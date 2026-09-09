# Beetle — React Native

The Beetle app in React Native, built with Expo. It shares its state layer and
its icon set with the web build at the repository root, so there is one source
of truth for what the app knows and what it draws with.

## Running it

```
npm install
npm start          # then press i, a, or w
npm run ios
npm run android
npm run web
```

`npm test` runs the type check. `npx tsc --noEmit` is the same thing.

## What comes from where

Three things are generated, never edited by hand:

| File | Generated from | Command |
|---|---|---|
| `src/icons.ts` | `../src/icons.js`, the 97 glyphs exported from Figma | `npm run icons` |
| `src/state/*.js` | `../src/{data,store,flow,actions}.js` | `npm run state` |
| `src/routes.ts` | the web registry and `../test/figma-map.json` | see below |

`npm run sync` does the first two. Run it after re-exporting icons from Figma
or changing the state layer, and the two apps stay in step.

The state layer is shared rather than copied by hand. The only file that
differs per platform is `storage.js`: the web one uses `localStorage`, the one
here uses AsyncStorage and is hydrated in `App.tsx` before the first screen
draws, because the state layer reads synchronously.

## The design is the source

`src/theme.ts` holds the tokens read out of the Figma file, not approximations:
the type scale is 32/40, 20/24, 16/24, 14/20 and 12/16, cards are 24 radius
with 20 and 21 of padding, buttons are 56 tall, the dock leaves 24 above and
below its row, a screen column is spaced 20 and starts 72 down. Those numbers
came from reading frames, and every one of them was wrong at some point from
being judged by eye instead.

`src/routes.ts` records, for all 100 screens, the frame in the Figma file it is
drawn from. `../test/figma-map.json` is where that mapping lives and
`../test/geometry.mjs` is how the web build is measured against it.

## Adding a screen

1. Look up the frame in `src/routes.ts`. Open that node in Figma.
2. Write the component in `src/screens/`, using `src/components/kit.tsx`. Do
   not invent spacing: take it off the frame.
3. Register it in `BUILT` in `src/navigation.tsx`.

Any route with no component falls to `ToBuild`, which names its frame on
screen. Nothing is stranded, and what is still owed is visible while using the
app rather than hidden in a list.

## Where it has got to

Built: the design tokens, all 97 icons, the component kit (screen, page head,
card, button, list row, action row, tool panel, pill, dock), the shared state
layer, navigation across all 100 routes, and the Start and Actions screens.

Not built: the other 98 screens. They route, they name their frame, and they
are drawn by following the three steps above. The kit is what most of them
need; the ones that will want new pieces are the receipts, the keypad screens
and the chat thread.
