# Beetle Glyphs

A parametric icon library and editor for the Beetle wallet. Every icon is drawn on a 24 grid with every radius and gap in stroke units, so the sliders re-derive the whole library at once. There are four styles (stroke, two-tone, duotone and fill), each with rounded or sharp corners. The library holds:

- the four-style set, 1,366 icons drawn by their designers in all eight versions;
- a core set of 1,854 general icons;
- the app's own 73 glyphs and 12 parametric icons;
- 127 app scenarios mapped to icons.

Static site. No build step, no server code, no framework.

## Deploy on Vercel

1. Import the `ibrahimweng/beetle-wallet` repository in Vercel.
2. Set **Root Directory** to `glyphs`.
3. Framework Preset **Other**. Leave Build Command and Output Directory empty.
4. Deploy. `vercel.json` in this folder sets clean URLs and cache headers.

The folder also ships inside the main app's deploy: `node build.js` at the repository root copies it into `public/glyphs/`, so the existing project serves it at `/glyphs/`. `/glyphs` without the slash is sent there, by the root `vercel.json` and by the page itself on any other host.

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
      utils.js                h(), cn(), debounce, the style names, the interface's own small icons
    components/
      ui/                     button, badge, input + select, segmented, tick-slider, switch, menu, slider, toggle-group, tabs, card + separator + kbd, sheet, code-block, command
      app/                    topbar, sidebar, toolbar, icon-grid, inspector, editor, library-panel, export-panel
  data/four/                  the four-style set's drawings, one file per corners and style, loaded when picked
  sources/core/               the core set's source data
  sources/keyline/            the four-style set's source data, copied by tools/import-keyline.mjs
  figma-plugin/PLAN.md        the plan for a free Figma plugin
```

## The toolbar

Above the grid, one row sets how every icon is drawn and shown:

- **Style**: Stroke, Two-tone, Duotone or Fill.
- **Corners**: Rounded or Sharp. Sharp squares every corner and cuts line ends off flat.
- **Size**: the size of the icons in the grid, 16 to 48 px.
- **Stroke**: the stroke on the 24 grid, 1 to 4.
- **Shape**: all icons, or only the four-style icons drawn plain, in a rounded square or in a circle.
- **Color**: the system's colour picker. With no colour, the icons take the theme's ink.
- **Grid settings**: names under the icons, and how many icons to a row.
- **Reset**: puts style, corners, size, stroke, colour, shape and the filter back. It is off while they are at their defaults.

The sliders are rows of ticks with a white capsule on top. A real range input lies over each one, so the keyboard, a click and a drag all work as they do on any slider. The motion follows the page it was modelled on:

- Colours fade over 150 ms.
- A slider's capsule glides to its value.
- Menus grow out of their button.
- Sheets slide in and back out.
- With the names off, one label glides from tile to tile under the pointer.

With reduced motion turned on, none of it moves. On a narrow screen the controls fold into a drawer behind one Browse button.

## The inspector

The panel on the right is about one thing at a time, and says which at the top: **This icon** or **Whole library**.

- **This icon**: the name and tags; the style switch, made of the icon in its four styles, where the one you pick is the one you edit and the one the grid shows; the icon on paper and on ink at three sizes; copy and download; the point editor, which edits exactly the weight on show (an icon with a solid of its own keeps separate edits per weight); the list of parts with the role each plays in the solid; and the SVG code.
- **Whole library**: the six parameters every icon is derived from, the presets, the style and corners the grid shows, the preview surface, and the sprite, font and JSON exports of the current view. Everything here applies to all icons at once.

The palette is black and white: every token is a grey with no hue, and the preview surface is the page, white paper or black ink.

## The engine

- **Primitives.** `poly` (points with per-vertex corner kinds: none, soft, box, box:k, fillet, or a number), `arc` (centre, radii, angles), `seq`, `quad`, and `path` (SVG path data).
- **Corners.** Straight joins get true circular fillets from the corner fillet slider. Quarter-circle corners in imported paths were recognised at import and follow the box corner slider.
- **Solid weight.** Closed shapes fill and inflate by S with round joins. A part sitting inside a closed shape becomes a cut of S; a filled dot on a line shape punches a hole of its outline size; a shape stacked on another gets a gap of G around it; a pill narrower than 2 S (a digit) stays a stroke. Parts marked `cut`, `knock`, `punch` or `flat` keep that role in both weights. Any part can be set by hand in the editor.
- **Two weights for the Beetle glyphs.** The 22 pairs the designer drew (bell and bell-filled, grid and grid-tone, alert and warn-filled, and so on) are one icon each, with the outline and the solid both native; the old name is an alias. The 10 filled glyphs without a drawn outline (mark, step-done, home-filled, undo-filled, receive-filled, history-filled, settings-filled, phone-filled, more, bet) get one derived from the solid through Clipper: a stroke of S just inside every edge, so the outline covers the solid's footprint exactly; parts thinner than about 1.2 S become a line along their middle, small discs a dot; a hole gets a ring on its edge, moved inside when it would crowd the outer stroke. Cuts and plain strokes pass through.
- **Four styles.** The four-style set brings a drawing of its own for every style and both corners, and is drawn exactly as drawn. Its lines follow the stroke, sharp ends, choke and goo. Its fills and corner shapes stay as drawn, so a plate always sits under its line. Every other icon derives the styles from its centrelines:
  - Two-tone is the line over what the fill would fill, at 40%.
  - Duotone is that body at 40%, with the details and lines in full.
  Each drawing of the four-style set keeps edits of its own.
- **Corners.** Sharp gives every corner kind a radius of 0, and gives lines butt ends. Dots keep a square end so they do not vanish.
- **Choke** offsets every edge geometrically and is baked into exports. **Goo** is a blur-then-threshold filter for preview and SVG.
- **Exports.** SVG and the sprite keep curves, strokes and masks. The font flattens every primitive, offsets it by S/2 with round joins and caps through Clipper, unions and cuts it, and maps results to U+E000 upward in result order. A font has one colour, so a two-tone font keeps the line and a duotone font takes the fill. Every icon goes by a name of its own in a sprite, a font or JSON: where two sets share a name, the set goes in front (`param-card`, `beetle-card`).

## Regenerating the library

`tools/import-keyline.mjs path/to/keyline-icons` copies the four-style set from a checkout of its repository into `sources/keyline/`, with its keywords, categories and licence notice. It only needs to run again for a newer release.

`tools/build-library.mjs` reads the core set's `icon-nodes.json`, `tags.json` and category map from `sources/core/`, the four-style set from `sources/keyline/`, converts every element into engine primitives, imports the app's glyphs from `src/icons.js` at the repository root, merges each drawn pair into one icon, derives the missing outlines, validates every icon (it has to render, and stay on the 24 grid), and writes `data/icons.json` and the eight files in `data/four/`. Every one of the 10,928 four-style drawings is checked. Rasterised at 48 px, they match the originals to within 0.5% of their ink. Light strokes on a glyph with nothing to cut into (the rails of the progress rings) become translucent tracks.

## Licenses

The core set is used under the ISC license; the notice is in `LICENSE-core.txt` and stays with the icons. The four-style set is Keyline Icons 1.7.0 (https://github.com/keyline-icons/keyline-icons), used under the MIT license. Its notice is in `LICENSE-keyline.txt` and stays with the icons. As its terms ask, the set is not named after Keyline Icons, and its wordmark and logo are not used. The app glyphs belong to the Beetle wallet design.
