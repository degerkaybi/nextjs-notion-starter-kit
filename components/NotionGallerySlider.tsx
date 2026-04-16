'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'

interface NotionGallerySliderProps {
  items: any[]
  fullWidth?: boolean
  square?: boolean
  isSilentSteps?: boolean
}

export default function NotionGallerySlider({ items, fullWidth, square, isSilentSteps }: NotionGallerySliderProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const [failedMediaIds, setFailedMediaIds] = useState<Set<string>>(new Set())
  const [retryCounts, setRetryCounts] = useState<Record<string, number>>({})
  const thumbnailsRef = useRef<HTMLDivElement>(null)

  const handleMediaError = (id: string) => {
    setFailedMediaIds(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  const handleMediaRetry = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    
    setRetryCounts(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }))
    
    setFailedMediaIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  // Normalize URLs similar to NotionRenderer logic
  const normalizeImgurUrl = (url: string) => {
    if (!url || !url.includes('imgur.com')) return url
    if (url.includes('imgur.com') && !url.includes('i.imgur.com') && /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url)) {
      return url.replace('imgur.com', 'i.imgur.com')
    }
    return url
  }

  const proxyImageUrl = (url: string, isStatic = false) => {
    if (!url) return url
    if (url.startsWith('/') || url.startsWith('data:') || url.includes('/api/image-proxy')) return url
    if (url.includes('imgur.com/embed') || url.includes('imgur.com/a/')) return url
    // YouTube thumbnails don't need proxy
    if (url.includes('img.youtube.com')) return url
    
    let proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`
    if (isStatic) proxyUrl += '&static=true&width=400'
    return proxyUrl
  }

  const getMediaInfo = (block: any) => {
    const type = block.type
    const val = block[type]
    const rawUrl = val?.type === 'external' ? val.external.url : val?.file?.url || val?.url
    const url = rawUrl ? normalizeImgurUrl(rawUrl) : ''
    const caption = val?.caption?.[0]?.plain_text || ''

    let isVideo = ['video', 'embed'].includes(type)
    let videoId = ''
    let isYouTube = false
    let thumbUrl = url

    if (url.includes('youtube') || url.includes('youtu.be')) {
      const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=))((\w|-){11})/)
      if (ytMatch && ytMatch[1]) {
        videoId = ytMatch[1]
        isYouTube = true
        isVideo = true
        thumbUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      }
    }

    return { url, caption, isVideo, isYouTube, videoId, thumbUrl }
  }

  const mediaItems = items.map(block => getMediaInfo(block)).filter(item => item.url)

  useEffect(() => {
    if (mediaItems.length > 0) {
      setActiveIndex(Math.floor(Math.random() * mediaItems.length))
    }
    setIsMounted(true)
  }, [items.length])

  // Ensure active index is within bounds
  const currentItem = mediaItems[activeIndex] || mediaItems[0]

  const handleNext = () => setActiveIndex((prev) => (prev + 1) % mediaItems.length)
  const handlePrev = () => setActiveIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length)

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (thumbnailsRef.current) {
      const scrollAmount = 200
      thumbnailsRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
    }
  }

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mediaItems.length])

  // Scroll active thumbnail into view (container only, doesn't affect page scroll)
  useEffect(() => {
    if (thumbnailsRef.current) {
      const activeThumb = thumbnailsRef.current.children[activeIndex] as HTMLElement
      if (activeThumb) {
        const container = thumbnailsRef.current
        const thumbLeft = activeThumb.offsetLeft
        const thumbWidth = activeThumb.clientWidth
        const containerWidth = container.clientWidth
        
        // Calculate the scroll position to center the thumbnail
        const scrollTarget = thumbLeft - (containerWidth / 2) + (thumbWidth / 2)
        
        container.scrollTo({
          left: scrollTarget,
          behavior: 'smooth'
        })
      }
    }
  }, [activeIndex])

  if (mediaItems.length === 0) return null

  // Prevent hydration mismatch by avoiding rendering random content on initial server pass
  if (!isMounted) {
    return <div className={`notion-slider-container ${fullWidth ? 'slider-full-width' : ''} ${square ? 'slider-square' : ''}`} style={{ minHeight: '400px' }} />
  }

  return (
    <div className={`notion-slider-container ${fullWidth ? 'slider-full-width' : ''} ${square ? 'slider-square' : ''}`}>
      {/* Main View */}
      <div className="slider-main-view">
        {currentItem.isVideo ? (
          <div className="slider-video-wrapper">
            {(() => {
              const isDirectVideo = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(currentItem.url)
              if (currentItem.isYouTube) {
                return (
                  <iframe
                    src={`https://www.youtube.com/embed/${currentItem.videoId}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="slider-video-iframe"
                  ></iframe>
                )
              } else if (isDirectVideo) {
                return (
                  <video 
                    src={currentItem.url} 
                    controls 
                    muted 
                    playsInline 
                    className="slider-video-direct"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
                  />
                )
              } else {
                return (
                  <iframe
                    src={currentItem.url}
                    frameBorder="0"
                    allowFullScreen
                    className="slider-video-iframe"
                  ></iframe>
                )
              }
            })()}
          </div>
        ) : (
          <div className="slider-main-image-container image-retry-container" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {(() => {
              const retryCount = retryCounts[currentItem.url] || 0
              const finalSrc = retryCount > 0 ? `${proxyImageUrl(currentItem.url)}&t=${retryCount}` : proxyImageUrl(currentItem.url)
              const isFailed = failedMediaIds.has(currentItem.url)
              
              return (
                <>
                  <img 
                    key={finalSrc} 
                    src={finalSrc} 
                    alt={currentItem.caption || `Image ${activeIndex + 1}`}
                    loading="lazy"
                    decoding="async"
                    onLoad={(e) => {
                      e.currentTarget.classList.add('loaded')
                      if (isFailed) {
                        setFailedMediaIds(prev => {
                          const next = new Set(prev)
                          next.delete(currentItem.url)
                          return next
                        })
                      }
                    }}
                    onError={() => handleMediaError(currentItem.url)}
                    referrerPolicy="no-referrer"
                    className={`slider-main-image notion-img fade-in-entrance ${isFailed ? 'image-failed' : ''}`}
                    style={isSilentSteps ? { objectFit: 'contain', maxHeight: '70vh', width: '100%', margin: '0 auto', borderRadius: '20px' } : {}}
                  />
                  
                  {/* Timeout trigger for main slider image */}
                  {!isFailed && (
                    <span style={{ display: 'none' }}>
                      {(() => {
                        setTimeout(() => handleMediaError(currentItem.url), 12000)
                        return null
                      })()}
                    </span>
                  )}

                  {isFailed && (
                    <div className="image-retry-overlay">
                      <p className="retry-error-text">Failed to load main image</p>
                      <button className="retry-button" onClick={(e) => handleMediaRetry(e, currentItem.url)}>
                        <RefreshCw /> Retry
                      </button>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )}
        
        {/* Main View Arrows */}
        <button className="main-nav-btn prev" onClick={handlePrev} aria-label="Previous">
          <ChevronLeft size={32} />
        </button>
        <button className="main-nav-btn next" onClick={handleNext} aria-label="Next">
          <ChevronRight size={32} />
        </button>
      </div>

      {/* Caption + Counter */}
      <div className="slider-meta">
        {currentItem.caption && (
          <p className="slider-caption-block">{currentItem.caption}</p>
        )}
        <span className="slider-counter-text">
          {activeIndex + 1} / {mediaItems.length}
        </span>
      </div>

      {/* Thumbnails Track */}
      <div className="slider-thumbnails-wrapper">
        <button className="thumb-nav-btn prev" onClick={() => scrollThumbnails('left')} aria-label="Scroll thumbnails left">
          <ChevronLeft size={20} />
        </button>
        
        <div className="slider-thumbnails" ref={thumbnailsRef}>
          {mediaItems.map((item, idx) => (
            <button 
              key={idx}
              className={`thumbnail-item ${idx === activeIndex ? 'active' : ''} ${item.isVideo ? 'video-thumb' : ''}`}
              onClick={() => setActiveIndex(idx)}
              aria-label={`View item ${idx + 1}`}
            >
              <div className="thumb-image-container image-retry-container">
                {(() => {
                  const retryCount = retryCounts[item.thumbUrl] || 0
                  const finalSrc = retryCount > 0 ? `${proxyImageUrl(item.thumbUrl, item.url.toLowerCase().includes('.gif'))}&t=${retryCount}` : proxyImageUrl(item.thumbUrl, item.url.toLowerCase().includes('.gif'))
                  const isThumbFailed = failedMediaIds.has(item.thumbUrl)
                  
                  return (
                    <>
                      <img 
                        key={finalSrc}
                        src={finalSrc} 
                        alt={`Thumbnail ${idx + 1}`} 
                        loading="lazy"
                        decoding="async" 
                        onLoad={(e) => {
                          e.currentTarget.classList.add('loaded')
                          if (isThumbFailed) {
                            setFailedMediaIds(prev => {
                              const next = new Set(prev)
                              next.delete(item.thumbUrl)
                              return next
                            })
                          }
                        }}
                        onError={() => handleMediaError(item.thumbUrl)}
                        referrerPolicy="no-referrer"
                        className={`notion-img ${isThumbFailed ? 'image-failed' : ''}`}
                      />

                      {isThumbFailed && (
                        <div className="image-retry-overlay" style={{ scale: '0.8' }}>
                          <button className="retry-button" style={{ padding: '0.4rem', borderRadius: '50%' }} onClick={(e) => handleMediaRetry(e, item.thumbUrl)} aria-label="Retry thumbnail">
                            <RefreshCw size={14} />
                          </button>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
              {item.isVideo && <div className="play-overlay">▶</div>}
            </button>
          ))}
        </div>

        <button className="thumb-nav-btn next" onClick={() => scrollThumbnails('right')} aria-label="Scroll thumbnails right">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}
