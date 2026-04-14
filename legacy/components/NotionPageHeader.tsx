import type * as types from 'notion-types'
import { IoMoonSharp } from '@react-icons/all-files/io5/IoMoonSharp'
import { IoSunnyOutline } from '@react-icons/all-files/io5/IoSunnyOutline'
import { IoMenu } from '@react-icons/all-files/io5/IoMenu'
import { IoClose } from '@react-icons/all-files/io5/IoClose'
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
  block,
  components: propsComponents,
  mapPageUrl: propsMapPageUrl
}: {
  block: types.CollectionViewPageBlock | types.PageBlock
  components?: any
  mapPageUrl?: (pageId: string) => string
}) {
  const context = useNotionContext()
  const components = propsComponents || context?.components || {}
  const mapPageUrl = propsMapPageUrl || context?.mapPageUrl || ((pageId: string) => `/${pageId}`)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const isRootPage = block?.id && parsePageId(block.id) === parsePageId(rootNotionPageId)

  if (navigationStyle === 'default') {
    return <Header block={block as any} />
  }

  return (
    <header className='notion-header'>
      <div className='notion-nav-header'>
        <div
          className='hamburger-menu'
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <IoClose /> : <IoMenu />}
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
            {name}
          </Link>
        </div>

        <div className='notion-nav-header-rhs breadcrumbs'>
          {navigationLinks
            ?.map((link, index) => {
              if (!link?.pageId && !link?.url) {
                return null
              }

              const href =
                link.url ||
                (link.pageId
                  ? typeof mapPageUrl === 'function'
                    ? mapPageUrl(link.pageId)
                    : `/${link.pageId}`
                  : '#')

              const isInternalLink = href.startsWith('/')

              return isInternalLink ? (
                <Link
                  href={href}
                  key={index}
                  className={cs(styles.navLink, 'breadcrumb', 'button')}
                >
                  {link.title}
                </Link>
              ) : (
                <a
                  href={href}
                  key={index}
                  className={cs(styles.navLink, 'breadcrumb', 'button')}
                >
                  {link.title}
                </a>
              )
            })
            .filter(Boolean)}

          <ToggleThemeButton />

          {isSearchEnabled && <Search block={block as any} title={null} />}
        </div>
      </div>
    </header>
  )
}
