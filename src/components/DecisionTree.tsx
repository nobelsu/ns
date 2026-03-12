import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

// ─── Data ───────────────────────────────────────────────────────────────────

// image: swap gradients for real URLs, e.g. 'url(/previews/lumina.jpg)'
const allProjects = [
  { id: 1, title: 'Lumina — Brand System',  type: 'Brand Identity', year: '2024', image: 'linear-gradient(135deg, #0f1c2e, #1e3a5f)' },
  { id: 2, title: 'Folia Finance App',       type: 'UI / UX',        year: '2024', image: 'linear-gradient(135deg, #0d1a0d, #1a3d20)' },
  { id: 3, title: 'Arthaus Gallery',         type: 'Web Design',     year: '2023', image: 'linear-gradient(135deg, #1a0d1a, #2d1a2d)' },
  { id: 4, title: 'Kōhī Coffee Packaging',   type: 'Packaging',      year: '2023', image: 'linear-gradient(135deg, #1a1206, #2d1e0a)' },
]

const tree = {
  question: 'What does your\nproject need?',
  branches: [
    {
      id: 'brand',
      label: 'Brand identity',
      leaves: [
        { id: 'brand-early', label: 'Early stage',  projectIds: [1, 4, 3] },
        { id: 'brand-estab', label: 'Established',  projectIds: [1, 3, 2] },
      ],
    },
    {
      id: 'product',
      label: 'Digital product',
      leaves: [
        { id: 'product-mobile', label: 'Mobile app', projectIds: [2, 1, 3] },
        { id: 'product-web',    label: 'Web',         projectIds: [3, 2, 1] },
      ],
    },
    {
      id: 'print',
      label: 'Print & packaging',
      leaves: [
        { id: 'print-pkg',  label: 'Packaging', projectIds: [4, 3, 1] },
        { id: 'print-edit', label: 'Editorial',  projectIds: [3, 4, 2] },
      ],
    },
  ],
}

type Pt       = { x: number; y: number }
type LineInfo = { id: string; from: string; to: string; p1: Pt; p2: Pt }

// ─── Component ───────────────────────────────────────────────────────────────

export default function DecisionTree() {
  const [activeBranch, setActiveBranch] = useState<string | null>(null)
  const [activeLeaf,   setActiveLeaf]   = useState<string | null>(null)
  const [hovered,      setHovered]      = useState<number | null>(null)
  const [mousePos,     setMousePos]     = useState({ x: 0, y: 0 })

  const containerRef              = useRef<HTMLDivElement>(null)
  const [lines,   setLines]       = useState<LineInfo[]>([])
  const [svgSize, setSvgSize]     = useState({ w: 0, h: 0 })

  // ── Measure node centers ──────────────────────────────────────────────────

  const measure = useCallback(() => {
    const c = containerRef.current
    if (!c) return
    const cb = c.getBoundingClientRect()

    const rightEdge = (id: string): Pt | null => {
      const el = c.querySelector<HTMLElement>(`[data-id="${id}"]`)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: r.right - cb.left, y: r.top - cb.top + r.height / 2 }
    }

    const leftEdge = (id: string): Pt | null => {
      const el = c.querySelector<HTMLElement>(`[data-id="${id}"]`)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: r.left - cb.left, y: r.top - cb.top + r.height / 2 }
    }

    const newLines: LineInfo[] = []
    const rootRight = rightEdge('root')

    tree.branches.forEach(b => {
      const bLeft  = leftEdge(`branch-${b.id}`)
      const bRight = rightEdge(`branch-${b.id}`)
      if (rootRight && bLeft)
        newLines.push({ id: `root-${b.id}`, from: 'root', to: b.id, p1: rootRight, p2: bLeft })
      b.leaves.forEach(l => {
        const lLeft = leftEdge(`leaf-${l.id}`)
        if (bRight && lLeft)
          newLines.push({ id: `${b.id}-${l.id}`, from: b.id, to: l.id, p1: bRight, p2: lLeft })
      })
    })

    setLines(newLines)
    setSvgSize({ w: cb.width, h: cb.height })
  }, [])

  useEffect(() => {
    const raf = requestAnimationFrame(measure)
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [measure])

  // Re-measure after leaves appear/disappear
  useEffect(() => {
    const raf = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(raf)
  }, [activeBranch, measure])

  // ── Opacity ───────────────────────────────────────────────────────────────

  const lineOpacity = (l: LineInfo): number => {
    if (!activeBranch) return l.from === 'root' ? 0.18 : 0
    if (l.from === 'root')       return l.to === activeBranch ? 0.9 : 0.05
    if (l.from !== activeBranch) return 0
    if (!activeLeaf)             return 0.35
    return l.to === activeLeaf ? 0.9 : 0
  }

  const branchOpacity = (id: string): number => {
    if (!activeBranch) return 0.6
    return id === activeBranch ? 1 : 0.12
  }

  const leafOpacity = (id: string, branchId: string): number => {
    if (activeBranch !== branchId) return 0.18
    if (!activeLeaf) return 0.6
    return id === activeLeaf ? 1 : 0.18
  }

  // ── SVG path (orthogonal elbow) ───────────────────────────────────────────

  const connPath = (p1: Pt, p2: Pt) => {
    const mx = p1.x + (p2.x - p1.x) * 0.55
    return `M${p1.x},${p1.y} H${mx} V${p2.y} H${p2.x}`
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleBranch = (id: string) => {
    setActiveBranch(prev => prev === id ? null : id)
    setActiveLeaf(null)
  }

  const handleLeaf = (id: string, branchId: string) => {
    if (activeBranch !== branchId) return
    setActiveLeaf(prev => prev === id ? null : id)
  }

  // ── Results ───────────────────────────────────────────────────────────────

  const activeLeafData = tree.branches
    .find(b => b.id === activeBranch)
    ?.leaves.find(l => l.id === activeLeaf)

  const resultProjects = (activeLeafData?.projectIds ?? [])
    .map(id => allProjects.find(p => p.id === id)!)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section
      className="work-section"
      id="work"
      onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      <div className="section-label" data-reveal>Selected Work</div>

      <div className="dtree-wrapper">
      <div className="dtree" ref={containerRef} data-reveal>
        {/* SVG lines */}
        <svg className="dtree-svg" style={{ width: svgSize.w || '100%', height: svgSize.h || '100%' }}>
          {lines.map(l => (
            <path
              key={l.id}
              d={connPath(l.p1, l.p2)}
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="1"
              style={{ opacity: lineOpacity(l), transition: 'opacity 0.35s ease' }}
            />
          ))}
        </svg>

        {/* Root */}
        <div
          data-id="root"
          className="dtree-root"
          style={{ gridColumn: 1, gridRow: '1 / 7' }}
        >
          {tree.question.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
        </div>

        {/* Branches + leaves */}
        {tree.branches.map((b, bi) => (
          <Fragment key={b.id}>
            <button
              data-id={`branch-${b.id}`}
              className={`dtree-node dtree-branch${activeBranch === b.id ? ' is-active' : ''}`}
              style={{
                gridColumn: 2,
                gridRow: `${bi * 2 + 1} / ${bi * 2 + 3}`,
                opacity: branchOpacity(b.id),
              }}
              onClick={() => handleBranch(b.id)}
            >
              {b.label}
            </button>

            {activeBranch === b.id && b.leaves.map((l, li) => (
              <button
                key={l.id}
                data-id={`leaf-${l.id}`}
                className={`dtree-node dtree-leaf${activeLeaf === l.id ? ' is-active' : ''}`}
                style={{
                  gridColumn: 3,
                  gridRow: bi * 2 + li + 1,
                  opacity: leafOpacity(l.id, b.id),
                }}
                onClick={() => handleLeaf(l.id, b.id)}
              >
                {l.label}
              </button>
            ))}
          </Fragment>
        ))}
      </div>

      {/* Results — side by side with tree */}
      <div className={`dtree-results${resultProjects.length > 0 ? ' is-visible' : ''}`}>
        <div className="dtree-results-label">Based on your answers</div>
        <div className="project-list">
          {resultProjects.map((p, i) => (
            <div
              key={p.id}
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
            </div>
          ))}
        </div>
        {resultProjects.length > 0 && (
          <button
            className="dtree-reset"
            onClick={() => { setActiveBranch(null); setActiveLeaf(null) }}
          >
            Start over
          </button>
        )}
      </div>
      </div>{/* end dtree-wrapper */}

      {/* Hover preview for result rows */}
      <div
        className={`work-preview${hovered !== null ? ' is-visible' : ''}`}
        style={{ transform: `translate(${mousePos.x + 28}px, ${mousePos.y - 100}px)` }}
      >
        <div
          className="work-preview-img"
          style={{ background: allProjects.find(p => p.id === hovered)?.image }}
        />
      </div>
    </section>
  )
}
