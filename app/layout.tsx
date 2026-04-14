import type { Metadata } from 'next'
import '../styles/globals.css'
import { Instagram, Twitter, Youtube } from 'lucide-react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import NavigationProgress from '@/components/NavigationProgress'
import SiteHeader from '@/components/SiteHeader'

export const metadata: Metadata = {
  title: 'Kaybid | Artist Portfolio',
  description: 'Artist portfolio and works of Kaybid.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <NavigationProgress />
        <SiteHeader />
        <main>{children}</main>
        <footer className="site-footer">
          <div className="footer-row footer-nav">
            <Link href="/about">About</Link>
            <Link href="/works">Works</Link>
            <Link href="/art-ideas">Art & Ideas</Link>
            <Link href="/press">Press</Link>
          </div>
          
          <div className="footer-row footer-social">
            <a href="https://twitter.com/kaybidsteps" target="_blank" rel="noopener noreferrer" title="Twitter">
              <Twitter size={20} />
            </a>
            <a href="https://instagram.com/kaybid" target="_blank" rel="noopener noreferrer" title="Instagram">
              <Instagram size={20} />
            </a>
            <a href="https://youtube.com/@KaybidLive" target="_blank" rel="noopener noreferrer" title="YouTube">
              <Youtube size={20} />
            </a>
          </div>

          <div className="footer-row">
            <p className="copyright-text">
              &copy; {new Date().getFullYear()} Kaybid
            </p>
          </div>
          
          <div className="footer-row footer-bottom">
            <ThemeToggle />
          </div>
        </footer>
      </body>
    </html>
  )
}
