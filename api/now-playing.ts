const CLIENT_ID = process.env.VITE_SPOTIFY_CLIENT_ID
const CLIENT_SECRET = process.env.VITE_SPOTIFY_CLIENT_SECRET
const REFRESH_TOKEN = process.env.VITE_SPOTIFY_REFRESH_TOKEN

export default async function handler(_req: any, res: any) {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    res.setHeader('Content-Type', 'application/json')
    res.statusCode = 503
    res.end(JSON.stringify({ isPlaying: false }))
    return
  }

  try {
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

    if (!tokenRes.ok) {
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 500
      res.end(JSON.stringify({ isPlaying: false }))
      return
    }

    const { access_token } = (await tokenRes.json()) as { access_token: string }

    const spotifyRes = await fetch(
      'https://api.spotify.com/v1/me/player/currently-playing',
      { headers: { Authorization: `Bearer ${access_token}` } }
    )

    if (spotifyRes.status === 204 || spotifyRes.status > 400) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ isPlaying: false }))
      return
    }

    const song = (await spotifyRes.json()) as {
      is_playing: boolean
      item: {
        name: string
        artists: { name: string }[]
        album: { images: { url: string }[] }
        external_urls: { spotify: string }
      }
    }

    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        isPlaying: song.is_playing,
        title: song.item.name,
        artist: song.item.artists.map(a => a.name).join(', '),
        albumArt: song.item.album.images[0]?.url,
        songUrl: song.item.external_urls.spotify,
      })
    )
  } catch {
    res.setHeader('Content-Type', 'application/json')
    res.statusCode = 500
    res.end(JSON.stringify({ isPlaying: false }))
  }
}

