import Link from 'next/link'
import * as React from 'react'
import { useNotionContext } from 'react-notion-x'
import { getBlockTitle, parsePageId } from 'notion-utils'
import { mapImageUrl } from '@/lib/map-image-url'
import { getCanonicalPageId } from '@/lib/get-canonical-page-id'

import styles from './PageLinkCard.module.css'

interface PageLinkBlockProps {
    block: any
    className?: string
}

/**
 * Sayfa içinden ilk görseli bulur
 * Önce cover, sonra içerikteki ilk image bloğunu kontrol eder (Derinlemesine arama - DFS)
 */
function findFirstImageInPage(pageId: string, recordMap: any): string | null {
    if (!recordMap?.block) return null

    const normalizedPageId = parsePageId(pageId) || pageId

    // Sayfa bloğunu bul
    const pageBlock = recordMap.block[normalizedPageId]?.value
    if (!pageBlock) return null

    // 1. Önce cover resmi kontrol et
    const cover = pageBlock?.format?.page_cover
    if (cover) {
        if (cover.startsWith('http')) {
            return `https://www.notion.so/image/${encodeURIComponent(cover)}?table=block&id=${normalizedPageId}&cache=v2`
        }
        if (cover.startsWith('attachment:') || cover.includes('/')) {
            return `https://www.notion.so/image/${encodeURIComponent(cover)}?table=block&id=${normalizedPageId}&cache=v2`
        }
    }

    // 2. Content bloklarını recursively tara (DFS - Depth First Search)
    const stack = [...(pageBlock.content || [])].reverse()
    const visited = new Set<string>()
    let iterations = 0
    const MAX_BLOCKS_TO_CHECK = 100

    while (stack.length > 0 && iterations < MAX_BLOCKS_TO_CHECK) {
        iterations++
        const blockId = stack.pop()

        if (!blockId || visited.has(blockId)) continue
        visited.add(blockId)

        const block = recordMap.block[blockId]?.value
        if (!block) continue

        // Image block
        if (block.type === 'image') {
            const source =
                block?.properties?.source?.[0]?.[0] ||
                block?.format?.display_source ||
                block?.format?.block_full_width_layout_source

            if (source) {
                if (source.startsWith('http')) {
                    return `https://www.notion.so/image/${encodeURIComponent(source)}?table=block&id=${block.id}&cache=v2`
                }
                return `https://www.notion.so/image/${encodeURIComponent(source)}?table=block&id=${block.id}&cache=v2`
            }
        }

        // Embed veya video block
        if (block.type === 'embed' || block.type === 'video') {
            const source = block?.format?.display_source
            if (source && source.startsWith('http') &&
                (source.includes('.jpg') || source.includes('.jpeg') ||
                    source.includes('.png') || source.includes('.gif') ||
                    source.includes('.webp'))) {
                return source
            }
        }

        if (block.content && block.content.length > 0) {
            for (let i = block.content.length - 1; i >= 0; i--) {
                stack.push(block.content[i])
            }
        }
    }

    return null
}

/**
 * Custom Page Link component - kart formatında sayfa linki gösterir
 */
export function PageLinkBlock({ block, className }: PageLinkBlockProps) {
    const { recordMap, mapPageUrl } = useNotionContext()

    if (!block) return null

    // Block'un ID'sini al (page veya link_to_page olabilir)
    let targetPageId: string | null = null

    if (block.type === 'page') {
        targetPageId = block.id
    } else if (block.type === 'link_to_page' && block.format?.page_id) {
        targetPageId = block.format.page_id
    } else if (block.type === 'alias' && block.format?.alias_pointer?.id) {
        targetPageId = block.format.alias_pointer.id
    }

    if (!targetPageId) return null

    const normalizedPageId = parsePageId(targetPageId) || targetPageId

    // Hedef sayfayı al (Prefetch sayesinde içi dolu olabilir)
    const targetBlock = recordMap?.block?.[normalizedPageId]?.value
    if (!targetBlock) return null

    // Sayfa başlığını al
    const title = getBlockTitle(targetBlock, recordMap) || 'Untitled'

    // İkonu al
    const icon = targetBlock.format?.page_icon

    // İlk görseli bul (Recursive DFS ile)
    let imageUrl = findFirstImageInPage(normalizedPageId, recordMap)

    // Eğer görsel bulunamadıysa ve icon bir resimse, icon'u görsel olarak kullan
    if (!imageUrl && icon && (icon.startsWith('http') || icon.startsWith('/'))) {
        if (icon.startsWith('http')) {
            imageUrl = `https://www.notion.so/image/${encodeURIComponent(icon)}?table=block&id=${normalizedPageId}&cache=v2`
        } else {
            imageUrl = `https://www.notion.so/image/${encodeURIComponent(icon)}?table=block&id=${normalizedPageId}&cache=v2`
        }
    }

    // URL oluştur
    const canonicalPageId = getCanonicalPageId(normalizedPageId, recordMap) || normalizedPageId
    const pageUrl = mapPageUrl ? mapPageUrl(normalizedPageId) : `/${canonicalPageId}`

    return (
        <Link href={pageUrl} className={`${styles.card} ${className || ''}`}>
            {/* Cover/Content Image - Tam kaplama */}
            <div className={styles.imageWrapper}>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={title}
                        className={styles.coverImage}
                        loading="lazy"
                    />
                ) : (
                    <div className={styles.placeholder}>
                        <svg
                            className={styles.placeholderSvg}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        >
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Page Title - Sadece başlık */}
            <div className={styles.titleWrapper}>
                <span className={styles.title}>{title}</span>
            </div>
        </Link>
    )
}

/**
 * Varsayılan page linklerini kart olarak render eden wrapper
 */
export function CustomPage({ block, level, ...props }: any) {
    const { recordMap } = useNotionContext()

    // Root page değilse kart olarak göster
    const rootBlockId = Object.keys(recordMap?.block || {})[0]
    const isRootPage = block?.id === rootBlockId

    if (isRootPage) {
        // Root sayfa için normal render
        return null
    }

    // Child page için kart göster
    return <PageLinkBlock block={block} />
}
