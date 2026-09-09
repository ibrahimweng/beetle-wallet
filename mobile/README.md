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

## The design system

`src/design/` is the Figma file's component set written out in code, named the
same way so the two can be read side by side. A component's props are its
variant properties:

| In Figma | In code | Variants |
|---|---|---|
| Button | `<Button>` | `tone` black, grey, white, blue · `size` 44, 48, 56 |
| Bubble | `<Bubble>` | `who` You, You · typed, Beetle, Beetle · with a title |
| Page head | `<PageHead>` | `lead` no, yes |
| Tool panel | `<ToolPanel>` | `tool` Transfers, Requests, Airtime |
| Tool row | `<ToolRow>` | `go` no, yes |
| Icon | `<Icon>` | all 97 glyphs |
| Status pill | `<StatusPill>` | |
| Passcode keypad | `<Keypad>` `<Pips>` | |
| Field · typing | `<Field>` | |
| Dock, Action button | `<Dock>` `<ActionButton>` | |

Sizes come from the set, not from judgement: a 44 button is 22 radius with 20
of side padding, a 56 is 28 radius with 24, and the label is semibold.

`StepTrail` and `StepHead` are the way-in pattern. Note that the onboarding
frames set their second line at 14 regular, while the Page head component sets
it at 16. They are two different heads and both are correct in their place.

## Where it has got to

Built: the design system above, all 97 icons, the shared state layer,
navigation across all 100 routes with a path each, and sixteen screens.

- The way in: Start, Number, Code, Nin, Who, Face, Passcode, Ready, Signin,
  Signcode. Opening an account runs from the front door to "Take me in", and
  signing in runs to home.
- The send flow: Ask, Chat, Confirm, NoFace, DoneSend, Share. It runs end to
  end and the money really moves: Confirm calls the shared state layer, so the
  balance on the receipt is the balance after, not a figure typed in.
- The button's menu.

Not built: the other 84. They route, they name their frame, and the system
above is what they are made of.

## One thing the file leaves open

The Chat frame's agent bubble still carries the Bubble component's default
text, about topping up Ikeja Electric, rather than anything about the transfer
being put together. It reads like an instance nobody overrode. The screen here
uses the line the flow needs instead of copying that through. Worth a look
next time the file is open.
