const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

const manifest = {
  id: "org.mytamilcinema.catalog",
  version: "1.3.0",
  name: "My Tamil Cinema",
  description: "Browse and search Tamil-language movies across years, with playback only for separately authorized sources.",
  resources: ["catalog", "meta", "stream"],
  types: ["movie"],
  idPrefixes: ["tmdb:", "tt"],
  catalogs: [
    { type: "movie", id: "all_tamil_movies", name: "All Tamil Movies", extra: [{ name: "search", isRequired: false }] },
    { type: "movie", id: "popular_tamil_movies", name: "Popular Tamil Movies", extra: [{ name: "search", isRequired: false }] },
    { type: "movie", id: "new_tamil_movies", name: "New Tamil Movies", extra: [{ name: "search", isRequired: false }] },
    { type: "movie", id: "top_rated_tamil_movies", name: "Top Rated Tamil Movies", extra: [{ name: "search", isRequired: false }] },
    { type: "movie", id: "classic_tamil_movies", name: "Classic Tamil Movies", extra: [{ name: "search", isRequired: false }] },
    { type: "movie", id: "legal_demo", name: "Legal Demo Movies" }
  ]
};

const demoMovie = {
  id: "tt1254207",
  type: "movie",
  name: "Big Buck Bunny",
  releaseInfo: "2008",
  description: "An open animated short film commonly used for video playback demos.",
  poster: "https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217",
  genres: ["Animation", "Comedy"]
};

const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Optional JSON object keyed by Stremio movie ID. Add only torrents you own
// or are explicitly authorized to distribute.
function loadAuthorizedTorrents() {
  if (!process.env.AUTHORIZED_TORRENTS_JSON) return {};
  try {
    const parsed = JSON.parse(process.env.AUTHORIZED_TORRENTS_JSON);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Expected a JSON object");
    }
    const valid = {};
    for (const [id, item] of Object.entries(parsed)) {
      if (!/^(tmdb:\d+|tt\d+)$/.test(id) || !item || typeof item !== "object") continue;
      const infoHash = String(item.infoHash || "").replace(/^urn:btih:/i, "");
      if (!/^[a-fA-F0-9]{40}$/.test(infoHash)) continue;
      const entry = { infoHash: infoHash.toLowerCase() };
      if (Number.isInteger(item.fileIdx) && item.fileIdx >= 0) entry.fileIdx = item.fileIdx;
      if (typeof item.title === "string" && item.title.trim()) entry.title = item.title.trim().slice(0, 100);
      valid[id] = entry;
    }
    return valid;
  } catch (error) {
    console.error("AUTHORIZED_TORRENTS_JSON is invalid:", error.message);
    return {};
  }
}

const authorizedTorrents = loadAuthorizedTorrents();
const torrentTrackers = (process.env.TORRENT_TRACKERS || "")
  .split(",")
  .map((value) => value.trim())
  .filter((value) => /^https?:\/\//i.test(value) || /^udp:\/\//i.test(value))
  .map((value) => `tracker:${value}`);

async function tmdb(path, params = {}) {
  if (!TMDB_API_KEY) throw new Error("TMDB_API_KEY is not configured");
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`TMDB API returned HTTP ${response.status}`);
  return response.json();
}

function toMeta(movie) {
  return {
    id: `tmdb:${movie.id}`,
    type: "movie",
    name: movie.title || movie.original_title || "Untitled",
    poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
    background: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : undefined,
    description: movie.overview || undefined,
    releaseInfo: movie.release_date ? movie.release_date.slice(0, 4) : undefined,
    genres: movie.genres ? movie.genres.map((genre) => genre.name) : undefined,
    imdbRating: movie.vote_average ? movie.vote_average.toFixed(1) : undefined
  };
}

const catalogSettings = {
  all_tamil_movies: { sort_by: "popularity.desc" },
  popular_tamil_movies: { sort_by: "popularity.desc" },
  new_tamil_movies: { sort_by: "primary_release_date.desc", "primary_release_date.lte": "2099-12-31" },
  top_rated_tamil_movies: { sort_by: "vote_average.desc", "vote_count.gte": 20 },
  classic_tamil_movies: { sort_by: "popularity.desc", "primary_release_date.lte": "2000-12-31" }
};

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ type, id, extra }) => {
  if (type !== "movie") return { metas: [] };
  if (id === "legal_demo") return { metas: [demoMovie] };
  const settings = catalogSettings[id];
  if (!settings) return { metas: [] };

  try {
    const skip = Math.max(0, Number(extra?.skip || 0));
    const page = Math.floor(skip / 20) + 1;
    const search = String(extra?.search || "").trim();
    let data;
    if (search) {
      data = await tmdb("/search/movie", {
        query: search,
        include_adult: false,
        language: "ta-IN",
        page
      });
      data.results = (data.results || []).filter((movie) => movie.original_language === "ta");
    } else {
      data = await tmdb("/discover/movie", {
        with_original_language: "ta",
        include_adult: false,
        language: "ta-IN",
        page,
        ...settings
      });
    }
    return { metas: (data.results || []).map(toMeta) };
  } catch (error) {
    console.error("Tamil catalog error:", error.message);
    return { metas: [] };
  }
});

builder.defineMetaHandler(async ({ type, id }) => {
  if (type !== "movie") return { meta: null };
  if (id === demoMovie.id) return { meta: demoMovie };
  const match = /^tmdb:(\d+)$/.exec(id || "");
  if (!match) return { meta: null };

  try {
    const movie = await tmdb(`/movie/${match[1]}`, { language: "ta-IN" });
    return { meta: toMeta(movie) };
  } catch (error) {
    console.error("Tamil movie metadata error:", error.message);
    return { meta: null };
  }
});

builder.defineStreamHandler(async ({ type, id }) => {
  if (type !== "movie") return { streams: [] };
  if (id === demoMovie.id) {
    return {
      streams: [{
        title: "Open demo video",
        url: "https://distribution.bbb3d.renderfarming.net/video/mp4/bbb_sunflower_1080p_30fps_normal.mp4",
        behaviorHints: { notWebReady: false }
      }]
    };
  }

  const torrent = authorizedTorrents[id];
  if (!torrent) return { streams: [] };
  return {
    streams: [{
      name: "Authorized torrent",
      title: torrent.title || "Authorized torrent • peer discovery",
      infoHash: torrent.infoHash,
      ...(torrent.fileIdx !== undefined ? { fileIdx: torrent.fileIdx } : {}),
      ...(torrentTrackers.length ? { sources: torrentTrackers } : {})
    }]
  };
});

const port = Number(process.env.PORT || 7000);
serveHTTP(builder.getInterface(), { port });
console.log(`My Tamil Cinema addon listening on port ${port}`);
console.log(`Loaded ${Object.keys(authorizedTorrents).length} authorized torrent mapping(s).`);
if (!TMDB_API_KEY) console.warn("Set TMDB_API_KEY in Render Environment to enable the Tamil movie catalog.");
