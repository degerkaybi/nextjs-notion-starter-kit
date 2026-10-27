'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const links = [
  ['Works', '/works'],
  ['About', '/about'],
  ['Editions', '/editions'],
  ['Press', '/press'],
  ['Contact', '/contact'],
] as const

export default function PortfolioHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="pf-header">
      <div className="pf-header-inner">
        <Link href="/" className="pf-wordmark" onClick={() => setOpen(false)} aria-label="Kaybid, home">
          KAYBID<span>.</span>
        </Link>
        <button
          type="button"
          className="pf-menu-toggle"
          aria-expanded={open}
          aria-controls="pf-main-navigation"
          onClick={() => setOpen(value => !value)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
        <nav id="pf-main-navigation" className={`pf-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={pathname === href || (href === '/works' && pathname.startsWith('/works/')) ? 'is-active' : ''}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
