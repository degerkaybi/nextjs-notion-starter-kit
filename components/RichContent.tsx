import Link from 'next/link'
import { getMediaUrl, getPage, getPageHref, type NotionBlock } from '@/lib/portfolio'

type RichPart = {
  plain_text?: string
  href?: string | null
  annotations?: { bold?: boolean; italic?: boolean; underline?: boolean; strikethrough?: boolean; code?: boolean }
  mention?: { type?: string; page?: { id?: string } }
}

function richText(parts: RichPart[] = []) {
  return parts.map((part, index) => {
    let text: React.ReactNode = part.plain_text || ''
    if (part.annotations?.code) text = <code>{text}</code>
    if (part.annotations?.bold) text = <strong>{text}</strong>
    if (part.annotations?.italic) text = <em>{text}</em>
    if (part.annotations?.underline) text = <u>{text}</u>
    if (part.annotations?.strikethrough) text = <s>{text}</s>
    const linkedPage = part.mention?.type === 'page' && part.mention.page?.id ? getPage(part.mention.page.id) : null
    if (linkedPage) return <Link key={index} href={getPageHref(linkedPage)}>{text}</Link>
    if (part.href) return <a key={index} href={part.href} target="_blank" rel="noopener noreferrer">{text}</a>
    if (/https?:\/\//.test(part.plain_text || '')) {
      return <span key={index}>{(part.plain_text || '').split(/(https?:\/\/[^\s]+)/g).map((piece, pieceIndex) => /^https?:\/\//.test(piece) ? <a key={pieceIndex} href={piece} target="_blank" rel="noopener noreferrer">{piece}</a> : piece)}</span>
    }
    return <span key={index}>{text}</span>
  })
}

function youtubeEmbed(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}`
    if (parsed.hostname.endsWith('youtube.com')) {
      const id = parsed.searchParams.get('v') || parsed.pathname.match(/\/(?:embed|shorts)\/([^/]+)/)?.[1]
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
    }
  } catch {}
  return null
}

function Media({ value, kind, caption }: { value: { mediaId?: string; url?: string }; kind: string; caption?: RichPart[] }) {
  const url = getMediaUrl(value.mediaId) || value.url
  const label = caption?.map(part => part.plain_text).join('') || ''
  if (!url) return <figure className="pf-media-unavailable"><span>{kind === 'image' ? 'Image currently unavailable' : 'Media currently unavailable'}</span>{label && <figcaption>{richText(caption)}</figcaption>}</figure>
  if (kind === 'image') {
    return <figure className="pf-figure"><img src={url} alt={label} loading="lazy" decoding="async" />{label && <figcaption>{richText(caption)}</figcaption>}</figure>
  }
  if (kind === 'video') {
    const embed = youtubeEmbed(url)
    return <figure className="pf-figure pf-video">{embed ? <iframe src={embed} title={label || 'Artwork video'} loading="lazy" allowFullScreen /> : <video src={url} controls preload="metadata" />}{label && <figcaption>{richText(caption)}</figcaption>}</figure>
  }
  if (kind === 'audio') return <figure className="pf-audio"><audio src={url} controls preload="none" />{label && <figcaption>{richText(caption)}</figcaption>}</figure>
  return <a className="pf-file" href={url} target="_blank" rel="noopener noreferrer">{label || 'Open file'} ↗</a>
}

function Embed({ url, title }: { url: string; title: string }) {
  const youtube = youtubeEmbed(url)
  if (youtube) return <div className="pf-embed pf-video"><iframe src={youtube} title={title} loading="lazy" allowFullScreen /></div>
  if (/google\.[^/]+\/maps/.test(url)) {
    const mapUrl = url.replace('/edit?', '/embed?').replace('/viewer?', '/embed?')
    return <div className="pf-embed pf-map"><iframe src={mapUrl} title={title} loading="lazy" /></div>
  }
  if (/spotify\.com|soundcloud\.com|music\.youtube\.com/.test(url)) return <div className="pf-embed pf-sound"><iframe src={url} title={title} loading="lazy" /></div>
  return <a className="pf-external-link" href={url} target="_blank" rel="noopener noreferrer">{title} ↗</a>
}

function Block({ block }: { block: NotionBlock }) {
  const value = (block[block.type] || {}) as {
    rich_text?: RichPart[]
    caption?: RichPart[]
    mediaId?: string
    url?: string
    title?: string
    checked?: boolean
    language?: string
    page_id?: string
  }
  const content = richText(value.rich_text)
  const children = block.children?.length ? <RichContent blocks={block.children} /> : null

  switch (block.type) {
    case 'paragraph':
      return <div className="pf-block"><p>{content}</p>{children}</div>
    case 'heading_1':
      return <h2 className="pf-block-heading">{content}</h2>
    case 'heading_2':
      return <h3 className="pf-block-heading">{content}</h3>
    case 'heading_3':
    case 'heading_4':
      return <h4 className="pf-block-heading">{content}</h4>
    case 'image':
    case 'video':
    case 'audio':
    case 'file':
    case 'pdf':
      return <Media value={value} kind={block.type} caption={value.caption} />
    case 'embed':
    case 'link_preview':
      return value.url ? <Embed url={value.url} title={value.caption?.[0]?.plain_text || 'External media'} /> : null
    case 'bookmark':
      return value.url ? <a className="pf-bookmark" href={value.url} target="_blank" rel="noopener noreferrer"><span>{value.caption?.[0]?.plain_text || value.url}</span><span>↗</span></a> : null
    case 'quote':
      return <blockquote className="pf-quote">{content}{children}</blockquote>
    case 'callout':
      return <aside className="pf-callout">{content}{children}</aside>
    case 'bulleted_list_item':
      return <div className="pf-list-item"><span aria-hidden="true">•</span><div>{content}{children}</div></div>
    case 'numbered_list_item':
      return <div className="pf-list-item"><span aria-hidden="true">—</span><div>{content}{children}</div></div>
    case 'to_do':
      return <div className="pf-list-item"><span aria-hidden="true">{value.checked ? '☑' : '□'}</span><div>{content}{children}</div></div>
    case 'toggle':
      return <details className="pf-toggle"><summary>{content}</summary>{children}</details>
    case 'divider':
      return <hr className="pf-divider" />
    case 'column_list':
      return <div className="pf-columns">{children}</div>
    case 'column':
      return <div className="pf-column">{children}</div>
    case 'synced_block':
      return <>{children}</>
    case 'child_page': {
      const page = getPage(block.id)
      return page ? <Link className="pf-child-page" href={getPageHref(page)}>{page.title}<span aria-hidden="true">↗</span></Link> : null
    }
    case 'link_to_page': {
      const page = value.page_id ? getPage(value.page_id) : null
      return page ? <Link className="pf-child-page" href={getPageHref(page)}>{page.title}<span aria-hidden="true">↗</span></Link> : null
    }
    case 'code':
      return <pre className="pf-code"><code>{value.rich_text?.map(part => part.plain_text).join('')}</code></pre>
    case 'table':
      return <div className="pf-table-wrap"><table><tbody>{block.children?.map(row => {
        const rowValue = row.table_row as { cells?: RichPart[][] } | undefined
        return <tr key={row.id}>{rowValue?.cells?.map((cell, index) => <td key={index}>{richText(cell)}</td>)}</tr>
      })}</tbody></table></div>
    default:
      return value.rich_text?.length ? <div className="pf-block"><p>{content}</p>{children}</div> : children
  }
}

export default function RichContent({ blocks }: { blocks: NotionBlock[] }) {
  return <div className="pf-rich-content">{blocks.map(block => <Block key={block.id} block={block} />)}</div>
}
