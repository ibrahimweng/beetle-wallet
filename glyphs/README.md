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
  data/icons.json             the library (1.7 MB, 291 KB compressed)
  data/fills.json             how each line icon fills: plates, details, cuts and badges (242 KB compressed), loaded when a filled style is first shown
  vendor/clipper.js           polygon offsetting and booleans (sprite and font exports)
  vendor/opentype.min.js      TrueType writer (icon font export)
  src/
    app.js                    bootstrap: theme, shell, command palette, mobile sheets
    styles/globals.css        HSL tokens (:root and .dark), base styles, component classes
    lib/
      engine.js               the geometry engine (ES module)
      library.js              loading, search, edits applied on top of the library
      store.js                one observable store with persistence
      export.js               SVG, sprite, font, JSON and category ZIP exports; save through claude.ai or a plain link
      zip.js                  a small ZIP writer (deflate through the browser's CompressionStream, or stored)
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

Above the grid, one bar sets how every icon is drawn and shown. It stays in view under the top bar while the grid scrolls, with a hairline once it has left its place, and the page scrolls keyboard focus clear of it:

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

## Categories

Each category in the sidebar has a download button where its count is, shown on hover or focus (always, on a touch screen). It saves a ZIP of every icon the category counts, one SVG each, in the style, corners and parameters the grid shows and in the grid's colour when one is picked. The ZIP also holds the licence notice of each set it draws on and a README with the settings.

## The inspector

The panel on the right is about one thing at a time, and says which at the top: **This icon** or **Whole library**.

- **This icon**: the name and tags; the style switch, made of the icon in its four styles, where the one you pick is the one you edit and the one the grid shows; the icon on paper and on ink at three sizes; copy and download; the point editor, which edits exactly the weight on show (an icon with a solid of its own keeps separate edits per weight); the list of parts with the role each plays in the solid; and the SVG code.
- **Whole library**: the six parameters every icon is derived from, the presets, the style and corners the grid shows, the preview surface, and the sprite, font and JSON exports of the current view. Everything here applies to all icons at once.

The palette is black and white: every token is a grey with no hue, and the preview surface is the page, white paper or black ink.

## The engine

- **Primitives.** `poly` (points with per-vertex corner kinds: none, soft, box, box:k, fillet, or a number), `arc` (centre, radii, angles), `seq`, `quad`, and `path` (SVG path data).
- **Corners.** Straight joins get true circular fillets from the corner fillet slider. Quarter-circle corners in imported paths were recognised at import and follow the box corner slider.
- **Solid weight.** Closed shapes fill and inflate by S with round joins. A part sitting inside a closed shape becomes a cut of S; a filled dot on a line shape punches a hole of its outline size; a shape stacked on another gets a gap of G around it; a pill narrower than 2 S (a digit) stays a stroke. Parts marked `cut`, `knock`, `punch` or `flat` keep that role in both weights. Any part can be set by hand in the editor.
- **Two weights for the Beetle glyphs.** The 22 pairs the designer drew (bell and bell-filled, grid and grid-tone, alert and warn-filled, and so on) are one icon each, with the outline and the solid both native; the old name is an alias. Two of them take their filled styles from their line instead, as any line icon does: power, whose drawn solid was a smaller bolt than its line, and send, whose drawn solid was a paper plane where its line is an arrow. So does bet, drawn as a line die with filled pips. The 9 filled glyphs without a drawn outline (mark, step-done, home-filled, undo-filled, receive-filled, history-filled, settings-filled, phone-filled, more) get one derived from the solid through Clipper: a stroke of S just inside every edge, so the outline covers the solid's footprint exactly; parts thinner than about 1.2 S become a line along their middle, small discs a dot; a hole gets a ring on its edge, moved inside when it would crowd the outer stroke. Cuts and plain strokes pass through.
- **Four styles.** The four-style set brings a drawing of its own for every style and both corners, and is drawn exactly as drawn. Its lines follow the stroke, sharp ends, choke and goo. Its fills and corner shapes stay as drawn, so a plate always sits under its line. Each drawing of the four-style set keeps edits of its own.
- **The filled styles of a line icon** come from what its line encloses, worked out once by the build and stored in `data/fills.json`:
  - **Plates**: every space the ink closes round, at a stroke of 2, grown to just short of the centrelines around it.
  - **Details**: parts that never reach the icon's edge (an eye's iris, a die's pips).
  - **Cuts**: the stretches of a line that run deep inside the shape (a globe's meridians, a clock's hands).
  - **Badges**: an outline left open for a badge (heart-plus, bell-plus, clock-alert, cloud-download) closes across its gap, when the badge reaches no more than 3.5 into the shape, is short beside the outline, and nothing else meets the outline's ends. A line that crosses itself (a letter or a rune) and a mark inside a space already closed stay as they are.
  Two-tone is the line over the plates at 40%. Fill is the plates and the line, with the details and cuts cut out and a gap of G kept round each badge. Duotone is the fill's body at 40% with the details, cuts and badges in full; an icon with none of those keeps in full what runs off its plates (a handle, a tail), or its whole line when everything borders a plate. An icon that encloses nothing keeps its line in every style. About 600 icons whose plates move with square corners keep a second analysis for sharp.
- **A part narrower than its stroke is drawn filled.** A circle stroked wider than itself (palette's wells, skull's nose, the dots of grip) leaves a hole in the middle in the browser, so such a part is drawn as the area its stroke covers. A circle is exact, and any other part takes Clipper's offset.
- **A fillet never blunts a tip.** On an acute corner the fillet is capped so the curve moves the point in by no more than half a stroke.
- **Corners.** Sharp gives every corner kind a radius of 0, and gives lines butt ends. Dots keep a square end so they do not vanish.
- **Choke** offsets every edge geometrically and is baked into exports. **Goo** is a blur-then-threshold filter for preview and SVG.
- **Exports.** SVG and the sprite keep curves, strokes and masks. The font flattens every primitive, offsets it by S/2 with round joins and caps through Clipper, unions and cuts it, and maps results to U+E000 upward in result order. A font has one colour, so a two-tone font keeps the line and a duotone font takes the fill. Every icon goes by a name of its own in a sprite, a font or JSON: where two sets share a name, the set goes in front (`param-card`, `beetle-card`).

## Regenerating the library

`tools/import-keyline.mjs path/to/keyline-icons` copies the four-style set from a checkout of its repository into `sources/keyline/`, with its keywords, categories and licence notice. It only needs to run again for a newer release.

`tools/build-library.mjs` reads the core set's `icon-nodes.json`, `tags.json` and category map from `sources/core/`, the four-style set from `sources/keyline/`, converts every element into engine primitives, imports the app's glyphs from `src/icons.js` at the repository root, merges each drawn pair into one icon, derives the missing outlines, validates every icon (it has to render, and stay on the 24 grid), and writes `data/icons.json`, `data/fills.json` and the eight files in `data/four/`. Every one of the 10,928 four-style drawings is checked. Rasterised at 48 px, they match the originals to within 0.5% of their ink. Light strokes on a glyph with nothing to cut into (the rails of the progress rings) become translucent tracks.

## Licenses

The core set is used under the ISC license; the notice is in `LICENSE-core.txt` and stays with the icons. The four-style set is Keyline Icons 1.7.0 (https://github.com/keyline-icons/keyline-icons), used under the MIT license. Its notice is in `LICENSE-keyline.txt` and stays with the icons. As its terms ask, the set is not named after Keyline Icons, and its wordmark and logo are not used. The app glyphs belong to the Beetle wallet design.
