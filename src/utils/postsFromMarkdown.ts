import type { Post } from '../types/post'

type Frontmatter = {
  slug?: string
  title?: string
  date?: string
  category?: string
  summary?: string
}

const markdownFiles = import.meta.glob('../content/blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function parseFrontmatter(raw: string): { data: Frontmatter; content: string } {
  // Very small YAML-like parser for the simple key: value pairs we're using.
  if (!raw.startsWith('---')) {
    return { data: {}, content: raw }
  }

  const end = raw.indexOf('\n---', 3)
  if (end === -1) {
    return { data: {}, content: raw }
  }

  const frontmatterBlock = raw.slice(3, end).trim()
  const content = raw.slice(end + 4) // skip "\n---"

  const data: Frontmatter = {}
  for (const line of frontmatterBlock.split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    if (!key) continue
    ;(data as any)[key] = value
  }

  return { data, content }
}

const posts: Post[] = Object.entries(markdownFiles).map(([path, rawContent]) => {
  const { data, content } = parseFrontmatter(rawContent)

  const slug =
    data.slug ??
    path
      .split('/')
      .pop()
      ?.replace(/\.md$/, '') ??
    ''

  if (!slug) {
    // Silently skip invalid posts instead of crashing the app.
    return null as unknown as Post
  }

  return {
    slug,
    title: data.title ?? slug,
    date: data.date ?? '',
    category: data.category ?? '',
    summary: data.summary ?? '',
    content: content.trim(),
  }
}).filter(Boolean)

function compareDatesDesc(a: Post, b: Post) {
  return new Date(b.date).getTime() - new Date(a.date).getTime()
}

export function getAllPosts(): Post[] {
  return [...posts].sort(compareDatesDesc)
}

export function getPostBySlug(slug: string | undefined): Post | undefined {
  if (!slug) return undefined
  return posts.find(post => post.slug === slug)
}

