import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load all .env vars (no prefix filter) — only used server-side, never sent to the client bundle
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'spotify-now-playing',
        configureServer(server) {
          server.middlewares.use('/api/now-playing', async (_req, res) => {
            const CLIENT_ID     = env.VITE_SPOTIFY_CLIENT_ID
            const CLIENT_SECRET = env.VITE_SPOTIFY_CLIENT_SECRET
            const REFRESH_TOKEN = env.VITE_SPOTIFY_REFRESH_TOKEN

            if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 503
              res.end(JSON.stringify({ isPlaying: false }))
              return
            }

            try {
              // Exchange refresh token for a short-lived access token
              const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  Authorization: `Basic ${Buffer.from(
                    `${CLIENT_ID}:${CLIENT_SECRET}`
                  ).toString('base64')}`,
                },
                body: new URLSearchParams({
                  grant_type: 'refresh_token',
                  refresh_token: REFRESH_TOKEN,
                }),
              })

              const { access_token } = await tokenRes.json() as { access_token: string }

              // Fetch currently-playing track
              const spotifyRes = await fetch(
                'https://api.spotify.com/v1/me/player/currently-playing',
                { headers: { Authorization: `Bearer ${access_token}` } }
              )

              // 204 = player is idle, >400 = error
              if (spotifyRes.status === 204 || spotifyRes.status > 400) {
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ isPlaying: false }))
                return
              }

              const song = await spotifyRes.json() as {
                is_playing: boolean
                item: {
                  name: string
                  artists: { name: string }[]
                  album: { images: { url: string }[] }
                  external_urls: { spotify: string }
                }
              }

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                isPlaying: song.is_playing,
                title:     song.item.name,
                artist:    song.item.artists.map(a => a.name).join(', '),
                albumArt:  song.item.album.images[0]?.url,
                songUrl:   song.item.external_urls.spotify,
              }))
            } catch {
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 500
              res.end(JSON.stringify({ isPlaying: false }))
            }
          })
        },
      },
    ],
  }
})
