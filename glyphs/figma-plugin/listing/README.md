# Listing pictures

The pictures for the plugin's page on Figma Community. `make.mjs` draws them with the site's own engine, so run it again after a change on the site, before you publish:

```
node glyphs/figma-plugin/listing/make.mjs
```

- `icon.png`: the plugin's icon, 128 by 128.
- `thumbnail.png`: the cover, 1920 by 1080.
- `carousel-1.png` to `carousel-8.png`: the carousel, 1920 by 1080 each, in this order: Stroke, Two-tone, Duotone, Fill, then rounded or sharp corners, any stroke, any colour, and the panel itself.

They name no other icon set and show no other logo, Figma's included, as the review guidelines and the four-style set's licence ask.
