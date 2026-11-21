# My Tamil Cinema — Stremio addon

This addon provides Tamil-language movie discovery through TMDB metadata. Version 1.3.0 includes these browse catalogs:

- All Tamil Movies
- Popular Tamil Movies
- New Tamil Movies
- Top Rated Tamil Movies
- Classic Tamil Movies (released through 2000)
- Search within the Tamil movie catalogs

The catalog is paginated and uses TMDB's Tamil original-language filter. Search results are also filtered to Tamil-original movies. TMDB provides movie metadata and posters, not playback streams.

## Enable the Tamil catalog

1. Create a free TMDB account and request an API key: https://www.themoviedb.org/settings/api
2. In Render, open the `my-tamil-cinema-addon` service.
3. Go to **Environment** and add `TMDB_API_KEY` with your TMDB API v3 key.
4. Save and let Render redeploy.

## Configure authorized playback

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

The key must exactly match the movie ID used by this addon (for TMDB items, `tmdb:<TMDB movie ID>`). `fileIdx` is optional. Only valid 40-character hexadecimal info hashes are accepted.

Optional tracker list:

- Key: `TORRENT_TRACKERS`
- Value: comma-separated HTTP or UDP tracker URLs for authorized torrents you configure.

Trackers can help discover peers, but they cannot create seeders, repair an unavailable torrent, or guarantee playback/no buffering. Only configure torrents and streams you own or are explicitly authorized to distribute.

## Install in Stremio

After Render has deployed the latest GitHub commit, install or refresh this HTTPS manifest URL in Stremio:

`https://my-tamil-cinema-addon.onrender.com/manifest.json`

## Notes

- TMDB supplies metadata and images, not video streams.
- A movie appearing in the catalog does not mean a playable stream is available.
- This addon does not host/cache video data. Reliable playback needs a licensed stream or authorized media source.
