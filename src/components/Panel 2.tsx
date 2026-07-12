import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { projects } from '../data/projects'
import { getAllPosts, getPostBySlug } from '../utils/postsFromMarkdown'
import { getBioMarkdown } from '../utils/bioFromMarkdown'
import { SKILL_LABEL, projectsForSkill } from '../data/graph'
import MarkdownRenderer from './MarkdownRenderer'
import {
  workExperience,
  education,
  otherExperience,
  awards,
  currents,
  playlists,
  interests,
} from '../data/profile'

// ─── Spotify now playing ──────────────────────────────────────────────────────

interface NowPlaying {
  isPlaying: boolean
  title?: string
  artist?: string
  albumArt?: string
  songUrl?: string
}

function useNowPlaying() {
  const [data, setData] = useState<NowPlaying>({ isPlaying: false })
  useEffect(() => {
    const poll = () =>
      fetch('/api/now-playing')
        .then(r => (r.ok ? r.json() : { isPlaying: false }))
        .then((d: NowPlaying) => setData(d))
        .catch(() => setData({ isPlaying: false }))
    poll()
    const id = setInterval(poll, 30_000)
    return () => clearInterval(id)
  }, [])
  return data
}

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.516 17.313a.75.75 0 0 1-1.032.25c-2.824-1.727-6.38-2.118-10.572-1.16a.75.75 0 0 1-.336-1.463c4.584-1.05 8.52-.598 11.69 1.34a.75.75 0 0 1 .25 1.033zm1.472-3.275a.937.937 0 0 1-1.29.31c-3.23-1.986-8.155-2.562-11.977-1.403a.938.938 0 1 1-.546-1.795c4.366-1.327 9.793-.683 13.503 1.598a.937.937 0 0 1 .31 1.29zm.127-3.41c-3.873-2.3-10.26-2.512-13.953-1.39a1.125 1.125 0 1 1-.652-2.152c4.244-1.287 11.3-1.038 15.756 1.608a1.125 1.125 0 1 1-1.151 1.934z" />
    </svg>
  )
}

function NowPlayingCard() {
  const np = useNowPlaying()
  return (
    <a
      className={`panel-spotify${np.isPlaying ? ' is-playing' : ''}`}
      href={np.songUrl ?? 'https://open.spotify.com'}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="panel-spotify-art">
        {np.albumArt ? <img src={np.albumArt} alt="album art" /> : <SpotifyIcon />}
      </div>
      <div className="panel-spotify-meta">
        {np.isPlaying ? (
          <>
            <span className="panel-spotify-title">{np.title}</span>
            <span className="panel-spotify-sub">{np.artist}</span>
          </>
        ) : (
          <>
            <span className="panel-spotify-title">Not playing right now</span>
            <span className="panel-spotify-sub">probably studying or sleeping</span>
          </>
        )}
      </div>
    </a>
  )
}

// ─── Shared bits ──────────────────────────────────────────────────────────────

function ExpList({ entries }: { entries: typeof workExperience }) {
  return (
    <div className="panel-timeline">
      {entries.map(e => (
        <div key={e.company + e.role} className="panel-tl-item">
          <span className="panel-tl-period">{e.period}</span>
          <div className="panel-exp">
            <div className="panel-exp-head">
              <span className="panel-exp-company">
                {e.company}
                {e.tag && <span className="panel-tag">{e.tag}</span>}
              </span>
            </div>
            <div className="panel-exp-role">{e.role}</div>
            <p className="panel-exp-details">{e.details}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function NodeLink({ route, children }: { route: string; children: React.ReactNode }) {
  // Panel-internal navigation goes through the same URL-driven selection.
  return (
    <Link to={route} className="panel-nodelink">
      {children}
    </Link>
  )
}

// ─── Views ────────────────────────────────────────────────────────────────────

function AboutView() {
  return (
    <>
      <div className="panel-kicker">hello!</div>
      <h2 className="panel-title">Nobel Suhendra</h2>
      <p className="panel-lede">
        Hey! I'm Nobel, a CS undergrad at Oxford, full-stack SWE and part-time app developer. I got
        super into competitive programming in high school and became a 2x NOI medalist. Ever since,
        I've been mostly self-taught in programming and all things building. I'm currently tinkering
        with a couple side projects and exploring AI &amp; quantum computing research.
      </p>
      <img src="/assets/profile.jpg" alt="Nobel Suhendra" className="panel-photo" />

      <h3 className="panel-h">right now</h3>
      <div className="panel-currents">
        {currents.map(c => (
          <div key={c.key} className="panel-current">
            <span className="panel-current-key">{c.key}</span>
            <span className="panel-current-val">{c.val}</span>
          </div>
        ))}
      </div>

      <h3 className="panel-h">listening to</h3>
      <NowPlayingCard />
      {playlists.map(p => (
        <a key={p.name} className="panel-playlist" href={p.url} target="_blank" rel="noopener noreferrer">
          <SpotifyIcon />
          <span>{p.name}</span>
          <span className="panel-index-meta">{p.mood}</span>
        </a>
      ))}

      <h3 className="panel-h">say hi</h3>
      <div className="panel-contact">
        <a href="mailto:nobel.suhendra@st-annes.ox.ac.uk">nobel.suhendra@st-annes.ox.ac.uk</a>
        <a href="tel:+447412967062">+44 7412 967 062</a>
        <a href="https://github.com/nobelsu" target="_blank" rel="noopener noreferrer">github.com/nobelsu ↗</a>
        <a href="https://linkedin.com/in/nobelsu" target="_blank" rel="noopener noreferrer">linkedin.com/in/nobelsu ↗</a>
      </div>

      <div className="panel-links">
        <NodeLink route="/experience">experience →</NodeLink>
        <NodeLink route="/me">this is me →</NodeLink>
      </div>
    </>
  )
}

const HIGHLIGHTS = ['Jane Street FTTP', '2x NOI medalist', 'IGCSE top in the world']

function ExperienceView() {
  return (
    <>
      <div className="panel-kicker">work</div>
      <h2 className="panel-title">What I've been up to</h2>
      <div className="panel-chips panel-highlights">
        {HIGHLIGHTS.map(h => (
          <span key={h} className="panel-chip panel-chip-accent">{h}</span>
        ))}
      </div>
      <h3 className="panel-h">Experience</h3>
      <ExpList entries={workExperience} />
      <div className="panel-links">
        <NodeLink route="/education">education →</NodeLink>
      </div>
      <h3 className="panel-h">Leadership</h3>
      <div className="panel-exp-list panel-exp-compact">
        {otherExperience.map(e => (
          <div key={e.company} className="panel-exp">
            <div className="panel-exp-head">
              <span className="panel-exp-company">{e.company}</span>
              <span className="panel-exp-period">{e.period}</span>
            </div>
            <div className="panel-exp-role">{e.role}</div>
          </div>
        ))}
      </div>
      <h3 className="panel-h">Awards</h3>
      <div className="panel-exp-list panel-exp-compact">
        {awards.map(a => (
          <div key={a.title} className="panel-exp">
            <div className="panel-exp-head">
              <span className="panel-exp-company">{a.title}</span>
              <span className="panel-exp-period">{a.year}</span>
            </div>
            <div className="panel-exp-role">{a.issuer}</div>
          </div>
        ))}
      </div>
    </>
  )
}

function EducationView() {
  return (
    <>
      <div className="panel-kicker">education</div>
      <h2 className="panel-title">Where I've studied</h2>
      <ExpList entries={education} />
      <div className="panel-links">
        <NodeLink route="/experience">work →</NodeLink>
      </div>
    </>
  )
}

function ProjectView({ slug }: { slug: string }) {
  const p = projects.find(x => x.slug === slug)
  if (!p) return <p className="panel-empty">Project not found.</p>
  return (
    <>
      <div className="panel-kicker">
        {p.type} · {p.year}
        {p.inProgress && <span className="panel-tag">in progress</span>}
      </div>
      <h2 className="panel-title">{p.title}</h2>
      <div className="panel-body">
        {p.description.split('\n\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      {p.techStack.length > 0 && (
        <>
          <h3 className="panel-h">Stack</h3>
          <div className="panel-chips">
            {p.techStack.map(t => (
              <span key={t} className="panel-chip">{t}</span>
            ))}
          </div>
        </>
      )}
      <div className="panel-links">
        {p.github && (
          <a href={p.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
        )}
        {p.live && (
          <a href={p.live} target="_blank" rel="noopener noreferrer">Live ↗</a>
        )}
      </div>
    </>
  )
}

function ProjectsHubView() {
  const byYear = (a: (typeof projects)[number], b: (typeof projects)[number]) =>
    parseInt(b.year) - parseInt(a.year)
  const featured = projects.filter(p => p.featured).sort(byYear)
  const archive = projects.filter(p => !p.featured).sort(byYear)
  return (
    <>
      <div className="panel-kicker">index</div>
      <h2 className="panel-title">Projects</h2>
      <h3 className="panel-h">Featured</h3>
      <div className="panel-index">
        {featured.map(p => (
          <NodeLink key={p.slug} route={`/projects/${p.slug}`}>
            <span className="panel-index-title">{p.title}</span>
            <span className="panel-index-meta">{p.type} · {p.year}</span>
            <span className="panel-index-summary">{p.description.split('\n')[0]}</span>
          </NodeLink>
        ))}
      </div>
      <h3 className="panel-h">Archive</h3>
      <div className="panel-index panel-index-compact">
        {archive.map(p => (
          <NodeLink key={p.slug} route={`/projects/${p.slug}`}>
            <span className="panel-index-title">{p.title}</span>
            <span className="panel-index-meta">{p.type} · {p.year}</span>
          </NodeLink>
        ))}
      </div>
    </>
  )
}

function SkillView({ skill }: { skill: string }) {
  const label = SKILL_LABEL[skill] ?? skill
  const related = projectsForSkill(skill).sort((a, b) => parseInt(b.year) - parseInt(a.year))
  return (
    <>
      <div className="panel-kicker">language · tool</div>
      <h2 className="panel-title">{label}</h2>
      <h3 className="panel-h">{related.length} project{related.length === 1 ? '' : 's'}</h3>
      {related.length === 0 ? (
        <p className="panel-empty">No projects tagged with {label} yet.</p>
      ) : (
        <div className="panel-index">
          {related.map(p => (
            <NodeLink key={p.slug} route={`/projects/${p.slug}`}>
              <span className="panel-index-title">{p.title}</span>
              <span className="panel-index-meta">{p.type} · {p.year}</span>
            </NodeLink>
          ))}
        </div>
      )}
    </>
  )
}

function PostView({ slug }: { slug: string }) {
  const post = getPostBySlug(slug)
  if (!post) return <p className="panel-empty">Post not found.</p>
  return (
    <>
      <div className="panel-kicker">{post.category} · {post.date}</div>
      <h2 className="panel-title">{post.title}</h2>
      <MarkdownRenderer markdown={post.content} className="panel-markdown" />
    </>
  )
}

function BlogHubView() {
  return (
    <>
      <div className="panel-kicker">index</div>
      <h2 className="panel-title">Writing</h2>
      <div className="panel-index">
        {getAllPosts().map(p => (
          <NodeLink key={p.slug} route={`/blog/${p.slug}`}>
            <span className="panel-index-title">{p.title}</span>
            <span className="panel-index-meta">{p.category} · {p.date}</span>
            {p.summary && <span className="panel-index-summary">{p.summary}</span>}
          </NodeLink>
        ))}
      </div>
    </>
  )
}

function MeView() {
  return (
    <>
      <div className="panel-kicker">on a real note</div>
      <h2 className="panel-title">This is Me</h2>

      <MarkdownRenderer markdown={getBioMarkdown()} className="panel-markdown panel-bio" />

      <h3 className="panel-h">into</h3>
      <div className="panel-interests">
        {interests.map(item => (
          <figure key={item.name} className="panel-interest">
            {item.image && <img src={item.image} alt={item.name} loading="lazy" decoding="async" />}
            <figcaption>
              <span className="panel-index-title">{item.name}</span>
              <span className="panel-index-meta">{item.note}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  )
}

// ─── Panel shell ──────────────────────────────────────────────────────────────

interface PanelProps {
  nodeId: string | null
  onClose: () => void
}

function viewFor(nodeId: string) {
  if (nodeId === 'nobel') return <AboutView />
  if (nodeId === 'hub:experience') return <ExperienceView />
  if (nodeId === 'hub:education') return <EducationView />
  if (nodeId === 'hub:projects') return <ProjectsHubView />
  if (nodeId === 'hub:blog') return <BlogHubView />
  if (nodeId === 'hub:me') return <MeView />
  if (nodeId.startsWith('project:')) return <ProjectView slug={nodeId.slice('project:'.length)} />
  if (nodeId.startsWith('post:')) return <PostView slug={nodeId.slice('post:'.length)} />
  if (nodeId.startsWith('skill:')) return <SkillView skill={nodeId.slice('skill:'.length)} />
  return null
}

export default function Panel({ nodeId, onClose }: PanelProps) {
  // Keep last content mounted during the slide-out transition.
  const [shown, setShown] = useState<string | null>(nodeId)
  if (nodeId && nodeId !== shown) setShown(nodeId)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const content = shown ? viewFor(shown) : null

  return (
    <aside className={`panel${nodeId ? ' is-open' : ''}`} aria-hidden={!nodeId}>
      <button className="panel-close" onClick={onClose} aria-label="Close panel">×</button>
      <div className="panel-scroll" key={shown ?? 'none'}>
        {content}
      </div>
    </aside>
  )
}
