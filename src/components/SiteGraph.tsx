import { useEffect, useRef } from 'react'
import { GRAPH_NODES, GRAPH_EDGES } from '../data/graph'
import type { GraphNode } from '../data/graph'

// ─── Simulation constants ─────────────────────────────────────────────────────

const REPULSION = 26000
const SPRING_K = 0.04
const DAMPING = 0.82
const CENTER_K = 0.012
const ALPHA_DECAY = 0.995

const restLen = (a: SimNode, b: SimNode) => {
  const kinds = [a.kind, b.kind].sort().join('-')
  if (kinds === 'center-hub') return 300
  if (kinds === 'hub-project' || kinds === 'hub-post') return 175
  return 165 // skill-project
}

interface SimNode extends GraphNode {
  x: number
  y: number
  vx: number
  vy: number
  pinned: boolean
}

// ─── Deterministic wobble (seeded per node/edge id, stable across frames) ─────

function hashSeed(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CIRCLE_SEGS = 16

interface Wobble {
  ring1: number[]
  ring2: number[]
  bow: number
  mid1: number[]
  mid2: number[]
}

const wobbleCache = new Map<string, Wobble>()
function wobbleFor(id: string): Wobble {
  let w = wobbleCache.get(id)
  if (!w) {
    const rnd = mulberry32(hashSeed(id))
    const ring = () => Array.from({ length: CIRCLE_SEGS }, () => (rnd() - 0.5) * 2)
    w = {
      ring1: ring(),
      ring2: ring(),
      bow: (rnd() - 0.5) * 2,
      mid1: [rnd() - 0.5, rnd() - 0.5],
      mid2: [rnd() - 0.5, rnd() - 0.5],
    }
    wobbleCache.set(id, w)
  }
  return w
}

/** Hand-drawn circle: closed spline through jittered ring points. */
function sketchCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, offsets: number[]) {
  const amp = Math.max(0.5, r * 0.07)
  const pts = offsets.map((o, i) => {
    const a = (i / CIRCLE_SEGS) * Math.PI * 2
    const rr = r + o * amp
    return [x + Math.cos(a) * rr, y + Math.sin(a) * rr]
  })
  ctx.beginPath()
  ctx.moveTo((pts[0][0] + pts[CIRCLE_SEGS - 1][0]) / 2, (pts[0][1] + pts[CIRCLE_SEGS - 1][1]) / 2)
  for (let i = 0; i < CIRCLE_SEGS; i++) {
    const p = pts[i]
    const n = pts[(i + 1) % CIRCLE_SEGS]
    ctx.quadraticCurveTo(p[0], p[1], (p[0] + n[0]) / 2, (p[1] + n[1]) / 2)
  }
  ctx.closePath()
}

/** Hand-drawn edge: slightly bowed quadratic with a jittered midpoint. */
function sketchLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  bow: number, mid: number[],
) {
  const mx = (x1 + x2) / 2 + mid[0] * 3
  const my = (y1 + y2) / 2 + mid[1] * 3
  const dx = x2 - x1, dy = y2 - y1
  const d = Math.sqrt(dx * dx + dy * dy) || 1
  const px = -dy / d, py = dx / d
  const b = bow * Math.min(10, d * 0.05)
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.quadraticCurveTo(mx + px * b, my + py * b, x2, y2)
}

/** Word-wrap a label to fit maxWidth; falls back to single word if unbreakable. */
function wrapLabel(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  if (words.length === 1 || ctx.measureText(text).width <= maxWidth) return [text]
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SiteGraphProps {
  selectedId: string | null
  panelOpen: boolean
  onSelect: (node: GraphNode | null) => void
}

const INK = '38, 34, 27'       // --ink
const ACCENT = '179, 84, 62'   // --accent

export default function SiteGraph({ selectedId, panelOpen, onSelect }: SiteGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const selectedRef = useRef<string | null>(selectedId)
  const panelOpenRef = useRef(panelOpen)
  const onSelectRef = useRef(onSelect)

  selectedRef.current = selectedId
  onSelectRef.current = onSelect
  panelOpenRef.current = panelOpen

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let animId = 0
    let alpha = 1.0
    let frame = 0
    let hoveredId: string | null = null
    let dragging: SimNode | null = null
    let dragOX = 0, dragOY = 0
    let panning = false
    let w = 0, h = 0

    // View transform: screen = world * k + (tx, ty)
    let k = 1, tx = 0, ty = 0
    // Camera auto-fits the graph until the user takes over (pan/zoom)
    let userView = false

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    // Radial initial layout: hubs ring around center, leaves scattered near hub.
    const nodes: SimNode[] = (() => {
      const cx = w / 2, cy = h / 2
      const out: SimNode[] = []
      const hubIds = GRAPH_NODES.filter(n => n.kind === 'hub').map(n => n.id)
      const hubAngle = new Map(hubIds.map((id, i) => [id, (i / hubIds.length) * Math.PI * 2 - Math.PI / 2]))
      const parentHub = new Map<string, string>()
      GRAPH_EDGES.forEach(e => {
        if (e.s.startsWith('hub:')) parentHub.set(e.t, e.s)
      })
      GRAPH_NODES.forEach(n => {
        const rnd = mulberry32(hashSeed('layout:' + n.id))
        let x = cx, y = cy
        if (n.kind === 'hub') {
          const a = hubAngle.get(n.id)!
          x = cx + Math.cos(a) * 230
          y = cy + Math.sin(a) * 230
        } else if (n.kind !== 'center') {
          const hub = parentHub.get(n.id)
          const hubA = hub ? hubAngle.get(hub)! : rnd() * Math.PI * 2
          if (n.order !== undefined) {
            // dated leaf: start on its chronological arc
            const a = hubA + (n.order - 0.5) * 1.5
            const d = 230 + 70 + n.order * 105
            x = cx + Math.cos(a) * d
            y = cy + Math.sin(a) * d
          } else {
            const a = hubA + (rnd() - 0.5) * 1.0
            const d = 230 + 120 + (rnd() - 0.5) * 90
            x = cx + Math.cos(a) * d
            y = cy + Math.sin(a) * d
          }
        }
        out.push({ ...n, x, y, vx: 0, vy: 0, pinned: false })
      })
      return out
    })()

    // Headliner (center/hub) labels sit inside the node — grow radius to fit text
    const sizeHeadliners = () => {
      nodes.forEach(n => {
        if (n.kind === 'center') {
          ctx.font = 'italic 20px "Instrument Serif", Georgia, serif'
          n.r = Math.max(30, ctx.measureText(n.label).width / 2 + 16)
        } else if (n.kind === 'hub') {
          ctx.font = 'italic 16px "Instrument Serif", Georgia, serif'
          n.r = Math.max(15, ctx.measureText(n.label).width / 2 + 12)
        }
      })
    }
    sizeHeadliners()
    // re-measure once webfonts arrive (first pass may use the fallback serif)
    document.fonts?.ready.then(sizeHeadliners)

    const byId = new Map(nodes.map(n => [n.id, n]))
    const neighbors = new Map<string, Set<string>>()
    const leafHub = new Map<string, string>() // dated leaf → its hub
    GRAPH_EDGES.forEach(e => {
      if (!neighbors.has(e.s)) neighbors.set(e.s, new Set())
      if (!neighbors.has(e.t)) neighbors.set(e.t, new Set())
      neighbors.get(e.s)!.add(e.t)
      neighbors.get(e.t)!.add(e.s)
      if (e.s.startsWith('hub:')) leafHub.set(e.t, e.s)
    })
    // Dated leaves (order set) ride their hub in a FIXED chronological arc.
    // Offset is computed once against the hub's constant base angle, so the arc
    // translates with the hub but never rotates/spins on its own.
    const hubIdList = GRAPH_NODES.filter(n => n.kind === 'hub').map(n => n.id)
    const hubBase = new Map(hubIdList.map((id, i) => [id, (i / hubIdList.length) * Math.PI * 2 - Math.PI / 2]))
    const TL_FAN = 1.5, TL_NEAR = 78, TL_SPAN = 62
    const tlOffset = new Map<string, { x: number; y: number }>()
    const timelineLeaves = nodes.filter(n => n.order !== undefined && leafHub.has(n.id))
    timelineLeaves.forEach(n => {
      const base = hubBase.get(leafHub.get(n.id)!) ?? 0
      const ang = base + (n.order! - 0.5) * TL_FAN
      const dist = TL_NEAR + n.order! * TL_SPAN
      tlOffset.set(n.id, { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist })
    })

    const tick = () => {
      const cx = w / 2, cy = h / 2
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j]
          const dx = b.x - a.x, dy = b.y - a.y
          const d2 = Math.max(dx * dx + dy * dy, 1)
          const d = Math.sqrt(d2)
          const f = (REPULSION / d2) * alpha
          const nx = dx / d, ny = dy / d
          a.vx -= f * nx; a.vy -= f * ny
          b.vx += f * nx; b.vy += f * ny
        }
      }
      GRAPH_EDGES.forEach(e => {
        const s = byId.get(e.s)!, t = byId.get(e.t)!
        const dx = t.x - s.x, dy = t.y - s.y
        const d = Math.sqrt(dx * dx + dy * dy) || 1
        const f = SPRING_K * (d - restLen(s, t)) * alpha
        const nx = dx / d, ny = dy / d
        s.vx += f * nx; s.vy += f * ny
        t.vx -= f * nx; t.vy -= f * ny
      })
      nodes.forEach(n => {
        if (n.kind === 'center') return // center is pinned to (cx,cy) below
        n.vx += CENTER_K * (cx - n.x) * alpha
        n.vy += CENTER_K * (cy - n.y) * alpha
      })
      // Hubs settle onto an even ring around the center: fixed radius + fixed angle
      const HUB_RING = Math.min(300, Math.min(w, h) * 0.34)
      const ANG_K = 1.6, RAD_K = 0.06
      nodes.forEach(n => {
        if (n.kind !== 'hub') return
        const desired = hubBase.get(n.id)
        if (desired === undefined) return
        const dx = n.x - cx, dy = n.y - cy
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const cur = Math.atan2(dy, dx)
        let diff = desired - cur
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        // tangential nudge toward the slot angle
        n.vx += -Math.sin(cur) * diff * ANG_K
        n.vy += Math.cos(cur) * diff * ANG_K
        // radial nudge toward the ring radius
        n.vx += (dx / dist) * (HUB_RING - dist) * RAD_K
        n.vy += (dy / dist) * (HUB_RING - dist) * RAD_K
      })
      // Idle drift once cooled — keeps the ink alive
      frame++
      if (alpha < 0.08) {
        const t = frame * 0.004
        nodes.forEach((n, i) => {
          if (n.pinned) return
          const phase = i * 1.7
          n.vx += Math.sin(t + phase) * 0.012
          n.vy += Math.cos(t + phase * 0.7) * 0.012
        })
      }
      nodes.forEach(n => {
        if (n.pinned) return
        n.vx *= DAMPING; n.vy *= DAMPING
        n.x += n.vx; n.y += n.vy
      })
      // Pin the center at the gravity origin so the ring stays balanced
      const cnode = byId.get('nobel')
      if (cnode && !cnode.pinned) { cnode.x = cx; cnode.y = cy; cnode.vx = 0; cnode.vy = 0 }
      // Rigidly place dated leaves on their hub's fixed arc — no spin, no chase.
      timelineLeaves.forEach(n => {
        if (n.pinned) return
        const hub = byId.get(leafHub.get(n.id)!)!
        const off = tlOffset.get(n.id)!
        n.x = hub.x + off.x
        n.y = hub.y + off.y
        n.vx = 0; n.vy = 0
      })
      alpha = Math.max(0.04, alpha * ALPHA_DECAY)
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.save()
      ctx.translate(tx, ty)
      ctx.scale(k, k)

      const sel = selectedRef.current
      const focus = hoveredId ?? sel
      const focusSet = focus ? new Set([focus, ...(neighbors.get(focus) ?? [])]) : null

      // Edges — a single softly-bowed hand-drawn stroke; skill web stays whisper-faint
      GRAPH_EDGES.forEach(e => {
        const s = byId.get(e.s)!, t = byId.get(e.t)!
        const wob = wobbleFor(e.s + '→' + e.t)
        const inFocus = focusSet ? focusSet.has(e.s) && focusSet.has(e.t) : true
        const isSkillEdge = e.s.startsWith('skill:') || e.t.startsWith('skill:')
        const base = inFocus ? (isSkillEdge && !focusSet ? 0.12 : 0.34) : 0.05
        ctx.strokeStyle = `rgba(${INK}, ${base})`
        ctx.lineWidth = 1.1
        sketchLine(ctx, s.x, s.y, t.x, t.y, wob.bow, wob.mid1)
        ctx.stroke()
      })

      // Nodes
      nodes.forEach(n => {
        const isSel = n.id === sel
        const isHover = n.id === hoveredId
        const inFocus = focusSet ? focusSet.has(n.id) : true
        const wob = wobbleFor(n.id)
        const ink = inFocus ? 0.92 : 0.22
        const color = isSel ? ACCENT : INK

        // opaque paper base so edges never show through the node...
        sketchCircle(ctx, n.x, n.y, n.r, wob.ring1)
        ctx.fillStyle = '#f7f2e7'
        ctx.fill()
        // ...then the tint wash on top
        if (isSel || n.kind === 'center' || n.kind === 'hub') {
          ctx.fillStyle = isSel
            ? 'rgba(179, 84, 62, 0.12)'
            : `rgba(${INK}, ${inFocus ? 0.08 : 0.03})`
          ctx.fill()
        }

        ctx.strokeStyle = `rgba(${color}, ${ink})`
        ctx.lineWidth = isSel || isHover ? 1.8 : 1.3
        ctx.stroke()
        // second pass, offset ring — the "gone over it twice" pen look
        sketchCircle(ctx, n.x, n.y, n.r, wob.ring2)
        ctx.strokeStyle = `rgba(${color}, ${ink * 0.4})`
        ctx.lineWidth = 0.9
        ctx.stroke()

        if (n.kind === 'skill') {
          // small solid dot at the middle
          ctx.beginPath()
          ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${INK}, ${ink * 0.7})`
          ctx.fill()
        }

        let labelAlpha = inFocus ? (isSel || isHover ? 1 : n.kind === 'skill' ? 0.55 : 0.78) : 0.12
        // Leaf/skill labels declutter: fade out at low zoom unless highlighted
        const highlighted = isSel || isHover || (focusSet !== null && focusSet.has(n.id))
        if (!highlighted) {
          if (n.kind === 'skill') labelAlpha = 0
          else if (n.kind !== 'center' && n.kind !== 'hub') {
            labelAlpha *= Math.max(0, Math.min(1, (k - 0.35) / 0.25))
          }
        }
        if (labelAlpha > 0.02) {
          ctx.fillStyle = isSel ? `rgba(${ACCENT}, 1)` : `rgba(${INK}, ${labelAlpha})`
          ctx.textAlign = 'center'
          if (n.kind === 'center') {
            ctx.font = 'italic 20px "Instrument Serif", Georgia, serif'
            ctx.textBaseline = 'middle'
            ctx.fillText(n.label, n.x, n.y + 1)
            ctx.textBaseline = 'alphabetic'
          } else if (n.kind === 'hub') {
            ctx.font = 'italic 16px "Instrument Serif", Georgia, serif'
            ctx.textBaseline = 'middle'
            ctx.fillText(n.label, n.x, n.y + 1)
            ctx.textBaseline = 'alphabetic'
          } else {
            // leaves: wrap long labels across lines instead of truncating
            ctx.font = `${isSel ? 600 : 400} 10.5px "IBM Plex Mono", ui-monospace, monospace`
            const lines = wrapLabel(ctx, n.label, 130)
            lines.forEach((line, li) => ctx.fillText(line, n.x, n.y + n.r + 15 + li * 13))
          }
        }
      })

      ctx.restore()
    }

    // Region available for the graph (left of the panel on desktop)
    const availRegion = () => {
      const margin = Math.min(70, w * 0.08, h * 0.08)
      const panelW = window.innerWidth > 900 && panelOpenRef.current ? Math.min(552, w * 0.45) : 0
      return {
        x: margin,
        y: margin,
        w: Math.max(120, w - panelW - margin * 2),
        h: Math.max(120, h - margin * 2),
      }
    }

    // Camera: zoom onto the selected node, otherwise fit the whole graph
    const updateCamera = () => {
      if (userView) return
      const r = availRegion()
      const sel = selectedRef.current
      const focus = sel ? byId.get(sel) : undefined

      let targetK: number, targetTx: number, targetTy: number
      if (focus) {
        // frame the focused node + its immediate neighbours
        const group = [focus, ...[...(neighbors.get(focus.id) ?? [])].map(id => byId.get(id)!).filter(Boolean)]
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        group.forEach(n => {
          minX = Math.min(minX, n.x - n.r)
          maxX = Math.max(maxX, n.x + n.r)
          minY = Math.min(minY, n.y - n.r)
          maxY = Math.max(maxY, n.y + n.r + 18)
        })
        const bw = Math.max(1, maxX - minX)
        const bh = Math.max(1, maxY - minY)
        targetK = Math.min(1.7, Math.max(0.5, Math.min(r.w / bw, r.h / bh)))
        // center the focused node itself within the available region
        targetTx = r.x + r.w / 2 - focus.x * targetK
        targetTy = r.y + r.h / 2 - focus.y * targetK
      } else {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        nodes.forEach(n => {
          minX = Math.min(minX, n.x - n.r)
          maxX = Math.max(maxX, n.x + n.r)
          minY = Math.min(minY, n.y - n.r)
          maxY = Math.max(maxY, n.y + n.r + 18)
        })
        const bw = Math.max(1, maxX - minX)
        const bh = Math.max(1, maxY - minY)
        targetK = Math.min(1.1, Math.max(0.1, Math.min(r.w / bw, r.h / bh)))
        targetTx = r.x + (r.w - bw * targetK) / 2 - minX * targetK
        targetTy = r.y + (r.h - bh * targetK) / 2 - minY * targetK
      }

      const t = liveFrames < 30 ? 1 : 0.09 // snap on first frames, ease afterwards
      k += (targetK - k) * t
      tx += (targetTx - tx) * t
      ty += (targetTy - ty) * t
    }

    // Pre-settle so the first paint is already a calm layout
    for (let i = 0; i < 400; i++) tick()
    let liveFrames = 0
    let prevSel = selectedRef.current

    const loop = () => {
      liveFrames++
      // Any selection change re-takes camera control (overrides manual pan/zoom)
      if (selectedRef.current !== prevSel) {
        prevSel = selectedRef.current
        userView = false
      }
      // viewport emulation / pane resizes don't always fire 'resize'
      if (window.innerWidth !== w || window.innerHeight !== h) {
        resize()
        alpha = Math.max(alpha, 0.2)
      }
      tick(); updateCamera(); draw()
      if (import.meta.env.DEV) {
        ;(window as unknown as Record<string, unknown>).__graphDebug = { k, tx, ty, userView, w, h, alpha, frame }
      }
      animId = requestAnimationFrame(loop)
    }
    animId = requestAnimationFrame(loop)

    // ── Interaction ──────────────────────────────────────────────────────────

    const toWorld = (sx: number, sy: number) => ({ x: (sx - tx) / k, y: (sy - ty) / k })

    const hitTest = (sx: number, sy: number) => {
      const { x, y } = toWorld(sx, sy)
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i]
        const r = n.r + 9
        const dx = n.x - x, dy = n.y - y
        if (dx * dx + dy * dy < r * r) return n
      }
      return null
    }

    let downX = 0, downY = 0, moved = false

    const pointerDown = (sx: number, sy: number) => {
      downX = sx; downY = sy; moved = false
      const n = hitTest(sx, sy)
      if (n) {
        dragging = n
        n.pinned = true
        const wpt = toWorld(sx, sy)
        dragOX = n.x - wpt.x; dragOY = n.y - wpt.y
        canvas.style.cursor = 'grabbing'
      } else {
        panning = true
        canvas.style.cursor = 'grabbing'
      }
    }
    const pointerMove = (sx: number, sy: number) => {
      if (!dragging || !moved) return
      const wpt = toWorld(sx, sy)
      dragging.x = wpt.x + dragOX; dragging.y = wpt.y + dragOY
      dragging.vx = 0; dragging.vy = 0
      alpha = Math.max(alpha, 0.25)
    }
    // panning needs deltas — track last position
    let lastX = 0, lastY = 0

    const onMouseDown = (e: MouseEvent) => {
      lastX = e.clientX; lastY = e.clientY
      pointerDown(e.clientX, e.clientY)
    }
    const onMouseMove = (e: MouseEvent) => {
      const sx = e.clientX, sy = e.clientY
      if ((sx - downX) ** 2 + (sy - downY) ** 2 > 25) moved = true
      if (dragging) {
        pointerMove(sx, sy)
      } else if (panning) {
        if (moved) userView = true
        tx += sx - lastX
        ty += sy - lastY
      } else {
        const n = hitTest(sx, sy)
        hoveredId = n?.id ?? null
        canvas.style.cursor = n ? 'pointer' : 'default'
      }
      lastX = sx; lastY = sy
    }
    const onMouseUp = () => {
      if (dragging) {
        if (!moved) {
          const n = dragging
          onSelectRef.current(n.id === selectedRef.current ? null : n)
        }
        dragging.pinned = false
        dragging = null
        alpha = Math.max(alpha, 0.25)
      } else if (panning && !moved) {
        onSelectRef.current(null)
      }
      panning = false
      canvas.style.cursor = hoveredId ? 'pointer' : 'default'
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      userView = true
      const factor = Math.exp(-e.deltaY * 0.0016)
      const nk = Math.min(2.5, Math.max(0.35, k * factor))
      // zoom around cursor
      tx = e.clientX - ((e.clientX - tx) / k) * nk
      ty = e.clientY - ((e.clientY - ty) / k) * nk
      k = nk
    }

    // Touch: 1 finger drag/pan, 2 finger pinch
    let pinchDist = 0
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const t = e.touches[0]
        lastX = t.clientX; lastY = t.clientY
        pointerDown(t.clientX, t.clientY)
      } else if (e.touches.length === 2) {
        if (dragging) { dragging.pinned = false; dragging = null }
        panning = false
        const [a, b] = [e.touches[0], e.touches[1]]
        pinchDist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY)
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length === 1) {
        const t = e.touches[0]
        const sx = t.clientX, sy = t.clientY
        if ((sx - downX) ** 2 + (sy - downY) ** 2 > 25) moved = true
        if (dragging) {
          pointerMove(sx, sy)
        } else if (panning) {
          if (moved) userView = true
          tx += sx - lastX
          ty += sy - lastY
        }
        lastX = sx; lastY = sy
      } else if (e.touches.length === 2) {
        userView = true
        const [a, b] = [e.touches[0], e.touches[1]]
        const d = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY)
        const cxs = (a.clientX + b.clientX) / 2
        const cys = (a.clientY + b.clientY) / 2
        if (pinchDist > 0) {
          const nk = Math.min(2.5, Math.max(0.35, k * (d / pinchDist)))
          tx = cxs - ((cxs - tx) / k) * nk
          ty = cys - ((cys - ty) / k) * nk
          k = nk
        }
        pinchDist = d
      }
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        onMouseUp()
        pinchDist = 0
      }
    }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('mouseleave', () => { hoveredId = null })
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)

    const onResize = () => {
      resize()
      alpha = Math.max(alpha, 0.3)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="site-graph" aria-label="Site map graph. Use the index button for a text navigation." />
}
