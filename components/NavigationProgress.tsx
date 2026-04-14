'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function NavigationProgress() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // When pathname changes, the navigation is complete
    setLoading(false)
    setProgress(100)
    const timer = setTimeout(() => setProgress(0), 300)
    return () => clearTimeout(timer)
  }, [pathname])

  useEffect(() => {
    // Intercept all link clicks to show progress bar
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return
      
      const href = target.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return
      
      // It's an internal navigation
      setLoading(true)
      setProgress(30)
      
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      return () => clearInterval(interval)
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  if (!loading && progress === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${progress}%`,
        height: '3px',
        background: 'linear-gradient(90deg, rgba(255,255,255,0.2), #fff)',
        transition: loading ? 'width 0.3s ease' : 'width 0.2s ease, opacity 0.3s ease',
        opacity: progress === 100 ? 0 : 1,
        zIndex: 99999,
        boxShadow: '0 0 10px rgba(255,255,255,0.5)',
        pointerEvents: 'none',
      }}
    />
  )
}
