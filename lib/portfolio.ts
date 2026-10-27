import archive from '@/data/portfolio-content.json'
import mediaOrigin from '@/data/media-origin.json'

export type NotionBlock = {
  id: string
  type: string
  has_children?: boolean
  children?: NotionBlock[]
  [key: string]: unknown
}

export type PortfolioPage = {
  id: string
  parentId: string | null
  title: string
  createdTime: string
  lastEditedTime: string
  cover: unknown
  icon: unknown
  blocks: NotionBlock[]
}

export type Work = {
  page: PortfolioPage
  slug: string
  href: string
  image: string | null
  excerpt: string
  tags: string[]
  series: string | null
  year: string | null
}

type MediaItem = {
  id: string
  url?: string
  localPath: string | null
  mimeType: string | null
  error: string | null
}

const data = archive as unknown as {
  roots: Record<string, string>
  pages: Record<string, PortfolioPage>
  media: Record<string, MediaItem>
}

const ids = {
  silentSteps: '62d2c83c-d0e0-4654-90db-610ddb78bfc7',
  volta: '1b039248-8fe5-80f7-9589-d1dd2ffbba93',
  nightWatch: 'bd62c75c-ff0b-4b11-a857-1ea394db1d59',
  eidola: 'da5cf4ff-a5a7-4d81-b2b4-651d85c9a9d8',
}

const tagMap: Record<string, string[]> = {
  [ids.silentSteps]: ['Sokak sanatı', 'Kolaj', 'Animasyon'],
  '30239248-8fe5-8018-85f0-d341175edced': ['Sokak sanatı', 'Kolaj'],
  '22a39248-8fe5-80c8-aae6-fcdebd717fb8': ['Sokak sanatı', 'Kolaj', 'Animasyon'],
  '25f39248-8fe5-80df-ac77-ca4a82b720c4': ['Sokak sanatı', 'Sergi'],
  '22a39248-8fe5-803f-a915-f0b8c5bd2ebe': ['Sokak sanatı', 'Animasyon', 'Sergi'],
  '26c39248-8fe5-80ae-a265-ee5989cd0311': ['Sokak sanatı', 'Kolaj', 'Animasyon'],
  '26c39248-8fe5-80ff-b74c-f811b5bc29c0': ['Sokak sanatı', 'Video'],
  '4902f670-013a-4661-8234-1cc6d94f00d4': ['Sokak sanatı', 'Dijital'],
  '33239248-8fe5-8018-b85b-cbdb6ba6e03f': ['Heykel', 'Enstalasyon'],
  '36439248-8fe5-8078-9dd3-f09a1b16667f': ['Heykel', 'Enstalasyon'],
  '33239248-8fe5-80b8-95e0-c3971654c746': ['Heykel'],
  '33239248-8fe5-8035-b6e9-ceb07a9c84fd': ['Heykel'],
  '3ec39248-8fe5-8095-845c-f590582f19c9': ['Sergi', 'İşbirliği'],
  [ids.volta]: ['Kolaj', 'Ses', 'Sergi'],
  'f4ec0763-6c97-4df6-88d6-4ff6631ec26c': ['Animasyon'],
  '22a39248-8fe5-8077-8278-ccc0674023b1': ['Animasyon', 'Video'],
  '25f39248-8fe5-80b9-9041-d50804c968cf': ['Animasyon', 'Video'],
  '25f39248-8fe5-806f-bada-c95b0519b8f6': ['Animasyon', 'Video'],
  '25f39248-8fe5-8048-97c3-e58496e8b2cd': ['Animasyon', 'Video'],
  [ids.nightWatch]: ['Kolaj', 'Animasyon', 'Dijital'],
  '2e639248-8fe5-80cc-a7c3-c51c30088b4e': ['Sergi'],
  '22a39248-8fe5-80f2-8c33-e898a8fc01a6': ['Sergi'],
  [ids.eidola]: ['Resim', 'Animasyon'],
  '22a39248-8fe5-8050-8c6f-d28fd81cb677': [],
}

const topWorkIds = new Set(
  data.pages[data.roots.works]?.blocks
    .filter(block => block.type === 'child_page')
    .map(block => block.id) || []
)

const conceptualVoltaTitles = new Set([
  'Resimlerimin Mırıldandığı Şarkılar',
  'Kavramsal Metin',
])

export const featuredIds = [ids.silentSteps, ids.volta, ids.nightWatch, ids.eidola]
const tagLabels: Record<string, string> = {
  'Sokak sanatı': 'Street Art',
  Kolaj: 'Collage',
  Animasyon: 'Animation',
  Heykel: 'Sculpture',
  Resim: 'Painting',
  Ses: 'Sound',
  Dijital: 'Digital',
  Sergi: 'Exhibition',
  Enstalasyon: 'Installation',
  Video: 'Video',
  İşbirliği: 'Collaboration',
}

export const filters = ['All', 'Street Art', 'Collage', 'Animation', 'Sculpture', 'Painting', 'Sound', 'Digital', 'Exhibition', 'Installation', 'Video', 'Collaboration']

export function getPage(id: string): PortfolioPage | null {
  return data.pages[id] || null
}

export function getSection(slug: string): PortfolioPage | null {
  return getPage(data.roots[slug])
}

export function getMediaUrl(mediaId?: string | null): string | null {
  if (!mediaId) return null
  const item = data.media[mediaId]
  if (!item) return null
  if (item.error) return null
  if (item.localPath) {
    const base = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL || mediaOrigin.baseUrl).replace(/\/$/, '')
    return base ? `${base}${item.localPath}` : item.localPath
  }
  return item.url?.startsWith('https://') && item.url.includes('amazonaws.com') ? null : item.url || null
}

function imageFromObject(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const object = value as { mediaId?: string; url?: string }
  return getMediaUrl(object.mediaId) || (object.url?.startsWith('https://') ? object.url : null)
}

function findImageInBlocks(blocks: NotionBlock[]): string | null {
  for (const block of blocks) {
    if (block.type === 'image') {
      const image = imageFromObject(block.image)
      if (image) return image
    }
    if (block.children?.length) {
      const image = findImageInBlocks(block.children)
      if (image) return image
    }
  }
  return null
}

export function getPageImage(page: PortfolioPage, includeChildPages = false): string | null {
  const own = imageFromObject(page.cover) || imageFromObject(page.icon) || findImageInBlocks(page.blocks)
  if (own || !includeChildPages) return own
  for (const block of page.blocks) {
    if (block.type === 'child_page') {
      const child = getPage(block.id)
      if (child) {
        const image = getPageImage(child)
        if (image) return image
      }
    }
  }
  return null
}

function richTextPlain(value: unknown): string {
  if (!Array.isArray(value)) return ''
  return value.map(part => (part as { plain_text?: string }).plain_text || '').join('')
}

function textFromBlocks(blocks: NotionBlock[]): string[] {
  const texts: string[] = []
  for (const block of blocks) {
    const value = block[block.type] as { rich_text?: unknown } | undefined
    if (['paragraph', 'quote', 'callout'].includes(block.type)) {
      const text = richTextPlain(value?.rich_text).trim()
      if (text && !/^https?:\/\//.test(text) && text.length > 45) texts.push(text)
    }
    if (block.children?.length) texts.push(...textFromBlocks(block.children))
  }
  return texts
}

function getExcerpt(page: PortfolioPage): string {
  const text = textFromBlocks(page.blocks)[0] || ''
  return text.length > 170 ? `${text.slice(0, 167).trimEnd()}…` : text
}

export function slugify(value: string): string {
  return value
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64)
}

export function getWorkSlug(page: PortfolioPage): string {
  return `${slugify(page.title) || 'work'}-${page.id.replaceAll('-', '').slice(0, 8)}`
}

function yearFrom(page: PortfolioPage): string | null {
  const titleYear = page.title.match(/\b(20\d{2})\b/)
  if (titleYear) return titleYear[1]
  const text = textFromBlocks(page.blocks).slice(0, 3).join(' ')
  return text.match(/\b(20\d{2})\b/)?.[1] || null
}

export function getAllWorks(): Work[] {
  const topLevel = Object.values(data.pages).filter(page => topWorkIds.has(page.id) && page.id !== '36439248-8fe5-8078-9dd3-f09a1b16667f')
  const voltaChildren = Object.values(data.pages).filter(
    page => page.parentId === ids.volta && !conceptualVoltaTitles.has(page.title.trim())
  )
  return [...topLevel, ...voltaChildren].map(page => {
    const isVoltaChild = page.parentId === ids.volta
    const series = isVoltaChild ? 'Volta' : [ids.silentSteps, ids.volta, ids.nightWatch, ids.eidola].includes(page.id) ? page.title : null
    return {
      page,
      slug: getWorkSlug(page),
      href: `/works/${getWorkSlug(page)}`,
      image: getPageImage(page, true),
      excerpt: getExcerpt(page),
      tags: (isVoltaChild ? ['Kolaj', 'Ses'] : tagMap[page.id] || []).map(tag => tagLabels[tag] || tag),
      series,
      year: yearFrom(page),
    }
  })
}

export function getWorkBySlug(slug: string): Work | null {
  return getAllWorks().find(work => work.slug === slug) || null
}

export function getPageBySlug(slug: string): PortfolioPage | null {
  return Object.values(data.pages).find(page => getWorkSlug(page) === slug) || null
}

export function getPageHref(page: PortfolioPage): string {
  const rootEntry = Object.entries(data.roots).find(([, id]) => id === page.id)
  if (rootEntry) {
    const paths: Record<string, string> = { home: '/', about: '/about', works: '/works', 'art-ideas': '/editions', press: '/press', contact: '/contact' }
    return paths[rootEntry[0]] || '/'
  }
  const work = getAllWorks().find(item => item.page.id === page.id)
  return work?.href || `/archive/${getWorkSlug(page)}`
}

export function getFeaturedWorks(): Work[] {
  const works = getAllWorks()
  return featuredIds.map(id => works.find(work => work.page.id === id)).filter((work): work is Work => !!work)
}

export function getRelatedWorks(work: Work): Work[] {
  return getAllWorks()
    .filter(item => item.page.id !== work.page.id)
    .map(item => ({ item, score: item.tags.filter(tag => work.tags.includes(tag)).length + (item.series && item.series === work.series ? 2 : 0) }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(result => result.item)
}
