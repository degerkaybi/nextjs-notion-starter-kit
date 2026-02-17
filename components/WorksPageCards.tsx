import { type ExtendedRecordMap } from 'notion-types'
import { getBlockTitle, parsePageId } from 'notion-utils'
import { ChildPageGrid } from './ChildPageGrid'
import { getCanonicalPageId } from '@/lib/get-canonical-page-id'

interface WorksPageCardsProps {
  recordMap: ExtendedRecordMap
  site: any
}

export function WorksPageCards({ recordMap }: WorksPageCardsProps) {
  if (!recordMap?.block) return null

  const blocks = Object.values(recordMap.block)
  const rootBlockId = Object.keys(recordMap.block)[0]
  const rootPageId = rootBlockId
    ? (recordMap.block as any)[rootBlockId]?.value?.id
    : null

  // Child pages (alt sayfalar)
  const childPages = blocks.filter((b: any) => {
    const v = b.value
    return (
      v?.type === 'page' &&
      v?.parent_table === 'block' &&
      v?.id !== rootPageId
    )
  })

  // Page link blocks (sayfa linkleri)
  const pageLinkBlocks = blocks.filter((b: any) => {
    const v = b.value
    return v?.type === 'link_to_page' && v?.format?.page_id
  })

  // Tüm sayfa linklerini birleştir
  const allPageLinks: Array<{ pageId: string; block: any }> = []

  childPages.forEach((b: any) => {
    const pageId = parsePageId(b.value.id)
    if (pageId) {
      allPageLinks.push({ pageId, block: b.value })
    }
  })

  pageLinkBlocks.forEach((b: any) => {
    const pageId = parsePageId(b.value.format.page_id)
    if (pageId) {
      if (!allPageLinks.find((link) => link.pageId === pageId)) {
        const linkedPageBlock = (recordMap.block as any)[pageId]
        if (linkedPageBlock) {
          allPageLinks.push({ pageId, block: linkedPageBlock.value })
        }
      }
    }
  })

  if (!allPageLinks.length) return null

  const excludedPageIds = [
    '8401785badf840e99bb988a5e63eacb8', // About
    '32345bd70e2d4156a30b399acd23c897', // Art & Ideas
    '22a392488fe58002bf57cf365b91d67f', // More about User Manual for Vitality
    '22a392488fe5802489ebc87f7546a320', // More about First Aid Kit For City Hackers
    '22a392488fe580199671dd9af9e33095', // More about WWF Market X Kaybid
    '226392488fe580429c7fd774798d9c8a'  // Press
  ]

  const excludedTitles = [
    'About Kaybid and Silent Steps Series',
    'Interview with Kaybid',
    'ART & IDEAS',
    'More about User Manual for Vitality',
    'More about First Aid Kit For City Hackers',
    'More about WWF Market X Kaybid',
    'Press'
  ]

  const filteredPageLinks = allPageLinks.filter(({ pageId, block }) => {
    const title = getBlockTitle(block, recordMap) || ''
    const cleanPageId = parsePageId(pageId)
    const normalizedTitle = title.toLowerCase().trim()

    if (cleanPageId && excludedPageIds.includes(cleanPageId)) {
      return false
    }

    for (const excludedTitle of excludedTitles) {
      const normalizedExcluded = excludedTitle.toLowerCase().trim()
      if (
        normalizedTitle === normalizedExcluded ||
        normalizedTitle.includes(normalizedExcluded) ||
        normalizedExcluded.includes(normalizedTitle)
      ) {
        return false
      }
    }

    if (
      normalizedTitle.includes('interview') &&
      normalizedTitle.includes('kaybid')
    ) {
      return false
    }
    if (
      (normalizedTitle.includes('user manual') ||
        normalizedTitle.includes('manual for vitality')) &&
      (normalizedTitle.includes('vitality') || normalizedTitle.includes('user'))
    ) {
      return false
    }
    if (
      normalizedTitle.includes('more about') &&
      normalizedTitle.includes('vitality')
    ) {
      return false
    }

    return true
  })

  if (!filteredPageLinks.length) return null

  const manualItems = filteredPageLinks.map(({ pageId, block }) => {
    const title = getBlockTitle(block, recordMap) || 'Untitled'
    const canonicalPageId = getCanonicalPageId(pageId, recordMap) || pageId

    return {
      id: pageId,
      title,
      href: `/${canonicalPageId}`,
      coverUrl: block.format?.page_cover,
      icon: block.format?.page_icon
    }
  })

  return (
    <div className="works-cards-wrapper">
      <ChildPageGrid manualItems={manualItems} recordMap={recordMap} />
      <style jsx>{`
        .works-cards-wrapper {
          padding: 48px 24px;
          max-width: 1400px;
          margin: 0 auto;
        }
        @media (max-width: 640px) {
          .works-cards-wrapper {
            padding: 2rem 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}
