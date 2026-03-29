import type * as types from 'notion-types'
import { IoMoonSharp } from '@react-icons/all-files/io5/IoMoonSharp'
import { IoSunnyOutline } from '@react-icons/all-files/io5/IoSunnyOutline'
import { IoMenuOutline } from '@react-icons/all-files/io5/IoMenuOutline'
import { IoCloseOutline } from '@react-icons/all-files/io5/IoCloseOutline'
import cs from 'classnames'
import Link from 'next/link'
import * as React from 'react'
import { Breadcrumbs, Header, Search, useNotionContext } from 'react-notion-x'
import { parsePageId } from 'notion-utils'

import { isSearchEnabled, name, navigationLinks, navigationStyle, rootNotionPageId } from '@/lib/config'
import { useDarkMode } from '@/lib/use-dark-mode'

import styles from './styles.module.css'

function ToggleThemeButton() {
  const [hasMounted, setHasMounted] = React.useState(false)
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  const onToggleTheme = React.useCallback(() => {
    toggleDarkMode()
  }, [toggleDarkMode])

  return (
    <div
      className={cs('breadcrumb', 'button', !hasMounted && styles.hidden)}
      onClick={onToggleTheme}
    >
      {hasMounted && isDarkMode ? <IoMoonSharp /> : <IoSunnyOutline />}
    </div>
  )
}

export function NotionPageHeader({
  block
}: {
  block: types.CollectionViewPageBlock | types.PageBlock
}) {
  const { components, mapPageUrl } = useNotionContext()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const isRootPage = block?.id && parsePageId(block.id) === parsePageId(rootNotionPageId)

  if (navigationStyle === 'default') {
    return <Header block={block} />
  }

  return (
    <header className='notion-header'>
      <div className='notion-nav-header'>
        <div
          className='hamburger-menu'
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <IoCloseOutline /> : <IoMenuOutline />}
        </div>
        {isRootPage ? (
          <div className="breadcrumbs">
            <Link href='/' className={cs(styles.navLink, 'breadcrumb', 'button', 'title')}>
              {name}
            </Link>
          </div>
        ) : (
          <Breadcrumbs block={block} rootOnly={true} />
        )}

        <div className={cs('notion-nav-header-rhs', 'breadcrumbs', isMobileMenuOpen && 'mobile-menu-open')}>
          <Link
            href='/'
            className={cs(styles.navLink, 'breadcrumb', 'button')}
          >
            Home
          </Link>

          {navigationLinks
            ?.map((link, index) => {
              if (!link?.pageId && !link?.url) {
                return null
              }

              if (link.pageId) {
                return (
                  <components.PageLink
                    href={mapPageUrl(link.pageId)}
                    key={index}
                    className={cs(styles.navLink, 'breadcrumb', 'button')}
                  >
                    {link.title}
                  </components.PageLink>
                )
              } else {
                return (
                  <components.Link
                    href={link.url}
                    key={index}
                    className={cs(styles.navLink, 'breadcrumb', 'button')}
                  >
                    {link.title}
                  </components.Link>
                )
              }
            })
            .filter(Boolean)}

          <ToggleThemeButton />

          {isSearchEnabled && <Search block={block} title={null} />}
        </div>
      </div>
    </header>
  )
}
