import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SectionLayout from '@/components/SectionLayout'
import { getSection } from '@/lib/portfolio'

export const metadata: Metadata = { title: 'Editions & Collaborations' }

export default function EditionsPage() {
  const page = getSection('art-ideas')
  if (!page) notFound()
  return <SectionLayout page={page} eyebrow="BEYOND THE GALLERY" title="Editions & collaborations" introduction="Objects, publications, digital editions and collaborations from the Kaybid archive." />
}
