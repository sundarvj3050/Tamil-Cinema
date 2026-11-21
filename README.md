# My Tamil Cinema — Stremio addon

This addon provides an **All-time Tamil Movies** discovery catalog (posters, titles, release years, descriptions and genres) using The Movie Database (TMDB), plus one legal demo video, Big Buck Bunny.

It does **not** scrape Moviesda or provide unauthorized movie streams. The Tamil catalog is for movie discovery; playback is available only where you have a separately authorized stream source.

## Enable the Tamil catalog

1. Create a free TMDB account and request an API key for your personal project: https://www.themoviedb.org/settings/api
2. In the Render dashboard, open the `my-tamil-cinema-addon` service.
3. Go to **Environment** and add:
   - Key: `TMDB_API_KEY`
   - Value: your TMDB API v3 key
4. Save changes and let Render redeploy the service.
5. Open `https://YOUR-SERVICE.onrender.com/manifest.json` and reinstall/refresh the addon in Stremio.

The catalog filters movies by original language Tamil (`ta`) and sorts them by popularity. TMDB metadata/images are subject to TMDB's terms and attribution requirements. This product uses the TMDB API but is not endorsed or certified by TMDB. See https://www.themoviedb.org/documentation/api/terms-of-use.

## Run locally

Requires Node.js 18+.

```bash
npm install
TMDB_API_KEY=your_key npm start
```

Then open `http://127.0.0.1:7000/manifest.json`.

## Deploy on Render

The included `render.yaml` defines the web service. Connect this repository to Render as a Blueprint. After deployment, install the HTTPS manifest URL in Stremio.

## Playback

Only the Big Buck Bunny sample has a stream configured. Do not add or distribute copyrighted movie streams unless you own them or have permission to distribute them.
