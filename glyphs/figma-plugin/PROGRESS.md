# Progress

**Blockers for the owner:** none that stop the work. Testing in Figma itself needs the desktop app on a Mac or a Windows computer (PLAN.md, question 3). Every step that can run without Figma is built and tested.

**Settled by the owner:** the toolbar scrolls away with the grid in the plugin, even though it stays in view on the site. In a panel 420 pixels wide it is about 200 pixels tall, and kept in view it would leave room for only two rows of icons.

**For the library session:** nothing open. The three site faults the plugin found are all fixed in `engine.js`.

## Merged from the library branch

- `a8ce4e6`: the stored fills in `data/fills.json`, badges kept apart in an outline's gap, bet, power and send without solids of their own, the toolbar that stays in view, a ZIP download on each category, and the two mask fixes. The plugin carries all of it. `fills.json` is bundled like the other data, the ZIP saves from the panel with both licence notices, and the plugin now works out the site's own masks instead of rebuilding the layers, so it draws the new fills exactly.
- `1279952`: a part narrower than its stroke draws whole, as the plugin and the font already drew it. The worst difference between the site and the plugin is now 1.3% of an icon's ink, so the test's limit is 2%.

## Found in Figma by the owner

- Before its first publish, the plugin has no ID, and Figma will not keep settings for a plugin without one. The panel used to stop at that error. It now opens with the default settings and saves nothing until the plugin has an ID. The tests now run the plugin both with and without an ID.

## Milestones

Milestones 1 to 6 follow PLAN.md. Where a milestone needs the Figma app, the part that runs without it is done and the rest waits for the owner.

- [x] **1. Set up.** The plugin, its manifest and its build. Waiting for the owner: the account with two-factor authentication, the desktop app, and the first import (README.md).
- [x] **2. Engine in the panel.** The build reads the engine, the data and the site's components from `glyphs/`. The panel has search, sets and categories, the site's toolbar and its other sliders, and a grid. One click inserts one icon. Masks or outlines: outlines, see PLAN.md. Tested: every one of the 27,456 drawings is free of masks, filters, `currentColor` and `NaN`, and 1,446 masked drawings match their version without masks within 2% of their ink. Waiting for the owner: compare 20 icons in Figma with the site.
- [x] **3. Placement and batches.** Into the selected frame, beside a selected icon, or in the middle of the screen. Drag and drop. Batches in chunks of 50, into one grid frame, up to 2,000 icons or 200 component sets. Tested on the stand-in with the 127 scenarios. Waiting for the owner: check that Figma stays responsive.
- [x] **4. Components and variants.** Insert as a component, or as a component set with Style and Corners variants. Waiting for the owner: switch the variants in the right panel.
- [x] **5. Swap and sync.** Settings stored on every icon, the two relaunch buttons, swap in place, and update the selection or the page. Instances swap their component, and a variant instance keeps its style and corners. Waiting for the owner: try it in a file with auto layout and instances.
- [ ] **6. Polish and publish.** Done: light and dark themes from Figma, keyboard use from the site's components, empty states, the About sheet with both licences in full, and the listing pictures in `listing/` (the icon, the thumbnail and eight carousel pictures, drawn by the site's engine). Next: the owner tries the plugin in Figma, then publishes (README.md).

## How it is checked

- `node glyphs/tools/build-figma-plugin.mjs --check` fails when `dist/` no longer matches the site's files. It also draws every icon for Figma and runs `code.js` on a stand-in for Figma. CI runs it.
- `node glyphs/figma-plugin/test/ui.mjs` drives the built panel in headless Chromium, with `code.js` on the stand-in, and downloads a category as a ZIP. CI runs it. Waiting for the owner: check that the ZIP download saves inside Figma.
- `npm test` at the root and `node glyphs/tools/build-library.mjs --check` still pass.

## Next

- Merge new work from `claude/focused-tesla-4ruk13` at each step, rebuild, and check.
- Draw the listing pictures again with `listing/make.mjs` if the site changes before publishing.
- Later, if wanted: bind live strokes to a Figma number variable.
