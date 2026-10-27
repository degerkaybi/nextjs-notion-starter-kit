import type { Metadata } from 'next'
import WorkExplorer from '@/components/WorkExplorer'
import { filters, getAllWorks } from '@/lib/portfolio'

export const metadata: Metadata = { title: 'Works' }

export default function WorksPage() {
  const works = getAllWorks()
  const summaries = works.map(work => ({
    id: work.page.id,
    title: work.page.title,
    href: work.href,
    image: work.image,
    tags: work.tags,
    year: work.year,
    series: work.series,
    searchText: `${work.page.title} ${work.series || ''} ${work.tags.join(' ')}`.toLocaleLowerCase(),
  }))

  return (
    <div className="pf-page-shell pf-works-page">
      <div className="pf-page-hero">
        <p className="pf-eyebrow">KAYBID / PORTFOLIO</p>
        <h1>Works<span>.</span></h1>
        <p>Across streets, images, motion, objects and sound. Each work can belong to more than one practice.</p>
      </div>
      <WorkExplorer works={summaries} filters={filters} />
    </div>
  )
}
