import * as React from 'react'
import Link from 'next/link'
import { getBlockTitle } from 'notion-utils'
import { mapImageUrl } from '@/lib/map-image-url'

export function ChildPageGrid({
  recordMap,
  limit,
  manualItems,
  columns
}: {
  recordMap?: any,
  limit?: number,
  columns?: number,
  manualItems?: Array<{
    id: string,
    title: string,
    href: string,
    coverUrl?: string,
    icon?: string
  }>
}) {
  const blocks = recordMap?.block ? Object.values(recordMap.block) : []
  const rootBlockId = recordMap?.block ? Object.keys(recordMap.block)[0] : null

  const seenIds = new Set()

  let items: any[] = []

  if (manualItems) {
    items = manualItems
  } else if (recordMap) {
    const childPages = blocks.filter((b: any) => {
      const v = b.value
      if (v?.type !== 'page' || v?.parent_table !== 'block' || v?.id === rootBlockId) return false

      if (seenIds.has(v.id)) return false
      seenIds.add(v.id)
      return true
    })

    items = childPages.map((b: any) => {
      const page = b.value
      return {
        id: page.id,
        title: getBlockTitle(page, recordMap),
        href: `/${page.id}`,
        coverUrl: page.format?.page_cover,
        icon: page.format?.page_icon
      }
    })
  }

  if (limit) {
    items = items.slice(0, limit)
  }

  if (!items.length) return null

  return (
    <div className="grid-container">
      <div className="cards-grid">
        {items.map((item: any) => {
          const { id, title, href, coverUrl: rawCover, icon: rawIcon } = item

          // Construct a partial block object for mapImageUrl
          const dummyBlock = { value: { id, type: 'page' } } as any

          const icon = rawIcon ? mapImageUrl(rawIcon, dummyBlock.value) : null
          const coverUrl = rawCover ? mapImageUrl(rawCover, dummyBlock.value) : null

          return (
            <Link key={id} href={href} legacyBehavior>
              <a className="page-card">
                <div className="card-image-wrapper">
                  {rawIcon ? (
                    <div className="card-icon-visual">
                      {rawIcon.startsWith('http') || rawIcon.startsWith('/') ? (
                        <img src={icon} alt={title} className="card-large-icon" />
                      ) : (
                        <span className="card-emoji-icon">{rawIcon}</span>
                      )}
                    </div>
                  ) : coverUrl ? (
                    <img src={coverUrl} alt={title} className="card-image" />
                  ) : (
                    <div className="card-image-placeholder" />
                  )}
                </div>

                <div className="card-content">
                  <h3 className="card-title">{title}</h3>

                  <p className="card-excerpt">
                    Bu eserin detaylarını ve sanatçının yaratım sürecini keşfetmek için tıklayın.
                  </p>

                  <div className="card-footer">
                    <span className="card-cta">Detayları Gör <span>→</span></span>
                  </div>
                </div>
              </a>
            </Link>
          )
        })}
      </div>

      <style jsx>{`
        .cards-grid {
          display: grid;
          grid-template-columns: ${columns ? `repeat(${columns}, 1fr)` : 'repeat(auto-fill, minmax(320px, 1fr))'};
          gap: 2.5rem;
        }
        @media (max-width: 1024px) {
          .cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .cards-grid {
            grid-template-columns: 1fr;
          }
        }
        .page-card {
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: inherit;
          background: var(--bg-color);
          border: 1px solid var(--divider-color);
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
          height: 100%;
        }
        .page-card:hover {
          transform: translateY(-8px);
          border-color: var(--accent-color);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .card-image-wrapper {
          position: relative;
          aspect-ratio: 1/1;
          overflow: hidden;
          background: var(--bg-color-1);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card-icon-visual {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-color-2);
          transition: background 0.3s;
        }
        .page-card:hover .card-icon-visual {
          background: var(--bg-color-1);
        }
        .card-large-icon {
          width: 50%;
          height: 50%;
          object-fit: contain;
          filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1));
          transition: transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .card-emoji-icon {
          font-size: 5rem;
          transition: transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .page-card:hover .card-large-icon,
        .page-card:hover .card-emoji-icon {
          transform: scale(1.1);
        }
        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }
        .card-content {
          padding: 1.5rem 2rem 2rem;
          display: flex;
          flex-direction: column;
          flex: 1;
          text-align: center;
        }
        .card-title {
          margin: 0 0 0.75rem 0;
          font-size: 1.4rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .card-excerpt {
          font-size: 0.9rem;
          opacity: 0.6;
          line-height: 1.5;
          margin-bottom: 2rem;
        }
        .card-footer {
          margin-top: auto;
          display: flex;
          justify-content: center;
        }
        .card-cta {
          color: var(--accent-color);
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          opacity: 0.8;
          transition: opacity 0.3s;
        }
        .page-card:hover .card-cta {
          opacity: 1;
        }
      `}</style>
    </div>
  )
}
