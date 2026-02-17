import * as React from 'react'
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
        getBlockTitle((b.value as any), recordMap)?.toLowerCase().includes(titlePart.toLowerCase())
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
      />

      <section className="featured-projects">
        <h2 className="featured-projects-title">Seçilmiş Projeler/Eserler</h2>
        <ChildPageGrid manualItems={featuredItems} columns={4} />
      </section>

      <style jsx>{`
        .custom-home {
          width: 100%;
        }
        .featured-projects {
          padding: 4rem 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }
        .featured-projects-title {
          font-size: 1.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin: 0 0 2.5rem 0;
          text-align: center;
        }
      `}</style>
    </div>
  )
}
