import { Client } from '@notionhq/client'
import { unstable_cache } from 'next/cache'

if (!process.env.NOTION_TOKEN) {
  throw new Error('Missing NOTION_TOKEN in environment variables')
}

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const REVALIDATE_TIME = 60 // Revalidate every 60 seconds

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
    return await notion.pages.retrieve({ page_id: ensureDashedId(pageId) })
  },
  ['notion-page'],
  { revalidate: REVALIDATE_TIME, tags: ['notion'] }
)

async function fetchBlocksRecursive(blockId: string): Promise<any[]> {
  const blocks: any[] = []
  let cursor: string | undefined
  
  try {
    while (true) {
      const response: any = await notion.blocks.children.list({
        block_id: ensureDashedId(blockId),
        start_cursor: cursor,
      })
      blocks.push(...response.results)
      if (!response.next_cursor) break
      cursor = response.next_cursor
    }

    // Parallel fetch for children to speed up
    const blocksWithChildren = await Promise.all(
      blocks.map(async (block: any) => {
        if (block.has_children && !['child_page', 'child_database'].includes(block.type)) {
          const children = await fetchBlocksRecursive(block.id)
          return { ...block, children }
        }
        
        if (block.type === 'child_database') {
          console.log('[DEBUG] FOUND DATABASE:', block.id, block.child_database?.title)
          try {
            const res = await fetch(`https://api.notion.com/v1/databases/${ensureDashedId(block.id)}/query`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
              }
            })
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
    )

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
    return []
  }
}

export const getBlocks = unstable_cache(
  async (blockId: string) => {
    console.log(`[PERF] Fetching blocks for ${blockId}`)
    return await fetchBlocksRecursive(blockId)
  },
  ['notion-blocks-v9'], // Cache buster v9
  { revalidate: 60, tags: ['notion-v9'] }
)

export const getPageMetadata = unstable_cache(
  async (pageIds: string[]) => {
    console.log(`[PERF] Fetching metadata for ${pageIds.length} pages`)
    const metadata = await Promise.all(
      pageIds.map(async (id) => {
        try {
          const page: any = await notion.pages.retrieve({ page_id: ensureDashedId(id) })
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
    )
    return metadata.filter(m => m !== null) as any[]
  },
  ['notion-metadata-v9'], // Cache buster v9
  { revalidate: 60, tags: ['notion-v9'] }
)
