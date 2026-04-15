import { notion } from './notion'
import { config } from './config'
import { unstable_cache } from 'next/cache'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ıİ]/g, 'i')
    .replace(/[üÜ]/g, 'u')
    .replace(/[öÖ]/g, 'o')
    .replace(/[çÇ]/g, 'c')
    .replace(/[şŞ]/g, 's')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export { slugify }

// Build a bidirectional map: slug <-> pageId, and also parent tracking
export const getSlugMap = unstable_cache(
  async (): Promise<{ slugToId: Record<string, string>, idToSlug: Record<string, string>, idToParentSlug: Record<string, string> }> => {
    const slugToId: Record<string, string> = {}
    const idToSlug: Record<string, string> = {}
    const idToParentSlug: Record<string, string> = {}

    // Start with hardcoded overrides from config (these take priority)
    for (const [slug, pageId] of Object.entries(config.pageUrlOverrides)) {
      slugToId[slug] = pageId
      idToSlug[pageId] = slug
      // Also map the dashed version
      const dashedId = pageId.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
      idToSlug[dashedId] = slug
    }

    // Fetch all child pages from root to auto-generate slugs
    try {
      const rootId = config.rootNotionPageId
      let cursor: string | undefined
      
      while (true) {
        const response: any = await notion.blocks.children.list({
          block_id: rootId,
          start_cursor: cursor,
        })
        
        for (const block of response.results) {
          if (block.type === 'child_page') {
            const title = block.child_page?.title || ''
            const pageId = block.id.replace(/-/g, '')
            const dashedId = block.id
            const slug = slugify(title)
            
            if (slug && !slugToId[slug]) {
              slugToId[slug] = pageId
              idToSlug[pageId] = slug
              idToSlug[dashedId] = slug
            }
          }
        }
        
        if (!response.next_cursor) break
        cursor = response.next_cursor
      }

      // Also fetch children of children (2 levels deep for sub-pages like Works/Art&Ideas children)
      const topLevelPages = Object.entries(slugToId).map(([slug, id]) => ({ slug, id }))
      for (const { slug: parentSlug, id } of topLevelPages) {
        try {
          const dashedId = id.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
          let subCursor: string | undefined
          while (true) {
            const subResponse: any = await notion.blocks.children.list({
              block_id: dashedId,
              start_cursor: subCursor,
            })
            for (const block of subResponse.results) {
              if (block.type === 'child_page') {
                const title = block.child_page?.title || ''
                const pageId = block.id.replace(/-/g, '')
                const subDashedId = block.id
                const slug = slugify(title)
                
                if (slug && !slugToId[slug]) {
                  slugToId[slug] = pageId
                  idToSlug[pageId] = slug
                  idToSlug[subDashedId] = slug
                }
                // Track parent relationship
                idToParentSlug[pageId] = parentSlug
                idToParentSlug[subDashedId] = parentSlug
              }
            }
            if (!subResponse.next_cursor) break
            subCursor = subResponse.next_cursor
          }
        } catch (e) {
          // Skip pages that can't be read
        }
      }
    } catch (error) {
      console.error('Error building slug map:', error)
    }

    return { slugToId, idToSlug, idToParentSlug }
  },
  ['slug-map-v2'],
  { revalidate: 60, tags: ['slugs'] }
)

// Resolve a URL path to a page ID
export async function resolveSlug(path: string): Promise<string | null> {
  const { slugToId } = await getSlugMap()
  return slugToId[path] || null
}

// Get the slug for a page ID
export async function getSlugForId(pageId: string): Promise<string | null> {
  const { idToSlug } = await getSlugMap()
  return idToSlug[pageId] || idToSlug[pageId.replace(/-/g, '')] || null
}
