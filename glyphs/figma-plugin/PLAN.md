# Beetle Glyphs Figma plugin plan

This is a plan for a free Figma plugin that uses the same engine and sliders as the Beetle Glyphs site. Nothing in it needs a paid account or paid hosting. I checked the Figma facts against the linked pages on 6 October 2026.

## 1. What the plugin does for a designer

- **Browse and search.** You see the core set, the Beetle glyphs and the four-style set in one grid, with the same toolbar as the site. You can filter by set and category, and search by name and tags.
- **Set the look.** You pick a style (stroke, two-tone, duotone or fill) and Rounded or Sharp corners. The site's sliders set stroke S, box corner R, corner fillet, gap G and choke. You also pick a size and a colour. Figma cannot import the goo blur filter, so goo is left out at first.
- **Insert one icon.** You click an icon or drag it onto the canvas. It lands in the selected frame, or in the middle of the screen.
- **Insert a batch.** You tick several icons, or a whole category, and they arrive in a grid frame.
- **Insert as components.** A component is a reusable master in Figma. A component set holds variants of one icon, here Style and Corners, so a designer switches style in the right panel. An icon can arrive as either.
- **Swap in place.** You select an icon on the canvas and click another. The new icon takes the old one's place, size and parent. On an instance, the plugin uses `swapComponent`, which keeps the designer's overrides ([InstanceNode](https://developers.figma.com/docs/plugins/api/InstanceNode/)).
- **Keep parameters in sync.** Each inserted icon stores its name and settings on its layer. "Update this page" redraws those icons at the current settings. When you select one, Figma shows an "Edit in Beetle Glyphs" button in the right panel ([setRelaunchData](https://developers.figma.com/docs/plugins/api/properties/nodes-setrelaunchdata/)).

## 2. Cost

**Free:**

- The Starter plan costs nothing. Creating plugins is "supported on any team or plan" ([help](https://help.figma.com/hc/en-us/articles/360042786733)), and so is publishing to the Community ([help](https://help.figma.com/hc/en-us/articles/360042293394)).
- Review is free. Figma takes a 15% fee from paid sales only ([selling](https://help.figma.com/hc/en-us/articles/12067637274519)).
- After the first approval, "you don't need to submit your plugin for further review" ([manage plugins](https://help.figma.com/hc/en-us/articles/360042293714)).
- No hosting is needed when the data is inside the plugin. The build needs only Node.

**Needed but not paid:**

- The desktop app on macOS or Windows. Figma says "You must use the Figma desktop app to create and publish plugins" ([help](https://help.figma.com/hc/en-us/articles/360042786733)). There is no official Linux app.
- Two-factor authentication on the account ([help](https://help.figma.com/hc/en-us/articles/360042293394)).

**Paid or limited, so the plan avoids it:**

- Selling is not an option anyway. Figma is "not approving new creators to sell paid files" at the moment ([selling](https://help.figma.com/hc/en-us/articles/12067637274519)).
- Team libraries need a paid plan ([pricing](https://www.figma.com/pricing/)). The plugin gives people the icons without one.
- Starter team files have at most three pages, and drafts have no cap ([Figma blog](https://www.figma.com/blog/about-figmas-new-starter-plan/)). So the plugin never adds pages.

**Accounts:**

1. A Figma account on the free Starter plan, with two-factor authentication on.
2. The public GitHub repository `ibrahimweng/beetle-wallet`. Its Issues page can be the support contact.

## 3. Architecture

**Two halves.** The main file, `code.js`, can change the document but has no web page. The panel, `ui.html`, is a web page that cannot touch the document. They send each other messages ([how plugins run](https://developers.figma.com/docs/plugins/how-plugins-run/)).

**The engine runs in the panel.** `engine.js` uses no page features, so it runs there unchanged. The panel needs it for the grid anyway. Figma also stays responsive when Clipper, the vendored polygon library, runs there. One insert has four steps.

1. The panel builds one SVG string at 24 by 24 at the chosen settings. Open lines stay as live strokes from `svg()`, so designers can still change the stroke weight. Filled parts with cuts come from `outline()` as plain shapes with holes, as in the icon font. The site's SVG makes cuts with `<mask>`, and we have not tested how Figma imports masks. `currentColor` becomes the chosen colour, because Figma cannot read it.
2. The panel sends the SVG, the icon key, the settings and the size to `code.js`.
3. `code.js` calls `figma.createNodeFromSvg`, which returns a frame ([figma API](https://developers.figma.com/docs/plugins/api/figma/)). It clears the frame's white fill and names it. It scales it with `rescale`, not `resize`, so the stroke scales too. It never places a new icon inside the icon that is still selected. We took these three points from Keyline's plugin. Components use `createComponentFromNode`. A component set is one component per variant, named like `Style=Stroke, Corners=Rounded`, joined with `combineAsVariants` ([combineAsVariants](https://developers.figma.com/docs/plugins/api/properties/figma-combineasvariants/)).
4. It stores the settings with `setPluginData`, up to 100 kB per entry ([setPluginData](https://developers.figma.com/docs/plugins/api/properties/nodes-setplugindata/)). "Update this page" finds those layers with `findAllWithCriteria`.

Later, live strokes can be tied to a number variable with `setBoundVariable` ([bindable fields](https://developers.figma.com/docs/plugins/api/VariableBindableNodeField/)).

**Manifest.** Figma reads `manifest.json` first ([manifest](https://developers.figma.com/docs/plugins/manifest/)).

```json
{
  "name": "Beetle Glyphs",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "editorType": ["figma"],
  "documentAccess": "dynamic-page",
  "networkAccess": { "allowedDomains": ["none"] },
  "relaunchButtons": [
    { "command": "open", "name": "Edit in Beetle Glyphs" },
    { "command": "sync", "name": "Update to current settings", "multipleSelection": true }
  ]
}
```

- Figma gives the `id` at first publish. Never make one up.
- `"dynamic-page"` is "required for all new plugins". Pages then load on demand, so the code uses the async calls.
- `["none"]` blocks all network use, and the listing says "No access to network".
- `permissions` is left out, because the plugin reads no user data.

**Storage.** The last settings and recent icons go in `figma.clientStorage`, which keeps up to 5 MB on the user's machine ([clientStorage](https://developers.figma.com/docs/plugins/api/figma-clientStorage/)).

**Data.** I recommend bundling, which means building the icon data into `ui.html`. The reasons are these:

- It works offline, with no server to keep alive. The Vercel URL on the repository answered `DEPLOYMENT_NOT_FOUND` when I tried it.
- With no network access, review and the data security form are simpler.
- The data and the engine always come from the same build.
- Keyline fetches its data so new icons skip review. Our updates skip review anyway after the first approval.

Each icon change then needs "Publish new version", which takes minutes. Fetching stays possible later, from a server that sends `Access-Control-Allow-Origin: *` ([network requests](https://developers.figma.com/docs/plugins/making-network-requests/)). jsDelivr, a free file delivery service, sends it and keeps a copy of a file on `main` for 12 hours. Vercel would need the header added.

**How the data is laid out today.** `data/icons.json` holds the core set, the Beetle glyphs, the scenarios and the four-style set's names, tags and categories. The four-style set's drawings live in eight files, `data/four/<corners>-<style>.json`, one for each of rounded and sharp with stroke, two-tone, duotone and fill. Each icon there is a short list of parts, and `engine.js` turns them into drawable parts with `drawn()`. The plugin can read the same files.

**Size.** The developer docs state no limit. A Figma support reply on the forum says plugin code must be under 15 MB ([forum](https://forum.figma.com/report-a-problem-6/unable-to-publish-figma-plugin-44361)). Today `icons.json` is 1.5 MB, or 257 KB compressed with gzip. The eight files in `data/four/` total 5.0 MB, or 1.25 MB compressed. The build stores each data file compressed and written as base64, which turns binary data into text. The panel unpacks only the file in view, with the browser's own `DecompressionStream`. With Clipper and the engine, I estimate `ui.html` at about 2.5 MB. The build fails above 10 MB. `opentype.min.js` stays out, since there is no font export.

**Build step.** The panel cannot load other files by relative path, so everything goes inline in one HTML file ([external resources](https://developers.figma.com/docs/plugins/resource-links/)). A new script, `glyphs/tools/build-figma-plugin.mjs`, works like `build-library.mjs`.

- It reads the plugin source in `glyphs/figma-plugin/`, `engine.js` without its `export` line, `vendor/clipper.js`, the data files and the licence notices.
- It writes `manifest.json`, `code.js` and `ui.html` to `glyphs/figma-plugin/dist/`.
- With `--check`, it renders every icon in every style and fails on `NaN`, leftover `currentColor`, a missing licence or the size budget.

The root `build.js` copies all of `glyphs/` to the site, so it should skip `figma-plugin/`.

## 4. Milestones

All testing happens in drafts, which are unlimited on Starter. In the desktop app you choose **Plugins, Development, Import plugin from manifest** and pick `dist/manifest.json`. Nothing is public until milestone 6. `--check` tests the data in Node, and a saved test file covers Figma.

1. **Set up.** Make the account, turn on two-factor authentication and install the desktop app. Write a plugin that inserts one fixed SVG. To test, import it and run it in a draft.
2. **Engine in the panel.** Build the script, the bundled data, the grid, search, sliders and a single insert. To test, insert 20 icons in every style and corner, and compare each with the site's SVG export. Also compare the painted bounds Figma reports, `absoluteRenderBounds`, with the engine's box. Then choose masks or outlines.
3. **Placement and batches.** Add placement, drag and drop, and batch insert in chunks of about 50. To test, insert the 127 scenarios and check that Figma stays responsive.
4. **Components and variants.** Add insert as component and as component set. To test, place an instance and switch Style and Corners in the right panel.
5. **Swap and sync.** Add stored settings, relaunch buttons, swap, and update selection or page. To test, change S in a file with frames, auto layout and instances, then update the page. Positions, sizes and overrides must stay.
6. **Polish and publish.** Add light and dark themes, keyboard use, empty states and an About panel with the licences. To test, run everything in a new draft, then submit.

## 5. Publishing

1. Turn on two-factor authentication.
2. In the desktop app, open the Figma menu, then **Plugins**, then **Manage plugins**, and choose **Publish** ([help](https://help.figma.com/hc/en-us/articles/360042293394)).
3. Fill in the name, tagline, description and support contact, which is the GitHub Issues URL. Answer the data security form, and set the price to Free.
4. Paste the ID Figma gives you into `manifest.json`, then rebuild and commit.
5. Submit. Figma emails the decision and promises no date, saying "approval times vary" ([review guidelines](https://help.figma.com/hc/en-us/articles/360039958914-Plugin-and-widget-review-guidelines)). Forum reports say 5 to 10 business days, sometimes more.
6. Later releases use **Publish new version**. Keyline's notes say that changed network or data security answers can bring a new review.

**Listing assets:**

- An icon at 128 by 128 pixels.
- A thumbnail at 1920 by 1080 pixels.
- Up to nine carousel images, e.g., one per style.

**Licences.** The notices must be included wherever the icons are copied, and every install is a copy.

- The core set is ISC, "Copyright (c) 2026 Lucide Icons and Contributors", and some icons are MIT from Feather. Put the full `LICENSE-core.txt` in the About panel and in a comment at the top of `ui.html`.
- The new set is MIT, "Copyright (c) 2026 Keyline Icons". Include its full notice the same way. Keyline's README says the licence "does not grant rights in the name". So our set gets its own name. "Keyline" stays out of the plugin name, tagline, tags and images, and their logo is never used. The credit inside the notice is required and allowed.
- The review guidelines point to Figma's trademark rules, so the Figma logo stays out of our icon.
- The Beetle app glyphs belong to the Beetle wallet design. If they ship, anyone can use them.

## 6. Risks and open questions

**Risks:**

- Masks or two-tone opacity may import wrongly. Outlined shapes are the fix, and milestone 2 decides.
- The 15 MB limit comes from a forum reply, not the docs. The build keeps a wide margin.
- The new set as 8 variant component sets is about 11,000 layers, so batches need a cap.
- The engine is still changing, and each change needs a rebuild and a new published version.

**Questions for the owner:**

1. Should the Beetle app glyphs ship in a public plugin?
2. The site calls the new set the four-style set, so it is not named after Keyline Icons. Is that the name to use in the plugin too?
3. Which Mac or Windows computer will run the desktop app?
4. Should `dist/` be committed, or rebuilt before each publish?
5. Should FigJam be in the first release?
6. Should the plugin read point edits exported from the site?
7. Should strokes stay live by default, or be outlined to match the exports?
8. Which website goes on the listing, since the repository's Vercel URL is not live?
