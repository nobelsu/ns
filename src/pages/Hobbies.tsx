import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { getBioThreeParts } from '../utils/bioFromMarkdown'
import japaneseImg from '../assets/japanese.jpg'
import cpImg from '../assets/cp.JPG'
import sudokuImg from '../assets/sudoku.jpg'
import bakingImg from '../assets/baking.jpg'
import fencingImg from '../assets/fencing.jpg'
import questImg from '../assets/quest.JPG'

// ─── Spotify ──────────────────────────────────────────────────────────────────

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
        .then(r => r.ok ? r.json() : { isPlaying: false })
        .then((d: NowPlaying) => setData(d))
        .catch(() => setData({ isPlaying: false }))
    poll()
    const id = setInterval(poll, 30_000)
    return () => clearInterval(id)
  }, [])
  return data
}

function NowPlayingCard() {
  const np = useNowPlaying()

  return (
    <div className="me-spotify-block" data-reveal style={{ '--i': 1 } as CSSProperties}>
      <div className="me-block-label">listening to</div>
      <a
        className={`me-spotify-card${np.isPlaying ? ' is-playing' : ''}`}
        href={np.songUrl ?? 'https://open.spotify.com'}
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className="me-spotify-art">
          {np.albumArt
            ? <img src={np.albumArt} alt="album art" />
            : (
              <div className="me-spotify-art-empty">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.516 17.313a.75.75 0 0 1-1.032.25c-2.824-1.727-6.38-2.118-10.572-1.16a.75.75 0 0 1-.336-1.463c4.584-1.05 8.52-.598 11.69 1.34a.75.75 0 0 1 .25 1.033zm1.472-3.275a.937.937 0 0 1-1.29.31c-3.23-1.986-8.155-2.562-11.977-1.403a.938.938 0 1 1-.546-1.795c4.366-1.327 9.793-.683 13.503 1.598a.937.937 0 0 1 .31 1.29zm.127-3.41c-3.873-2.3-10.26-2.512-13.953-1.39a1.125 1.125 0 1 1-.652-2.152c4.244-1.287 11.3-1.038 15.756 1.608a1.125 1.125 0 1 1-1.151 1.934z"/>
                </svg>
              </div>
            )
          }
        </div>
        <div className="me-spotify-meta">
          {np.isPlaying ? (
            <>
              <span className="me-spotify-title">{np.title}</span>
              <span className="me-spotify-artist">{np.artist}</span>
              <div className="me-spotify-bars">
                <span /><span /><span /><span />
              </div>
            </>
          ) : (
            <>
              <span className="me-spotify-title me-spotify-offline">Not playing right now</span>
              <span className="me-spotify-artist">probably studying or sleeping</span>
            </>
          )}
        </div>
      </a>
    </div>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const { intro: bioIntro, middle: bioMiddle, tail: bioTail } = getBioThreeParts()

let bioTailStatic = ''
let bioTailTyped = bioTail

if (bioTail) {
  const marker = '\n---'
  const idx = bioTail.indexOf(marker)
  if (idx !== -1) {
    bioTailStatic = bioTail.slice(0, idx).trim()
    bioTailTyped = bioTail.slice(idx + marker.length).trim()
  }
}

const currents = [
  { key: 'reading',   val: 'Butter by Asako Yuzuki' },
  { key: 'building',  val: 'Ruby, a "game-ified" screen-time solution' },
  { key: 'thinking',    val: 'Probs about some stupid AI "what ifs"' },
  { key: 'playing',   val: 'Badminton! My toes hurt.' },
]

const playlists = [
  { name: 'k/j', url: 'https://open.spotify.com/playlist/6UfkzSd6XxN1tGawUX64Nw', mood: '202 tracks' },
]

// image: drop a file into /public (e.g. /public/reading.jpg) and set image: '/reading.jpg'
// Leave image as '' to show a placeholder box instead.
const interests = [
  {
    name: 'Japanese literature',
    note: 'Murakami numba one',
    image: japaneseImg, // e.g. '/images/books.jpg'
  },
  {
    name: 'Competitive programming',
    note: 'Gonna be on the CF grind this summer',
    image: cpImg, // e.g. '/images/comp-prog.jpg'
  },
  {
    name: 'Sudoku',
    note: "LOWKEY meditative",
    image: sudokuImg, // e.g. '/images/sudoku.jpg'
  },
  {
    name: 'Baking',
    note: "Specifically baguettes. (I promise I'm learning!!)",
    image: bakingImg, // e.g. '/images/baguette.jpg'
  },
  {
    name: 'Fencing',
    note: 'Might overtake badminton as my fav sport',
    image: fencingImg, // e.g. '/images/chess.jpg'
  },
  {
    name: 'Side-quests??',
    note: "One day I'll finish the storybook. One day...",
    image: questImg, // e.g. '/images/storybook.jpg'
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Hobbies() {
  const [typedMiddleChars, setTypedMiddleChars] = useState(0)
  const [typedTailChars, setTypedTailChars] = useState(0)
  const bioMiddleRef = useRef<HTMLDivElement>(null)
  const bioTailRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => {
      if (bioMiddle && bioMiddleRef.current) {
        const rect = bioMiddleRef.current.getBoundingClientRect()
        const scrollable = bioMiddleRef.current.offsetHeight - window.innerHeight
        if (scrollable <= 0) {
          setTypedMiddleChars(bioMiddle.length)
        } else {
          const raw = Math.max(0, Math.min(1, -rect.top / scrollable))
          const eased = Math.pow(raw, 1.8)
          setTypedMiddleChars(Math.round(eased * bioMiddle.length))
        }
      }

      if (bioTailTyped && bioTailRef.current) {
        const rect = bioTailRef.current.getBoundingClientRect()
        const scrollable = bioTailRef.current.offsetHeight - window.innerHeight
        if (scrollable <= 0) {
          setTypedTailChars(bioTailTyped.length)
        } else {
          const raw = Math.max(0, Math.min(1, -rect.top / scrollable))
          const eased = Math.pow(raw, 1.8)
          setTypedTailChars(Math.round(eased * bioTailTyped.length))
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Alternate bio photos left/right regardless of extra text blocks
  useEffect(() => {
    const containers = document.querySelectorAll<HTMLElement>('.me-bio-markdown')

    containers.forEach(container => {
      const imgs = Array.from(container.querySelectorAll<HTMLImageElement>('img'))
      let photoIndex = 0

      imgs.forEach(img => {
        const imgParagraph = img.closest('p')
        if (!imgParagraph) return

        const captionParagraph = imgParagraph.nextElementSibling instanceof HTMLParagraphElement
          ? imgParagraph.nextElementSibling
          : null

        imgParagraph.classList.add('me-bio-photo')
        captionParagraph?.classList.add('me-bio-photo-caption')

        if (photoIndex % 2 === 0) {
          // First, third, ... image: image on the right, text on the left
          imgParagraph.classList.add('me-bio-photo-right')
          captionParagraph?.classList.add('me-bio-photo-left-text')
        } else {
          // Second, fourth, ... image: image on the left, text on the right
          imgParagraph.classList.add('me-bio-photo-left')
          captionParagraph?.classList.add('me-bio-photo-right-text')
        }

        photoIndex += 1
      })
    })
  }, [])

  return (
    <div className="page">
      <section className="me-section">
        <div className="section-label" data-reveal>On a real note</div>

        {/* Bio */}
        <div className="me-bio">
          <div data-reveal style={{ '--i': 0 } as CSSProperties}>
            <MarkdownRenderer markdown={bioIntro} className="me-bio-markdown" />
          </div>
          {bioMiddle && (
            <div ref={bioMiddleRef} className="me-bio-rest-scroll">
              <div className="me-bio-rest-sticky">
                <MarkdownRenderer
                  className="me-bio-markdown"
                  markdown={
                    typedMiddleChars > 0
                      ? bioMiddle.slice(0, typedMiddleChars) +
                        (typedMiddleChars < bioMiddle.length ? '▌' : '')
                      : '\u200b'
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Right now + Spotify + playlists */}
        <div className="me-top-grid">
          <div className="me-currents" data-reveal style={{ '--i': 0 } as CSSProperties}>
            <div className="me-block-label">right now</div>
            <div className="me-currents-list">
              {currents.map(c => (
                <div key={c.key} className="me-current-row">
                  <span className="me-current-key">{c.key}</span>
                  <span className="me-current-val">{c.val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="me-right-col">
            <NowPlayingCard />
            <div className="me-playlists" data-reveal style={{ '--i': 2 } as CSSProperties}>
              <div className="me-block-label">my fav playlist</div>
              <div className="me-playlist-grid">
                {playlists.map(p => (
                  <a
                    key={p.name}
                    className="me-playlist-item"
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="me-playlist-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.516 17.313a.75.75 0 0 1-1.032.25c-2.824-1.727-6.38-2.118-10.572-1.16a.75.75 0 0 1-.336-1.463c4.584-1.05 8.52-.598 11.69 1.34a.75.75 0 0 1 .25 1.033zm1.472-3.275a.937.937 0 0 1-1.29.31c-3.23-1.986-8.155-2.562-11.977-1.403a.938.938 0 1 1-.546-1.795c4.366-1.327 9.793-.683 13.503 1.598a.937.937 0 0 1 .31 1.29zm.127-3.41c-3.873-2.3-10.26-2.512-13.953-1.39a1.125 1.125 0 1 1-.652-2.152c4.244-1.287 11.3-1.038 15.756 1.608a1.125 1.125 0 1 1-1.151 1.934z"/>
                      </svg>
                    </div>
                    <div className="me-playlist-info">
                      <span className="me-playlist-name">{p.name}</span>
                      <span className="me-playlist-mood">{p.mood}</span>
                    </div>
                    <span className="me-playlist-arrow">→</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Static \"sneak peek\" section from tail before the third --- */}
        {bioTailStatic && (
          <div className="me-bio">
            <div data-reveal style={{ '--i': 1 } as CSSProperties}>
              <MarkdownRenderer markdown={bioTailStatic} className="me-bio-markdown" />
            </div>
          </div>
        )}

        {/* Bio tail below grid */}
        {bioTailTyped && (
          <div className="me-bio me-bio-tail">
            <div ref={bioTailRef} className="me-bio-rest-scroll">
              <div className="me-bio-rest-sticky">
                <MarkdownRenderer
                  className="me-bio-markdown"
                  markdown={
                    typedTailChars > 0
                      ? bioTailTyped.slice(0, typedTailChars) +
                        (typedTailChars < bioTailTyped.length ? '▌' : '')
                      : '\u200b'
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Interests with images */}
        <div className="me-block-label" data-reveal style={{ '--i': 0 } as CSSProperties}>into</div>
        <div className="me-interests-grid">
          {interests.map((item, i) => (
            <div
              key={item.name}
              className={`me-interest-card${i % 2 === 1 ? ' me-interest-card-reverse' : ''}`}
              data-reveal
              style={{ '--i': i } as CSSProperties}
            >
              <div className="me-interest-img">
                {item.image
                  ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                    />
                    )
                  : <span className="me-interest-img-placeholder" />
                }
              </div>
              <div className="me-interest-body">
                <span className="me-interest-name">{item.name}</span>
                <span className="me-interest-note">{item.note}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
