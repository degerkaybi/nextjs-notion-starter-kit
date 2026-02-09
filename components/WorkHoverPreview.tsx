'use client'

import { useState } from 'react'

type Props = {
  pageId: string
}

export default function WorkHoverPreview({ pageId }: Props) {
  const [image, setImage] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function load() {
    if (loaded) return
    setLoaded(true)

    try {
      const res = await fetch(`/api/work-preview?pageId=${pageId}`)
      const data = await res.json()
      setImage(data.image)
    } catch {
      setImage(null)
    }
  }

  return (
    <div
      onMouseEnter={() => {
        setVisible(true)
        load()
      }}
      onMouseLeave={() => setVisible(false)}
      className="relative inline-block"
    >
      {visible && image && (
        <img
          src={image}
          alt=""
          className="absolute left-full top-0 ml-4 w-56 rounded-lg shadow-lg z-50"
        />
      )}
    </div>
  )
}
