'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"

export default function NotionRenderer({ blocks, pageMetadata = [] }: { blocks: any[], pageMetadata?: any[] }) {
  const [index, setIndex] = useState(-1)
  
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

  // Group consecutive child_page blocks together for the grid view
  const groupedBlocks: any[] = []
  let currentGroup: any[] = []

  blocks.forEach((block) => {
    if (block.type === 'child_page') {
      currentGroup.push(block)
    } else {
      if (currentGroup.length > 0) {
        groupedBlocks.push({ type: 'page_group', pages: currentGroup })
        currentGroup = []
      }
      groupedBlocks.push(block)
    }
  })
  if (currentGroup.length > 0) {
    groupedBlocks.push({ type: 'page_group', pages: currentGroup })
  }

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
        const mentionSlug = mention.page.id.replace(/-/g, '')
        return (
          <Link key={i} href={`/${mentionSlug}`} style={style} className="notion-link-mention">
            {plain_text}
          </Link>
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

    // Wrap in toggle if Notion says so or if it's a toggle type
    if (type === 'toggle' || (hasVisibleChildren && type.startsWith('heading_'))) {
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

    switch (type) {
      case 'heading_1':
        return <h1 key={id}>{renderRichText(value.rich_text)}{renderChildren()}</h1>
      case 'heading_2':
        return <h2 key={id}>{renderRichText(value.rich_text)}{renderChildren()}</h2>
      case 'heading_3':
        return <h3 key={id}>{renderRichText(value.rich_text)}{renderChildren()}</h3>
      case 'paragraph':
        return <p key={id} className="notion-p">{renderRichText(value.rich_text)}{renderChildren()}</p>
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
      case 'image': {
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
                src={src} 
                decoding="async"
                onLoad={(e) => {
                  const target = e.target as HTMLElement;
                  target.parentElement?.classList.remove('loading-skeleton');
                  target.classList.add('loaded');
                }}
                onError={(e) => {
                  const target = e.target as HTMLElement;
                  target.parentElement?.classList.remove('loading-skeleton');
                  target.parentElement?.classList.add('image-error');
                  target.style.opacity = '0.3';
                  target.style.filter = 'grayscale(100%)';
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
      case 'video':
      case 'embed': {
        let src = value.type === 'external' ? value.external.url : value.file?.url || value.url
        if (!src) return null

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
          <div key={id} className="notion-video-container">
            <iframe
              src={src}
              frameBorder="0"
              allowFullScreen
              title="Embedded Content"
              className="notion-embed-iframe"
            ></iframe>
          </div>
        )
      }
      case 'child_page': {
        const slug = id.replace(/-/g, '')
        return (
          <Link key={id} href={`/${slug}`} className="notion-link-page">
            <ArrowUpRight size={18} />
            <span>{value.title}</span>
          </Link>
        )
      }
      case 'bookmark':
        return (
          <a key={id} href={value.url} target="_blank" rel="noopener noreferrer" className="notion-bookmark">
            <div className="notion-bookmark-content">
              <div className="notion-bookmark-title">{value.url}</div>
              <div className="notion-bookmark-link">{value.url}</div>
            </div>
          </a>
        )
      case 'link_to_page': {
        const pageId = value.page_id.replace(/-/g, '')
        return (
          <Link key={id} href={`/${pageId}`} className="notion-link-page">
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
      case 'synced_block':
        return <div key={id} className="notion-synced-block">{renderChildren()}</div>
      default:
        if (hasVisibleChildren) {
          return <div key={id} className="notion-unknown-block">{renderChildren()}</div>
        }
        return null
    }
  }

  return (
    <div className="notion-blocks">
      {groupedBlocks.map((item, idx) => {
        if (item.type === 'page_group') {
          return (
            <div key={`group-${idx}`} className="works-grid">
              {item.pages.map((page: any) => {
                const slug = page.id.replace(/-/g, '')
                const meta = pageMetadata.find(m => m.id === page.id)
                const icon = meta?.icon
                const cover = meta?.cover
                const bgImage = cover?.external?.url || cover?.file?.url || icon?.external?.url || icon?.file?.url

                return (
                  <Link key={page.id} href={`/${slug}`} className="work-card">
                    <ArrowUpRight className="card-arrow" size={24} />
                    <div className="card-icon-wrapper">
                      {bgImage ? (
                        <img 
                          src={bgImage} 
                          alt="" 
                          className="card-icon-img" 
                        />
                      ) : (
                        icon?.type === 'emoji' && <span className="card-emoji">{icon.emoji}</span>
                      )}
                    </div>
                    <h3>{page.child_page.title}</h3>
                  </Link>
                )
              })}
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
