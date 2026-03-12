import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { getAllPosts } from '../utils/postsFromMarkdown'

export default function Blog() {
  const posts = getAllPosts()

  return (
    <div className="page">
      <section className="blog-section">
        <div className="section-label" data-reveal>Writing</div>

        <div className="blog-list">
          {posts.map((post, i) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="blog-row"
              data-reveal
              style={{ '--i': i } as CSSProperties}
            >
              <span className="blog-num">0{i + 1}</span>
              <div className="blog-body">
                <div className="blog-title">{post.title}</div>
                <div className="blog-summary">{post.summary}</div>
              </div>
              <div className="blog-right">
                <span className="blog-category">{post.category}</span>
                <span className="blog-date">{post.date}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
