import Link from 'next/link'
import RichContent from './RichContent'
import { type PortfolioPage } from '@/lib/portfolio'

export default function SectionLayout({ page, eyebrow, title, introduction }: { page: PortfolioPage; eyebrow: string; title: string; introduction?: string }) {
  return (
    <div className="pf-page-shell pf-section-page">
      <div className="pf-page-hero">
        <p className="pf-eyebrow">{eyebrow}</p>
        <h1>{title}<span>.</span></h1>
        {introduction && <p>{introduction}</p>}
      </div>
      <div className="pf-section-body"><RichContent blocks={page.blocks} /></div>
      <Link href="/works" className="pf-back-link">Explore the works <span aria-hidden="true">↗</span></Link>
    </div>
  )
}
