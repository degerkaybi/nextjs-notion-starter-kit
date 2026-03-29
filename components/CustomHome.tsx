import * as React from 'react'
import Link from 'next/link'
import * as config from '@/lib/config'
import { HeroSection } from './HeroSection'
import { ChildPageGrid } from './ChildPageGrid'
import { getBlockTitle } from 'notion-utils'
import { getCanonicalPageId } from '@/lib/get-canonical-page-id'

export function CustomHome({ recordMap }: { recordMap: any }) {
  const blocks = recordMap?.block ? Object.values(recordMap.block) : []
  const videoBlock = blocks.find(
    (b: any) => b.value?.type === 'video'
  ) as any
  const videoUrl = videoBlock?.value?.properties?.source?.[0]?.[0] || null

  const coverUrl = (blocks.find(
    (b: any) => (b.value as any)?.format?.page_cover
  ) as any)?.value?.format?.page_cover

  const featuredItems = React.useMemo(() => {
    const findPage = (titlePart: string) => {
      return (blocks.find((b: any) =>
        (b.value as any)?.type === 'page' &&
        getBlockTitle((b.value as any), recordMap)?.toLowerCase()?.includes(titlePart.toLowerCase())
      ) as any)?.value
    }

    const silentPage = findPage('Silent Steps')
    const pandaPage = findPage('Panda')
    const voltaPage = findPage('Volta')
    const somewherePage = findPage('Somewhere') || findPage('Nowhere Together')

    const getHref = (page: any, fallback: string) => page?.id ? `/${getCanonicalPageId(page.id, recordMap) || fallback}` : fallback

    return [
      {
        id: silentPage?.id || 'silent-steps',
        title: 'Silent Steps Series',
        href: getHref(silentPage, '/silent-steps'),
        coverUrl: silentPage?.format?.page_cover,
        icon: silentPage?.format?.page_icon
      },
      {
        id: pandaPage?.id || 'panda',
        title: 'Silent Steps "Panda"',
        href: getHref(pandaPage, '/panda'),
        coverUrl: pandaPage?.format?.page_cover,
        icon: pandaPage?.format?.page_icon
      },
      {
        id: voltaPage?.id || 'kaybid-records',
        title: 'Kaybid Records',
        href: getHref(voltaPage, '/kaybid-plak-gururla-sunar-volta'),
        coverUrl: voltaPage?.format?.page_cover,
        icon: voltaPage?.format?.page_icon
      },
      {
        id: somewherePage?.id || 'somewhere',
        title: 'Somewhere',
        href: getHref(somewherePage, '/nowhere-together'),
        coverUrl: somewherePage?.format?.page_cover,
        icon: somewherePage?.format?.page_icon
      }
    ]
  }, [blocks, recordMap])

  return (
    <div className="custom-home">
      <HeroSection
        videoUrl={videoUrl}
        imageUrl={coverUrl}
        subtitle="Street Art | Animation |  Traditional Collage"
        startTime={28}
      />

      <section className="about-section">
        <h2 className="section-title">About</h2>
        <div className="about-content">
          <p>Best known for the Silent Steps Series—a long-term street art project featuring hand-cut collages of endangered animals, installed across cities worldwide since 2018.</p>
          <p>Featured: Straat Museum Amsterdam, Paris Olympics 2024, Times Square NYC, WWF partnership.</p>
          <div className="about-link-container">
            <Link href="/about" className="read-more">Read more →</Link>
          </div>
        </div>
      </section>

      <section className="map-section">
        <h2 className="map-title">Silent Steps Series Istanbul Map</h2>
        <div className="map-subtitle">
          <p>
            The project ongoing since 2018 and over 600+ individual unique collages created from 40+ different species were created and applied to the streets.
          </p>
        </div>
        <div className="map-container">
          <iframe
            src="https://www.google.com/maps/d/u/0/embed?mid=1tHoeYbM6SzK_Q1106KHegwvG7mPNBL2d&femb=1"
            width="100%"
            height="600"
            className="google-map"
            title="Kaybid Map"
          />
        </div>
        <div className="map-description">
          <p className="quote">
            “All my collage works are original and unique. None of them are copies, prints, or stickers. That is all organic. I make them with traditional methods.”
          </p>
        </div>
      </section>

      <style jsx>{`
        .custom-home {
          width: 100%;
        }
        .about-section {
          width: 100%;
          padding: 6rem 2rem 2rem;
          background: var(--bg-color);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .section-title {
          font-size: 2rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 4px;
          margin-bottom: 2.5rem;
          color: var(--fg-color);
        }
        .about-content {
          max-width: 800px;
          font-size: 1.1rem;
          line-height: 1.8;
          opacity: 0.9;
        }
        .about-content p {
          margin-bottom: 1.5rem;
        }
        .about-link-container {
          margin-top: 2rem;
        }
        .read-more {
          color: var(--fg-color);
          text-decoration: none;
          font-weight: 600;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          opacity: 0.8;
          transition: all 0.2s ease;
          border-bottom: 1px solid var(--fg-color);
          padding-bottom: 4px;
          cursor: pointer;
        }
        .read-more:hover {
          opacity: 1;
          letter-spacing: 3px;
        }
        .map-section {
          width: 100%;
          padding: 4rem 2rem;
          background: var(--bg-color, #000);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .map-title {
          font-size: 1.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin: 0 0 1rem 0;
          text-align: center;
          color: var(--fg-color);
        }
        .map-subtitle {
          max-width: 800px;
          margin-bottom: 2.5rem;
          text-align: center;
          font-size: 1.1rem;
          line-height: 1.6;
          opacity: 0.8;
          padding: 0 1rem;
        }
        .map-description {
          max-width: 800px;
          margin-top: 2rem;
          text-align: center;
          font-size: 1.1rem;
          line-height: 1.6;
          opacity: 0.8;
          padding: 0 1rem;
        }
        .quote {
          font-style: italic;
          font-weight: 300;
          opacity: 0.9;
        }
        .map-container {
          width: 100%;
          max-width: 700px;
          height: 350px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          border: 1px solid var(--divider-color, rgba(255,255,255,0.1));
          position: relative;
        }
        .google-map {
          border: none;
          position: absolute;
          top: -50px; /* Hides the header */
          left: 0;
          height: calc(350px + 50px) !important;
        }
        @media (max-width: 640px) {
          .map-section {
            padding: 1rem;
          }
          .map-container {
            max-width: 100%;
            height: 300px;
          }
          .google-map {
            height: calc(300px + 50px) !important;
          }
        }
      `}</style>
    </div>
  )
}
