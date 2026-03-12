import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPostBySlug } from '../utils/postsFromMarkdown'
import MarkdownRenderer from '../components/MarkdownRenderer'

export default function Post() {
  const { slug } = useParams()
  const post = getPostBySlug(slug)

  if (!post) {
    return (
      <div className="page">
        <section className="post-section">
          <p className="post-not-found">Post not found.</p>
          <Link to="/blog" className="post-back">← Back to writing</Link>
        </section>
      </div>
    )
  }

  return (
    <div className="page">
      <section className="post-section">
        <Link to="/blog" className="post-back" data-reveal>← Writing</Link>

        <div className="post-header" data-reveal style={{ '--i': 1 } as CSSProperties}>
          <div className="post-meta">
            <span>{post.category}</span>
            <span>{post.date}</span>
          </div>
          <h1 className="post-title">{post.title}</h1>
        </div>

        <div className="post-rule" data-reveal style={{ '--i': 2 } as CSSProperties} />

        <div className="post-body">
          <MarkdownRenderer markdown={post.content} className="post-markdown" />
        </div>
      </section>
    </div>
  )
}
