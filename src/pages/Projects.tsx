import type { CSSProperties } from 'react'
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { projects } from '../data/projects'

const ALL_TYPES = ['All', ...Array.from(new Set(projects.map(p => p.type))).sort()]

type SortKey = 'default' | 'year-desc' | 'year-asc' | 'name-asc'

const SORT_LABELS: Record<SortKey, string> = {
  'default':   'In Progress First',
  'year-desc': 'Newest First',
  'year-asc':  'Oldest First',
  'name-asc':  'A → Z',
}

export default function Projects() {
  const [query,      setQuery]      = useState('')
  const [activeType, setActiveType] = useState('All')
  const [sortKey,    setSortKey]    = useState<SortKey>('default')
  const [sortOpen,   setSortOpen]   = useState(false)

  const displayed = useMemo(() => {
    let list = [...projects]

    // Search
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.techStack.some(t => t.toLowerCase().includes(q))
      )
    }

    // Filter by type
    if (activeType !== 'All') {
      list = list.filter(p => p.type === activeType)
    }

    // Sort
    if (sortKey === 'default') {
      list.sort((a, b) => {
        if (a.inProgress && !b.inProgress) return -1
        if (!a.inProgress && b.inProgress) return 1
        return parseInt(b.year) - parseInt(a.year)
      })
    } else if (sortKey === 'year-desc') {
      list.sort((a, b) => parseInt(b.year) - parseInt(a.year))
    } else if (sortKey === 'year-asc') {
      list.sort((a, b) => parseInt(a.year) - parseInt(b.year))
    } else if (sortKey === 'name-asc') {
      list.sort((a, b) => a.title.localeCompare(b.title))
    }

    return list
  }, [query, activeType, sortKey])

  return (
    <div className="page">
      <section className="projects-section">
        <div className="section-label" data-reveal>Projects</div>

        {/* Controls */}
        <div className="projects-controls" data-reveal style={{ '--i': 1 } as CSSProperties}>
          <div className="projects-search-wrap">
            <svg className="projects-search-icon" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              className="projects-search"
              type="text"
              placeholder="Search projects…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button className="projects-search-clear" onClick={() => setQuery('')} aria-label="Clear search">×</button>
            )}
          </div>

          <div className="projects-sort-wrap">
            <button
              className="projects-sort-btn"
              onClick={() => setSortOpen(o => !o)}
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
            >
              <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              {SORT_LABELS[sortKey]}
              <span className={`projects-sort-chevron${sortOpen ? ' open' : ''}`}>‹</span>
            </button>
            {sortOpen && (
              <div className="projects-sort-dropdown" role="listbox">
                {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
                  <button
                    key={k}
                    role="option"
                    aria-selected={sortKey === k}
                    className={`projects-sort-option${sortKey === k ? ' is-active' : ''}`}
                    onClick={() => { setSortKey(k); setSortOpen(false) }}
                  >
                    {SORT_LABELS[k]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Type filter pills */}
        <div className="projects-filter-bar" data-reveal style={{ '--i': 2 } as CSSProperties}>
          {ALL_TYPES.map(t => (
            <button
              key={t}
              className={`projects-filter-pill${activeType === t ? ' is-active' : ''}`}
              onClick={() => setActiveType(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Count */}
        <div className="projects-count" data-reveal style={{ '--i': 3 } as CSSProperties}>
          {displayed.length} {displayed.length === 1 ? 'project' : 'projects'}
        </div>

        <div className="all-projects-list">
          {displayed.length === 0 ? (
            <p className="projects-empty">No projects match your search.</p>
          ) : (
            displayed.map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.slug}`}
                className="all-project-row"
              >
                <div
                  className="all-project-image"
                  style={{ background: p.image }}
                />
                <div className="all-project-info">
                  <div className="all-project-meta">
                    <span>{p.type}</span>
                    <span>{p.year}</span>
                    {p.inProgress && <span className="all-project-pill">In progress</span>}
                  </div>
                  <div className="all-project-title">{p.title}</div>
                  <p className="all-project-desc">
                    {p.description.split('\n\n')[0]}
                  </p>
                  <div className="all-project-stack">
                    {p.techStack.map(t => (
                      <span key={t} className="all-project-tag">{t}</span>
                    ))}
                  </div>
                </div>
                <span className="all-project-arrow">→</span>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
