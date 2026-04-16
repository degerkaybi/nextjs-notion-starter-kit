import { getPage, getBlocks, getPageMetadata } from '@/lib/notion'
import { config } from '@/lib/config'
import { resolveSlug, getSlugMap } from '@/lib/slugs'
import NotionRenderer from '@/components/NotionRenderer'
import Breadcrumbs from '@/components/Breadcrumbs'
import Hero from '@/components/Hero'
import MapSection from '@/components/MapSection'
import { notFound } from 'next/navigation'

export const revalidate = 60 // Revalidate every 60 seconds to prevent Notion S3 image URLs from expiring

export default async function DynamicPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  
  const path = slug?.join('/') || ''
  const isRoot = path === ''

  // Resolve the page ID: first check config overrides, then dynamic slugs, then raw ID
  let pageId: string | null = config.pageUrlOverrides[path] || null
  
  if (!pageId && path) {
    pageId = await resolveSlug(path)
  }
  
  if (!pageId) {
    pageId = slug ? slug[slug.length - 1] : config.rootNotionPageId
  }

  // Get the slug map for generating proper links in the renderer
  const { idToSlug, slugToId } = await getSlugMap()

  // Build breadcrumb ancestors by traversing Notion's parent chain
  const ancestors: { href: string; label: string }[] = []
  if (!isRoot) {
    const rootId = config.rootNotionPageId.replace(/-/g, '')
    let currentId = pageId
    const visited = new Set<string>()
    while (true) {
      if (visited.has(currentId)) break
      visited.add(currentId)
      try {
        const pg: any = await getPage(currentId)
        const parent = pg.parent
        if (!parent || parent.type === 'workspace') break
        if (parent.type !== 'page_id') break
        const parentRaw = parent.page_id
        const parentNorm = parentRaw.replace(/-/g, '')
        if (parentNorm === rootId) break // reached site root
        const parentPage: any = await getPage(parentRaw)
        const title = parentPage.properties?.title?.title?.[0]?.plain_text || 'Untitled'
        const slug = idToSlug[parentRaw] || idToSlug[parentNorm] || parentNorm
        ancestors.unshift({ href: `/${slug}`, label: title })
        currentId = parentRaw
      } catch {
        break
      }
    }
  }

  try {
    const page: any = await getPage(pageId)
    let blocks = await getBlocks(pageId)

    // Truncate content after the specific statement ONLY on the root page
    if (isRoot) {
      const truncateIndex = blocks.findIndex((b: any) => {
        const text = b[b.type]?.rich_text?.[0]?.plain_text || ''
        return text.includes('traditional methods')
      })
      
      if (truncateIndex !== -1) {
        blocks = blocks.slice(0, truncateIndex + 1)
      }
    }

    // Filter out specific redundant text blocks the user wants removed
    const textsToRemove = [
      'ANIMATIONS',
      'Thanks for patience while the gifs loaded.',
      '2024 Olympics, Paris',
      'Commencis, 2024',
      'Penguin, 2024',
      'Squirrel, 2024',
      'Herkül, 2024',
      'Bull, 2023',
      'Bear 2023',
      'Ostrich, 2023',
      'Chameleon, 2023',
      'Panda, 2018',
      'Urbanist Gorila, 2021',
      'Unicorn, 2021',
      'Seal, 2021',
      'Human Zer0, 2020',
      'Cow, 2020',
      'Koala, 2019',
      'Lemur, 2019',
      'Tortise, 2019',
      'Kangaroo, 2019',
      'Giraffe, 2019',
      'Caretta Caretta, 2019',
      'Dolphin, 2019',
      'Sea Horse, 2019',
      'Whale, 2019',
      'Octopus, 2019',
      'Shark, 2019',
      'Raccon, 2018',
      'Polar Bear, 2018',
      'White Lion, 2018',
      'Bision, 2018',
      'Hippo, 2018',
      'Bear —— 2023',
      'Gorilla, 2018',
      'Moose, 2018',
      'Jaguar, 2018',
      'Rhino, 2018',
      'Lion, 2018',
      'Elephant, 2018',
      'I started by making my first pasteup with this series',
      'The project ongoing since 2018',
      'I create each frame of the animation'
    ]

    blocks = blocks.flatMap((b: any) => {
      const text = b[b.type]?.rich_text?.[0]?.plain_text || ''
      const shouldRemove = textsToRemove.some(toRemove => text.includes(toRemove))
      
      if (shouldRemove) {
        // If the block has children (e.g., GIFs under a heading), preserve them
        return b.children || []
      }
      return [b]
    })

    // Fetch metadata for child pages to get icons
    const childPageIds = blocks
      .filter((b: any) => b.type === 'child_page')
      .map((b: any) => b.id)
    
    const pageMetadata = childPageIds.length > 0 
      ? await getPageMetadata(childPageIds)
      : []

    return (
      <div className="fade-in">
        {isRoot ? (
          <>
            <Hero />
            <MapSection />
          </>
        ) : (
          <div className="content-wrapper">
            <section className="notion-content">
              <Breadcrumbs currentTitle={page.properties?.title?.title?.[0]?.plain_text || 'Untitled'} ancestors={ancestors} />
              <h1>{page.properties?.title?.title?.[0]?.plain_text || 'Untitled'}</h1>
              <NotionRenderer 
                blocks={blocks} 
                pageMetadata={pageMetadata} 
                slugMap={idToSlug} 
                galleryMode={page.properties?.title?.title?.[0]?.plain_text === 'Silent Steps Series'}
                showLeadText={page.properties?.title?.title?.[0]?.plain_text === 'Silent Steps Series'}
              />
            </section>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error(`Error fetching page for slug ${path}:`, error)
    return notFound()
  }
}
