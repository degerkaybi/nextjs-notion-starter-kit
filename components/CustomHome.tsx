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

      <section className="map-section">
        <div className="map-container">
          <iframe
            src="https://www.google.com/maps/d/u/0/embed?mid=1tHoeYbM6SzK_Q1106KHegwvG7mPNBL2d&femb=1"
            width="100%"
            height="600"
            className="google-map"
            title="Kaybid Map"
          />
        </div>
      </section>

      <style jsx>{`
        .custom-home {
          width: 100%;
        }
        .map-section {
          width: 100%;
          padding: 2rem 2rem;
          background: var(--bg-color, #000);
          display: flex;
          justify-content: center;
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
