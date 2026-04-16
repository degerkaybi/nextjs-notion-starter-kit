'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface NotionGallerySliderProps {
  items: any[]
  fullWidth?: boolean
}

export default function NotionGallerySlider({ items, fullWidth }: NotionGallerySliderProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const thumbnailsRef = useRef<HTMLDivElement>(null)

  // Normalize URLs similar to NotionRenderer logic
  const normalizeImgurUrl = (url: string) => {
    if (!url || !url.includes('imgur.com')) return url
    if (url.includes('imgur.com') && !url.includes('i.imgur.com') && /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url)) {
      return url.replace('imgur.com', 'i.imgur.com')
    }
    return url
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

  if (mediaItems.length === 0) return null

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

  return (
    <div className={`notion-slider-container ${fullWidth ? 'slider-full-width' : ''}`}>
      {/* Main View */}
      <div className="slider-main-view">
        {currentItem.isVideo ? (
          <div className="slider-video-wrapper">
            {currentItem.isYouTube ? (
              <iframe
                src={`https://www.youtube.com/embed/${currentItem.videoId}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="slider-video-iframe"
              ></iframe>
            ) : (
              <iframe
                src={currentItem.url}
                frameBorder="0"
                allowFullScreen
                className="slider-video-iframe"
              ></iframe>
            )}
          </div>
        ) : (
          <img 
            key={currentItem.url} 
            src={currentItem.url} 
            alt={currentItem.caption || `Image ${activeIndex + 1}`}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="slider-main-image fade-in-entrance"
          />
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
              <img 
                src={item.thumbUrl} 
                alt={`Thumbnail ${idx + 1}`} 
                loading="lazy"
                decoding="async" 
                referrerPolicy="no-referrer"
              />
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
