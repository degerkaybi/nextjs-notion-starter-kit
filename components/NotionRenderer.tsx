'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"
import InstagramEmbed from './InstagramEmbed'
import NotionGallerySlider from './NotionGallerySlider'

export default function NotionRenderer({ blocks, pageMetadata = [], slugMap = {}, showLeadText = false, galleryMode = false }: { blocks: any[], pageMetadata?: any[], slugMap?: Record<string, string>, showLeadText?: boolean, galleryMode?: boolean }) {
  const [index, setIndex] = useState(-1)
  const [activeTab, setActiveTab] = useState('GIFs')
  
  // Recursively collect all images for the gallery
  const getAllImages = (blocks: any[]): any[] => {
    let images: any[] = []
    blocks.forEach(block => {
      const type = block.type
      if (type === 'image') {
        const val = block.image
        const src = val.type === 'external' ? val.external.url : val.file.url
        images.push({ src })
      }
      if (block.children && block.children.length > 0) {
        images = [...images, ...getAllImages(block.children)]
      }
    });
    return images
  }

  const galleryImages = getAllImages(blocks)

  // Function to find an image's index in the full gallery
  const getImageIndex = (url: string) => {
    return galleryImages.findIndex(img => img.src === url)
  }

  // Extract all media blocks but EXCLUDE maps and specific items the user wants inline
  const getAllMediaBlocks = (blocksArray: any[]): any[] => {
    let mediaBlocks: any[] = []
    blocksArray.forEach(block => {
      const type = block.type
      const value = block[type]
      const url = value?.type === 'external' ? value.external.url : value?.file?.url || value?.url || ''
      const isMap = url.includes('google.') && url.includes('/maps')
      const caption = value?.caption?.[0]?.plain_text || ''
      const isExcluded = caption.includes('Panda, 2018-2022')

      if (['image', 'video', 'embed'].includes(type) && !isMap && !isExcluded) {
        mediaBlocks.push(block)
      }
      if (block.children && block.children.length > 0) {
        mediaBlocks = [...mediaBlocks, ...getAllMediaBlocks(block.children)]
      }
    })
    return mediaBlocks
  }

  const allMediaBlocks = getAllMediaBlocks(blocks)
  // Gallery mode is only activated on specific pages (e.g. Silent Steps Series)
  const isGalleryLayout = galleryMode && allMediaBlocks.length > 0

  // Categorize media into GIFs, Static (JPEG/PNG/etc), and Videos
  const gifBlocks = allMediaBlocks.filter(block => {
    if (block.type !== 'image') return false
    const val = block.image
    const src = (val.type === 'external' ? val.external.url : val.file.url).toLowerCase()
    return src.includes('.gif')
  })

  const videoBlocks = allMediaBlocks.filter(block => ['video', 'embed'].includes(block.type))

  const staticImageBlocks = allMediaBlocks.filter(block => {
    if (block.type !== 'image') return false
    return !gifBlocks.includes(block)
  })

  const renderRichText = (richText: any[]) => {
    if (!richText || richText.length === 0) return null
    return richText.map((t: any, i: number) => {
      const { annotations, plain_text, href, type, mention } = t
      const style = {
        fontWeight: annotations?.bold ? 'bold' : 'normal',
        fontStyle: annotations?.italic ? 'italic' : 'normal',
        textDecoration: annotations?.strikethrough ? 'line-through' : 'none',
        color: annotations?.color !== 'default' ? annotations.color : 'inherit'
      }

      if (type === 'mention' && mention?.type === 'page') {
        const mentionId = mention.page.id
        const mentionSlug = slugMap[mentionId] || mentionId.replace(/-/g, '')
        return (
          <Link key={i} href={`/${mentionSlug}`} style={style} className="notion-link-mention">
            <svg viewBox="0 0 14 14" className="notion-mention-icon">
              <path d="M2.5 1.5v11h9v-7.38L8.12 1.5H2.5zM1.5 1.5A1 1 0 012.5.5h5.83l.11.04 3.42 3.42.04.11v8.43a1 1 0 01-1 1h-9a1 1 0 01-1-1v-11z" />
            </svg>
            {plain_text}
          </Link>
        )
      }

      if (type === 'mention' && mention?.type === 'link_preview') {
        const previewUrl = mention.link_preview?.url || href || '#'
        const isYouTube = previewUrl.includes('youtube') || previewUrl.includes('youtu.be')
        return (
          <a key={i} href={previewUrl} target="_blank" rel="noopener noreferrer" className="notion-link-mention">
            {isYouTube ? (
              <svg viewBox="0 0 24 24" className="notion-mention-icon" fill="currentColor">
                <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6a3 3 0 00-2.1 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1C4.5 20.5 12 20.5 12 20.5s7.5 0 9.4-.6a3 3 0 002.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.8 15.5V8.5l6.2 3.5-6.2 3.5z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 14 14" className="notion-mention-icon" fill="currentColor">
                <path d="M7 1a6 6 0 100 12A6 6 0 007 1zM0 7a7 7 0 1114 0A7 7 0 010 7zm7-3.5a.5.5 0 01.5.5v3.19l1.65 1.65a.5.5 0 01-.7.71L6.65 7.85A.5.5 0 016.5 7.5v-3a.5.5 0 01.5-.5z"/>
              </svg>
            )}
            {plain_text}
          </a>
        )
      }

      if (href) {
        return (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer" style={style} className="notion-link">
            {plain_text}
          </a>
        )
      }

      return <span key={i} style={style}>{plain_text}</span>
    })
  }

  const normalizeImgurUrl = (url: string) => {
    if (!url || !url.includes('imgur.com')) return url
    
    // Convert gallery/album to embed
    if (url.includes('/a/') || url.includes('/gallery/') || (!url.includes('i.imgur.com') && !/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url))) {
      const match = url.match(/imgur\.com\/(?:a\/|gallery\/|)?([a-zA-Z0-9]+)/)
      if (match && match[1]) {
        return `https://imgur.com/a/${match[1]}/embed?pub=true`
      }
    }
    
    // Ensure direct links use i.imgur.com
    if (url.includes('imgur.com') && !url.includes('i.imgur.com') && /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url)) {
      return url.replace('imgur.com', 'i.imgur.com')
    }
    
    return url
  }

  const renderBlock = (block: any): React.ReactNode => {
    const { type, id, children } = block
    const value = block[type]
    
    // Check if this block should behave like a toggle (if it has children)
    const canHaveChildren = ['paragraph', 'heading_1', 'heading_2', 'heading_3', 'bulleted_list_item', 'numbered_list_item', 'quote', 'callout', 'toggle', 'synced_block']
    const hasVisibleChildren = children && children.length > 0

    const renderChildren = () => {
      if (!hasVisibleChildren) return null
      return <div className="notion-children">{children.map(renderBlock)}</div>
    }

    // Check if block should behave as a toggle
    const isToggleBlock = type === 'toggle'
    const isToggleableHeading = type.startsWith('heading_') && (value?.is_toggleable === true)

    // DEBUG: log all block types to find toggle/image issues
    if (type === 'toggle' || (type.startsWith('heading_') && value?.is_toggleable)) {
      console.log('[TOGGLE DEBUG]', type, 'is_toggleable:', value?.is_toggleable, 'has children:', children?.length)
    }

    if (isToggleBlock || isToggleableHeading) {
      return (
        <details key={id} className={`notion-toggle toggle-${type}`}>
          <summary className="notion-summary">
            {type === 'heading_1' && <h1>{renderRichText(value.rich_text)}</h1>}
            {type === 'heading_2' && <h2>{renderRichText(value.rich_text)}</h2>}
            {type === 'heading_3' && <h3>{renderRichText(value.rich_text)}</h3>}
            {type === 'paragraph' && <span className="p-text">{renderRichText(value.rich_text)}</span>}
            {type === 'toggle' && <span className="toggle-text">{renderRichText(value.rich_text)}</span>}
          </summary>
          <div className="toggle-content">
            {renderChildren()}
          </div>
        </details>
      )
    }

    // If this block is part of the unified top gallery, suppress inline rendering
    const isGalleryItem = allMediaBlocks.some(b => b.id === id)
    
    switch (type) {
      case 'image': {
        if (isGalleryLayout && isGalleryItem) return null

        const src = value.type === 'external' ? value.external.url : value.file.url
        const caption = value.caption
        return (
          <div key={id} className="notion-image-wrapper">
            <div 
              className="notion-image-container loading-skeleton"
              onClick={() => setIndex(getImageIndex(src))}
              style={{ cursor: 'pointer' }}
            >
              <img 
                src={normalizeImgurUrl(src)} 
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="notion-img"
                onLoad={(e) => {
                  const target = e.target as HTMLElement;
                  target.parentElement?.classList.remove('loading-skeleton');
                  target.classList.add('loaded');
                }}
                onError={(e) => {
                  const target = e.target as HTMLElement;
                  target.parentElement?.classList.remove('loading-skeleton');
                  target.parentElement?.classList.add('image-error-container');
                  target.classList.add('image-failed');
                  console.error('Image failed to load:', src);
                }}
                alt={caption?.[0]?.plain_text || 'Notion Content'} 
              />
            </div>
            {caption && caption.length > 0 && (
              <figcaption className="notion-image-caption">
                {renderRichText(caption)}
              </figcaption>
            )}
          </div>
        )
      }
      case 'heading_1':
        return (
          <div key={id} className="notion-heading-block">
            <h1>{renderRichText(value.rich_text)}</h1>
            {renderChildren()}
          </div>
        )
      case 'heading_2':
        return (
          <div key={id} className="notion-heading-block">
            <h2>{renderRichText(value.rich_text)}</h2>
            {renderChildren()}
          </div>
        )
      case 'heading_3':
        return (
          <div key={id} className="notion-heading-block">
            <h3>{renderRichText(value.rich_text)}</h3>
            {renderChildren()}
          </div>
        )
      case 'paragraph':
        return (
          <div key={id} className="notion-paragraph-block">
            <p className="notion-p">{renderRichText(value.rich_text)}</p>
            {renderChildren()}
          </div>
        )
      case 'bulleted_list_item':
        return (
          <li key={id} className="notion-li">
            <span className="li-text">{renderRichText(value.rich_text)}</span>
            {renderChildren()}
          </li>
        )
      case 'numbered_list_item':
        return (
          <li key={id} className="notion-li-num">
            {renderRichText(value.rich_text)}
            {renderChildren()}
          </li>
        )
      case 'quote':
        return <blockquote key={id} className="notion-quote">{renderRichText(value.rich_text)}{renderChildren()}</blockquote>
      case 'divider':
        return <hr key={id} className="notion-hr" />
      case 'column_list':
        return (
          <div key={id} className="notion-column-list">
            {children?.map(renderBlock)}
          </div>
        )
      case 'column':
        return (
          <div key={id} className="notion-column">
            {children?.map(renderBlock)}
          </div>
        )
      case 'callout':
        return (
          <div key={id} className="notion-callout">
            {value.icon?.emoji && <span className="icon">{value.icon.emoji}</span>}
            <div className="text">
              {renderRichText(value.rich_text)}
              {renderChildren()}
            </div>
          </div>
        )
      case 'video':
      case 'embed': {
        let src = value.type === 'external' ? value.external.url : value.file?.url || value.url
        const caption = value.caption
        const isMap = src?.includes('google.') && src?.includes('/maps')

        // If we are pooling this into the gallery, suppress inline rendering
        if (isGalleryLayout && isGalleryItem) return null

        if (!src) return null
        if (!src) return null

        const normalizedSrc = normalizeImgurUrl(src)
        const isImgurEmbed = normalizedSrc.includes('imgur.com/a/') && normalizedSrc.includes('/embed')

        // If it's a direct image link or normalized to one, treat it as an image
        const isDirectImage = /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(normalizedSrc) || normalizedSrc.includes('i.imgur.com')
        
        if (isDirectImage && !isImgurEmbed) {
          return (
            <div key={id} className="notion-image-wrapper">
              <div className="notion-image-container">
                <img 
                  src={normalizedSrc} 
                  loading="lazy"
                  referrerPolicy="no-referrer" 
                  style={{ width: '100%', borderRadius: '20px', display: 'block' }} 
                  alt="Embedded Content"
                  onLoad={(e) => (e.target as HTMLElement).classList.add('loaded')}
                />
              </div>
            </div>
          )
        }

        // Broad support for Google Maps & My Maps (viewer/edit -> embed transformation)
        const isGoogleMap = src.includes('google.') && src.includes('/maps')
        if (isGoogleMap) {
          if (src.includes('viewer?mid=') || src.includes('edit?mid=')) {
            src = src.replace('viewer?mid=', 'embed?mid=').replace('edit?mid=', 'embed?mid=')
          }
        }

        if (src.includes('youtube') || src.includes('youtu.be')) {
          const ytMatch = src.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
          const videoId = (ytMatch && ytMatch[1]) ? ytMatch[1] : '';
          
          if (videoId) {
            return (
              <div key={id} className="notion-video-container-wrapper">
                <div className="notion-video-container">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    title="YouTube Video"
                  ></iframe>
                </div>
                {caption && caption.length > 0 && (
                  <figcaption className="notion-image-caption">
                    {renderRichText(caption)}
                  </figcaption>
                )}
              </div>
            )
          }
        }

        // Instagram embed support
        if (src.includes('instagram.com')) {
          return (
            <div key={id} className="notion-embed-container-wrapper">
              <div className="notion-embed-container">
                <InstagramEmbed url={src} />
              </div>
              {caption && caption.length > 0 && (
                <figcaption className="notion-image-caption">
                  {renderRichText(caption)}
                </figcaption>
              )}
            </div>
          )
        }

        return (
          <div key={id} className="notion-video-container-wrapper">
            <div className="notion-video-container">
              <iframe
                src={src}
                frameBorder="0"
                allowFullScreen
                title="Embedded Content"
                className="notion-embed-iframe"
              ></iframe>
            </div>
            {caption && caption.length > 0 && (
              <figcaption className="notion-image-caption">
                {renderRichText(caption)}
              </figcaption>
            )}
          </div>
        )
      }
      case 'child_page': {
        const slug = slugMap[id] || id.replace(/-/g, '')
        const meta = pageMetadata.find(m => m.id === id)
        const icon = meta?.icon
        const cover = meta?.cover
        const bgImage = cover?.external?.url || cover?.file?.url || icon?.external?.url || icon?.file?.url

        return (
          <Link key={id} href={`/${slug}`} className="work-card">
            <ArrowUpRight className="card-arrow" size={24} />
            <div className="card-icon-wrapper">
              {bgImage ? (
                <img 
                  src={bgImage} 
                  alt="" 
                  className="card-icon-img" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                icon?.type === 'emoji' && <span className="card-emoji">{icon.emoji}</span>
              )}
            </div>
            <h3>{value.title}</h3>
          </Link>
        )
      }
      case 'bookmark': {
        const bookmarkUrl = value.url || ''
        
        // Auto-embed Google Maps bookmarks
        if (bookmarkUrl.includes('google.') && bookmarkUrl.includes('/maps')) {
          let mapSrc = bookmarkUrl
            .replace('http://', 'https://')
            .replace('viewer?', 'embed?')
            .replace('edit?', 'embed?')
          if (!mapSrc.includes('google.com')) {
            mapSrc = mapSrc.replace('google.', 'www.google.')
          }
          return (
            <div key={id} className="notion-video-container">
              <iframe
                src={mapSrc}
                frameBorder="0"
                allowFullScreen
                title="Google Map"
                className="notion-embed-iframe"
                style={{ minHeight: '450px' }}
              ></iframe>
            </div>
          )
        }

        return (
          <a key={id} href={bookmarkUrl} target="_blank" rel="noopener noreferrer" className="notion-bookmark">
            <div className="notion-bookmark-content">
              <div className="notion-bookmark-title">{bookmarkUrl}</div>
              <div className="notion-bookmark-link">{bookmarkUrl}</div>
            </div>
          </a>
        )
      }
      case 'link_to_page': {
        const linkedId = value.page_id.replace(/-/g, '') // Notion API returns ID with/without dashes sometimes
        // Try to match with original ID or normalized ID
        const slug = slugMap[value.page_id] || slugMap[linkedId] || linkedId
        return (
          <Link key={id} href={`/${slug}`} className="notion-link-page">
            <ArrowUpRight size={18} />
            <span>Link to Page</span>
          </Link>
        )
      }
      case 'file':
      case 'pdf': {
        const src = value.type === 'external' ? value.external.url : value.file.url
        const name = value.caption?.[0]?.plain_text || 'Download File'
        return (
          <a key={id} href={src} target="_blank" rel="noopener noreferrer" className="notion-file-link">
            <div className="notion-file-icon">📎</div>
            <div className="notion-file-info">
              <span className="notion-file-name">{name}</span>
            </div>
          </a>
        )
      }
      case 'link_preview': {
        const previewUrl = value?.url || ''
        if (!previewUrl) return null
        const isYouTube = previewUrl.includes('youtube') || previewUrl.includes('youtu.be')
        if (isYouTube) {
          const ytMatch = previewUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=))(([\w-]){11})/)
          const videoId = ytMatch?.[1]
          if (videoId) {
            return (
              <div key={id} className="notion-video-container">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title="YouTube Video"
                ></iframe>
              </div>
            )
          }
        }
        return (
          <a key={id} href={previewUrl} target="_blank" rel="noopener noreferrer" className="notion-link-preview-block">
            <span className="notion-link-preview-icon">🔗</span>
            <span className="notion-link-preview-url">{previewUrl}</span>
          </a>
        )
      }
      case 'synced_block':
        return <div key={id} className="notion-synced-block">{renderChildren()}</div>
      default:
        if (hasVisibleChildren) {
          return <div key={id} className="notion-unknown-block">{renderChildren()}</div>
        }
        return null
    }
  }

  // Group consecutive child_page blocks for grid display
  const groupedBlocks = blocks.reduce((acc: any[], block: any) => {
    if (block.type === 'child_page') {
      const last = acc[acc.length - 1]
      if (last && last._type === '_child_page_group') {
        last.items.push(block)
      } else {
        acc.push({ _type: '_child_page_group', items: [block] })
      }
    } else {
      acc.push(block)
    }
    return acc
  }, [])

  return (
    <div className="notion-blocks">
      {showLeadText && (
        <div className="notion-page-lead-text">
          The project ongoing since 2018 and over 600+ individual unique collages created from 40+ different species were created and applied to the streets. ”I create each frame of the animation by ripping apart images I've previously made. Each frame is a collage.”
        </div>
      )}

      {isGalleryLayout && (
        <div className="unified-gallery-wrapper tabbed-gallery" style={{ marginBottom: '3rem' }}>
          <div className="notion-tabs-container">
            <div className="notion-tabs-bar">
              {gifBlocks.length > 0 && (
                <button 
                  className={`notion-tab-button ${activeTab === 'GIFs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('GIFs')}
                >
                  Animations (GIFs)
                </button>
              )}
              {staticImageBlocks.length > 0 && (
                <button 
                  className={`notion-tab-button ${activeTab === 'Photography' ? 'active' : ''}`}
                  onClick={() => setActiveTab('Photography')}
                >
                  Photography
                </button>
              )}
              {videoBlocks.length > 0 && (
                <button 
                  className={`notion-tab-button ${activeTab === 'Videos' ? 'active' : ''}`}
                  onClick={() => setActiveTab('Videos')}
                >
                  Videos
                </button>
              )}
            </div>
          </div>

          <div className="tab-content-wrapper fade-in-entrance">
            {activeTab === 'GIFs' && gifBlocks.length > 0 ? (
              <NotionGallerySlider key="GIFs" items={gifBlocks} fullWidth={true} />
            ) : activeTab === 'Videos' && videoBlocks.length > 0 ? (
              <NotionGallerySlider key="Videos" items={videoBlocks} />
            ) : (
              staticImageBlocks.length > 0 && <NotionGallerySlider key="Photography" items={staticImageBlocks} />
            )}
          </div>
        </div>
      )}

      {groupedBlocks.map((item: any, i: number) => {
        if (item._type === '_child_page_group') {
          return (
            <div key={`group-${i}`} className="works-grid-inline">
              {item.items.map((b: any) => renderBlock(b))}
            </div>
          )
        }
        return renderBlock(item)
      })}

      <Lightbox
        index={index}
        open={index >= 0}
        close={() => setIndex(-1)}
        slides={galleryImages}
      />
    </div>
  )
}
