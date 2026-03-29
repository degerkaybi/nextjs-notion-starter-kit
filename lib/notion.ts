import {
  type ExtendedRecordMap,
  type SearchParams,
  type SearchResults
} from 'notion-types'
import { mergeRecordMaps } from 'notion-utils'
import pMap from 'p-map'
import pMemoize from 'p-memoize'

import {
  isPreviewImageSupportEnabled,
  navigationLinks,
  navigationStyle
} from './config'
import { getTweetsMap } from './get-tweets'
import { notion } from './notion-api'
import { getPreviewImageMap } from './preview-images'

// Exponential backoff retry helper
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 5,
  delayMs = 2000
): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      const isRateLimit =
        err?.response?.status === 429 ||
        err?.status === 429 ||
        (err?.message && err.message.includes('429')) ||
        err?.name === 'HTTPError'

      const isLastAttempt = attempt === retries - 1

      if (isLastAttempt || !isRateLimit) throw err

      let backoff = delayMs * Math.pow(1.5, attempt)

      try {
        const retryAfterStr = err?.response?.headers?.get('retry-after')
        if (retryAfterStr) {
          const retryAfterSec = parseInt(retryAfterStr, 10)
          if (!isNaN(retryAfterSec)) {
            backoff = Math.max(backoff, retryAfterSec * 1000 + 1000)
          }
        }
      } catch (headerErr) {
        // ignore header parsing errors
      }

      console.warn(
        `Notion API rate limited (attempt ${attempt + 1}/${retries}), retrying in ${backoff}ms...`
      )
      await new Promise((resolve) => setTimeout(resolve, backoff))
    }
  }
  throw new Error('unreachable')
}

const getNavigationLinkPages = pMemoize(
  async (): Promise<ExtendedRecordMap[]> => {
    const navigationLinkPageIds = (navigationLinks || [])
      .map((link) => link?.pageId)
      .filter(Boolean)

    if (navigationStyle !== 'default' && navigationLinkPageIds.length) {
      return pMap(
        navigationLinkPageIds,
        async (navigationLinkPageId) => {
          try {
            return await withRetry(() =>
              notion.getPage(navigationLinkPageId, {
                chunkLimit: 1,
                fetchMissingBlocks: false,
                fetchCollections: false,
                signFileUrls: false
              })
            )
          } catch (err) {
            console.warn(
              `Failed to fetch navigation link page ${navigationLinkPageId}:`,
              err
            )
            return null
          }
        },
        {
          concurrency: 1 // reduce from 4 to 1 to avoid rate limiting
        }
      ).then((results) => results.filter(Boolean) as ExtendedRecordMap[])
    }

    return []
  }
)

export async function getPage(pageId: string): Promise<ExtendedRecordMap> {
  let recordMap = await withRetry(() => notion.getPage(pageId))

  if (navigationStyle !== 'default') {
    // ensure that any pages linked to in the custom navigation header have
    // their block info fully resolved in the page record map so we know
    // the page title, slug, etc.
    try {
      const navigationLinkRecordMaps = await getNavigationLinkPages()

      if (navigationLinkRecordMaps?.length) {
        recordMap = navigationLinkRecordMaps.reduce(
          (map, navigationLinkRecordMap) =>
            mergeRecordMaps(map, navigationLinkRecordMap),
          recordMap
        )
      }
    } catch (err) {
      console.warn('Failed to fetch navigation link pages:', err)
    }
  }

  if (isPreviewImageSupportEnabled) {
    const previewImageMap = await getPreviewImageMap(recordMap)
    ;(recordMap as any).preview_images = previewImageMap
  }

  await getTweetsMap(recordMap)

  return recordMap
}

export async function search(params: SearchParams): Promise<SearchResults> {
  return notion.search(params)
}
