import { getPage, getBlocks, getPageMetadata } from '@/lib/notion'
import { config } from '@/lib/config'
import NotionRenderer from '@/components/NotionRenderer'
import Hero from '@/components/Hero'
import MapSection from '@/components/MapSection'
import { notFound } from 'next/navigation'

export default async function DynamicPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  
  const path = slug?.join('/') || ''
  const isRoot = path === ''
  const pageId = config.pageUrlOverrides[path] || (slug ? slug[slug.length - 1] : config.rootNotionPageId)

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
    } else {
      console.log(`Blocks content for ${pageId}:`, blocks.map(b => ({
        type: b.type,
        text: b[b.type]?.rich_text?.[0]?.plain_text || 'NO TEXT'
      })))
    }

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
              <h1>{page.properties?.title?.title?.[0]?.plain_text || 'Untitled'}</h1>
              <NotionRenderer blocks={blocks} pageMetadata={pageMetadata} />
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
