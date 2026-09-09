# Beetle

A Nigerian bank app with an agent that actually thinks, built in code from the
Figma file. Ninety-four screens across four acts, every route in every flow,
and money that really moves: send ₦7,500 and the balance drops, a row appears
in the feed, and the receipt shows what you actually sent.

**Live:** https://ibrahimweng.github.io/beetle-wallet/ once Pages is switched on (see Publishing).
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

**One switch, once, by hand:** in this repository, **Settings → Pages →
Source: GitHub Actions**. The workflow token is not allowed to turn Pages on
by itself, so until you flip it the Publish workflow fails on its first step.

After that, every push to `main` runs the tests and republishes the site at
`https://ibrahimweng.github.io/beetle-wallet/`. Open it on your phone and add
it to the home screen.

The **Tests** workflow is separate and runs on every push regardless, so a red
mark there always means something actually broke.

## Layout

| File | What it is |
| --- | --- |
| `src/tokens.css` | Colours, type scale, radii, spacing — read off the Figma file, not guessed |
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
| `src/screens/act3a.js` `act3b.js` | It works — 48 screens |
| `src/screens/act4.js` | Getting in — 19 screens |
| `src/screens/index.js` | The registry: every id, act, section, and what the section is for |
| `build.js` | Rolls it into one self-contained HTML file for publishing as an artifact |
| `test/render.mjs` | Every screen draws, no console errors, no sideways scroll |
| `test/interact.mjs` | Twenty-five things a slideshow cannot do |

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
npm test        # builds, then checks 94 renders and 25 interactions
```
