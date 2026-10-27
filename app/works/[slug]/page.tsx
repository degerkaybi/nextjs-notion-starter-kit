import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import RichContent from '@/components/RichContent'
import WorkCard from '@/components/WorkCard'
import { getAllWorks, getPage, getPageHref, getRelatedWorks, getWorkBySlug } from '@/lib/portfolio'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return getAllWorks().map(work => ({ slug: work.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const work = getWorkBySlug((await params).slug)
  return { title: work?.page.title || 'Work', description: work?.excerpt || undefined }
}

export default async function WorkPage({ params }: Props) {
  const work = getWorkBySlug((await params).slug)
  if (!work) notFound()
  const related = getRelatedWorks(work)

  return (
    <div className="pf-page-shell pf-detail-page">
      <nav className="pf-breadcrumbs" aria-label="Breadcrumb"><Link href="/works">Works</Link><span>/</span><span>{work.page.title}</span></nav>
      <header className="pf-detail-header">
        <div><p className="pf-eyebrow">{work.series && work.series !== work.page.title ? work.series : 'SELECTED WORK'}</p><h1>{work.page.title}</h1></div>
        <div className="pf-detail-meta">{work.year && <span>{work.year}</span>}{work.tags.map(tag => <Link href={`/works?filter=${encodeURIComponent(tag)}`} key={tag}>{tag}</Link>)}</div>
      </header>
      {work.image && <div className="pf-detail-cover"><img src={work.image} alt={work.page.title} /></div>}
      {work.excerpt && <p className="pf-detail-lead">{work.excerpt}</p>}
      <div className="pf-detail-content"><RichContent blocks={work.page.blocks} /></div>
      {work.page.id === '33239248-8fe5-8018-b85b-cbdb6ba6e03f' && (() => {
        const otherPresentation = getPage('36439248-8fe5-8078-9dd3-f09a1b16667f')
        return otherPresentation ? <div className="pf-presentation-link"><span>ALSO PRESENTED AT UPCYCLE</span><Link href={getPageHref(otherPresentation)}>View this presentation ↗</Link></div> : null
      })()}
      {related.length > 0 && <section className="pf-related" aria-labelledby="related-heading"><div className="pf-section-heading"><div><p className="pf-eyebrow">CONTINUE EXPLORING</p><h2 id="related-heading">Related works.</h2></div></div><div className="pf-work-grid">{related.map(item => <WorkCard key={item.page.id} work={{ id: item.page.id, title: item.page.title, href: item.href, image: item.image, tags: item.tags, year: item.year, series: item.series }} />)}</div></section>}
    </div>
  )
}
