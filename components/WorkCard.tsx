import Link from 'next/link'

export type WorkCardData = {
  id: string
  title: string
  href: string
  image: string | null
  tags: string[]
  year: string | null
  series: string | null
}

export default function WorkCard({ work, featured = false }: { work: WorkCardData; featured?: boolean }) {
  return (
    <Link href={work.href} className={`pf-work-card ${featured ? 'pf-work-card-featured' : ''}`}>
      <div className="pf-work-card-image">
        {work.image ? <img src={work.image} alt="" loading="lazy" decoding="async" /> : <span className="pf-image-placeholder">KAYBID</span>}
        <span className="pf-card-arrow" aria-hidden="true">↗</span>
      </div>
      <div className="pf-work-card-info">
        <div>
          <h3>{work.title}</h3>
          {work.series && work.series !== work.title && <p className="pf-card-series">{work.series}</p>}
        </div>
        {work.year && <span className="pf-card-year">{work.year}</span>}
      </div>
      {featured && <div className="pf-card-tags">{work.tags.slice(0, 3).join(' · ')}</div>}
    </Link>
  )
}
