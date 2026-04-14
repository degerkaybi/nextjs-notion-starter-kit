'use client'

export default function InstagramEmbed({ url }: { url: string }) {
  // Extract the post/reel path and convert to embed URL
  // e.g. https://www.instagram.com/p/ABC123/ -> https://www.instagram.com/p/ABC123/embed/
  // e.g. https://www.instagram.com/reel/ABC123/ -> https://www.instagram.com/reel/ABC123/embed/
  const cleanUrl = url.split('?')[0].replace(/\/$/, '')
  const embedUrl = cleanUrl + '/embed/'

  return (
    <div className="notion-instagram-embed" style={{
      margin: '1.5rem auto',
      maxWidth: '540px',
      width: '100%',
    }}>
      <iframe
        src={embedUrl}
        style={{
          width: '100%',
          minHeight: '500px',
          border: 'none',
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'transparent',
        }}
        allowFullScreen
        scrolling="no"
        title="Instagram Post"
      />
    </div>
  )
}
