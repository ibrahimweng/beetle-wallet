# Beetle Glyphs

A parametric icon library and editor for the Beetle wallet. Every icon is centrelines on a 24 grid with every radius and gap in stroke units, so six sliders re-derive the whole library at once. All 1,854 Lucide icons (1.48.0, ISC) sit alongside the app's own 95 glyphs and 127 app scenarios mapped to icons.

Static site. No build step, no server code, no framework.

## Deploy on Vercel

1. Import the `ibrahimweng/beetle-wallet` repository in Vercel.
2. Set **Root Directory** to `glyphs`.
3. Framework Preset **Other**. Leave Build Command and Output Directory empty.
4. Deploy. `vercel.json` in this folder sets clean URLs and cache headers.

The folder also ships inside the main app's deploy: `node build.js` at the repository root copies it into `public/glyphs/`, so the existing project serves it at `/glyphs/`.

Run locally with any static server, for example `npm start` (Python's `http.server` on port 4173) or `npx serve .`.

## Structure

The layout follows shadcn/ui: tokens in one stylesheet, one file per ui component, app components composed from them, and a `lib` folder for everything that is not a component.

```
glyphs/
  index.html                  the shell; loads the vendored libraries and src/app.js
  vercel.json                 clean URLs and cache headers
  package.json                name and a local start script
  data/icons.json             the library (1.5 MB, served compressed)
  vendor/clipper.js           polygon offsetting and booleans (sprite and font exports)
  vendor/opentype.min.js      TrueType writer (icon font export)
  src/
    app.js                    bootstrap: theme, shell, command palette, mobile sheets
    styles/globals.css        HSL tokens (:root and .dark), base styles, component classes
    lib/
      engine.js               the geometry engine (ES module)
      library.js              loading, search, edits applied on top of the library
      store.js                one observable store with persistence
      export.js               SVG, sprite, font and JSON exports; save through claude.ai or a plain link
      utils.js                h(), cn(), debounce, the interface's own small icons
    components/
      ui/                     button, badge, input + select, slider, toggle-group, tabs, card + separator + kbd, sheet, code-block, command
      app/                    topbar, sidebar, icon-grid, inspector, editor, params, export-panel
```

## The engine

- **Primitives.** `poly` (points with per-vertex corner kinds: none, soft, box, box:k, fillet, or a number), `arc` (centre, radii, angles), `seq`, `quad`, and `path` (SVG path data).
- **Corners.** Straight joins get true circular fillets from the corner fillet slider. Quarter-circle corners in Lucide paths were recognised at import and follow the box corner slider.
- **Solid weight.** Closed shapes fill and inflate by S with round joins. A part sitting inside a closed shape becomes a cut of S. Parts marked `cut`, `knock` or `flat` keep that role in both weights. Any part can be set by hand in the editor.
- **Choke** offsets every edge geometrically and is baked into exports. **Goo** is a blur-then-threshold filter for preview and SVG.
- **Exports.** SVG keeps curves. Sprite and font flatten every primitive, offset it by S/2 with round joins and caps through Clipper, union and cut it. The font maps results to U+E000 upward in result order.

## Regenerating the library

`build-library.mjs` (kept with the engine's tooling) reads Lucide's `icon-nodes.json`, `tags.json` and the category map, converts every element into engine primitives, imports the app's glyphs from `src/icons.js` at the repository root, validates every icon, and writes `data/icons.json`.

## Licenses

Lucide icons © Lucide Contributors, ISC license (`LICENSE-lucide.txt`). Beetle glyphs belong to the Beetle wallet design.
