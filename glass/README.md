# Beetle Glass

Glass tiles over a photo. Drop in a picture and it is seen through a sheet of
glass made of separate tiles (circles, squares, ovals or the Beetle mark), each
one bending, frosting and catching the light on its own. Then export it as a
PNG at the photo's own size.

Static site. No build step, no server code, no framework, no libraries. The
page is `index.html`: the styles, the WebGL shader and every control are in
that one file. Next to it, in `assets/`, are the things you might want to swap:
the sample photo, the logo and the fonts.

Everything runs in the browser. The photo is never uploaded anywhere, and the
share link carries only the settings.

## Run it

Any static server, from this folder:

```sh
npm start            # python3 -m http.server on http://127.0.0.1:4174
npx serve .          # or this
```

Opening `index.html` straight from the disk does not work: browsers will not
let WebGL read a photo from a `file://` page.

## Deploy on Vercel

1. Import the `ibrahimweng/beetle-wallet` repository in Vercel.
2. Set **Root Directory** to `glass`.
3. Framework Preset **Other**. Leave Build Command and Output Directory empty.
4. Deploy. `vercel.json` here sets clean URLs and headers, and `.vercelignore`
   leaves the tests out.

It is a project of its own: the wallet's root deploy does not serve it.

## Change the brand colours

The first six variables at the top of the `<style>` in `index.html`:

| Variable | Now | What it colours |
| --- | --- | --- |
| `--brand-primary` | `#2b2721` Beetle ink | the Export button, chosen presets, tooltips |
| `--brand-accent` | `#f04f22` Beetle orange | what moves: slider fills, switches, the light dial, focus rings, the chosen tab |
| `--bg` | `#f1f0ed` | behind the picture |
| `--surface` | `#fafaf9` | the top bar and the panel |
| `--text` | `#2b2721` | words |
| `--radius` | `16px` | the picture's corners and the dialogs |

The lines under them are the steps around those (a field's grey, a hairline,
secondary text). Dark mode, in the brand's very dark brown, sets the same
variables again in two blocks just below: one for the device's own setting and
one for the theme button. Change both.

## Swap the photo, the logo or the fonts

- **The sample photo**: replace `assets/sample.jpg`. Any size; it opens at its
  own size. To use another name, change `CONFIG.sampleImage` at the top of the
  script.
- **The logo tile**: replace `assets/logo.svg`. Use a mark in one solid colour
  on nothing (no background square, or every tile becomes a square). It needs
  a `viewBox`. To use another name, change `CONFIG.logo`. People can also
  upload their own SVG with **Upload SVG** under the Logo shape; that stays on
  their device.
- **The wordmark in the top bar**: the `<svg>` inside `<a class="brand">` in
  `index.html`, drawn in `currentColor` so it takes `--lockup`.
- **The fonts**: `assets/fonts/` holds Beetle Sans (Geist with the naira sign,
  as the wallet ships it). The title is Sentient, loaded from Fontshare as the
  wallet loads it, because its licence keeps it out of a public repository.
  Both are named in the `@font-face` rules at the top of the styles.

## Add a tile shape

1. In the shader, write the shape's signed distance function (negative inside)
   and add it to `tileShape()` under the next id, with the depth of its
   deepest point.
2. Add it to `SHAPES` in the script with that id, a label and a small icon.

The glass, the light and every control then work for it with no more changes.

## How it draws

One pass of one fragment shader. For each pixel it finds the tile it falls in
(checking its own grid cell and the eight around it, since tiles can be moved
and grown past their cell), measures how far the pixel is from the tile's
edge, and leans the glass by that much: the four lens styles are four profiles
of that lean. It then reads the photo at the bent position, frosted by a
golden-angle disc of taps read from the mip level that matches their spacing,
split by colour if asked, and shades and lights the tile from the light's
direction. All lengths are in units of the photo's short side, so the export
at full size looks the same as the preview. The export is drawn in 2048-pixel
squares and put together, so a large photo never needs more than the device
allows; if a device cannot hold the full size, the export says what it made.

## What is in it, and whose it is

- The page, the shader and the tests were written for Beetle. No code from
  another project is in them.
- The hash that makes the per-tile randomness is Chris Wellons' `lowbias32`,
  which he placed in the public domain. The logo's distance field uses the
  exact distance transform from Felzenszwalb and Huttenlocher's published
  paper (an algorithm, written here from the paper).
- `assets/sample.jpg` is [Pexels photo 5717310](https://www.pexels.com/photo/5717310/)
  under the [Pexels licence](https://www.pexels.com/license/): free for
  commercial use, changes allowed, no credit needed. The licence has no model
  release, so do not use the photo to suggest the person in it endorses
  Beetle. Replace it with Beetle's own photography whenever there is some.
- `assets/fonts/` is Geist under the SIL Open Font License, its licence
  beside it in `OFL-Geist.txt`.
- `assets/logo.svg` and the wordmark are Beetle's own vectors, from
  `wallet/src/design/Lockup.tsx`.

## Tests

`test/glass.mjs` drives the page in Chromium: the shader compiles and draws;
every shape, lens style, gap fill, seed, light and finish changes what is
drawn; the controls work by pointer and keyboard; Shuffle, Randomize all, the
dice, presets, undo and redo do what they say; the link and the JSON copy
bring a look back; a photo and an SVG can be swapped in; the export is a PNG
at the photo's own size; it fits a phone; and a browser without WebGL is told
so. CI runs it on every push.

```sh
npm install                  # at the repository root, once, for Playwright
node glass/test/glass.mjs    # or: npm run test:glass
```
