'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, RefreshCw } from 'lucide-react'
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"
import InstagramEmbed from './InstagramEmbed'
import NotionGallerySlider from './NotionGallerySlider'

export default function NotionRenderer({ blocks, pageMetadata = [], slugMap = {}, showLeadText = false, galleryMode = false, pageTitle = '' }: { blocks: any[], pageMetadata?: any[], slugMap?: Record<string, string>, showLeadText?: boolean, galleryMode?: boolean, pageTitle?: string }) {
  const [index, setIndex] = useState(-1)
  const [activeTab, setActiveTab] = useState('')
  const [failedMediaIds, setFailedMediaIds] = useState<Set<string>>(new Set())
  const [retryCounts, setRetryCounts] = useState<Record<string, number>>({})

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

  const isParisPage = pageTitle.toLowerCase().includes('paris') || pageTitle.toLowerCase().includes('olympics')
  const isVoltaPage = pageTitle.toLowerCase().includes('volta') || pageTitle.toLowerCase().includes('records')
  const isSilentStepsPage = pageTitle.toLowerCase().includes('silent steps')
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[DEBUG] NotionRenderer Title:', pageTitle, 'isVoltaPage:', isVoltaPage)
    }
  }, [pageTitle, isVoltaPage])

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

  // Route all images through the server-side proxy to avoid referrer blocking and enable caching
  const proxyImageUrl = (url: string, blockId?: string) => {
    if (!url) return url
    // Don't proxy local/relative URLs, data URIs, or already-proxied URLs
    if (url.startsWith('/') || url.startsWith('data:') || url.includes('/api/image-proxy')) return url
    // Don't proxy Imgur embed URLs (they're iframes)
    if (url.includes('imgur.com/embed') || url.includes('imgur.com/a/')) return url
    let returnUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`
    if (blockId) returnUrl += `&blockId=${blockId}`
    return returnUrl
  }

  // Robust Google Maps detection
  const isGoogleMap = (url: string) => {
    if (!url) return false
    return (
      (url.includes('google.') && url.includes('/maps')) ||
      url.includes('goo.gl/maps') ||
      url.includes('maps.app.goo.gl')
    )
  }

  const convertCountryToFlag = (text: string) => {
    const flags: Record<string, string> = {
      'TR': '🇹🇷',
      'TUR': '🇹🇷',
      'TURKEY': '🇹🇷',
      'TÜRKİYE': '🇹🇷',
      'USA': '🇺🇸',
      'US': '🇺🇸',
      'FRANCE': '🇫🇷',
      'FR': '🇫🇷',
      'ITALY': '🇮🇹',
      'IT': '🇮🇹',
      'PORTUGAL': '🇵🇹',
      'PT': '🇵🇹',
      'NETHERLANDS': '🇳🇱',
      'NL': '🇳🇱',
      'GERMANY': '🇩🇪',
      'DE': '🇩🇪',
      'UK': '🇬🇧',
      'GB': '🇬🇧',
      'SPAIN': '🇪🇸',
      'ES': '🇪🇸',
      'BRAZIL': '🇧🇷',
      'BR': '🇧🇷',
      'JAPAN': '🇯🇵',
      'JP': '🇯🇵'
    }

    // Match code at the end of string, e.g. "Paris 2024 FR", "Paris 2024 (USA)" or "Paris 2024 Turkey"
    return text.replace(/[\s(]+([A-Z]{2,}|TÜRKİYE|TURKEY|ITALY|FRANCE|GERMANY|SPAIN|PORTUGAL|NETHERLANDS|BRAZIL|JAPAN)[\s)]*(\s*)$/i, (match, code, space) => {
      const flag = flags[code.toUpperCase()]
      return flag ? ` ${flag}${space}` : match
    })
  }
  
  // Recursively collect all images for the gallery
  const getAllImages = (blocks: any[]): any[] => {
    let images: any[] = []
    blocks.forEach(block => {
      const type = block.type
      if (type === 'image') {
        const val = block.image
        const rawSrc = val.type === 'external' ? val.external.url : val.file.url
        images.push({ src: proxyImageUrl(normalizeImgurUrl(rawSrc), block.id) })
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
    let mediaCount = 0
    const traverse = (arr: any[]) => {
      arr.forEach(block => {
        const type = block.type
        const value = block[type]
        const url = value?.type === 'external' ? value.external.url : (value?.file?.url || value?.url || block.video?.external?.url || block.video?.file?.url || '')
        const isMap = isGoogleMap(url)
        const caption = value?.caption?.[0]?.plain_text || ''
        const isPandaVideo = caption.includes('Panda, 2018-2022') && type === 'video'
        const isExcluded = isPandaVideo // Only exclude the video version from gallery pooling

        const isMedia = ['image', 'video', 'embed', 'google_drive'].includes(type)
        if (isMedia) {
          mediaCount++
          
          if (!isMap && !isExcluded) {
            mediaBlocks.push(block)
          }
        }
        
        if (block.children && block.children.length > 0) {
          traverse(block.children)
        }
      })
    }
    
    traverse(blocksArray)
    return mediaBlocks
  }

  let allMediaBlocks = getAllMediaBlocks(blocks)
  if (isVoltaPage) {
    let foundMarker = false
    let mediaAfterMarker: any[] = []
    
    const traverseAndCollect = (arr: any[]) => {
      arr.forEach(b => {
        const type = b.type
        const value = b[type]
        const blockText = value?.rich_text?.[0]?.plain_text?.trim().toUpperCase() || ''
        const isMarker = (type.startsWith('heading_') || type === 'paragraph' || type === 'toggle') && 
                         (blockText.includes('PHOTO GALLERY') || 
                          blockText.includes('GALLERY') || 
                          blockText.includes('GALERİ') || 
                          blockText.includes('FOTOĞRAF'))
        
        if (isMarker) {
          foundMarker = true
        } else if (foundMarker) {
          const isMedia = ['image', 'video', 'embed', 'google_drive'].includes(type)
          if (isMedia) {
            let src = ''
            if (type === 'image') src = (value.type === 'external' ? value.external.url : value.file.url).toLowerCase()
            const isGif = src.includes('.gif')
            const isMap = isGoogleMap(src)
            // Exclude GIFs and maps from the slider
            if (!isMap && !isGif) {
              mediaAfterMarker.push(b)
            }
          }
        }
        
        if (b.children && b.children.length > 0) {
          traverseAndCollect(b.children)
        }
      })
    }
    
    traverseAndCollect(blocks)
    allMediaBlocks = mediaAfterMarker
  }

  // Gallery mode is only activated on specific pages (e.g. Silent Steps Series)
  const isGalleryLayout = (galleryMode || isVoltaPage) && allMediaBlocks.length > 0

  if (typeof window !== 'undefined' && (isVoltaPage || pageTitle.toLowerCase().includes('records'))) {
    console.log('[VOLTA DEBUG]', { 
      pageTitle, 
      isVoltaPage, 
      galleryMode, 
      mediaCount: allMediaBlocks.length,
      isGalleryLayout
    })
  }

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

  // Set initial active tab based on what's available
  React.useEffect(() => {
    if (!activeTab) {
      if (isParisPage) {
        if (staticImageBlocks.length > 0) setActiveTab('Photography')
        else if (videoBlocks.length > 0) setActiveTab('Videos')
      } else {
        if (gifBlocks.length > 0) setActiveTab('GIFs')
        else if (staticImageBlocks.length > 0) setActiveTab('Photography')
        else if (videoBlocks.length > 0) setActiveTab('Videos')
      }
    }
  }, [isParisPage, gifBlocks.length, staticImageBlocks.length, videoBlocks.length, activeTab])

  const renderRichText = (richText: any[]) => {
    if (!richText || richText.length === 0) return null
    return richText.map((t: any, i: number) => {
      let { annotations, plain_text, href, type, mention } = t
      
      // Automatic flag conversion for text segments
      if (type === 'text' && plain_text) {
        plain_text = convertCountryToFlag(plain_text)
      }

      const style = {
        fontWeight: annotations?.bold ? 'bold' : 'normal',
        fontStyle: annotations?.italic ? 'italic' : 'normal',
        textDecoration: annotations?.strikethrough ? 'line-through' : 'none',
        color: annotations?.color !== 'default' ? annotations.color : 'inherit'
      }

      if (type === 'mention' && mention?.type === 'page') {
        const mentionId = mention.page.id
        const mentionSlug = slugMap[mentionId] || mentionId.replace(/-/g, '')
        const cleanText = plain_text.trim()
        const isExcludedText = isVoltaPage && (cleanText.includes('Resimlerimin Mırıldandığı Şarkılar') || cleanText.includes('Kavramsal Metin'))
        
        if (isExcludedText) {
          return (
            <Link key={i} href={`/${mentionSlug}`} style={style} className="notion-link">
              {plain_text}
            </Link>
          )
        }

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
        const cleanText = plain_text.trim()
        const isInternalNotion = href.includes('notion.so') && !href.includes('google.com')
        const isExcludedText = isVoltaPage && (cleanText.includes('Resimlerimin Mırıldandığı Şarkılar') || cleanText.includes('Kavramsal Metin'))
        
        const isMusicService = href.includes('music.youtube.com') || 
                               href.includes('spotify.com') || 
                               href.includes('music.apple.com') || 
                               href.includes('deezer.com')

        if ((isInternalNotion || isMusicService) && !isExcludedText) {
          let icon = (
            <svg viewBox="0 0 14 14" className="notion-mention-icon">
              <path d="M2.5 1.5v11h9v-7.38L8.12 1.5H2.5zM1.5 1.5A1 1 0 012.5.5h5.83l.11.04 3.42 3.42.04.11v8.43a1 1 0 01-1 1h-9a1 1 0 01-1-1v-11z" />
            </svg>
          )

          if (href.includes('spotify.com')) {
            icon = (
              <svg viewBox="0 0 24 24" className="notion-mention-icon" fill="currentColor">
                <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.508 17.302c-.223.367-.704.485-1.07.262-2.734-1.67-6.175-2.048-10.228-1.123-.42.096-.834-.172-.93-.591-.096-.42.172-.834.591-.93 4.437-.1.012 8.27-.448 11.41 1.473.367.223.485.704.262 1.07-.223.367-.704.485-1.07.262zM18.91 14.025c-.282.458-.883.61-1.341.328-3.125-1.92-7.886-2.47-11.58-1.347-.512.156-1.054-.132-1.21-.645-.156-.512.132-1.054.645-1.21 4.226-1.284 9.475-.66 13.158 1.6 1.6.458.282 1.059.13.328.61.328 1.341.328zM19.043 10.61c-3.747-2.225-9.924-2.43-13.483-1.352-.575.175-1.18-.153-1.355-.728-.175-.575.153-1.18.728-1.355 4.102-1.246 10.916-1.008 15.222 1.55.518.308.687.978.379 1.496-.308.518-.978.687-1.496.379z"/>
              </svg>
            )
          } else if (href.includes('music.youtube.com')) {
            icon = (
              <svg viewBox="0 0 24 24" className="notion-mention-icon" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18.369c-3.518 0-6.369-2.851-6.369-6.369S8.482 5.631 12 5.631s6.369 2.851 6.369 6.369-2.851 6.369-6.369 6.369zM12 7.031c-2.744 0-4.969 2.225-4.969 4.969S9.256 16.969 12 16.969s4.969-2.225 4.969-4.969-2.225-4.969-4.969-4.969zM9.654 15.111l6.113-3.111-6.113-3.111v6.222z"/>
              </svg>
            )
          } else if (href.includes('apple.com')) {
            icon = (
              <svg viewBox="0 0 24 24" className="notion-mention-icon" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.5 9v3.5c0 1.93-1.57 3.5-3.5 3.5s-3.5-1.57-3.5-3.5 1.57-3.5 3.5-3.5c.35 0 .68.05 1 .14V7h2.5v2h-2.5z"/>
              </svg>
            )
          }

          return (
            <a key={i} href={href} style={style} className="notion-link-mention">
              {icon}
              {plain_text}
            </a>
          )
        }
        return (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer" style={style} className="notion-link">
            {plain_text}
          </a>
        )
      }

      return <span key={i} style={style}>{plain_text}</span>
    })
  }


  const renderBlock = (block: any): React.ReactNode => {
    const { type, id, children } = block
    const value = block[type]
    const caption = value?.caption
    
    // Ultimate filter: do not render GPT summary text from source blocks on ANY page
    // Since we hardcode it for Volta, we don't want the original block showing up anywhere.
    const richText = value?.rich_text || []
    const fullText = richText.map((t: any) => t.plain_text).join('')
    const lowerText = fullText.toLowerCase()
    const isGptText = (lowerText.includes('gpt ile uzun sohbetler') || 
                       lowerText.includes('şarkı üretildi') || 
                       (lowerText.includes('gpt') && lowerText.includes('promptlar')) ||
                       lowerText.includes('biz aslında hep bu resmin içindeki müziği bulmaya çalışıyorduk') ||
                       lowerText.includes('biz sadece bir şarkı yapmadık') ||
                       lowerText.includes('gpt said:'))
    if (isGptText) {
      return null
    }
    
    // Check if the current page should have full-width videos
    const fullScreenPageKeywords = ['fire', 'contact', 'seed', 'rêverie', 'insomnia', 'evil', 'rhythm', 'rest']
    const isFullScreenPage = fullScreenPageKeywords.some(kw => pageTitle.toLowerCase().includes(kw))
    
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
    
    // Check for gallery markers
    const blockText = value?.rich_text?.[0]?.plain_text?.trim().toUpperCase() || ''
    const isGalleryMarker = (type.startsWith('heading_') || type === 'paragraph' || type === 'toggle') && 
                            (blockText.includes('PHOTO GALLERY') || 
                             blockText.includes('GALLERY') || 
                             blockText.includes('GALERİ') || 
                             blockText.includes('FOTOĞRAF'))
    
    if (isVoltaPage && isGalleryMarker) {
      console.log('[VOLTA DEBUG] Found Gallery Marker:', type, blockText)
    }

    if (isGalleryMarker) {
      if (isVoltaPage) return null // Suppress marker on Volta page as it's at the top now

      if (type === 'toggle' || value?.is_toggleable) {
        // Render the toggle but with the gallery slider inside it
        return (
          <details key={id} className={`notion-toggle toggle-${type}`}>
            <summary className="notion-summary">
              {type === 'heading_1' && <h1>{renderRichText(value.rich_text)}</h1>}
              {type === 'heading_2' && <h2>{renderRichText(value.rich_text)}</h2>}
              {type === 'heading_3' && <h3>{renderRichText(value.rich_text)}</h3>}
              {type === 'toggle' && <span className="toggle-text">{renderRichText(value.rich_text)}</span>}
            </summary>
            <div className="toggle-content">
              {renderGallerySlider({}, isParisPage || isVoltaPage)}
            </div>
          </details>
        )
      }
      return (
        <div key={id} className="volta-gallery-wrapper">
          {type === 'heading_1' && <h1>{renderRichText(value.rich_text)}</h1>}
          {type === 'heading_2' && <h2>{renderRichText(value.rich_text)}</h2>}
          {type === 'heading_3' && <h3>{renderRichText(value.rich_text)}</h3>}
          {type === 'paragraph' && <p className="notion-p">{renderRichText(value.rich_text)}</p>}
          {renderGallerySlider({}, isParisPage || isVoltaPage)}
        </div>
      )
    }
    
    switch (type) {
      case 'image': {
        const src = value.type === 'external' ? value.external.url : value.file.url
        if (isGalleryLayout && isGalleryItem) {
          const isGif = src.toLowerCase().includes('.gif')
          if ((isParisPage || isVoltaPage) && isGif) {
            // continue
          } else {
            return null
          }
        }
        const caption = value.caption
        return (
          <div key={id} className="notion-image-wrapper">
            <div 
              className="notion-image-container loading-skeleton"
              onClick={() => setIndex(getImageIndex(src))}
              style={{ cursor: 'pointer' }}
            >
              <img 
                src={proxyImageUrl(normalizeImgurUrl(src), id)} 
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="notion-img"
                style={{ width: '100%', height: 'auto' }}
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
      case 'google_drive':
      case 'embed': {
        let src = value.type === 'external' ? value.external.url : value.file?.url || value.url
        const caption = value.caption
        const isPandaVideo = caption?.[0]?.plain_text?.includes('Panda, 2018-2022')
        const isMap = isGoogleMap(src)

        // If we are pooling this into the gallery, suppress inline rendering
        if (isGalleryLayout && isGalleryItem) return null

        if (!src) return null

        const normalizedSrc = normalizeImgurUrl(src)
        const isImgurEmbed = normalizedSrc.includes('imgur.com/a/') && normalizedSrc.includes('/embed')

        // If it's a direct image link or normalized to one, treat it as an image
        const isDirectImage = /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(normalizedSrc) || normalizedSrc.includes('i.imgur.com')
        
        if (isDirectImage && !isImgurEmbed) {
          const retryCount = retryCounts[id] || 0
          const finalSrc = retryCount > 0 ? `${proxyImageUrl(normalizedSrc, id)}&t=${retryCount}` : proxyImageUrl(normalizedSrc, id)
          const isFailed = failedMediaIds.has(id)
          
          return (
            <div key={id} className="notion-image-wrapper image-retry-container">
              <div className="notion-image-container">
                <img 
                  src={finalSrc} 
                  loading="lazy"
                  referrerPolicy="no-referrer" 
                  className={`notion-img ${isFailed ? 'image-failed' : ''}`}
                  style={{ width: '100%', borderRadius: '20px', display: 'block' }} 
                  alt="Embedded Content"
                  onLoad={(e) => {
                    e.currentTarget.classList.add('loaded')
                    // Automatically clear failed state if it loads successfully on retry
                    if (isFailed) {
                      setFailedMediaIds(prev => {
                        const next = new Set(prev)
                        next.delete(id)
                        return next
                      })
                    }
                  }}
                  onError={() => handleMediaError(id)}
                />
                
                {/* Internal timeout logic to detect "stuck" images */}
                <span className="hidden-timeout-trigger" style={{ display: 'none' }}>
                  {(() => {
                    if (!isFailed) {
                      const timer = setTimeout(() => handleMediaError(id), 12000)
                      return null
                    }
                    return null
                  })()}
                </span>
              </div>
              
              {isFailed && (
                <div className="image-retry-overlay">
                  <p className="retry-error-text">Image could not be loaded</p>
                  <button className="retry-button" onClick={(e) => handleMediaRetry(e, id)}>
                    <RefreshCw /> Retry
                  </button>
                </div>
              )}
            </div>
          )
        }

        if (isPandaVideo && isSilentStepsPage) {
          const ytMatch = src.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
          const videoId = (ytMatch && ytMatch[1]) ? ytMatch[1] : '';
          
          if (videoId) {
            return (
              <div key={id} className="notion-video-container-wrapper panda-video-full-width">
                <div className="notion-video-container">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    title="YouTube Video"
                  ></iframe>
                </div>
                <figcaption className="notion-image-caption panda-video-caption-full-width">
                  <div className="panda-story-text">
                    It took me nearly four years to capture the frames in this film. From beginning to end, in less than a minute, an entire lifetime passes before our eyes. In fact, if you watch each loop only once in sequence, it doesn’t even add up to five seconds. I extended it in the edit through repetition. Everything happens between two blinks of an eye.
                  </div>
                  <div className="panda-metadata-text">Panda, 2018-2022 - Istanbul, Ankara</div>
                </figcaption>
              </div>
            )
          }
        }

        // Broad support for Google Maps & My Maps (viewer/edit -> embed transformation)
        if (isMap) {
          src = src
            .replace('viewer?mid=', 'embed?mid=')
            .replace('edit?mid=', 'embed?mid=')
            .replace('http://', 'https://')
          
          if (!src.includes('/embed') && !src.includes('/d/embed') && src.includes('google.com/maps/d/')) {
            src = src.replace('/viewer', '/embed').replace('/edit', '/embed')
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

        const isDirectVideo = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(src)
        if (isDirectVideo) {
          const retryCount = retryCounts[id] || 0
          const finalSrc = retryCount > 0 ? `${proxyImageUrl(src, id)}&t=${retryCount}` : proxyImageUrl(src, id)
          const isFailed = failedMediaIds.has(id)
          
          return (
            <div key={id} className={`notion-video-container-wrapper image-retry-container ${isFullScreenPage ? 'video-full-screen-layout' : ''}`}>
              <div className="notion-video-container">
                <video 
                  key={finalSrc}
                  src={finalSrc} 
                  controls 
                  muted 
                  autoPlay
                  loop
                  playsInline 
                  className={`notion-video-direct ${isFailed ? 'video-failed' : ''}`}
                  style={{ width: '100%', borderRadius: isFullScreenPage ? '0' : '20px', background: '#000' }}
                  onError={() => handleMediaError(id)}
                  onLoadedData={() => {
                    if (isFailed) {
                      setFailedMediaIds(prev => {
                        const next = new Set(prev)
                        next.delete(id)
                        return next
                      })
                    }
                  }}
                />
                {/* Internal timeout logic for videos */}
                {!isFailed && (
                   <span style={{ display: 'none' }}>
                     {(() => {
                       setTimeout(() => {
                         const videoEl = document.querySelector(`video[src="${finalSrc}"]`) as HTMLVideoElement
                         if (videoEl && videoEl.readyState < 2) handleMediaError(id)
                       }, 12000)
                       return null
                     })()}
                   </span>
                )}
              </div>
              {isFailed && (
                <div className="image-retry-overlay">
                  <p className="retry-error-text">Video could not be loaded</p>
                  <button className="retry-button" onClick={(e) => handleMediaRetry(e, id)}>
                    <RefreshCw /> Retry
                  </button>
                </div>
              )}
              {caption && caption.length > 0 && (
                <figcaption className="notion-image-caption">
                  {renderRichText(caption)}
                </figcaption>
              )}
            </div>
          )
        }

        // Vimeo support
        if (src.includes('vimeo.com')) {
          const vimeoMatch = src.match(/vimeo\.com\/(?:video\/)?([0-9]+)/)
          const vimeoId = vimeoMatch ? vimeoMatch[1] : ''
          if (vimeoId) {
            return (
              <div key={id} className="notion-video-container-wrapper">
                <div className="notion-video-container">
                  <iframe
                    src={`https://player.vimeo.com/video/${vimeoId}`}
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title="Vimeo Video"
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

        // Specific handling for standard embeds to avoid "Error 153" or configuration errors
        // YouTube, Vimeo, Instagram, Spotify often NEED the referrer/origin
        const isKnownEmbed = src.includes('youtube') || src.includes('youtu.be') || src.includes('vimeo.com') || src.includes('instagram.com') || src.includes('spotify.com')

        // Spotify specific conversion to embed format
        if (src.includes('spotify.com') && !src.includes('/embed')) {
          src = src.replace('open.spotify.com/', 'open.spotify.com/embed/')
        }

        return (
          <div key={id} className={`notion-video-container-wrapper ${isFullScreenPage ? 'video-full-screen-layout' : ''}`}>
            <div className="notion-video-container">
              <iframe
                src={src}
                frameBorder="0"
                allowFullScreen
                title="Embedded Content"
                className="notion-embed-iframe"
                referrerPolicy={isKnownEmbed ? undefined : "no-referrer"}
                style={{ borderRadius: isFullScreenPage ? '0' : '20px' }}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
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
        
        // Use simple text links instead of cards on the Art & Ideas page or for specific Volta items
        const isArtPage = pageTitle.toLowerCase().includes('art') && pageTitle.toLowerCase().includes('ideas')
        const isExcludedCard = isVoltaPage && (value.title.includes('Resimlerimin Mırıldandığı Şarkılar') || value.title.includes('Kavramsal Metin'))
        
        if (isArtPage || isExcludedCard) {
          return (
            <div key={id} style={{ margin: '0.5rem 0' }}>
              <Link href={`/${slug}`} className="notion-link">• {value.title}</Link>
            </div>
          )
        }

        return (
          <Link key={id} href={`/${slug}`} className="work-card">
            <ArrowUpRight className="card-arrow" size={24} />
            <div className="card-icon-wrapper">
              {bgImage ? (
                <img 
                  src={proxyImageUrl(normalizeImgurUrl(bgImage))} 
                  className="notion-img"
                  onLoad={(e) => e.currentTarget.classList.add('loaded')}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.parentElement?.classList.add('image-failed')
                    target.classList.add('image-failed-img')
                    console.error('Image failed to load:', bgImage)
                  }}
                  alt={value.title || 'Portfolio Item'}
                  loading="lazy"
                  decoding="async"
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
        if (isGoogleMap(bookmarkUrl)) {
          let mapSrc = bookmarkUrl
            .replace('http://', 'https://')
            .replace('viewer?', 'embed?')
            .replace('edit?', 'embed?')
            .replace('/viewer', '/embed')
            .replace('/edit', '/embed')
          
          if (!mapSrc.includes('google.com') && mapSrc.includes('google.')) {
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
        const linkedId = value.page_id.replace(/-/g, '')
        const slug = slugMap[value.page_id] || slugMap[linkedId] || linkedId
        const meta = pageMetadata.find(m => m.id === value.page_id || m.id === linkedId)
        const title = meta?.title || 'Linked Page'

        const isArtPage = pageTitle.toLowerCase().includes('art') && pageTitle.toLowerCase().includes('ideas')
        const isExcludedCard = isVoltaPage && (title.includes('Resimlerimin Mırıldandığı Şarkılar') || title.includes('Kavramsal Metin'))
        
        if (isArtPage || isExcludedCard) {
          return (
            <div key={id} style={{ margin: '0.5rem 0' }}>
              <Link href={`/${slug}`} className="notion-link">• {title}</Link>
            </div>
          )
        }

        return (
          <Link key={id} href={`/${slug}`} className="notion-link-page">
            <ArrowUpRight size={18} />
            <span>{title}</span>
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

  // Move specific blocks (like the Panda video) after Google Maps for better layout on Silent Steps
  const processedBlocks = (() => {
    if (!isSilentStepsPage) return blocks
    
    let pandaBlock: any = null
    const cleanBlocks = (arr: any[]): any[] => {
      return arr.filter(b => {
        const val = b[b.type]
        const caption = val?.caption?.[0]?.plain_text || ''
        if (caption.includes('Panda, 2018-2022') && b.type === 'video') {
          pandaBlock = b
          return false
        }
        if (b.children && b.children.length > 0) {
          b.children = cleanBlocks(b.children)
        }
        return true
      })
    }

    const newBlocks = cleanBlocks([...blocks])
    if (pandaBlock) {
      // Find the index of the last Google Map to place Panda video after it
      let lastMapIndex = -1
      newBlocks.forEach((block, idx) => {
        const type = block.type
        const value = block[type]
        const url = value?.type === 'external' ? value.external.url : (value?.file?.url || value?.url || block.video?.external?.url || block.video?.file?.url || '')
        if (isGoogleMap(url)) {
          lastMapIndex = idx
        }
      })

      if (lastMapIndex !== -1) {
        const result = [...newBlocks]
        result.splice(lastMapIndex + 1, 0, pandaBlock)
        return result
      } else {
        // Fallback: if no map found, put at top
        return [pandaBlock, ...newBlocks]
      }
    }
    return newBlocks
  })()

  // Group consecutive child_page blocks for grid display
  const groupedBlocks = processedBlocks.reduce((acc: any[], block: any) => {
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

  const renderGallerySlider = (customStyles: React.CSSProperties = {}, hideTabs = false, square = false) => {
    if (!isGalleryLayout) return null
    return (
      <div className="unified-gallery-wrapper tabbed-gallery" style={{ marginBottom: isSilentStepsPage ? '0rem' : '3rem', ...customStyles }}>
        {!hideTabs && (
          <div className="notion-tabs-container">
            <div className="notion-tabs-bar">
              {gifBlocks.length > 0 && (
                <button 
                  className={`notion-tab-button ${activeTab === 'GIFs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('GIFs')}
                >
                  All Animations
                </button>
              )}
              {staticImageBlocks.length > 0 && (
                <button 
                  className={`notion-tab-button ${activeTab === 'Photography' ? 'active' : ''}`}
                  onClick={() => setActiveTab('Photography')}
                >
                  Photo Gallery
                </button>
              )}
              {videoBlocks.length > 0 && (
                <button 
                  className={`notion-tab-button ${activeTab === 'Videos' ? 'active' : ''}`}
                  onClick={() => setActiveTab('Videos')}
                >
                  Making Videos
                </button>
              )}
            </div>
          </div>
        )}

        <div className="tab-content-wrapper fade-in-entrance">
          {activeTab === 'GIFs' && gifBlocks.length > 0 ? (
            <NotionGallerySlider key="GIFs" items={gifBlocks} fullWidth={!isSilentStepsPage} square={square} isSilentSteps={isSilentStepsPage} />
          ) : activeTab === 'Videos' && videoBlocks.length > 0 ? (
            <NotionGallerySlider key="Videos" items={videoBlocks} square={square} isSilentSteps={isSilentStepsPage} />
          ) : (
            staticImageBlocks.length > 0 && <NotionGallerySlider key="Photography" items={staticImageBlocks} square={square} isSilentSteps={isSilentStepsPage} />
          )}
        </div>
      </div>
    )
  }

  // Check if we should render gallery at the top (fallback for Silent Steps)
  const hasGalleryMarker = blocks.some(b => {
    const val = b[b.type]
    const text = val?.rich_text?.[0]?.plain_text?.trim().toUpperCase() || ''
    return (b.type.startsWith('heading_') || b.type === 'toggle') && 
           (text.includes('PHOTO GALLERY') || 
            text.includes('GALLERY') || 
            text.includes('GALERİ') || 
            text.includes('FOTOĞRAF'))
  })
  const shouldRenderGalleryAtTop = isGalleryLayout && !hasGalleryMarker && !isParisPage && !isVoltaPage

  return (
    <div className="notion-blocks">
      {showLeadText && pageTitle === 'Silent Steps Series' && (
        <div className="notion-page-lead-text">
          The project ongoing since 2018 and over 600+ individual unique collages created from 40+ different species were created and applied to the streets. ”I create each frame of the animation by ripping apart images I've previously made. Each frame is a collage.”
        </div>
      )}

      {(() => {
        if (isParisPage && !hasGalleryMarker) {
          // Find the end of the description - we include text and GIFs
          let descriptionEndIndex = 0
          for (let i = 0; i < groupedBlocks.length; i++) {
            const b = groupedBlocks[i]
            const val = b[b.type]
            const url = (val?.type === 'external' ? val?.external?.url : val?.file?.url || val?.url || '').toLowerCase()
            
            // Check if this specific block is pulled into the gallery
            const blockIsGalleryItem = allMediaBlocks.some((mb: any) => mb.id === b.id)
            const isSkippedMedia = (b.type === 'image' || b.type === 'video' || b.type === 'embed') && blockIsGalleryItem
            const isGif = b.type === 'image' && url.includes('.gif')
            
            if (['paragraph', 'heading_1', 'heading_2', 'heading_3'].includes(b.type) || isGif) {
              descriptionEndIndex = i + 1
            } else if (isSkippedMedia || (b.type === 'paragraph' && !b.paragraph?.rich_text?.length)) {
              continue
            } else {
              break
            }
          }

          const before = groupedBlocks.slice(0, descriptionEndIndex)
          const after = groupedBlocks.slice(descriptionEndIndex)

          return (
            <>
              {before.map((item: any, i: number) => {
                const blockContent = renderBlock(item)
                if (!blockContent) return null
                
                return (
                  <div key={item.id} style={{ marginBottom: i === before.length - 1 ? '0.5rem' : undefined }}>
                    {blockContent}
                  </div>
                )
              })}
              {renderGallerySlider({ marginTop: '0', marginBottom: '2rem' }, true)}
              {after.map((item: any, i: number) => {
                const blockContent = renderBlock(item)
                if (!blockContent) return null

                if (item._type === '_child_page_group') {
                  return (
                    <div key={`group-${i}`} className="works-grid-inline">
                      {item.items.map((b: any) => renderBlock(b))}
                    </div>
                  )
                }
                return (
                  <div key={item.id}>
                    {blockContent}
                  </div>
                )
              })}
            </>
          )
        }

        if (isVoltaPage) {
          return (
            <>
              <blockquote className="notion-quote" style={{ borderLeft: '3px solid var(--text-color)', paddingLeft: '1.2rem', marginBottom: '1.5rem', fontStyle: 'italic', color: 'var(--secondary-text)', fontSize: '1.15rem', lineHeight: '1.7', opacity: 0.9 }}>
                “Şimdi fark ettim ki biz aslında hep bu resmin içindeki müziği bulmaya çalışıyorduk. O yüzden bu kadar üzerinde konuştuk, detayları irdeledik, anlamlarını düşündük.<br /><br />
                Ve işin güzel tarafı: Biz sadece bir şarkı yapmadık, aslında bir dünya yarattık.”
              </blockquote>
              <div style={{ marginBottom: '0.5rem' }} className="volta-top-gallery-section">
                {renderGallerySlider({ marginTop: '0', marginBottom: '0.5rem' }, true, true)}
              </div>
              <div className="notion-paragraph-block" style={{ marginBottom: '3rem', marginTop: '0' }}>
                <p className="notion-p" style={{ fontSize: '1.25rem', color: 'var(--text-color)', opacity: 0.95, lineHeight: '1.7', fontWeight: 400 }}>
                  Tüm resimler için GPT ile uzun sohbetler ve değerlendirmeler yaptık. GPT her bir resim için özel promptlar ve şarkı yapıları oluşturdu, şarkı sözlerini yazdı ve resimlerin isimleri de GPT verildi. Sergi için yaklaşık 4000 şarkı üretildi. Ortaya çıkan şarkılar, GPT ile birlikte resmin içindeki müziği bulma çabamızın bir çıktısı.
                </p>
              </div>
              {groupedBlocks.map((item: any, i: number) => {
                if (item.type === 'paragraph' && !item.paragraph?.rich_text?.length && !item.children?.length) {
                  return null
                }
                
                if (item._type === '_child_page_group') {
                  return (
                    <div key={`group-${i}`} className="works-grid-inline">
                      {item.items.map((b: any) => renderBlock(b))}
                    </div>
                  )
                }
                return renderBlock(item)
              })}
            </>
          )
        }

        // Standard logic for other pages or if marker exists
        return (
          <div className={isSilentStepsPage ? 'tight-layout' : ''}>
            {shouldRenderGalleryAtTop && renderGallerySlider({}, isParisPage || isVoltaPage)}
            {groupedBlocks.map((item: any, i: number) => {
              if (item.type === 'paragraph' && !item.paragraph?.rich_text?.length && !item.children?.length) {
                return null
              }
              // Skip empty toggle blocks or headings without text on Silent Steps
              if (isSilentStepsPage && (item.type.startsWith('heading_') || item.type === 'toggle')) {
                const text = item[item.type]?.rich_text?.[0]?.plain_text?.trim()
                if (!text && !item.children?.length) return null
              }
              
              const content = (item._type === '_child_page_group') ? (
                <div key={`group-${i}`} className="works-grid-inline">
                  {item.items.map((b: any) => renderBlock(b))}
                </div>
              ) : renderBlock(item)
              
              return content
            })}
          </div>
        )
      })()}

      <Lightbox
        index={index}
        open={index >= 0}
        close={() => setIndex(-1)}
        slides={galleryImages}
      />
    </div>
  )
}
