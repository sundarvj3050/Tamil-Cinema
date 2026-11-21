const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

const manifest = {
  id: "org.mytamilcinema.catalog",
  version: "1.1.0",
  name: "My Tamil Cinema",
  description: "All-time Tamil movie discovery catalog with posters and details. Playback is provided only for separately authorized streams.",
  resources: ["catalog", "meta", "stream"],
  types: ["movie"],
  idPrefixes: ["tmdb:", "tt"],
  catalogs: [
    { type: "movie", id: "all_tamil_movies", name: "All-time Tamil Movies" },
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

async function tmdb(path, params = {}) {
  if (!TMDB_API_KEY) throw new Error("TMDB_API_KEY is not configured");
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
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

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ type, id, extra }) => {
  if (type !== "movie") return { metas: [] };

  if (id === "legal_demo") return { metas: [demoMovie] };
  if (id !== "all_tamil_movies") return { metas: [] };

  try {
    const skip = Math.max(0, Number(extra?.skip || 0));
    const page = Math.floor(skip / 20) + 1;
    const data = await tmdb("/discover/movie", {
      with_original_language: "ta",
      include_adult: false,
      sort_by: "popularity.desc",
      language: "ta-IN",
      page
    });
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
  if (type !== "movie" || id !== demoMovie.id) return { streams: [] };
  return {
    streams: [{
      title: "Open demo video",
      url: "https://distribution.bbb3d.renderfarming.net/video/mp4/bbb_sunflower_1080p_30fps_normal.mp4",
      behaviorHints: { notWebReady: false }
    }]
  };
});

const port = Number(process.env.PORT || 7000);
serveHTTP(builder.getInterface(), { port });
console.log(`My Tamil Cinema addon listening on port ${port}`);
if (!TMDB_API_KEY) console.warn("Set TMDB_API_KEY in Render Environment to enable the Tamil movie catalog.");
