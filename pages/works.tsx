import { useState } from 'react'
import Link from 'next/link'

const works = [
  {
    title: 'Silent Steps',
    slug: '/silent-steps',
    pageId: '62d2c83cd0e0465490db610ddb78bfc7'
  },
  {
    title: 'Night Watch',
    slug: '/night-watch',
    pageId: 'bd62c75cff0b4b11a8571ea394db1d59'
  }
]

export default function WorksPage() {
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleHover = async (pageId: string) => {
    setLoading(true)
    const res = await fetch(`/api/work-preview?pageId=${pageId}`)
    const data = await res.json()
    setPreview(data.image ?? null)
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', gap: 48, padding: 48 }}>

      {/* LİSTE */}
      <div>
        {works.map((work) => (
          <div key={work.pageId} style={{ marginBottom: 20 }}>
            <Link href={work.slug} legacyBehavior>
              <a
                onMouseEnter={() => handleHover(work.pageId)}
                style={{
                  fontSize: 18,
                  textDecoration: 'none',
                  color: '#000'
                }}
              >
                {work.title}
              </a>
            </Link>
          </div>
        ))}
      </div>

      {/* PREVIEW */}
      <div style={{ width: 320, minHeight: 200 }}>
        {loading && <div>loading…</div>}

        {preview && (
          <div
            style={{
              border: '1px solid #ddd',
              padding: 8,
              borderRadius: 8
            }}
          >
            <img
              src={preview}
              alt="preview"
              style={{ width: '100%', borderRadius: 4 }}
            />
          </div>
        )}
      </div>

    </div>
  )
}
