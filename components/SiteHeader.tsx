'use client'

import { useState } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { Menu, X } from 'lucide-react'

export default function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false)

  const closeMenu = () => setIsOpen(false)

  return (
    <nav className="site-header">
      <div className="nav-container">
        <Link href="/" className="logo" onClick={closeMenu}>Kaybid</Link>
        <button 
          className="hamburger" 
          onClick={() => setIsOpen(!isOpen)} 
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
        <div className={`nav-menu ${isOpen ? 'open' : ''}`}>
          <div className="nav-links">
            <Link href="/" onClick={closeMenu}>Home</Link>
            <Link href="/about" onClick={closeMenu}>About</Link>
            <Link href="/works" onClick={closeMenu}>Works</Link>
            <Link href="/art-ideas" onClick={closeMenu}>Art & Ideas</Link>
            <Link href="/press" onClick={closeMenu}>Press</Link>
          </div>
          <ThemeToggle />
        </div>
      </div>
      {/* Overlay for mobile when menu is open */}
      <div 
        className={`nav-overlay ${isOpen ? 'open' : ''}`} 
        onClick={closeMenu}
      ></div>
    </nav>
  )
}
