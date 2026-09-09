# Beetle

A Nigerian bank app with an agent that actually thinks, built in code from the
Figma file. A hundred screens across four acts, every route in every flow, the design
system's own icons, and money that really moves: send ₦7,500 and the balance
drops, a row appears in the feed, and the receipt shows what you actually sent.

**Live:** deploy it on Vercel in two clicks (see Publishing) — every push redeploys.
**Locally:** `npm start` and open http://localhost:8080

The harness puts the phone in the middle, an index of every screen down the
left, and Prev/Next — or the arrow keys — to walk a flow end to end. Each
screen is a real route: `#/home`, `#/checking`, `#/nomatch`.

## It is not a slideshow

| | |
| --- | --- |
| The keypad | Types real digits. First press replaces what was there, so ₦20,000 does not become ₦20,000,750. |
| The passcode | Four real digits, `4471` to start. Wrong ones shake, count down, and lock after three. |
| Sending | Slide to send, then the passcode. That is where the money leaves — not on the screen after it. |
| The fee | ₦25 to NIP plus 7.5% VAT, and nothing under ₦10,000. Worked out, not written in. |
| Limits | Change them and they bite. Past one, the slider is replaced by the reason. |
| The feed | One ledger. A payment shows up on home, in history, and in what the agent knows. |
| Switches | Flip, persist, and mean something: hide the balance and the balance hides. |
| Savings, dollars, bills, airtime, requests | All move real money and hand back a real receipt. |
| Reset | Bottom of the left panel. Puts every figure back to the design. |

Everything is kept in your browser and nowhere else. `window.beetleState()` in
the console shows the whole thing.

## The agent

The ask bar on every screen, `#/agentchat` and `#/firstask` send a real
question to a real model, with a brief built fresh from the account as it
stands. It finds a model in this order:

1. **Published artifact** — `claude.use("sample")`. The viewer's own Claude
   answers and no key is involved.
2. **Your own key** — press the badge at the top right of the stage and paste
   an Anthropic key. It is kept in that browser only. From the repo you can
   instead copy `beetle.config.js.example` to `beetle.config.js`.
3. **Neither** — it answers from the wording in the design, so nothing is ever
   dead. The badge says which of the three is live.

It is briefed to use plain words, never invent a figure, say what it cannot
do, and always name the APR if credit comes up.

## The name

Beetle. The name shows up plainly nearly everywhere; the beetle itself only
turns up in about eight places, all of them waiting or empty states — the
thinking indicator, the first day, an empty feed, a payment still in flight,
and the offline screen. Never near a failure and never near an amount. No bug
or debug wordplay anywhere: in a money app that reads as *something is broken*.

## Publishing

The app is plain static files: `index.html` at the root and `src/` beside it.
No bundler, no framework, nothing to compile before it can be served.

### Vercel

1. **https://vercel.com/new** → Import Git Repository → `ibrahimweng/beetle-wallet`
2. Leave every setting alone. `vercel.json` already says what to do: skip the
   install (there are no runtime dependencies), run `node build.js`, serve
   `public/`. The build assembles that directory, and the tests drive it, so
   what is checked here is exactly what is deployed.
3. Deploy.

After that, every push to `main` redeploys, and every pull request gets its own
preview URL. Open the deployment on your phone and add it to the home screen.

### GitHub Pages, if you ever want it as well

Settings → Pages → Source: **Deploy from a branch**, branch **main**, folder
**/ (root)**. It serves the same files with no workflow involved. `.nojekyll`
is already there so Pages leaves the directory alone.

The **Tests** workflow runs on every push and is the only signal that matters:
red there means something actually broke.

## Layout

| File | What it is |
| --- | --- |
| `src/tokens.css` | Colours, type scale, radii, spacing — read off the Figma file, not guessed |
| `src/icons.js` | All 97 glyph components, exported from Figma as SVG. No emoji anywhere. |
| `src/app.css` | The harness, the phone, every in-app component class |
| `src/ui.js` | The kit: one function per recurring pattern, plus the controls that operate |
| `src/data.js` | The seed world — the figures the design is written around |
| `src/store.js` | Live state, kept in the browser, with the reset |
| `src/actions.js` | The things that move money, and what each one costs |
| `src/flow.js` | The payment being put together right now, shared across the screens that build it |
| `src/agent.js` | Model wiring, the voice brief, the written fallbacks |
| `src/app.js` | Routing, the index, the phone frame |
| `src/screens/act1.js` | It goes wrong — 16 screens |
| `src/screens/act2.js` | It decides — 9 screens |
| `src/screens/home.js` | Home and the live chat — 2 screens |
| `src/screens/act3a.js` `act3b.js` | It works — 54 screens |
| `src/screens/act4.js` | Getting in — 19 screens |
| `src/screens/index.js` | The registry: every id, act, section, and what the section is for |
| `vercel.json` | Points Vercel at `public/`, which `build.js` assembles |
| `build.js` | Rolls it into one self-contained HTML file for publishing as an artifact |
| `dist/beetle.html` | That bundle, committed. CI fails if it drifts from the source. |
| `test/render.mjs` | Every screen draws, no console errors, no sideways scroll |
| `test/icons.mjs` | No emoji, every icon name real, none rendered as text |
| `test/copy.mjs` | 204 strings read out of the Figma file, checked on the screen that should say them |
| `test/interact.mjs` | Thirty things a slideshow cannot do |

The registry checks itself when the app loads: if a screen is listed but not
built, or built but not listed, it says so instead of quietly showing a
different screen.

No framework and no dependencies in the app itself. Plain modules and plain
CSS, because the point is the design and the reasoning, not the stack.

## Numbers

Everything agrees with everything else, because it is all worked out from one
place. The loan costs ₦19,500 on ₦150,000 over 90 days — 76% nominal APR,
110% effective — and the screen says so.

## Tests

```sh
npm test        # icons, copy, 100 renders across three entry points, 30 interactions
```

## Against the design

Every screen was checked against the Figma file rather than against memory.
`test/figma-copy.json` holds 204 strings read out of the file, and
`npm test` fails if a screen stops saying what the design says it says.

One deliberate difference, recorded here so it is not mistaken for drift:

- **The APR box on the loan screen.** The design does not have it. It was
  added when the pricing was made honest, and removing it would put back a
  4% a month that reads as small and is not.

The name used to be a second difference. The file said Indigo and the code
said Beetle. The file has been renamed, so the two now agree.

One inconsistency in the file itself: `Pay` says the fee on ₦50,000 is free,
while `DoneFlat` charges ₦26.88 on the same amount. The code works the fee
out, so it agrees with the receipt.

## Icons

Every icon is one of the 97 `glyph=` components in the Figma file, exported as
SVG into `src/icons.js` and coloured by CSS. There are no emoji in the app, and
`npm test` fails if one appears, if an icon name does not exist, or if a name
is ever printed as text instead of drawn — all three of which happened while
this was being built.
