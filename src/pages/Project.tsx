import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { projects } from '../data/projects'

export default function Project() {
  const { slug } = useParams()
  const project = projects.find(p => p.slug === slug)

  if (!project) {
    return (
      <div className="page">
        <section className="post-section">
          <p className="post-not-found">Project not found.</p>
          <Link to="/" className="post-back">← Back</Link>
        </section>
      </div>
    )
  }

  return (
    <div className="page">
      <section className="project-page">
        <Link to="/" className="post-back" data-reveal>← Work</Link>

        <div className="project-page-header" data-reveal style={{ '--i': 1 } as CSSProperties}>
          <div className="post-meta">
            <span>{project.type}</span>
            <span>{project.year}</span>
          </div>
          <h1 className="post-title">{project.title}</h1>
        </div>

        <div className="post-rule" data-reveal style={{ '--i': 2 } as CSSProperties} />

        <div className="project-page-body">
          <div className="project-page-description">
            {project.description.split('\n\n').map((para, i) => (
              <p key={i} data-reveal style={{ '--i': i } as CSSProperties}>{para}</p>
            ))}
          </div>

          <aside className="project-page-sidebar">
            <div className="project-page-meta-block" data-reveal>
              <div className="project-page-meta-label">Tech stack</div>
              <ul className="project-tech-list">
                {project.techStack.map(t => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>

            <div className="project-page-meta-block" data-reveal style={{ '--i': 1 } as CSSProperties}>
              <div className="project-page-meta-label">Links</div>
              <div className="project-links">
                {project.github && (
                  <a href={project.github} target="_blank" rel="noopener noreferrer" className="project-link">
                    GitHub →
                  </a>
                )}
                {project.live && (
                  <a href={project.live} target="_blank" rel="noopener noreferrer" className="project-link">
                    Live site →
                  </a>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
