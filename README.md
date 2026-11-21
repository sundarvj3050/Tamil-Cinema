# My Tamil Cinema — Stremio addon

This addon provides an **All-time Tamil Movies** discovery catalog using TMDB, plus one legal demo video, Big Buck Bunny.

It supports Stremio BitTorrent stream objects for torrents that you own or are explicitly authorized to distribute. It does not search for, scrape, or supply unauthorized copyrighted movie torrents.

## Enable the Tamil catalog

1. Create a free TMDB account and request an API key: https://www.themoviedb.org/settings/api
2. In Render, open the `my-tamil-cinema-addon` service.
3. Go to **Environment** and add `TMDB_API_KEY` with your TMDB API v3 key.
4. Save and let Render redeploy.

## Configure authorized torrent playback

In Render → service → **Environment**, add:

- Key: `AUTHORIZED_TORRENTS_JSON`
- Value: a JSON object mapping Stremio movie IDs to authorized torrent info hashes.

Example (replace the sample hash with a real 40-character SHA-1 info hash for a video you own or have permission to distribute):

```json
{
  "tmdb:12345": {
    "infoHash": "0123456789abcdef0123456789abcdef01234567",
    "fileIdx": 0,
    "title": "Authorized Tamil film"
  }
}
```

The key must exactly match the movie ID used by this addon (for TMDB items, `tmdb:<TMDB movie ID>`). `fileIdx` is optional; without it, Stremio selects the largest file in the torrent. Only valid 40-character hexadecimal info hashes are accepted.

Optional tracker list:

- Key: `TORRENT_TRACKERS`
- Value: comma-separated HTTP or UDP tracker URLs for the authorized torrents you configure.

The addon passes these as additional peer-discovery sources to Stremio. Trackers can help discover peers, but they cannot create seeders, repair an unavailable torrent, or guarantee playback/no buffering. Peer availability, client/network support, and upload speed determine whether a torrent plays smoothly. Do not use DHT/tracker discovery where a private tracker prohibits it.

After saving environment variables, wait for Render to redeploy, then refresh/reinstall the manifest in Stremio:
`https://YOUR-SERVICE.onrender.com/manifest.json`

## Run locally

Requires Node.js 18+.

```bash
npm install
TMDB_API_KEY=your_key npm start
```

## Deploy on Render

The included `render.yaml` defines the web service. Connect this repository to Render as a Blueprint. After deployment, install the HTTPS manifest URL in Stremio.

## Notes

- TMDB supplies metadata and images, not video streams.
- Only add torrents and streams you own or are explicitly authorized to distribute.
- A magnet/info hash alone does not guarantee that any peers are online or that a video can stream without buffering.
- This addon does not host/cache torrent data. For reliable playback of older authorized films, use a properly licensed origin or your own authorized media server/CDN.
