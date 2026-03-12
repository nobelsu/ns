import { useEffect, useRef } from 'react'

interface SimNode {
  id: string
  label: string
  group: string
  x: number; y: number
  vx: number; vy: number
  pinned: boolean
  degree: number
}

const NODE_DEFS = [
  { id: 'figma',      label: 'Figma',       group: 'design' },
  { id: 'framer',     label: 'Framer',      group: 'design' },
  { id: 'sketch',     label: 'Sketch',      group: 'design' },
  { id: 'ps',         label: 'Photoshop',   group: 'design' },
  { id: 'ai',         label: 'Illustrator', group: 'design' },
  { id: 'html',       label: 'HTML',        group: 'frontend' },
  { id: 'css',        label: 'CSS',         group: 'frontend' },
  { id: 'js',         label: 'JavaScript',  group: 'frontend' },
  { id: 'ts',         label: 'TypeScript',  group: 'frontend' },
  { id: 'react',      label: 'React',       group: 'frontend' },
  { id: 'nextjs',     label: 'Next.js',     group: 'frontend' },
  { id: 'tailwind',   label: 'Tailwind',    group: 'frontend' },
  { id: 'node',       label: 'Node.js',     group: 'backend' },
  { id: 'python',     label: 'Python',      group: 'backend' },
  { id: 'postgres',   label: 'PostgreSQL',  group: 'backend' },
  { id: 'redis',      label: 'Redis',       group: 'backend' },
  { id: 'git',        label: 'Git',         group: 'tools' },
  { id: 'docker',     label: 'Docker',      group: 'tools' },
  { id: 'vite',       label: 'Vite',        group: 'tools' },
  { id: 'aws',        label: 'AWS',         group: 'tools' },
]

const EDGES = [
  { s: 'figma',    t: 'framer' },
  { s: 'figma',    t: 'sketch' },
  { s: 'figma',    t: 'ps' },
  { s: 'ps',       t: 'ai' },
  { s: 'figma',    t: 'react' },
  { s: 'framer',   t: 'react' },
  { s: 'html',     t: 'css' },
  { s: 'html',     t: 'js' },
  { s: 'css',      t: 'tailwind' },
  { s: 'js',       t: 'ts' },
  { s: 'ts',       t: 'react' },
  { s: 'react',    t: 'nextjs' },
  { s: 'react',    t: 'tailwind' },
  { s: 'vite',     t: 'react' },
  { s: 'ts',       t: 'node' },
  { s: 'node',     t: 'postgres' },
  { s: 'node',     t: 'redis' },
  { s: 'node',     t: 'nextjs' },
  { s: 'python',   t: 'postgres' },
  { s: 'git',      t: 'docker' },
  { s: 'docker',   t: 'aws' },
  { s: 'nextjs',   t: 'aws' },
]

const GROUP_COLOR: Record<string, string> = {
  design:   '#c4855a',
  frontend: '#6b9fd4',
  backend:  '#7ab87a',
  tools:    '#a89a8e',
}

const REPULSION   = 7000
const SPRING_K    = 0.045
const REST_LEN    = 115
const DAMPING     = 0.80
const CENTER_K    = 0.022
const ALPHA_DECAY = 0.994

export default function Skills() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const container = canvas.parentElement!
    const ctx = canvas.getContext('2d')!

    let animId = 0
    let alpha   = 1.0
    let hoveredId: string | null = null
    let dragging: SimNode | null = null
    let dragOX = 0, dragOY = 0
    let w = 0, h = 0

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      w = container.clientWidth
      h = Math.round(Math.min(600, Math.max(420, window.innerHeight * 0.6)))
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
      degree: EDGES.filter(e => e.s === n.id || e.t === n.id).length,
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

      const linkedIds: Set<string> | null = hoveredId
        ? new Set(EDGES.filter(e => e.s === hoveredId || e.t === hoveredId).flatMap(e => [e.s, e.t]))
        : null

      // Edges
      EDGES.forEach(e => {
        const s = byId(e.s), t = byId(e.t)
        const active = linkedIds && linkedIds.has(e.s) && linkedIds.has(e.t)
        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(t.x, t.y)
        ctx.strokeStyle = active ? 'rgba(237,234,228,0.28)' : 'rgba(237,234,228,0.07)'
        ctx.lineWidth   = active ? 1.5 : 0.8
        ctx.stroke()
      })

      // Nodes
      nodes.forEach(n => {
        const isHovered = n.id === hoveredId
        const isLinked  = linkedIds ? linkedIds.has(n.id) : false
        const dim       = !!(linkedIds && !isHovered && !isLinked)
        const r         = 4.5 + n.degree * 0.8

        const color = GROUP_COLOR[n.group] ?? '#4a4845'

        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fillStyle = dim
          ? 'rgba(74,72,69,0.12)'
          : isHovered
            ? '#edeae4'
            : color + 'cc' // hex with alpha
        ctx.fill()

        if (!dim) {
          const labelAlpha = isHovered ? 1 : isLinked ? 0.85 : 0.55
          ctx.font      = `${isHovered ? 600 : 500} 10px Inter, system-ui, sans-serif`
          ctx.fillStyle = `rgba(237,234,228,${labelAlpha})`
          ctx.textAlign = 'center'
          ctx.fillText(n.label, n.x, n.y + r + 13)
        }
      })
    }

    const loop = () => { tick(); draw(); animId = requestAnimationFrame(loop) }
    animId = requestAnimationFrame(loop)

    // Interaction
    const hitTest = (x: number, y: number) => {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i]
        const r = 4.5 + n.degree * 0.8 + 7
        const dx = n.x - x, dy = n.y - y
        if (dx * dx + dy * dy < r * r) return n
      }
      return null
    }

    const toCanvas = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const onMove = (e: MouseEvent) => {
      const { x, y } = toCanvas(e)
      if (dragging) {
        dragging.x = x + dragOX; dragging.y = y + dragOY
        dragging.vx = 0; dragging.vy = 0
        alpha = Math.max(alpha, 0.3)
      } else {
        const n = hitTest(x, y)
        hoveredId = n?.id ?? null
        canvas.style.cursor = n ? 'grab' : 'default'
      }
    }

    const onDown = (e: MouseEvent) => {
      const { x, y } = toCanvas(e)
      const n = hitTest(x, y)
      if (n) {
        dragging = n; n.pinned = true
        dragOX = n.x - x; dragOY = n.y - y
        canvas.style.cursor = 'grabbing'
      }
    }

    const onUp = () => {
      if (dragging) { dragging.pinned = false; dragging = null; alpha = Math.max(alpha, 0.3) }
      canvas.style.cursor = hoveredId ? 'grab' : 'default'
    }

    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    canvas.addEventListener('mouseleave', () => { hoveredId = null })

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(animId)
      resize()
      alpha = Math.max(alpha, 0.5)
      animId = requestAnimationFrame(loop)
    })
    ro.observe(container)

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      ro.disconnect()
    }
  }, [])

  return (
    <div className="page">
      <section className="skills-section">
        <div className="section-label" data-reveal>Skills & Stack</div>
        <canvas ref={canvasRef} className="skills-canvas" />
        <div className="skills-legend" data-reveal>
          {Object.entries(GROUP_COLOR).map(([group, color]) => (
            <span key={group} className="skills-legend-item">
              <span className="skills-legend-dot" style={{ background: color }} />
              {group.charAt(0).toUpperCase() + group.slice(1)}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}
