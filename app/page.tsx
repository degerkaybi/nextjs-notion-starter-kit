import Link from 'next/link'
import WorkCard from '@/components/WorkCard'
import { getFeaturedWorks, getAllWorks } from '@/lib/portfolio'

export default function HomePage() {
  const featured = getFeaturedWorks()
  const hero = featured[0]
  const recent = getAllWorks().filter(work => !featured.some(item => item.page.id === work.page.id)).slice(0, 4)

  return (
    <>
      <section className="pf-hero">
        <div className="pf-hero-copy">
          <div>
            <h1>KAYBID<span>.</span></h1>
            <p className="pf-hero-practices">STREET ART · COLLAGE · ANIMATION</p>
          </div>
          <div className="pf-hero-bottom">
            <span className="pf-accent-line" aria-hidden="true" />
            <p>Hand-cut collages and moving images<br />for a more curious world.</p>
            <Link className="pf-button" href="/works">EXPLORE WORKS <span aria-hidden="true">⟶</span></Link>
          </div>
        </div>
        <div className="pf-hero-image">
          {hero?.image && <img src={hero.image} alt="Artwork from Kaybid's Silent Steps series" />}
          <span className="pf-hero-image-label">SILENT STEPS · EST. 2018</span>
        </div>
      </section>

      <section className="pf-featured-section" aria-labelledby="featured-heading">
        <div className="pf-section-intro">
          <p className="pf-eyebrow">SELECTED SERIES</p>
          <h2 id="featured-heading">Ways of seeing<br />the world.</h2>
          <p>Explore projects that move between the street, the studio and the screen.</p>
        </div>
        <div className="pf-featured-grid">
          {featured.map((work, index) => (
            <div className="pf-featured-item" key={work.page.id}>
              <span className="pf-featured-number">0{index + 1}</span>
              <WorkCard featured work={{ id: work.page.id, title: work.page.title.replace(/\s*:\|\|\s*$/, ''), href: work.href, image: work.image, tags: work.tags, year: work.year, series: work.series }} />
            </div>
          ))}
        </div>
      </section>

      <section className="pf-home-works" aria-labelledby="recent-heading">
        <div className="pf-section-heading">
          <div><p className="pf-eyebrow">FROM THE ARCHIVE</p><h2 id="recent-heading">More to explore.</h2></div>
          <Link href="/works" className="pf-text-link">VIEW ALL WORKS <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="pf-work-grid">
          {recent.map(work => <WorkCard key={work.page.id} work={{ id: work.page.id, title: work.page.title, href: work.href, image: work.image, tags: work.tags, year: work.year, series: work.series }} />)}
        </div>
      </section>
    </>
  )
}
