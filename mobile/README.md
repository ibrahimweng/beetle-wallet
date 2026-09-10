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

`npm test` runs everything: the type check, the reachability check, then the
web bundle and the four checks that run against it. It takes a couple of
minutes and needs a Chromium (`npx playwright install chromium`).

| Command | What it proves |
|---|---|
| `npm run typecheck` | it compiles |
| `npm run reach` | every one of the 100 screens can be reached by tapping, from the first screen the app opens on |
| `npm run screens` | every screen draws, with no error and nothing blank |
| `npm run copy` | every line of text in the Figma frames is on the screen that should say it |
| `npm run motion` | screens assemble after the tap rather than appearing, sheets come up, and the menu blurs what is behind it |
| `npm run flows` | the way in, sending, buying, a bill, a request, the ask bar and the button all work, and the money really moves |

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

`src/design/tokens.ts` holds the tokens read out of the Figma file, not approximations:
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
2. Write the component in `src/screens/`, using `src/design/`. Do not invent
   spacing: take it off the frame.
3. Add its lines to `test/frames.json` if the frame is new, so `npm run copy`
   checks them.
4. Register it in `BUILT` in `src/navigation.tsx`, and make sure something
   already on screen can reach it, or `npm run reach` will say so.

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

## How it moves

`src/design/motion.tsx` is to movement what `tokens.ts` is to colour and size:
one file with every duration and spring in it, and nothing anywhere else
picking a number.

The rule the whole thing is built on is that **the tap starts the movement and
the movement finishes the tap**. Nothing appears; everything arrives, in a
direction that matches what you did to ask for it.

| | |
|---|---|
| A screen's column | Each thing rises 14 and fades in, 38 apart, so you watch the screen assemble. Nothing waits longer than 300, however far down it is. |
| Where it comes from | A sheet, a keyboard and a camera come up from the bottom. Everything else slides in from the right, the way a stack of pages does. |
| A sheet | Rises from below its own height on a heavy spring while the screen behind it recedes to 35%. What is in it then arrives in sequence. |
| A press | Gives 3% under the finger and springs back, before the screen it asks for arrives. |
| The button's menu | The home behind goes soft — a real blur, `expo-blur`, not a white wash — while the five actions come up out of the button you pressed, nearest first, each overshooting and settling. The plus turns 45° into a cross, and starts turning under your finger on the home screen before the menu screen finishes it. Closing runs the whole thing backwards before the screen goes. |

Everything is a spring rather than a curve, because a spring keeps the
momentum of whatever you just did. Anybody whose phone is set to reduce motion
gets none of it: `useStill()` reads that setting, and every piece here starts
in its finished state when it is on. A screen drawn behind a sheet is scenery,
not an arrival, so it skips its entrance too.

This is **react-native-reanimated**, which runs the animation on the UI thread,
so a screen still moves smoothly while JavaScript is busy putting the next one
together. anime.js and every other DOM animation library cannot be used here:
on a phone there are no DOM nodes to animate.

## Checked against the frames, not against memory

`test/frames.json` is every line of text in all 91 Figma frames, read straight
out of the file and keyed the way `src/routes.ts` keys them. `npm run copy`
opens each screen in the exported bundle and checks the frame's lines are on
it. That is 1,304 lines across 91 frames.

Fourteen lines are recorded in `test/copy.json` as deliberate differences, each
with the reason. They fall into three kinds:

- **A balance that moves.** The frame prints the balance the design had that
  day; the app prints the one the store actually holds after the payment.
- **A component's placeholder.** The Chat and Confirm frames carry the Bubble
  component's unoverridden default text, about topping up Ikeja Electric,
  rather than anything about the transfer. It reads like an instance nobody
  overrode, so the screen uses the line the flow needs.
- **Where the file disagrees with itself.** The Chat and Send money frames
  price a transfer as Free while the receipt for the same transfer charges
  ₦26.88. The app follows one rule everywhere — ₦25 to NIP plus 7.5% VAT above
  ₦10,000 — which is the receipt's.

All three are worth a look next time the file is open.

### A cap is not a wall

The Spending limits frame says ₦36,000 is left "before I stop and ask you
twice", and asking twice is exactly what the Past your own limit frame is:
your passcode, then the three words typed out in full. So a transfer past a
cap is not blocked on the form. The slide is there, and it leads through that
screen instead of straight to the passcode. Only money that is not in the
account stops the slide.

That is why Send money opens on a ₦50,000 flat deposit with the slide, as its
frame draws it, even though ₦64,000 of the ₦100,000 day cap has already gone.
`npm run flows` walks that path and fails if the slide stops going.

## Where it has got to

All 100 screens are built, every route has a path, and every screen can be
reached by tapping. Money moves through the shared state layer, so a transfer
made anywhere shows up in the balance, the feed and the history at once.

- **Act One, when it goes wrong** — sixteen screens, from the reasoning panel
  to the dispute that closed.
- **Act Two, what it decides** — standing instructions, the caps, what opens
  the app, and the phone in the wrong hands.
- **Act Three, what it does** — sending four ways, buying, asking to be paid,
  bills from a photo and from the list, being paid, the services drawer,
  borrowing, the card, the record, the pot, and dollars.
- **Act Four, getting in** — opening an account, finishing the checks, the
  first day, and coming back.

The ask bar is on almost every screen. A question either takes you to the
screen that answers it or goes to the chat, which answers from what is really
in the store — see `src/state/agent.ts`. Nothing here reaches a network.
