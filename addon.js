const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

const manifest = {
  id: "org.mytamilcinema.legal",
  version: "1.0.0",
  name: "My Tamil Cinema (Legal Demo)",
  description: "A starter catalog with legally distributable demo video content.",
  resources: ["catalog", "meta", "stream"],
  types: ["movie"],
  idPrefixes: ["tt"],
  catalogs: [{ type: "movie", id: "legal_demo", name: "Legal Demo Movies" }]
};

const demoMovie = {
  id: "tt1254207", type: "movie", name: "Big Buck Bunny", releaseInfo: "2008",
  description: "An open animated short film commonly used for video playback demos.",
  poster: "https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217",
  genres: ["Animation", "Comedy"]
};

const builder = new addonBuilder(manifest);
builder.defineCatalogHandler(async ({ type, id }) => {
  if (type !== "movie" || id !== "legal_demo") return { metas: [] };
  return { metas: [demoMovie] };
});
builder.defineMetaHandler(async ({ type, id }) => {
  if (type === "movie" && id === demoMovie.id) return { meta: demoMovie };
  return { meta: null };
});
builder.defineStreamHandler(async ({ type, id }) => {
  if (type !== "movie" || id !== demoMovie.id) return { streams: [] };
  return { streams: [{ title: "Open demo video", url: "https://distribution.bbb3d.renderfarming.net/video/mp4/bbb_sunflower_1080p_30fps_normal.mp4", behaviorHints: { notWebReady: false } }] };
});

const port = Number(process.env.PORT || 7000);
serveHTTP(builder.getInterface(), { port });
console.log(`My Tamil Cinema addon listening on port ${port}`);
