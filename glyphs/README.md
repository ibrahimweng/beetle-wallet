# Beetle Glyph Engine

A static site: one page, no build step, no server code.

- `index.html` — the generator. Sliders for stroke, box corner, corner fillet, gap, choke and goo; outline and solid weights; a point editor; exports.
- `engine.js` — the geometry engine (primitives, fillets, path parsing, Clipper outlines, opentype font builder).
- `icons.json` — the library: every Lucide icon (1.48.0, ISC license, see `LICENSE-lucide.txt`), the app's 95 glyphs read from `src/icons.js`, and 127 app scenarios mapped to icons.
- `clipper.js`, `opentype.min.js` — vendored so the page has no CDN dependency.

## Deploying on Vercel

Either of these works:

1. **Part of the main deploy.** `node build.js` copies this folder into `public/glyphs/`, so the existing project serves it at `/glyphs/`.
2. **Its own project.** Create a Vercel project from this repository, set the Root Directory to `glyphs`, Framework Preset to *Other*, and leave the build command empty. Vercel serves the folder as static files.

`icons.json` is 1.5 MB uncompressed; Vercel serves it with Brotli, which brings it to about 250 KB.

## Regenerating the library

The converter lives with the engine's build tooling (`build-library.mjs`): it reads Lucide's `icon-nodes.json`, `tags.json` and the category map, converts every element into engine primitives (quarter-circle corners become slider-driven corners), imports `src/icons.js`, validates every icon, and writes `icons.json`.
