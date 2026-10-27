import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SectionLayout from '@/components/SectionLayout'
import { getSection } from '@/lib/portfolio'

export const metadata: Metadata = { title: 'Press' }

export default function PressPage() {
  const page = getSection('press')
  if (!page) notFound()
  return <SectionLayout page={page} eyebrow="SELECTED COVERAGE" title="Press" introduction="Articles, interviews and broadcasts featuring Kaybid's work." />
}
