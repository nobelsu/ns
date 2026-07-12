import { projects } from './projects'
import { getAllPosts } from '../utils/postsFromMarkdown'
import { workExperience, education, interests } from './profile'

export type NodeKind = 'center' | 'hub' | 'project' | 'post' | 'skill' | 'item'

export interface GraphNode {
  id: string
  label: string
  kind: NodeKind
  r: number
  /** Route this node maps to. Skill nodes have none — they only highlight. */
  route?: string
  /** Chronological position within a dated hub (0 = newest … 1 = oldest). */
  order?: number
}

export interface GraphEdge {
  s: string
  t: string
}

// Some projects use long-form skill ids; normalize to the canonical short ids.
const SKILL_ALIAS: Record<string, string> = {
  typescript: 'ts',
  javascript: 'js',
}

export const SKILL_LABEL: Record<string, string> = {
  ts: 'TypeScript',
  js: 'JavaScript',
  python: 'Python',
  expo: 'Expo',
  html: 'HTML',
  css: 'CSS',
  react: 'React',
  'react-native': 'React Native',
  node: 'Node.js',
  convex: 'Convex',
  vercel: 'Vercel',
  fastapi: 'FastAPI',
  electron: 'Electron',
  docker: 'Docker',
}

export const normalizeSkill = (s: string) => SKILL_ALIAS[s] ?? s

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Projects (featured + archive) that use a given normalized skill id. */
export function projectsForSkill(skill: string) {
  return projects.filter(p => p.skills.map(normalizeSkill).includes(skill))
}

function buildGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  nodes.push({ id: 'nobel', label: 'Nobel Suhendra', kind: 'center', r: 30, route: '/about' })

  const hubs: Array<[string, string, string]> = [
    ['hub:projects', 'projects', '/projects'],
    ['hub:blog', 'writing', '/blog'],
    ['hub:experience', 'work', '/experience'],
    ['hub:education', 'education', '/education'],
    ['hub:beyond', 'beyond', '/beyond'],
    ['hub:me', 'this is me', '/me'],
  ]
  hubs.forEach(([id, label, route]) => {
    nodes.push({ id, label, kind: 'hub', r: 15, route })
    edges.push({ s: 'nobel', t: id })
  })

  // Only featured projects earn a node; the rest live in the projects hub panel.
  const featured = projects.filter(p => p.featured)
  featured.forEach(p => {
    const id = `project:${p.slug}`
    nodes.push({ id, label: p.title, kind: 'project', r: 10, route: `/projects/${p.slug}` })
    edges.push({ s: 'hub:projects', t: id })
  })

  getAllPosts().forEach(post => {
    const id = `post:${post.slug}`
    nodes.push({ id, label: post.title, kind: 'post', r: 8, route: `/blog/${post.slug}` })
    edges.push({ s: 'hub:blog', t: id })
  })

  // Work leaves — open the experience panel with that row highlighted
  const denom = (n: number) => Math.max(1, n - 1)
  workExperience.forEach((e, i) => {
    const id = `exp:${e.company}`
    nodes.push({ id, label: e.company, kind: 'item', r: 6.5, route: `/experience/${slugify(e.company)}`, order: i / denom(workExperience.length) })
    edges.push({ s: 'hub:experience', t: id })
  })

  // Education leaves — open the education panel with that row highlighted
  education.forEach((e, i) => {
    const id = `edu:${e.company}`
    nodes.push({ id, label: e.company, kind: 'item', r: 6.5, route: `/education/${slugify(e.company)}`, order: i / denom(education.length) })
    edges.push({ s: 'hub:education', t: id })
  })

  // Beyond leaves — two category nodes, both open the beyond panel
  ;[
    ['group:leadership', 'Leadership', '/beyond/leadership'],
    ['group:awards', 'Awards', '/beyond/awards'],
  ].forEach(([id, label, route], i) => {
    nodes.push({ id, label, kind: 'item', r: 7, route, order: i })
    edges.push({ s: 'hub:beyond', t: id })
  })

  // Interest leaves — all open the me panel
  interests.forEach(i => {
    const id = `int:${i.name}`
    nodes.push({ id, label: i.name, kind: 'item', r: 6, route: '/me' })
    edges.push({ s: 'hub:me', t: id })
  })

  // Skill connectors: only skills shared by 2+ featured projects, so they actually link things.
  const bySkill = new Map<string, string[]>()
  featured.forEach(p => {
    new Set(p.skills.map(normalizeSkill)).forEach(s => {
      bySkill.set(s, [...(bySkill.get(s) ?? []), `project:${p.slug}`])
    })
  })
  for (const [skill, projectIds] of bySkill) {
    if (projectIds.length < 2) continue
    const id = `skill:${skill}`
    nodes.push({ id, label: SKILL_LABEL[skill] ?? skill, kind: 'skill', r: 4, route: `/skill/${skill}` })
    projectIds.forEach(pid => edges.push({ s: id, t: pid }))
  }

  return { nodes, edges }
}

export const { nodes: GRAPH_NODES, edges: GRAPH_EDGES } = buildGraph()

// Reverse lookup for leaf routes (work / education), route → node id
const ROUTE_TO_ID = new Map(
  GRAPH_NODES
    .filter(n => n.route && /^(exp|edu|group):/.test(n.id))
    .map(n => [n.route!, n.id]),
)

/** Map a location pathname to the node id it selects (null = nothing selected). */
export function nodeIdForPath(pathname: string): string | null {
  const clean = pathname.replace(/\/$/, '') || '/'
  if (clean === '/') return null
  if (clean === '/about') return 'nobel'
  if (clean === '/projects') return 'hub:projects'
  if (clean === '/blog') return 'hub:blog'
  if (clean === '/experience') return 'hub:experience'
  if (clean === '/education') return 'hub:education'
  if (clean === '/beyond') return 'hub:beyond'
  if (clean === '/me') return 'hub:me'
  if (clean === '/contact') return 'nobel' // contact now lives in the center panel
  if (ROUTE_TO_ID.has(clean)) return ROUTE_TO_ID.get(clean)! // specific work / school node
  const project = clean.match(/^\/projects\/([^/]+)$/)
  if (project) return `project:${project[1]}`
  const post = clean.match(/^\/blog\/([^/]+)$/)
  if (post) return `post:${post[1]}`
  const skill = clean.match(/^\/skill\/([^/]+)$/)
  if (skill) return `skill:${skill[1]}`
  return null
}
