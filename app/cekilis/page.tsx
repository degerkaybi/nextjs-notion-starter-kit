import React from 'react'
import type { Metadata } from 'next'
import InstagramGiveaway from '@/components/InstagramGiveaway'

export const metadata: Metadata = {
  title: 'Yıkım Ekibi Çekiliş Aracı',
  description: 'Yıkım Ekibi Instagram Gönderi & Yorum Çekiliş Aracı',
}

export default function CekilisPage() {
  return (
    <div className="content-wrapper page-container" style={{ paddingTop: '0.8rem', paddingBottom: '0.8rem', maxWidth: '1440px' }}>
      <InstagramGiveaway />
    </div>
  )
}
