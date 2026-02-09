import Link from 'next/link'
import { getBlockTitle } from 'notion-utils'

export function ChildPageGrid({ recordMap }: { recordMap: any }) {
  const blocks = Object.values(recordMap.block)

  const rootBlockId = Object.keys(recordMap.block)[0]
  const childPages = blocks.filter((b: any) => {
    const v = b.value
    return (
      v?.type === 'page' &&
      v?.parent_table === 'block' &&
      v?.id !== rootBlockId
    )
  })

  if (!childPages.length) return null

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 24,
        marginTop: 48
      }}
    >
      {childPages.map((b: any) => {
        const page = b.value
        const title = getBlockTitle(page, recordMap)

        const icon = page.format?.page_icon
        const cover = page.format?.page_cover

        const coverUrl = cover
          ? cover.startsWith('http')
            ? cover
            : `https://www.notion.so/image/${encodeURIComponent(
              cover
            )}?table=block&id=${page.id}&cache=v2`
          : null

        return (
          <Link key={page.id} href={`/${page.id}`} legacyBehavior>
            <a
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                display: 'block',
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              {coverUrl && (
                <img
                  src={coverUrl}
                  style={{
                    width: '100%',
                    height: 180,
                    objectFit: 'cover'
                  }}
                />
              )}

              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 22 }}>
                  {icon && icon.startsWith('http') ? (
                    <img src={icon} style={{ width: 22, height: 22 }} />
                  ) : (
                    icon
                  )}
                </div>

                <div style={{ marginTop: 8, fontSize: 15 }}>
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
