'use client'

import { useEffect, useMemo, useState } from 'react'
import WorkCard, { type WorkCardData } from './WorkCard'

type FilterableWork = WorkCardData & { searchText: string }

export default function WorkExplorer({ works, filters }: { works: FilterableWork[]; filters: string[] }) {
  const [activeFilter, setActiveFilter] = useState('All')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('filter')
    if (fromUrl && filters.includes(fromUrl)) setActiveFilter(fromUrl)
  }, [filters])

  const chooseFilter = (filter: string) => {
    setActiveFilter(filter)
    const url = new URL(window.location.href)
    if (filter === 'All') url.searchParams.delete('filter')
    else url.searchParams.set('filter', filter)
    window.history.replaceState(null, '', url)
  }

  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    return works.filter(work => {
      if (activeFilter !== 'All' && !work.tags.includes(activeFilter)) return false
      return !term || work.searchText.includes(term)
    })
  }, [works, activeFilter, query])

  return (
    <section className="pf-explorer" aria-labelledby="all-works-heading">
      <div className="pf-section-heading">
        <div>
          <p className="pf-eyebrow">THE ARCHIVE</p>
          <h2 id="all-works-heading">All works<span className="pf-count">{visible.length}</span></h2>
        </div>
        <label className="pf-search">
          <span className="sr-only">Search works</span>
          <input value={query} onChange={event => setQuery(event.target.value)} type="search" placeholder="Search works" />
          <span aria-hidden="true">⌕</span>
        </label>
      </div>
      <div className="pf-filters" role="group" aria-label="Filter works by practice">
        {filters.map(filter => (
          <button
            key={filter}
            type="button"
            className={activeFilter === filter ? 'is-active' : ''}
            aria-pressed={activeFilter === filter}
            onClick={() => chooseFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>
      <div className="pf-work-grid">
        {visible.map(work => <WorkCard key={work.id} work={work} />)}
      </div>
      {visible.length === 0 && <p className="pf-empty">No works match this search. Try another term or category.</p>}
    </section>
  )
}
