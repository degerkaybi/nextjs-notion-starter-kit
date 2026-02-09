import WorkHoverPreview from '../components/WorkHoverPreview'

const works = [
  {
    title: 'Silent Steps',
    url: '/silent-steps',
    pageId: '62d2c83cd0e0465490db610ddb78bfc7'
  },
  {
    title: 'Night Watch',
    url: '/night-watch',
    pageId: 'bd62c75cff0b4b11a8571ea394db1d59'
  }
]

export default function WorksPage() {
  return (
    <main style={{ padding: 48 }}>
      <h1 style={{ fontSize: 32, marginBottom: 32 }}>Works</h1>

      <ul style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {works.map((work) => (
          <li key={work.pageId} style={{ position: 'relative' }}>
            <WorkHoverPreview pageId={work.pageId} />
            <a
              href={work.url}
              style={{
                fontSize: 18,
                textDecoration: 'underline'
              }}
            >
              {work.title}
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}
