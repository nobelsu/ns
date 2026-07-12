import { useCallback, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import SiteGraph from './components/SiteGraph'
import Panel from './components/Panel'
import ListIndex from './components/ListIndex'
import { nodeIdForPath } from './data/graph'
import type { GraphNode } from './data/graph'

export default function App() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const urlNodeId = nodeIdForPath(pathname)
  // Skill nodes have no route/panel — selecting one is graph-only state.
  const [skillId, setSkillId] = useState<string | null>(null)
  const [prevPath, setPrevPath] = useState(pathname)
  if (prevPath !== pathname) {
    setPrevPath(pathname)
    setSkillId(null)
  }

  const onSelect = useCallback(
    (node: GraphNode | null) => {
      if (!node) {
        // clicking empty space returns to the overview
        setSkillId(null)
        if (nodeIdForPath(window.location.pathname)) navigate('/')
        return
      }
      if (node.route) {
        setSkillId(null)
        navigate(node.route)
      } else {
        setSkillId(prev => (prev === node.id ? null : node.id))
      }
    },
    [navigate],
  )

  const selectedId = skillId ?? urlNodeId

  // Intro: header centered, graph dimmed. A deep link skips straight in.
  const [entered, setEntered] = useState(() => window.location.pathname !== '/')

  return (
    <div className={`site${entered ? '' : ' is-intro'}`}>
      <SiteGraph selectedId={selectedId} panelOpen={!!urlNodeId} onSelect={onSelect} />

      <header className="site-header">
        <Link
          to="/"
          className="site-name"
          onClick={() => setEntered(false)}
        >
          Nobel Suhendra
        </Link>
        <span className="site-sub">2nd year Oxford CS · continual learning</span>
        <span className="site-enter" aria-hidden>click anywhere to explore →</span>
      </header>

      {!entered && (
        <button
          className="intro-veil"
          aria-label="Enter site"
          onClick={() => setEntered(true)}
        />
      )}

      <div className="site-hint" aria-hidden>
        click a node · drag to rearrange · scroll to zoom
      </div>

      <footer className="site-footer" aria-hidden>
        © 2026 Nobel Suhendra
      </footer>

      <ListIndex />
      <Panel nodeId={urlNodeId} onClose={() => navigate('/')} />
    </div>
  )
}
