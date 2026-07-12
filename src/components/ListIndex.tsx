import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { projects } from '../data/projects'
import { getAllPosts } from '../utils/postsFromMarkdown'

const SECTIONS = [
  { title: 'pages', items: [
    { label: 'About & Contact', route: '/about' },
    { label: 'Work', route: '/experience' },
    { label: 'Education', route: '/education' },
    { label: 'Leadership & Awards', route: '/beyond' },
    { label: 'This is Me', route: '/me' },
  ]},
  { title: 'projects', items: projects.map(p => ({ label: p.title, route: `/projects/${p.slug}` })) },
  { title: 'writing', items: getAllPosts().map(p => ({ label: p.title, route: `/blog/${p.slug}` })) },
]

export default function ListIndex() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <>
      <button
        className={`index-toggle${open ? ' is-open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={open ? 'Close index' : 'Open index'}
      >
        {open ? 'close' : 'index'}
      </button>
      {open && (
        <nav className="index-sheet" aria-label="Site index">
          {SECTIONS.map(s => (
            <div key={s.title} className="index-section">
              <div className="index-section-title">{s.title}</div>
              {s.items.map(item => (
                <Link
                  key={item.route}
                  to={item.route}
                  className={`index-link${pathname === item.route ? ' is-active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      )}
    </>
  )
}
