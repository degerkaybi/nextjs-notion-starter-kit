import { Client } from '@notionhq/client'
import { unstable_cache } from 'next/cache'

if (!process.env.NOTION_TOKEN) {
  throw new Error('Missing NOTION_TOKEN in environment variables')
}

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const REVALIDATE_TIME = 60 // Revalidate every 60 seconds
const REQUEST_TIMEOUT_MS = 15_000
const MAX_ATTEMPTS = 3
const MAX_CONCURRENT_REQUESTS = 4

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function getErrorStatus(error: any): number | undefined {
  return error?.status ?? error?.statusCode ?? error?.response?.status
}

function isRetryableError(error: any): boolean {
  const status = getErrorStatus(error)
  return status === 429 || (typeof status === 'number' && status >= 500) ||
    ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'UND_ERR_CONNECT_TIMEOUT'].includes(error?.code)
}

export async function withRetry<T>(operation: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(Object.assign(new Error(`${label} timed out after ${REQUEST_TIMEOUT_MS}ms`), { code: 'ETIMEDOUT' })), REQUEST_TIMEOUT_MS)
        ),
      ])
    } catch (error: any) {
      lastError = error
      if (attempt === MAX_ATTEMPTS || !isRetryableError(error)) throw error

      const retryAfter = Number(error?.headers?.get?.('retry-after') ?? error?.headers?.['retry-after'])
      const delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : 500 * 2 ** (attempt - 1)
      console.warn(`[NOTION] Retrying ${label} in ${delay}ms (attempt ${attempt + 1}/${MAX_ATTEMPTS})`)
      await sleep(delay)
    }
  }

  throw lastError
}

export async function mapWithConcurrency<T, R>(items: T[], worker: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length)
  let nextIndex = 0

  async function consume() {
    while (true) {
      const index = nextIndex++
      if (index >= items.length) return
      results[index] = await worker(items[index])
    }
  }

  await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT_REQUESTS, items.length) }, consume))
  return results
}

export function getTitle(page: any): string {
  if (!page?.properties) return 'Untitled'
  const props = page.properties
  for (const key in props) {
    if (props[key].type === 'title') {
      return props[key].title?.[0]?.plain_text || 'Untitled'
    }
  }
  return 'Untitled'
}

function ensureDashedId(id: string): string {
  if (id.includes('-')) return id
  return id.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
}

export const getPage = unstable_cache(
  async (pageId: string) => {
    return await withRetry(
      () => notion.pages.retrieve({ page_id: ensureDashedId(pageId) }),
      `page ${pageId}`
    )
  },
  ['notion-page'],
  { revalidate: REVALIDATE_TIME, tags: ['notion'] }
)

async function fetchBlocksRecursive(blockId: string): Promise<any[]> {
  const blocks: any[] = []
  let cursor: string | undefined
  
  try {
    while (true) {
      const response: any = await withRetry(
        () => notion.blocks.children.list({
          block_id: ensureDashedId(blockId),
          start_cursor: cursor,
        }),
        `blocks ${blockId}`
      )
      blocks.push(...response.results)
      if (!response.next_cursor) break
      cursor = response.next_cursor
    }

    // Parallel fetch for children to speed up
    const blocksWithChildren = await mapWithConcurrency(blocks, async (block: any) => {
        if (block.has_children && !['child_page', 'child_database'].includes(block.type)) {
          try {
            const children = await fetchBlocksRecursive(block.id)
            return { ...block, children }
          } catch (error: any) {
            console.error(`[NOTION] Failed to fetch children for block ${block.id}:`, error?.message || error)
            return block
          }
        }
        
        if (block.type === 'child_database') {
          console.log('[DEBUG] FOUND DATABASE:', block.id, block.child_database?.title)
          try {
            const res = await withRetry(
              async () => {
                const response = await fetch(`https://api.notion.com/v1/databases/${ensureDashedId(block.id)}/query`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': '2022-06-28'
                  }
                })
                if (!response.ok) {
                  throw Object.assign(new Error(`Database request failed with status ${response.status}`), {
                    status: response.status,
                    headers: response.headers,
                  })
                }
                return response
              },
              `database ${block.id}`
            )
            const dbResponse = await res.json()
            if (dbResponse.results && dbResponse.results.length > 0) {
               console.log('[DEBUG] DB FIRST ITEM SUCCESS')
               return { ...block, children: dbResponse.results }
            }
          } catch(e) {
            console.error('[DEBUG] Error fetching database:', e)
          }
        }
        
        return block
      })

    // DEBUG: log block types and rich text mention types
    blocksWithChildren.forEach((b: any) => {
      const val = b[b.type]
      if (val?.rich_text) {
        val.rich_text.forEach((rt: any) => {
          if (rt.type === 'mention' || rt.href) {
            console.log('[DEBUG rich_text]', JSON.stringify(rt, null, 2))
          }
        })
      }
      if (b.type === 'link_preview' || b.type === 'bookmark' || b.type === 'embed') {
        console.log('[DEBUG block]', JSON.stringify(b, null, 2))
      }
    })

    return blocksWithChildren
  } catch (error: any) {
    if (error.code === 'object_not_found') {
      console.error(`[NOTION PERMISSION ERROR] Could not find or access block ${blockId}. Please ensure this page is shared with your integration.`)
    } else {
      console.error(`Error fetching blocks for ${blockId}:`, error)
    }
    throw error
  }
}

export const getBlocks = unstable_cache(
  async (blockId: string) => {
    console.log(`[PERF] Fetching blocks for ${blockId}`)
    return await fetchBlocksRecursive(blockId)
  },
  ['notion-blocks-v10'], // Cache buster after adding retry/concurrency safeguards
  { revalidate: 60, tags: ['notion-v10'] }
)

export const getPageMetadata = unstable_cache(
  async (pageIds: string[]) => {
    console.log(`[PERF] Fetching metadata for ${pageIds.length} pages`)
    const metadata = await mapWithConcurrency(pageIds, async (id) => {
        try {
          const page: any = await withRetry(
            () => notion.pages.retrieve({ page_id: ensureDashedId(id) }),
            `metadata ${id}`
          )
          return {
            id: page.id,
            icon: page.icon,
            cover: page.cover,
            title: getTitle(page)
          }
        } catch (e) {
          console.error(`Error fetching metadata for page ${id}:`, e)
          return null
        }
      })
    return metadata.filter(m => m !== null) as any[]
  },
  ['notion-metadata-v10'], // Cache buster after adding retry/concurrency safeguards
  { revalidate: 60, tags: ['notion-v10'] }
)
