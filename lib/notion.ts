import { Client } from '@notionhq/client'
import { unstable_cache } from 'next/cache'

if (!process.env.NOTION_TOKEN) {
  throw new Error('Missing NOTION_TOKEN in environment variables')
}

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const REVALIDATE_TIME = 1 // Force fresh fetch for debugging

export const getPage = unstable_cache(
  async (pageId: string) => {
    return await notion.pages.retrieve({ page_id: pageId })
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
        block_id: blockId,
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
        return block
      })
    )

    return blocksWithChildren
  } catch (error) {
    console.error(`Error fetching blocks for ${blockId}:`, error)
    return []
  }
}

export const getBlocks = unstable_cache(
  async (blockId: string) => {
    return await fetchBlocksRecursive(blockId)
  },
  ['notion-blocks-v2'], // Cache buster
  { revalidate: REVALIDATE_TIME, tags: ['notion-v2'] }
)

export const getPageMetadata = unstable_cache(
  async (pageIds: string[]) => {
    const metadata = await Promise.all(
      pageIds.map(async (id) => {
        try {
          const page: any = await notion.pages.retrieve({ page_id: id })
          return {
            id: page.id,
            icon: page.icon,
            cover: page.cover,
            title: page.properties?.title?.title?.[0]?.plain_text || 'Untitled'
          }
        } catch (e) {
          console.error(`Error fetching metadata for page ${id}:`, e)
          return null
        }
      })
    )
    return metadata.filter(m => m !== null) as any[]
  },
  ['notion-metadata-v2'], // Cache buster
  { revalidate: REVALIDATE_TIME, tags: ['notion-v2'] }
)
