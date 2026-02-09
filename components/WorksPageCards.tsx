import Link from 'next/link'
import { type ExtendedRecordMap } from 'notion-types'
import { getBlockTitle, parsePageId } from 'notion-utils'
import { mapImageUrl } from '@/lib/map-image-url'
import { getCanonicalPageId } from '@/lib/get-canonical-page-id'
import cs from 'classnames'

interface WorksPageCardsProps {
  recordMap: ExtendedRecordMap
  site: any
}

export function WorksPageCards({ recordMap, site }: WorksPageCardsProps) {
  const blocks = Object.values(recordMap.block)
  const rootBlockId = Object.keys(recordMap.block)[0]
  const rootPageId = rootBlockId ? recordMap.block[rootBlockId]?.value?.id : null

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

  // Child pages ekle
  childPages.forEach((b: any) => {
    const pageId = parsePageId(b.value.id)
    if (pageId) {
      allPageLinks.push({ pageId, block: b.value })
    }
  })

  // Page link blocks ekle
  pageLinkBlocks.forEach((b: any) => {
    const pageId = parsePageId(b.value.format.page_id)
    if (pageId) {
      // Eğer bu sayfa zaten child page olarak eklenmemişse ekle
      if (!allPageLinks.find((link) => link.pageId === pageId)) {
        // Link block'tan sayfa bilgisini almak için recordMap'te arama yap
        const linkedPageBlock = recordMap.block[pageId]
        if (linkedPageBlock) {
          allPageLinks.push({ pageId, block: linkedPageBlock.value })
        }
      }
    }
  })

  if (!allPageLinks.length) return null

  // Kaldırılacak sayfaların ID'leri ve title'ları
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

  // Filtreleme: excluded sayfaları kaldır
  const filteredPageLinks = allPageLinks.filter(({ pageId, block }) => {
    const title = getBlockTitle(block, recordMap) || ''
    const cleanPageId = parsePageId(pageId)
    const normalizedTitle = title.toLowerCase().trim()

    // ID kontrolü
    if (cleanPageId && excludedPageIds.includes(cleanPageId)) {
      return false
    }

    // Title kontrolü - daha esnek eşleştirme
    for (const excludedTitle of excludedTitles) {
      const normalizedExcluded = excludedTitle.toLowerCase().trim()
      // Tam eşleşme veya içerme kontrolü
      if (normalizedTitle === normalizedExcluded ||
        normalizedTitle.includes(normalizedExcluded) ||
        normalizedExcluded.includes(normalizedTitle)) {
        return false
      }
    }

    // Özel durumlar için ek kontroller - daha geniş eşleştirme
    if (normalizedTitle.includes('interview') && normalizedTitle.includes('kaybid')) {
      return false
    }
    if ((normalizedTitle.includes('user manual') || normalizedTitle.includes('manual for vitality')) &&
      (normalizedTitle.includes('vitality') || normalizedTitle.includes('user'))) {
      return false
    }
    if (normalizedTitle.includes('more about') && normalizedTitle.includes('vitality')) {
      return false
    }

    return true
  })

  if (!filteredPageLinks.length) return null

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 32,
        padding: '48px 24px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}
    >
      {filteredPageLinks.map(({ pageId, block }) => {
        const title = getBlockTitle(block, recordMap) || 'Untitled'
        const cover = block.format?.page_cover
        const icon = block.format?.page_icon

        // Cover image URL'ini oluştur
        let coverUrl: string | null = null
        if (cover) {
          if (cover.startsWith('http')) {
            coverUrl = cover
          } else {
            // Notion image URL formatı
            const mappedUrl = mapImageUrl(cover, block)
            if (mappedUrl && mappedUrl.startsWith('http')) {
              coverUrl = mappedUrl
            } else {
              // Fallback: Notion image URL formatı
              coverUrl = `https://www.notion.so/image/${encodeURIComponent(
                cover
              )}?table=block&id=${block.id}&cache=v2`
            }
          }
        }

        // Canonical page ID'yi al (URL için)
        const canonicalPageId = getCanonicalPageId(pageId, recordMap) || pageId
        const pageUrl = `/${canonicalPageId}`

        return (
          <Link key={pageId} href={pageUrl} legacyBehavior>
            <a
              className="notion-page-card"
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                backgroundColor: 'var(--bg-color)',
                boxShadow: 'var(--card-shadow)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = 'var(--card-shadow-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'var(--card-shadow)'
              }}
            >
              {/* Cover Image */}
              {coverUrl ? (
                <div
                  style={{
                    width: '100%',
                    height: 200,
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-color-2)'
                  }}
                >
                  <img
                    src={coverUrl}
                    alt={title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: 200,
                    backgroundColor: 'var(--bg-color-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 48
                  }}
                >
                  {icon && icon.startsWith('http') ? (
                    <img src={icon} style={{ width: 48, height: 48 }} alt="" />
                  ) : icon ? (
                    <span>{icon}</span>
                  ) : (
                    <span>📄</span>
                  )}
                </div>
              )}

              {/* Page Title */}
              <div
                style={{
                  padding: '20px',
                  borderTop: coverUrl ? 'none' : '1px solid var(--divider-color)'
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: 'var(--fg-color)',
                    lineHeight: 1.4,
                    marginTop: icon && !coverUrl ? 8 : 0
                  }}
                >
                  {icon && coverUrl && (
                    <span style={{ marginRight: 8, fontSize: 20 }}>
                      {icon.startsWith('http') ? (
                        <img
                          src={icon}
                          style={{ width: 20, height: 20, verticalAlign: 'middle' }}
                          alt=""
                        />
                      ) : (
                        icon
                      )}
                    </span>
                  )}
                  {title}
                </div>
              </div>
            </a>
          </Link>
        )
      })}
    </div>
  )
}
