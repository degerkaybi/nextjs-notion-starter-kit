import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import RichContent from '@/components/RichContent'
import { getPageBySlug } from '@/lib/portfolio'
import archive from '@/data/portfolio-content.json'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return Object.values(archive.pages).map(page => {
    const slug = page.title.toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64)
    return { slug: `${slug || 'work'}-${page.id.replaceAll('-', '').slice(0, 8)}` }
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getPageBySlug((await params).slug)?.title || 'Archive' }
}

export default async function ArchivePage({ params }: Props) {
  const page = getPageBySlug((await params).slug)
  if (!page) notFound()
  return <div className="pf-page-shell pf-detail-page"><nav className="pf-breadcrumbs" aria-label="Breadcrumb"><Link href="/works">Works</Link><span>/</span><span>{page.title}</span></nav><header className="pf-detail-header"><div><p className="pf-eyebrow">FROM THE ARCHIVE</p><h1>{page.title}</h1></div></header><div className="pf-detail-content"><RichContent blocks={page.blocks} /></div></div>
}
