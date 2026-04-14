'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void
      }
    }
  }
}

export default function InstagramEmbed({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load Instagram embed.js if not already loaded
    const existingScript = document.querySelector('script[src*="instagram.com/embed.js"]')
    if (!existingScript) {
      const script = document.createElement('script')
      script.src = 'https://www.instagram.com/embed.js'
      script.async = true
      script.onload = () => {
        window.instgrm?.Embeds.process()
      }
      document.body.appendChild(script)
    } else {
      // Script already loaded, just reprocess
      setTimeout(() => {
        window.instgrm?.Embeds.process()
      }, 100)
    }
  }, [url])

  // Extract clean URL (remove query params for the embed)
  const cleanUrl = url.split('?')[0].replace(/\/$/, '') + '/'

  return (
    <div ref={containerRef} className="notion-instagram-embed">
      <blockquote
        className="instagram-media"
        data-instgrm-captioned
        data-instgrm-permalink={cleanUrl}
        style={{
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          margin: '1.5rem auto',
          maxWidth: '540px',
          width: '100%',
          padding: '0',
        }}
      >
        <a href={cleanUrl} target="_blank" rel="noopener noreferrer" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 2rem',
          color: 'var(--text-color, #fff)',
          textDecoration: 'none',
          fontSize: '0.9rem',
          opacity: 0.6,
        }}>
          View on Instagram →
        </a>
      </blockquote>
    </div>
  )
}
