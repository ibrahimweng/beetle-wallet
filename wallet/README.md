# Beetle — the app

The product itself, built one feature at a time in React Native with Expo.
`mobile/` is the prototype of every screen in the Figma file; this folder is
the app people will use, so everything in it is real: validation that says
no, progress that survives closing the app, a session, a passcode that is
hashed before it is kept, and services behind interfaces so that the mock
this build runs on can be swapped for the bank's own without touching a
screen.

What is here so far is the way in: the first loading screen, the welcome,
opening an account (number, six digits by text, NIN or BVN, the record that
comes back, a face, a passcode typed twice, the account being ready), signing
in, and home — the black card with the balance, the day under it, and the
chat the card turns into when it is pulled down, where Beetle sends money,
tops up, buys data and reads an account number off a photo.

Each feature is a folder under `src/features/`, and every build but the
production one opens on the **lab**, a screen that lists them so each can be
tried on its own. See [the lab](#the-lab).

## Running it

```
npm install
npm start          # then press i, a, or w
npm run ios
npm run android
npm run web
```

`npm run verify` runs everything in order: the type check, the unit tests, the
web bundle, then the whole way in driven through a browser with a picture of
every screen. It needs a Chromium (`npx playwright install chromium`, or set
`CHROMIUM` to one already on the machine).

| Command | What it proves |
|---|---|
| `npm run typecheck` | it compiles, with `strict` and `noUncheckedIndexedAccess` on |
| `npm test` | the rules of the way in: what counts as a Nigerian number, what a passcode may not be, where each step leads, how the mock services answer |
| `npm run bundle` | the same JavaScript the phone runs, exported for the web into `dist/` |
| `npm run flow` | from the lab to the welcome and on to home, then out and back in as the demo account, with the doors that should be shut tried on the way; the card pulled down and traced as it opens, money sent by asking, a photo taken with the browser's stand-in camera and read, and the lab's places opened on their own; every screen photographed into `shots/` |

## What this build accepts

Nothing is texted and no register is asked. `src/services/index.ts` wires the
mocks in and says so on the code screen; a real `AuthService` and
`IdentityService` slot in there.

| Where | What works | What says no |
|---|---|---|
| Your number | any Nigerian mobile number: 070, 080, 081, 090 or 091 and eleven digits | anything else, with the reason under the field |
| Six digits | `123456` | `000000` has expired; any other six do not match, three of those and a fresh code is sent on its own |
| Who you are | `1234 5678 900` comes back as Ibrahim Musa, born 14 June 1996 | eleven digits with `0000` in them match nothing; the rest come back as a name made from the digits |
| Your face | on a phone, the device's own face check; on the web, a moment's wait | a face check that does not take, with try again; or do it later |
| A passcode | six digits typed twice | the same digit six times, a run, a repeated pair, your year of birth, and the handful everybody picks |
| Welcome back | `0803 214 4471` opens the account the design is drawn around, history and all; any number that opened an account on this device opens that one | a number nobody has opened an account with, with a way to open one |
| The chat | "Send 20k to Sarah", "top up my light", "buy data", "what about dollars", "how much do I have"; the people it knows are Sarah Adeyemi, Chidi Okafor, Musa Danjuma and John Doe, by name or account number | more than the balance; a name it does not know; anything else, with what it can do |
| A photo | on the phone, the camera and the device's own reader; on the web and in Expo Go, the sample slip, which reads as Sarah Adeyemi at GTBank, `0123 4567 89` | a photo with no ten-digit number on it |

## How it is put together

| Folder | What it is |
|---|---|
| `app/` | The routes: the loading screen, the lab, the way in as one screen, and home. `expo-router` reads this folder as the map. |
| `src/design/` | The design system read off the Figma file: tokens, type, icons, motion, and the pieces every screen is made of |
| `src/icons.ts` | The 95 glyphs, generated from `../src/icons.js` by `npm run icons`; never edited by hand |
| `src/features/onboarding/` | The way in: the step machine (`machine.ts`), what is remembered and the session (`store.tsx`), the rules (`validation.ts`), the one screen and its choreography (`WayIn.tsx`), what each stage of it shows (`views.tsx`, `stages.ts`), and the guard that keeps home for a session |
| `src/features/home/` | Home: the card (`WalletCard.tsx`, closed and open and the drag between), the screen around it (`Home.tsx`), the ask bar that moves between the dock and the card, what the day shows for an account (`account.ts`), and the once-only dip (`first.ts`) |
| `src/features/agent/` | The chat: the conversation and what Beetle is waiting for (`conversation.tsx`), the list (`Chat.tsx`), and the dark pieces it is drawn with — what was said, the panels, the dots (`Dark.tsx`) |
| `src/features/scan/` | The camera screen with every way it can go wrong, the photo's way back to the chat, and the sample slip |
| `src/lab/` | The lab: which builds have it (`enabled.ts`), every feature and the places in it with the state each needs (`catalogue.ts`), the screen, and the tab that comes back to it |
| `src/services/` | `AuthService`, `IdentityService`, `AgentService` (the scripted Beetle), `ReaderService` (the device's text reader, or a stand-in), storage and hashing behind interfaces, with the mocks this build runs on |
| `src/lib/` | Formatting: digit groups, naira and kobo, dates |
| `test/` | The unit tests, and the browser walk of the way in |
| `artifact/` | `npm run artifact` packages the exported bundle as a page that can be hosted anywhere, even inside another page: the phone in a frame with the keys to the mocks beside it |

Progress along the way in is kept in `AsyncStorage`, so closing the app halfway
brings you back to the step you were on. The session and the passcode hash
are kept in the device's secure store (`expo-secure-store`), with a plain
fallback on the web where there is none. The passcode itself is never kept:
a random salt and a SHA-256 of salt and code are, and `checkPasscode` compares
against that.

## The lab

A feature is built and tried on its own before it is joined to the rest, so
every build but the production one opens on the lab instead of the app. It
lists each feature, and inside each the places worth opening: every stage of
the way in, and home as a new account and as the demo one. Tap a place and
the app is put in the state that place needs — the steps before it done, a
session where one is wanted — and opens there. The passcode step is one tap
away, not six. A small dark tab on the right edge of every other screen comes
back to the lab; so do the phone's own back gesture and the browser's back.

The lab also says which build it is (the update it is running and when it was
sent) and can fetch the latest one on the spot, instead of waiting for the
next open. "Forget everything on this phone" clears the session and the way
in.

Which builds have it is decided in `src/lab/enabled.ts`: every build except
one on the `production` update channel, so the preview APK, Expo Go, the web
export and a development build all open on it and the production build never
does. `EXPO_PUBLIC_LAB=0` or `=1` at export time overrides that either way,
and `eas.json` sets it to `0` for the production profile as well.

To add a feature: make its folder under `src/features/`, give it a route
under `app/`, and add it to `FEATURES` in `src/lab/catalogue.ts` with the
places to open and the state each needs. `npm test` checks the catalogue —
every stage of the way in listed once, each seeded with exactly the way
there.

## Home and the chat

The black card at the top holds the balance, Send and Receive, and a
grabber that says pull down. Pull it and it becomes the chat: it grows to two
thirds of the screen while the figure glides up into the header, shrinking as
it goes; the buttons soften away; a hairline and the conversation arrive from
below; and the ask bar rises out of the dock into the card's foot. The head of
the day stays showing below it as the way back — a tap on it, a pull up on
the header, or the phone's own back closes the chat. The first time on a
phone, the card dips on its own with the words "Pull down to ask Beetle",
once. The keyboard shrinks the open card rather than covering the bar.

Beetle answers with words and with panels: what it checked and what it found,
each row landing after the last, and one thing to do about it. Confirm a
transfer and the panel says Sent, Beetle says where the money is, and the day
below has the line. The amount on a panel can be corrected by tapping it.

The camera at the end of the ask bar reads an account number off whatever it
sees — a slip, a screen, a card. On a phone with the build that carries it,
Google's on-device text reader does the reading, offline; the web and Expo
Go use a stand-in that reads the sample slip in `assets/`. The scripted
Beetle and the reader sit behind `AgentService` and `ReaderService` in
`src/services/`, so a real model and a real service slot in without a screen
changing.

The camera and the reader are native, so they need an APK built with them
in; every other change still reaches the phone as an update.

## How it moves

The way in is one screen that never reloads. What changes as you go is the
colour of the wash at the top, the glyph above the title, the stack of
finished steps above that, the title, the line under it, what sits beneath
and what waits at the bottom. A finished step's title travels up into the
stack, shrinking as it goes, and the next title takes its place; content
arrives from below out of a blur and leaves upward into one; the keypad and
the button rise and drop like a keyboard. Going back runs the same movements
the other way.

Every duration and curve is in `src/design/motion.tsx`, the way every colour
is in `tokens.ts`. Whatever arrives comes out of a blur, whatever leaves goes
back into one: the thing going softens and fades in 280ms, the next sharpens
and fills in 520ms, and nothing slides in from the side. A press dips to 96% in 90ms and springs back
past full. A marker lands beside a step 140ms after the step's label has
changed. A button's label changes through a blur rather than being swapped.
The wash at the top of a step recedes while you type. The ticks on the ready
screen land one after another, and the balance on home comes into focus
rather than counting up. All of it runs on one family of curves, and all of
it stops for anyone who has asked their phone to reduce motion.

`npm run flow` traces the moments that matter — the first screen change,
the ticks, the balance, the card opening under a finger, the first-time
dip — and fails if they are not moving the way that file says.

## What comes next

Finishing setting up (the ID card and the income question that turn the last
two limits on), the passcode before money moves, a real model behind
`AgentService`, receiving, and the shortcuts on home.
