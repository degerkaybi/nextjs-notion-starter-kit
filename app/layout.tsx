import type { Metadata } from 'next'
import Link from 'next/link'
import PortfolioHeader from '@/components/PortfolioHeader'
import '@/styles/globals.css'
import '@/styles/portfolio.css'

export const metadata: Metadata = {
  title: { default: 'Kaybid — Artist Portfolio', template: '%s — Kaybid' },
  description: 'Street art, collage, animation, sculpture, painting and sound by Kaybid.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="pf-site">
        <a className="pf-skip-link" href="#main-content">Skip to content</a>
        <PortfolioHeader />
        <main id="main-content">{children}</main>
        <footer className="pf-footer">
          <div className="pf-footer-top">
            <div>
              <p className="pf-eyebrow">STAY CURIOUS</p>
              <h2>Art belongs<br />in the world.</h2>
            </div>
            <Link href="/contact" className="pf-footer-contact">Get in touch <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="pf-footer-bottom">
            <Link href="/" className="pf-footer-logo">KAYBID<span>.</span></Link>
            <nav aria-label="Footer navigation">
              <Link href="/works">Works</Link>
              <Link href="/about">About</Link>
              <Link href="/editions">Editions</Link>
              <Link href="/press">Press</Link>
            </nav>
            <span>© {new Date().getFullYear()} Kaybid</span>
          </div>
        </footer>
      </body>
    </html>
  )
}
