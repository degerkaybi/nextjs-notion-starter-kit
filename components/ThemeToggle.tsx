'use client'

import React, { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [isLightMode, setIsLightMode] = useState(false)

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
    
    if (savedTheme === 'light' || (!savedTheme && systemPrefersLight)) {
      setIsLightMode(true)
      document.body.classList.add('light-mode')
    }
  }, [])

  const toggleTheme = () => {
    if (isLightMode) {
      document.body.classList.remove('light-mode')
      localStorage.setItem('theme', 'dark')
      setIsLightMode(false)
    } else {
      document.body.classList.add('light-mode')
      localStorage.setItem('theme', 'light')
      setIsLightMode(true)
    }
    // Dispatch a custom event so other toggles can sync
    window.dispatchEvent(new Event('theme-changed'))
  }

  // Listen for theme changes from other toggles
  useEffect(() => {
    const handleThemeChange = () => {
      setIsLightMode(document.body.classList.contains('light-mode'))
    }
    window.addEventListener('theme-changed', handleThemeChange)
    return () => window.removeEventListener('theme-changed', handleThemeChange)
  }, [])

  return (
    <button 
      onClick={toggleTheme} 
      className="theme-toggle"
      aria-label="Toggle Theme"
      title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    >
      {isLightMode ? (
        <svg 
          viewBox="0 0 24 24" 
          width="20" 
          height="20" 
          stroke="currentColor" 
          strokeWidth="2" 
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      ) : (
        <svg 
          viewBox="0 0 24 24" 
          width="20" 
          height="20" 
          stroke="currentColor" 
          strokeWidth="2" 
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      )}
      
      <style jsx>{`
        .theme-toggle {
          background: none;
          border: none;
          color: var(--text-color);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0.5rem;
          border-radius: 50%;
          transition: all 0.3s ease;
          opacity: 0.8;
        }
        
        .theme-toggle:hover {
          opacity: 1;
          background: var(--glass-bg);
          transform: scale(1.1);
        }
      `}</style>
    </button>
  )
}
