# Progress

**Blockers for the owner:** none that stop the work. Testing in Figma itself needs the desktop app on a Mac or a Windows computer (PLAN.md, question 3). Every step that can run without Figma is built and tested.

**For the library session:** the plugin found two small faults in the site's SVG, in `engine.js`. They do not reach the plugin, which outlines those shapes instead.

- The masks use the default mask region, which is the fill's box plus 10%. So a mask clips the stroke that grows a body. You can see it on the top edge of `hard-drive-download` in Fill. `maskUnits="userSpaceOnUse"` with the same box as the mask's white rectangle would fix it.
- With sharp corners, a cut that is a dot gets a butt end and cuts nothing, for example the two holes in `hard-drive-download` in Fill, Sharp. `outline()` gives it a square end, as `isDot` intends.

## Milestones

Milestones 1 to 6 follow PLAN.md. Where a milestone needs the Figma app, the part that runs without it is done and the rest waits for the owner.

- [x] **1. Set up.** The plugin, its manifest and its build. Waiting for the owner: the account with two-factor authentication, the desktop app, and the first import (README.md).
- [x] **2. Engine in the panel.** The build reads the engine, the data and the site's components from `glyphs/`. The panel has search, sets and categories, the site's toolbar and its other sliders, and a grid. One click inserts one icon. Masks or outlines: outlines, see PLAN.md. Tested: every one of the 27,456 drawings is free of masks, filters, `currentColor` and `NaN`, and 1,146 masked drawings match their outlined version within 3% of their ink. Waiting for the owner: compare 20 icons in Figma with the site.
- [x] **3. Placement and batches.** Into the selected frame, beside a selected icon, or in the middle of the screen. Drag and drop. Batches in chunks of 50, into one grid frame, up to 2,000 icons or 200 component sets. Tested on the stand-in with the 127 scenarios. Waiting for the owner: check that Figma stays responsive.
- [x] **4. Components and variants.** Insert as a component, or as a component set with Style and Corners variants. Waiting for the owner: switch the variants in the right panel.
- [x] **5. Swap and sync.** Settings stored on every icon, the two relaunch buttons, swap in place, and update the selection or the page. Instances swap their component, and a variant instance keeps its style and corners. Waiting for the owner: try it in a file with auto layout and instances.
- [ ] **6. Polish and publish.** Done: light and dark themes from Figma, keyboard use from the site's components, empty states, and the About sheet with both licences in full. Next: the listing pictures, then the owner publishes (README.md).

## How it is checked

- `node glyphs/tools/build-figma-plugin.mjs --check` fails when `dist/` no longer matches the site's files. It also draws every icon for Figma and runs `code.js` on a stand-in for Figma. CI runs it.
- `node glyphs/figma-plugin/test/ui.mjs` drives the built panel in headless Chromium, with `code.js` on the stand-in. CI runs it.
- `npm test` at the root and `node glyphs/tools/build-library.mjs --check` still pass.

## Next

- Merge new work from `claude/focused-tesla-4ruk13` at each step, rebuild, and check.
- The listing pictures: an icon at 128 by 128 and a thumbnail at 1920 by 1080.
- Later, if wanted: bind live strokes to a Figma number variable.
