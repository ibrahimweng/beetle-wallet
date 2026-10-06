# Beetle Glyphs for Figma

This is a free Figma plugin. It puts every Beetle Glyphs icon into Figma, drawn by the same engine and the same toolbar as the site. That is 3,305 icons and 127 app scenarios:

- the four-style set, 1,366 icons in stroke, two-tone, duotone and fill, each with rounded or sharp corners;
- the core set, 1,854 icons;
- the app's own 73 glyphs and 12 parametric icons;
- the 127 app scenarios.

Everything is inside the plugin. It never uses the network, and it costs nothing to run or to publish.

## What it does

- **Browse.** The panel shows the site's grid and toolbar: Style, Corners, Size, Stroke, Shape, Color and Reset. **Library** opens the sets and categories. **Settings** opens the site's other sliders: box corner, corner fillet, gap and choke.
- **Insert one icon.** Click it. It lands in the selected frame, or in the middle of the screen. If an icon is selected, the new one goes beside it, never inside it. You can also drag an icon onto the canvas.
- **Insert a batch.** Shift-click to tick icons, or press **Tick all**, then press **Insert**. They arrive together in one grid frame.
- **Choose what arrives.** **Insert as** gives a plain frame, a component, or a component set with Style and Corners variants. With variants, you switch the style and the corners in Figma's right panel.
- **Swap.** Select a Beetle Glyphs icon on the canvas and click another icon in the panel. The layer keeps its place and size. On an instance, the plugin swaps the component, so your overrides stay.
- **Update.** Every icon remembers its name and settings. Change the settings, then press **Update selection** or **Update page**. Each icon is redrawn in place. A variant keeps its own style and corners. When you select an icon, the right panel also shows **Edit in Beetle Glyphs** and **Update to current settings**.

Size is the size an icon arrives at. Color is its colour, and black when none is picked. Lines stay live strokes, so you can still change their weight in Figma. A part the site cuts with a mask arrives as one plain shape with holes. Goo is not in the plugin, because Figma cannot import SVG filters.

## Try it in the Figma desktop app

You need the Figma desktop app on a Mac or a Windows computer. The browser version of Figma cannot load a plugin from your own files.

1. Get the repository onto that computer. Use `git clone https://github.com/ibrahimweng/beetle-wallet`, or download it as a ZIP from GitHub and unzip it. The plugin is already built, so you do not need to run anything.
2. Open the Figma desktop app and open a draft file. Drafts are free and unlimited on the Starter plan.
3. Open the main menu. Choose **Plugins**, then **Development**, then **Import plugin from manifest…**.
4. Pick `glyphs/figma-plugin/dist/manifest.json`.
5. Run it from **Plugins**, then **Development**, then **Beetle Glyphs**.

Try these in the draft, and tell the library session what you see:

- Click a few icons in each style and both corners. Compare them with the same icons on the site.
- Insert the 127 app scenarios in one batch. Figma should stay responsive.
- Insert one icon as variants. Place an instance, then switch Style and Corners in the right panel.
- Select an inserted icon and click another one in the panel. It should swap in place.
- Move the Stroke slider, then press **Update page**. Positions and sizes should stay the same.
- Drag an icon from the panel onto a frame.
- Open **Library** and use the download button beside a category. A ZIP of SVGs should save.

When the repository changes, pull or download it again. Figma reads the new files the next time you run the plugin.

## Publish it

Publishing is free. Figma reviews the plugin once. Later versions do not need another review, unless the network or data answers change.

1. Turn on two-factor authentication on your Figma account, under **Settings**, then **Security**.
2. In the desktop app, open the main menu. Choose **Plugins**, then **Manage plugins**. Find Beetle Glyphs and choose **Publish**.
3. Fill in the form:
   - **Name:** Beetle Glyphs. Never use "Keyline" in the name, tagline, tags or pictures, and never use the Keyline logo or the Figma logo.
   - **Tagline and description:** for example, "3,305 parametric icons in four styles, with rounded or sharp corners".
   - **Support contact:** https://github.com/ibrahimweng/beetle-wallet/issues
   - **Price:** Free.
   - **Data security:** the plugin reads no user data and has no network access.
   - **Pictures:** they are ready in `glyphs/figma-plugin/listing/`. Upload `icon.png` as the icon, `thumbnail.png` as the thumbnail, and `carousel-1.png` to `carousel-8.png` as the carousel, in that order. If the site has changed since, run `node glyphs/figma-plugin/listing/make.mjs` first to draw them again.
4. Figma gives the plugin an ID. Add it to `glyphs/figma-plugin/manifest.json` as `"id": "…"` (the one in this folder, not the one in `dist/`), then rebuild with `node glyphs/tools/build-figma-plugin.mjs` and commit. You can also ask the library session to do this.
5. Submit. Figma emails you when it decides. Reports say this takes 5 to 10 working days.
6. For a later version, rebuild, then choose **Publish new version** in the same place.

## For developers

```
node glyphs/tools/build-figma-plugin.mjs           build dist/ from the site's files
node glyphs/tools/build-figma-plugin.mjs --check   fail if dist/ is stale, or any icon would reach Figma broken
node glyphs/figma-plugin/test/ui.mjs               the built panel in headless Chromium, with code.js on a stand-in for Figma
```

The plugin keeps no copies of the site. The build reads the engine, the library, the store, the toolbar, the grid, the sidebar, the whole-library panel and the stylesheet from `glyphs/src`, and the data from `glyphs/data`. It rolls them into `dist/ui.html` with the few files that belong to the plugin. `dist/` is committed so the plugin can be imported without a build. CI runs `--check`, so it goes red when a change on the site has not reached the plugin. Then run the build and commit `dist/`.

| File | What it is |
| --- | --- |
| `manifest.json` | what Figma reads first |
| `code.js` | the main thread: it makes, swaps and redraws layers |
| `ui/main.js` | the panel: it mounts the site's grid and toolbar, and adds the insert bar and About |
| `ui/figma-svg.js` | the engine's own SVG, with its masks worked out into plain shapes for Figma |
| `ui/data.js` | answers the site's `fetch` calls from data inside the page |
| `ui/plugin.css` | the site's styles, fitted to a narrow panel |
| `test/` | the checks, and the stand-in for Figma |
| `listing/` | the listing pictures, and `make.mjs`, which draws them with the site's engine |
| `PLAN.md`, `PROGRESS.md` | the plan, and how far it has got |
