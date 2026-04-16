import React, { Fragment } from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbsProps {
  currentTitle: string
  ancestors: { href: string; label: string }[]
}

export default function Breadcrumbs({ currentTitle, ancestors }: BreadcrumbsProps) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumbs-list">
        {/* Home */}
        <li className="breadcrumb-item">
          <Link href="/" className="breadcrumb-link breadcrumb-home" aria-label="Home">
            <Home size={14} />
          </Link>
        </li>

        {/* Ancestor pages */}
        {ancestors.map((ancestor) => (
          <Fragment key={ancestor.href}>
            <li className="breadcrumb-separator" aria-hidden="true">
              <ChevronRight size={14} />
            </li>
            <li className="breadcrumb-item">
              <Link href={ancestor.href} className="breadcrumb-link">
                {ancestor.label}
              </Link>
            </li>
          </Fragment>
        ))}

        {/* Current page */}
        <li className="breadcrumb-separator" aria-hidden="true">
          <ChevronRight size={14} />
        </li>
        <li className="breadcrumb-item">
          <span className="breadcrumb-current" aria-current="page">
            {currentTitle}
          </span>
        </li>
      </ol>
    </nav>
  )
}
