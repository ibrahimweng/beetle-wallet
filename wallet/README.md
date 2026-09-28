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
in, and home in both of its states.

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
| `npm run flow` | from the loading screen to home, then out and back in as the demo account, with the doors that should be shut tried on the way; every screen photographed into `shots/` |

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

## How it is put together

| Folder | What it is |
|---|---|
| `app/` | The routes, one file per screen, grouped by whether they come before or after the session. `expo-router` reads this folder as the map. |
| `src/design/` | The design system read off the Figma file: tokens, type, icons, motion, and the pieces every screen is made of |
| `src/icons.ts` | The 95 glyphs, generated from `../src/icons.js` by `npm run icons`; never edited by hand |
| `src/features/onboarding/` | The way in: the step machine (`machine.ts`), what is remembered and the session (`store.tsx`), the rules (`validation.ts`), the screen that takes digits (`DigitStep.tsx`), and the guards that keep a step from being reached by typing its address |
| `src/features/home/` | What home shows for an account: nothing for a new one, the design's world for the demo one |
| `src/services/` | `AuthService`, `IdentityService`, storage and hashing behind interfaces, with the mocks this build runs on |
| `src/lib/` | Formatting: digit groups, naira and kobo, dates |
| `test/` | The unit tests, and the browser walk of the way in |
| `artifact/` | `npm run artifact` packages the exported bundle as a page that can be hosted anywhere, even inside another page: the phone in a frame with the keys to the mocks beside it |

Progress along the way in is kept in `AsyncStorage`, so closing the app halfway
brings you back to the step you were on. The session and the passcode hash
are kept in the device's secure store (`expo-secure-store`), with a plain
fallback on the web where there is none. The passcode itself is never kept:
a random salt and a SHA-256 of salt and code are, and `checkPasscode` compares
against that.

## How it moves

Everything is in `src/design/motion.tsx`, the way every colour is in
`tokens.ts`. A screen arrives out of a blur and leaves back into one: the one
going softens and fades in 280ms, the next sharpens and fills in 520ms, and
nothing slides in from the side. A press dips to 96% in 90ms and springs back
past full. A marker lands beside a step 140ms after the step's label has
changed. A button's label changes through a blur rather than being swapped.
The wash at the top of a step recedes while you type. The ticks on the ready
screen land one after another, and the balance on home comes into focus
rather than counting up. All of it runs on one family of curves, and all of
it stops for anyone who has asked their phone to reduce motion.

`npm run flow` traces the three moments that matter — the first screen
change, the ticks, the balance — and fails if they are not moving the way
that file says.

## What comes next

Finishing setting up (the ID card and the income question that turn the last
two limits on), the agent behind the ask bar, the shortcuts on home, and
sending money.
