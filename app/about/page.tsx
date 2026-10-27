import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SectionLayout from '@/components/SectionLayout'
import { getSection } from '@/lib/portfolio'

export const metadata: Metadata = { title: 'About' }

export default function AboutPage() {
  const page = getSection('about')
  if (!page) notFound()
  return <SectionLayout page={page} eyebrow="THE ARTIST" title="About" introduction="Kaybid works across street art, collage, animation and painting, following images as they move through cities and screens." />
}
