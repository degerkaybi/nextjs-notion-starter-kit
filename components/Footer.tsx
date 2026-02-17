import { FaEnvelopeOpenText } from '@react-icons/all-files/fa/FaEnvelopeOpenText'
import { FaGithub } from '@react-icons/all-files/fa/FaGithub'
import { FaInstagram } from '@react-icons/all-files/fa/FaInstagram'
import { FaLinkedin } from '@react-icons/all-files/fa/FaLinkedin'
import { FaMastodon } from '@react-icons/all-files/fa/FaMastodon'
import { FaTwitter } from '@react-icons/all-files/fa/FaTwitter'
import { FaYoutube } from '@react-icons/all-files/fa/FaYoutube'
import { FaZhihu } from '@react-icons/all-files/fa/FaZhihu'
import { IoMoonSharp } from '@react-icons/all-files/io5/IoMoonSharp'
import { IoSunnyOutline } from '@react-icons/all-files/io5/IoSunnyOutline'
import Link from 'next/link'
import * as React from 'react'

import * as config from '@/lib/config'
import { getCanonicalPageId } from '@/lib/get-canonical-page-id'
import { useDarkMode } from '@/lib/use-dark-mode'

// TODO: merge the data and icons from PageSocial with the social links in Footer

export function FooterImpl({ recordMap }: { recordMap?: any }) {
  const [hasMounted, setHasMounted] = React.useState(false)
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const currentYear = new Date().getFullYear()

  const onToggleDarkMode = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      toggleDarkMode()
    },
    [toggleDarkMode]
  )

  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  const navLinks = (config.navigationLinks?.filter(
    (link) => link?.pageId || link?.url
  ) || []) as Array<{ pageId?: string; url?: string; title: string }>

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <nav className="footer-nav">
          {navLinks.map((link, index) => {
            const slug = link?.pageId && recordMap
              ? getCanonicalPageId(link.pageId, recordMap)
              : null
            const href = link?.url ?? (slug ? `/${slug}` : '#')
            return (
              <Link
                key={index}
                href={href}
                className="footer-nav-link"
              >
                {link?.title}
              </Link>
            )
          })}
        </nav>

        <div className="footer-social">
          {config.twitter && (
            <a
              className="footer-social-link"
              href={`https://twitter.com/${config.twitter}`}
              title={`Twitter @${config.twitter}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaTwitter />
            </a>
          )}
          {config.instagram && (
            <a
              className="footer-social-link"
              href={`https://www.instagram.com/${config.instagram}`}
              title={`Instagram @${config.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram />
            </a>
          )}
          {config.youtube && (
            <a
              className="footer-social-link"
              href={`https://www.youtube.com/${config.youtube}`}
              title={`YouTube ${config.author}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaYoutube />
            </a>
          )}
          {config.mastodon && (
            <a
              className="footer-social-link"
              href={config.mastodon}
              title={`Mastodon ${config.getMastodonHandle()}`}
              target="_blank"
              rel="me"
            >
              <FaMastodon />
            </a>
          )}
          {config.github && (
            <a
              className="footer-social-link"
              href={`https://github.com/${config.github}`}
              title={`GitHub @${config.github}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGithub />
            </a>
          )}
          {config.linkedin && (
            <a
              className="footer-social-link"
              href={`https://www.linkedin.com/in/${config.linkedin}`}
              title={`LinkedIn ${config.author}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaLinkedin />
            </a>
          )}
          {config.newsletter && (
            <a
              className="footer-social-link"
              href={config.newsletter}
              title={`Newsletter ${config.author}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaEnvelopeOpenText />
            </a>
          )}
          {config.zhihu && (
            <a
              className="footer-social-link"
              href={`https://zhihu.com/people/${config.zhihu}`}
              title={`Zhihu @${config.zhihu}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaZhihu />
            </a>
          )}
        </div>

        <div className="footer-bottom">
          {hasMounted && (
            <button
              type="button"
              className="footer-theme-toggle"
              onClick={onToggleDarkMode}
              title="Toggle dark mode"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <IoMoonSharp /> : <IoSunnyOutline />}
            </button>
          )}
          <span className="footer-copyright">
            © {currentYear} {config.author}
          </span>
        </div>
      </div>

      <style jsx>{`
        .site-footer {
          width: 100%;
          margin-top: auto;
          padding: 3rem 2rem 2rem;
          border-top: 1px solid var(--divider-color);
          background: var(--bg-color);
        }
        .footer-inner {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          text-align: center;
        }
        .footer-nav {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1.5rem 2.5rem;
        }
        .footer-nav-link {
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: var(--fg-color);
          opacity: 0.85;
          transition: opacity 0.2s, color 0.2s;
        }
        .footer-nav-link:hover {
          opacity: 1;
          color: var(--fg-color);
        }
        .footer-social {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1rem;
        }
        .footer-social-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          font-size: 1.2rem;
          color: var(--fg-color-1);
          transition: color 0.2s, transform 0.2s;
        }
        .footer-social-link:hover {
          color: var(--fg-color);
          transform: translateY(-2px);
        }
        .footer-bottom {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }
        .footer-theme-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          padding: 0;
          font-size: 1.2rem;
          background: none;
          border: none;
          color: var(--fg-color-1);
          cursor: pointer;
          transition: color 0.2s;
        }
        .footer-theme-toggle:hover {
          color: var(--fg-color);
        }
        .footer-copyright {
          font-size: 0.8rem;
          color: var(--fg-color-1);
          letter-spacing: 0.5px;
        }
        @media (max-width: 640px) {
          .site-footer {
            padding: 2rem 1.5rem;
          }
          .footer-nav {
            gap: 1rem 1.5rem;
          }
          .footer-nav-link {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </footer>
  )
}

export const Footer = React.memo(FooterImpl)
