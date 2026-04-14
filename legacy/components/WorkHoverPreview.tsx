import { useState } from 'react'

export default function WorkHoverPreview({ pageId }: { pageId: string }) {
  const [image, setImage] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function load() {
    if (loaded) return
    setLoaded(true)

    try {
      const res = await fetch(`/api/work-preview?pageId=${pageId}`)
      const data = (await res.json()) as { image: string }
      setImage(data.image)
    } catch {
      setImage(null)
    }
  }

  return (
    <span
      onMouseEnter={() => {
        setVisible(true)
        load()
      }}
      onMouseLeave={() => setVisible(false)}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {visible && image && (
        <img
          src={image}
          alt=""
          style={{
            position: 'absolute',
            left: '100%',
            top: 0,
            marginLeft: 12,
            width: 220,
            borderRadius: 8,
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            zIndex: 999
          }}
        />
      )}
    </span>
  )
}
