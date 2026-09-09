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

### What is pinned, and what is still adrift

`test/figma-map.json` records which frame in the Figma file each screen was
built from. Eighty-nine of the hundred screens trace to one, and every screen
the design has is built. `test/design.json` pins what each screen says and
draws, and `npm test` fails if either moves. Rebuild it with `npm run
design:write`, and only after checking the change against the frame the map
names.

Twelve screens have been read against their frame line by line so far. These
are the differences that pass still owes, each against the frame named:

- **home** (`225:3`). The design lists four things under Today: the flat
  deposit, the data for Mum, the groceries and the subscription. The code
  lists seven, adding the pending, failed and returned rows the later flows
  need. The design also puts "Where your money went" after the virtual card
  row, not before it.
- **chat** and **confirm** (`205:57`, `239:7762`). The design's fee row on
  ₦20,000 reads Free. The code works the fee out and shows ₦26.88. The file
  disagrees with itself here, because DoneSend charges ₦26.88 on the same
  transfer, so this one needs a decision rather than a patch.
- **donesend** (`239:7829`). The design's note under the fee is "Transfers
  under ₦10,000 carry none"; the code says "₦25 to NIP plus 7.5% VAT". The
  design offers "She has it. Rent again next month?" with "Set it up", which
  the code does not. The design asks "Something wrong with this?"; the code
  says "Something is wrong with this".
- **share** (`472:10886`). The design's subtitle carries the time, "₦20,000 to
  Sarah Adeyemi, 7:55 AM". The code leaves it off.
- **pay** (`332:9851`). The design frame shows the ₦50,000 flat deposit with
  the fee free. The code shows the ₦20,000 rent transfer with ₦26.88.
- **request** (`225:1606`). The design is a chat with a Beetle Requests panel.
  The code is a form headed "Ask to be paid". These are not the same screen.
- **sent** (`239:8294`). The design says "For · Rent balance"; the code says
  "Rent, the part you owe from August". The code adds a "Pretend they just
  paid" button and a note about it that the design does not have.
- **asksvc** (`225:2620`). The design suggests "Pay my light bill", "How much
  did I spend on data?" and "Top up my own line". The code suggests three
  other things.
- **receive** (`332:9555`) and **ways** (`222:199`). Several rows are worded
  differently from the design.
- The sheets that sit over home (ask, askreq, asksvc, typed, typedask,
  receive) show the whole home screen behind them in the design. The code
  shows a shorter one.

Seventy-nine screens have not been read against their frame yet. Until they
have, the pinned fixture is a guard against drift rather than proof of
fidelity, and this list is the honest state of it.

### The layout, measured

`node test/geometry.mjs out.json` records where every line of text sits on
every screen, with its size and weight. Comparing that against the same
measurements taken from the frames in `figma-map.json` is how layout gets
checked, because judging it by eye is what let the type run loose and the
onboarding trail get drawn as headings.

All ninety-one screens have been measured against their frames once. What
that found and fixed: page heads set their second line at 14 where the design
sets 16, and 4 below the title where the design leaves 8, which was wrong on
about thirty-five screens; and the onboarding trail drew every step already
behind you as a 32 point heading where the design draws a quiet 16 point line,
which was wrong on ten.

What it found and has not fixed yet, with the measurement:

- **Sheets drawn as whole screens.** The design draws Services, Bills, Loan,
  Card, Dollars, Airtime, PowerPay, Scan, ScanBill, Meter, PayFrom and others
  as a sheet over the home screen, so their content starts 50 to 200 lower
  than the app puts it and their first line is a 16 point label rather than a
  32 point title. Services reads 16 at y 147 in the design and 32 at y 72 in
  the app.
- **Title weights.** Settings is 32 bold in the design and 32 semibold in the
  app. Others differ the same way.
- **Bills** is not the same screen: its "3 of 5 covered" is a 12 point label
  inside the design, and a 32 point page title in the app.

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
