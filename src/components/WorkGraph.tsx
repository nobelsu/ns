import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { projects as PROJECTS } from '../data/projects'

// ─── Data ─────────────────────────────────────────────────────────────────────

const NODE_DEFS = [
  { id: 'react',        label: 'React',         group: 'web',     fluency: 5 },
  { id: 'react-native', label: 'React Native',  group: 'mobile',  fluency: 4 },
  { id: 'expo',         label: 'Expo',          group: 'mobile',  fluency: 4 },
  { id: 'ts',           label: 'TypeScript',    group: 'web',     fluency: 5 },
  { id: 'js',           label: 'JavaScript',    group: 'web',     fluency: 4 },
  { id: 'nextjs',       label: 'Next.js',       group: 'web',     fluency: 4 },
  { id: 'html',         label: 'HTML',          group: 'web',     fluency: 4 },
  { id: 'css',          label: 'CSS',           group: 'web',     fluency: 3 },
  { id: 'python',       label: 'Python',        group: 'backend', fluency: 5 },
  { id: 'fastapi',      label: 'FastAPI',       group: 'backend', fluency: 4 },
  { id: 'node',         label: 'Node.js',       group: 'backend', fluency: 3 },
  { id: 'postgres',     label: 'PostgreSQL',    group: 'backend', fluency: 3 },
  { id: 'convex',       label: 'Convex',        group: 'backend', fluency: 3 },
  { id: 'go',           label: 'Go',            group: 'backend', fluency: 3 },
  { id: 'vue',          label: 'Vue.js',        group: 'web',     fluency: 3 },
  { id: 'cpp',          label: 'C++',           group: 'systems', fluency: 4 },
  { id: 'electron',     label: 'Electron',      group: 'systems', fluency: 3 },
  { id: 'docker',       label: 'Docker',        group: 'systems', fluency: 3 },
  { id: 'git',          label: 'Git',           group: 'systems', fluency: 5 },
  { id: 'vercel',       label: 'Vercel',        group: 'systems', fluency: 4 },
]

const EDGES = [
  { s: 'react',        t: 'ts' },
  { s: 'react',        t: 'nextjs' },
  { s: 'react',        t: 'react-native' },
  { s: 'react-native', t: 'expo' },
  { s: 'ts',           t: 'js' },
  { s: 'ts',           t: 'nextjs' },
  { s: 'ts',           t: 'node' },
  { s: 'ts',           t: 'electron' },
  { s: 'ts',           t: 'convex' },
  { s: 'js',           t: 'html' },
  { s: 'html',         t: 'css' },
  { s: 'nextjs',       t: 'vercel' },
  { s: 'python',       t: 'fastapi' },
  { s: 'python',       t: 'postgres' },
  { s: 'node',         t: 'postgres' },
  { s: 'convex',       t: 'react' },
  { s: 'go',           t: 'postgres' },
  { s: 'vue',          t: 'js' },
  { s: 'docker',       t: 'electron' },
  { s: 'docker',       t: 'cpp' },
  { s: 'git',          t: 'docker' },
  { s: 'git',          t: 'vercel' },
  { s: 'expo',         t: 'ts' },
]

const GROUP_COLOR: Record<string, string> = {
  web:      '#5b9cf6',
  mobile:   '#a78bfa',
  backend:  '#4ecdc4',
  systems:  '#8896b8',
}

// ─── Simulation constants ──────────────────────────────────────────────────────

const REPULSION   = 12000
const SPRING_K    = 0.038
const REST_LEN    = 160
const DAMPING     = 0.80
const CENTER_K    = 0.022
const ALPHA_DECAY = 0.994

const nodeRadius = (fluency: number) => fluency * fluency * 0.9

interface SimNode {
  id: string; label: string; group: string; fluency: number
  x: number; y: number; vx: number; vy: number
  pinned: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkGraph() {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const selectedRef = useRef<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [hovered,     setHovered]     = useState<number | null>(null)
  const [mousePos,    setMousePos]    = useState({ x: 0, y: 0 })

  // ── Canvas / simulation ──────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const container = canvas.parentElement!
    const ctx = canvas.getContext('2d')!

    let animId = 0
    let alpha  = 1.0
    let tick_  = 0       // frame counter for drift
    let hoveredId: string | null = null
    let dragging: SimNode | null = null
    let dragOX = 0, dragOY = 0
    let w = 0, h = 0

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      w = container.clientWidth
      h = Math.round(Math.min(700, Math.max(500, window.innerHeight * 0.7)))
      canvas.width  = w * dpr
      canvas.height = h * dpr
      canvas.style.width  = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const nodes: SimNode[] = NODE_DEFS.map(n => ({
      ...n,
      x: w / 2 + (Math.random() - 0.5) * 340,
      y: h / 2 + (Math.random() - 0.5) * 340,
      vx: (Math.random() - 0.5),
      vy: (Math.random() - 0.5),
      pinned: false,
    }))

    const byId = (id: string) => nodes.find(n => n.id === id)!

    const tick = () => {
      const cx = w / 2, cy = h / 2
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j]
          const dx = b.x - a.x, dy = b.y - a.y
          const d2 = Math.max(dx * dx + dy * dy, 1)
          const d  = Math.sqrt(d2)
          const f  = (REPULSION / d2) * alpha
          const nx = dx / d, ny = dy / d
          a.vx -= f * nx; a.vy -= f * ny
          b.vx += f * nx; b.vy += f * ny
        }
      }
      EDGES.forEach(e => {
        const s = byId(e.s), t = byId(e.t)
        const dx = t.x - s.x, dy = t.y - s.y
        const d  = Math.sqrt(dx * dx + dy * dy) || 1
        const f  = SPRING_K * (d - REST_LEN) * alpha
        const nx = dx / d, ny = dy / d
        s.vx += f * nx; s.vy += f * ny
        t.vx -= f * nx; t.vy -= f * ny
      })
      nodes.forEach(n => {
        n.vx += CENTER_K * (cx - n.x) * alpha
        n.vy += CENTER_K * (cy - n.y) * alpha
      })
      // Idle drift — gentle sinusoidal nudge once simulation has cooled
      tick_++
      if (alpha < 0.08) {
        const t = tick_ * 0.004
        nodes.forEach((n, i) => {
          if (n.pinned) return
          const phase = i * 1.7
          n.vx += Math.sin(t + phase)       * 0.012
          n.vy += Math.cos(t + phase * 0.7) * 0.012
        })
      }

      nodes.forEach(n => {
        if (n.pinned) return
        n.vx *= DAMPING; n.vy *= DAMPING
        n.x = Math.max(44, Math.min(w - 44, n.x + n.vx))
        n.y = Math.max(44, Math.min(h - 44, n.y + n.vy))
      })
      alpha = Math.max(0.04, alpha * ALPHA_DECAY)
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const sel    = selectedRef.current
      const hasSel = sel.size > 0

      EDGES.forEach(e => {
        const s = byId(e.s), t = byId(e.t)
        const bright = hasSel
          ? sel.has(e.s) && sel.has(e.t)
          : hoveredId && (e.s === hoveredId || e.t === hoveredId)
        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(t.x, t.y)
        ctx.strokeStyle = bright ? 'rgba(228,234,248,0.28)' : 'rgba(228,234,248,0.07)'
        ctx.lineWidth   = bright ? 1.5 : 0.8
        ctx.stroke()
      })

      nodes.forEach(n => {
        const isSelected = sel.has(n.id)
        const isHovered  = n.id === hoveredId
        const dim        = hasSel && !isSelected
        const r          = nodeRadius(n.fluency)
        const color      = GROUP_COLOR[n.group] ?? '#4a4845'

        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fillStyle = dim
          ? 'rgba(26,32,53,0.6)'
          : isSelected
            ? '#e4eaf8'
            : color + (isHovered ? 'ff' : 'bb')
        ctx.fill()

        if (isSelected) {
          ctx.beginPath()
          ctx.arc(n.x, n.y, r + 3.5, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(228,234,248,0.5)'
          ctx.lineWidth = 1
          ctx.stroke()
        }

        const labelAlpha = dim ? 0.18 : isSelected ? 1 : isHovered ? 0.9 : 0.55
        ctx.font      = `${isSelected ? 600 : 500} 10px Inter, system-ui, sans-serif`
        ctx.fillStyle = `rgba(228,234,248,${labelAlpha})`
        ctx.textAlign = 'center'
        ctx.fillText(n.label, n.x, n.y + r + 13)
      })
    }

    const loop = () => { tick(); draw(); animId = requestAnimationFrame(loop) }
    animId = requestAnimationFrame(loop)

    const hitTest = (x: number, y: number) => {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i]
        const r = nodeRadius(n.fluency) + 7
        const dx = n.x - x, dy = n.y - y
        if (dx * dx + dy * dy < r * r) return n
      }
      return null
    }
    const toCanvas = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    let downX = 0, downY = 0
    const onDown = (e: MouseEvent) => {
      const { x, y } = toCanvas(e)
      downX = x; downY = y
      const n = hitTest(x, y)
      if (n) { dragging = n; n.pinned = true; dragOX = n.x - x; dragOY = n.y - y; canvas.style.cursor = 'grabbing' }
    }
    const onMove = (e: MouseEvent) => {
      const { x, y } = toCanvas(e)
      if (dragging) {
        if ((x - downX) ** 2 + (y - downY) ** 2 > 16) {
          dragging.x = x + dragOX; dragging.y = y + dragOY
          dragging.vx = 0; dragging.vy = 0
          alpha = Math.max(alpha, 0.3)
        }
      } else {
        const n = hitTest(x, y)
        hoveredId = n?.id ?? null
        canvas.style.cursor = n ? 'pointer' : 'default'
      }
    }
    const onUp = (e: MouseEvent) => {
      if (dragging) {
        const { x, y } = toCanvas(e)
        if ((x - downX) ** 2 + (y - downY) ** 2 <= 16) {
          const id = dragging.id
          const next = new Set(selectedRef.current)
          next.has(id) ? next.delete(id) : next.add(id)
          selectedRef.current = next
          setSelectedIds(new Set(next))
        }
        dragging.pinned = false; dragging = null
        alpha = Math.max(alpha, 0.3)
      }
      canvas.style.cursor = hoveredId ? 'pointer' : 'default'
    }

    canvas.addEventListener('mousedown', onDown)
    canvas.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    canvas.addEventListener('mouseleave', () => { hoveredId = null })

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(animId); resize()
      alpha = Math.max(alpha, 0.5)
      animId = requestAnimationFrame(loop)
    })
    ro.observe(container)

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousedown', onDown)
      canvas.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      ro.disconnect()
    }
  }, [])

  // ── Project filtering ─────────────────────────────────────────────────────────

  const filteredProjects = selectedIds.size === 0
    ? []
    : PROJECTS
        .map(p => ({ ...p, score: p.skills.filter(s => selectedIds.has(s)).length }))
        .filter(p => p.score > 0)
        .sort((a, b) => b.score - a.score || parseInt(b.year) - parseInt(a.year))
        .slice(0, 3)

  const clearSelection = () => {
    selectedRef.current = new Set()
    setSelectedIds(new Set())
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <section
      className="work-section"
      id="work"
      onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      <div className="section-label" data-reveal>Selected Work</div>

      <p className="wg-note" data-reveal>
        Back when I was doing competitive programming, graph theory was my favourite topic. I spent a lot of time with the{' '}
        <a href="https://csacademy.com/app/graph_editor/" target="_blank" rel="noopener noreferrer" className="wg-note-link">
          CS Academy graph editor
        </a>
        {' '}visualising and playing around with graphs. This one maps out my stack.
      </p>

      <div className="wg-layout">
        {/* Left — graph */}
        <div className="wg-graph-col">
          <canvas ref={canvasRef} className="skills-canvas" />
        </div>

        {/* Right — projects */}
        <div className="wg-results-col">
          <div className="wg-hint">
            {selectedIds.size === 0
              ? 'Select skills or pick a category'
              : `${selectedIds.size} skill${selectedIds.size > 1 ? 's' : ''} selected`}
            {selectedIds.size > 0 && (
              <button className="wg-clear" onClick={clearSelection}>Clear</button>
            )}
          </div>

          {/* Preset group selectors */}
          <div className="wg-presets">
            {Object.entries(GROUP_COLOR).map(([group, color]) => {
              const groupIds = new Set(NODE_DEFS.filter(n => n.group === group).map(n => n.id))
              const isActive = NODE_DEFS.filter(n => n.group === group).every(n => selectedIds.has(n.id))
              return (
                <button
                  key={group}
                  className={`wg-preset${isActive ? ' is-active' : ''}`}
                  style={{ '--preset-color': color } as CSSProperties}
                  onClick={() => {
                    const next = isActive
                      ? new Set([...selectedIds].filter(id => !groupIds.has(id)))
                      : new Set([...selectedIds, ...groupIds])
                    selectedRef.current = next
                    setSelectedIds(new Set(next))
                  }}
                >
                  <span className="wg-preset-dot" style={{ background: color }} />
                  {group.charAt(0).toUpperCase() + group.slice(1)}
                </button>
              )
            })}
          </div>

          {filteredProjects.length > 0 && (
            <div className="wg-results">
              <div className="dtree-results-label">Matching projects</div>
              <div className="project-list">
                {filteredProjects.map((p, i) => (
                  <Link
                    key={p.id}
                    to={`/projects/${p.slug}`}
                    className="project-row"
                    style={{ '--i': i } as CSSProperties}
                    onMouseEnter={() => setHovered(p.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <span className="project-num">0{i + 1}</span>
                    <span className="project-title">{p.title}</span>
                    <span className="project-meta">{p.type}</span>
                    <span className="project-meta">{p.year}</span>
                    <span className="project-arrow">→</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cursor preview — flips left when near right edge */}
      <div
        className={`work-preview${hovered !== null ? ' is-visible' : ''}`}
        style={{
          transform: `translate(${
            mousePos.x + 28 + 380 > window.innerWidth - 16
              ? mousePos.x - 28 - 380
              : mousePos.x + 28
          }px, ${
            Math.max(8, Math.min(mousePos.y - 119, window.innerHeight - 246))
          }px)`
        }}
      >
        <div
          className="work-preview-img"
          style={{ background: PROJECTS.find(p => p.id === hovered)?.image }}
        />
      </div>
    </section>
  )
}
