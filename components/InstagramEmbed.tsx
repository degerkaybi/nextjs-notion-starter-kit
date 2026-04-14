'use client'

import { Instagram } from 'lucide-react'

export default function InstagramEmbed({ url }: { url: string }) {
  const cleanUrl = url.split('?')[0].replace(/\/$/, '') + '/'
  
  // Try to extract the post code for display
  const codeMatch = cleanUrl.match(/\/(p|reel|tv)\/([^/]+)/)
  const postType = codeMatch?.[1] === 'reel' ? 'Reel' : 'Post'

  return (
    <a 
      href={cleanUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="instagram-card"
    >
      <div className="instagram-card-icon">
        <Instagram size={28} />
      </div>
      <div className="instagram-card-info">
        <span className="instagram-card-label">Instagram {postType}</span>
        <span className="instagram-card-action">View on Instagram →</span>
      </div>
    </a>
  )
}
