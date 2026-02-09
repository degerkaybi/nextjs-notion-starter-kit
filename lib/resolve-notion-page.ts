import { type ExtendedRecordMap } from 'notion-types'
import { parsePageId, mergeRecordMaps } from 'notion-utils'
import pMap from 'p-map'

import type { PageProps } from './types'
import * as acl from './acl'
import { environment, pageUrlAdditions, pageUrlOverrides, site } from './config'
import { db } from './db'
import { getSiteMap } from './get-site-map'
import { getPage } from './notion'
import { notion } from './notion-api'

export async function resolveNotionPage(
  domain: string,
  rawPageId?: string
): Promise<PageProps> {
  let pageId: string | undefined
  let recordMap: ExtendedRecordMap

  if (rawPageId && rawPageId !== 'index') {
    pageId = parsePageId(rawPageId)!

    if (!pageId) {
      const override =
        pageUrlOverrides[rawPageId] || pageUrlAdditions[rawPageId]

      if (override) {
        pageId = parsePageId(override)!
      }
    }

    const useUriToPageIdCache = true
    const cacheKey = `uri-to-page-id:${domain}:${environment}:${rawPageId}`
    const cacheTTL = undefined

    if (!pageId && useUriToPageIdCache) {
      try {
        pageId = await db.get(cacheKey)
      } catch (err: any) {
        console.warn(`redis error get "${cacheKey}"`, err.message)
      }
    }

    if (pageId) {
      recordMap = await getPage(pageId)
    } else {
      const siteMap = await getSiteMap()
      pageId = siteMap?.canonicalPageMap[rawPageId]

      if (pageId) {
        recordMap = await getPage(pageId)

        if (useUriToPageIdCache) {
          try {
            await db.set(cacheKey, pageId, cacheTTL)
          } catch (err: any) {
            console.warn(`redis error set "${cacheKey}"`, err.message)
          }
        }
      } else {
        return {
          error: {
            message: `Not found "${rawPageId}"`,
            statusCode: 404
          }
        }
      }
    }
  } else {
    pageId = site.rootNotionPageId
    recordMap = await getPage(pageId)
  }

  // --------------------------------------------------------------------------
  // Pre-fetch child pages (RECURSIVE)
  // --------------------------------------------------------------------------
  if (recordMap?.block && pageId) {
    const rootBlock = recordMap.block[pageId]?.value
    const effectiveRootBlock = rootBlock || Object.values(recordMap.block)[0]?.value

    if (effectiveRootBlock) {
      const pendingBlocks = [effectiveRootBlock.id]
      const foundPageIds = new Set<string>()
      const processedBlocks = new Set<string>()

      // BFS traversal to find link_to_page and page blocks
      // Limit depth/count to avoid infinite loops or excessive processing
      let iterations = 0
      const maxIterations = 2000

      while (pendingBlocks.length > 0 && iterations < maxIterations) {
        iterations++
        const blockId = pendingBlocks.shift()!
        if (processedBlocks.has(blockId)) continue
        processedBlocks.add(blockId)

        const block = recordMap.block[blockId]?.value
        if (!block) continue

        // Check content
        if (block.content) {
          pendingBlocks.push(...block.content)
        }

        // Identify target pages
        const blockAny = block as any
        if (blockAny.type === 'page' && blockAny.parent_table === 'block' && blockAny.id !== effectiveRootBlock.id) {
          foundPageIds.add(blockAny.id)
        } else if (blockAny.type === 'link_to_page' && blockAny.format?.page_id) {
          foundPageIds.add(blockAny.format.page_id)
        }
      }

      // Filter and limit
      const uniquePageIds = [...foundPageIds].slice(0, 50)

      if (uniquePageIds.length > 0) {
        try {
          // Fetch child pages in parallel
          const childRecordMaps = await pMap(
            uniquePageIds,
            async (childPageId) => {
              try {
                // Determine chunk limit depending on likelihood of image being deep?
                // Stick to 1 for now.
                return await notion.getPage(childPageId, {
                  chunkLimit: 1,
                  fetchMissingBlocks: false,
                  fetchCollections: false,
                  signFileUrls: false
                })
              } catch (err) {
                return null
              }
            },
            {
              concurrency: 4
            }
          )

          for (const childRecordMap of childRecordMaps) {
            if (childRecordMap) {
              mergeRecordMaps(recordMap, childRecordMap)
            }
          }
        } catch (err) {
          console.error('Error prefetching child pages', err)
        }
      }
    }
  }
  // --------------------------------------------------------------------------

  const props: PageProps = { site, recordMap, pageId }
  return { ...props, ...(await acl.pageAcl(props)) }
}
