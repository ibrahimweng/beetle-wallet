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
| `npm test` | the rules of the way in: what counts as a Nigerian number, what a passcode may not be, where each step leads, how the mock services answer; the scripted Beetle; the model against a fake API; the gate before money moves |
| `npm run bundle` | the same JavaScript the phone runs, exported for the web into `dist/` |
| `npm run flow` | from the lab to the welcome and on to home, then out and back in as the demo account, with the doors that should be shut tried on the way; the card pulled down and traced as it opens, money sent by asking and let through by the passcode, the account's details opened and copied, a photo taken with the browser's stand-in camera and read, money arriving, a shortcut, the model screen, and the lab's places opened on their own; every screen photographed into `shots/` |

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
| A passcode | six digits typed twice; this build also lets `654321` and `123456` through, so trying it never means thinking one up | the same digit six times, a run, a repeated pair, your year of birth, and the handful everybody picks |
| Welcome back | `0906 911 3588`, the owner's own number, opens the demo account, history and all; any number that opened an account on this device opens that one | a number nobody has opened an account with, with a way to open one |
| The chat | "Send 20k to Sarah", "top up my light", "buy data", "what about dollars", "how much do I have"; the people it knows are Sarah Adeyemi, Chidi Okafor, Musa Danjuma and John Doe, by name or account number | more than the balance; a name it does not know; anything else, with what it can do |
| Before money moves | the passcode set on the way in, or `654321` and `123456` in this build; the face, on a phone with one enrolled | three wrong tries shut the gate for thirty seconds and Beetle says so |
| Being paid | Receive on the card: the account number to copy or share; "have ₦50,000 arrive from Sarah" sets off an arrival in this build | nothing here can take money out |
| Beetle's model | a key kept on the phone from the lab's model screen, or one in the build, puts Claude behind Beetle; without one the script answers | a key that is refused, or no network: the script answers, with a note saying why |
| A photo | on the phone, the camera and the device's own reader; on the web and in Expo Go, the sample slip, which reads as Sarah Adeyemi at GTBank, `0123 4567 89` | a photo with no ten-digit number on it |

## How it is put together

| Folder | What it is |
|---|---|
| `app/` | The routes: the loading screen, the lab, the way in as one screen, and home. `expo-router` reads this folder as the map. |
| `src/design/` | The design system read off the Figma file: tokens, type, icons, motion, and the pieces every screen is made of |
| `src/icons.ts` | The 95 glyphs, generated from `../src/icons.js` by `npm run icons`, which puts the line widths the file draws them at (0.075 of the box for a glyph, 0.10 for a bare mark) and round ends back on every stroked path; never edited by hand |
| `src/features/onboarding/` | The way in: the step machine (`machine.ts`), what is remembered and the session (`store.tsx`), the rules (`validation.ts`), the one screen and its choreography (`WayIn.tsx`), what each stage of it shows (`views.tsx`, `stages.ts`), and the guard that keeps home for a session |
| `src/features/home/` | Home: the card (`WalletCard.tsx`, closed and open and the drag between), the haze at its head and its foot (`Frost.tsx`), the screen around it with the day and the chats in it (`Home.tsx`), the ask bar in its two states (`AskBar.tsx`), what the day shows for an account (`account.ts`), and the once-only dip (`first.ts`) |
| `src/features/agent/` | The chat: the conversation and what Beetle is waiting for (`conversation.tsx`), the list (`Chat.tsx`), the dark pieces it is drawn with — what was said, the panels, the dots (`Dark.tsx`) — and the chats filed in the day, Beetle's prompts among them (`chats.ts`) |
| `src/features/scan/` | The camera screen with every way it can go wrong, the photo's way back to the chat, and the sample slip |
| `src/features/passcode/` | The gate before money moves: the passcode pane over the chat (`Passcode.tsx`) and the check itself, with the tries and the lock (`check.ts`) |
| `src/features/receive/` | Being paid: the account's details over the chat (`Receive.tsx`), money arriving (`arrival.ts`), and the clipboard |
| `src/lab/` | The lab: which builds have it (`enabled.ts`), every feature and the places in it with the state each needs (`catalogue.ts`), the screen, and the tab that comes back to it |
| `src/services/` | `AuthService`, `IdentityService`, `AgentService` (Beetle: the model in `model.ts` where there is a key, the script in `agent.ts` where there is not), `ReaderService` (the device's text reader, or a stand-in), storage and hashing behind interfaces, with the mocks this build runs on |
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
grabber that says pull down. Pull it and it becomes the chat: it grows until
only the head of the day and its chips still show below it, while the figure
glides up into the header, shrinking as it goes; the buttons soften away; the
conversation arrives from below with the ask bar at the card's foot. The
header and the foot are a haze: the conversation runs up under the one and
down under the other and shows through, softened and darkened, near solid at
the card's edge and thinning to nothing — the top haze ends under the mark
and the foot haze at the middle of the ask bar, so a bubble on its way out
simply dims until it is gone, with no line anywhere; the figure keeps its
contrast, the bar sits over the tail of the conversation, and the card keeps
its silhouette. (Each sheet of the blur is masked by a gradient so its own end
fades — a `MaskedView` on the phone, CSS on the web.) The head of the
day below is the way back — a tap on it, a push up on it, a push up on the
header or on the chat once it has scrolled to its end, or the phone's own
back closes the chat. The first time on a phone, the card dips on its own
with the words "Pull down to ask Beetle", once. The keyboard shrinks the open
card rather than covering the bar. (The blur itself comes from `expo-blur` and its mask from
`@react-native-masked-view/masked-view`, both in Expo Go and the web now and
in any APK built after they were added; an older APK gets the darkening
without the blur.)

The ask bar has two states off the frame: idle, with the grey petals of the
mark, the placeholder and the camera; and active, the moment there is
something typed, with a hairline round the bar, the words in semibold, and a
black disc with an arrow where the camera was.

Beetle answers with words and with panels: what it checked and what it found,
each row landing after the last, and one thing to do about it. Press a
panel's button and the passcode comes up over the chat — the chat recedes
behind it, the amount and where it is going at the top, the six dots and the
pad under them — and the money moves only when the code is right (on a
phone with a face enrolled, the face is asked first and the pad is the way
past it). A wrong code shakes the dots and says how many tries are left; the
third wrong one shuts the gate for thirty seconds. Then the panel says Sent,
Beetle says where the money is, and the day below has the line. The amount
on a panel can be corrected by tapping it.

Under the open card, below the chips, a row of shortcuts: Bills, Data,
Receive and Photo, each a quick way into what the chat above can do. (The
frame for these is still being drawn; the row is the app's own reading of
it, in the app's icons.)

Receive, on the card, opens the account's own details over the chat: the
number, big, and whose it is, to copy or to share, with the line that says
these can only be paid into. Money arriving lands in three places at once:
the caption on the card says what came while the figure comes back into
focus, the day has the line under In, and Beetle starts a chat about it,
waiting in the day with a dot. This build can have a sample arrival happen
from the details pane, and the lab has a place for it.

Where an ask takes time — a transfer, a photo, a bill, data — Beetle says
what it is doing while it does it, in its own voice, a line at a time in the
chat ("I'm finding Sarah's account at GTBank…"), each line landing its tick
as the next begins; the lines stay above the answer, dimmed, once it is
there. The answer's words then arrive at reading speed, and the panel lands
when the sentence is done. A quick answer — the balance, a greeting — shows
none of that. Both Beetles report their steps through `onStep` on
`AgentService.ask`.

### Beetle's model

Behind `AgentService` there are two Beetles, and `src/services/index.ts`
picks between them on every ask: the model where there is a key for it, the
script where there is not. The model is Claude (`claude-opus-5-5`) through
the Messages API, with six tools that do what the app does — find an
account, prepare a transfer, a bill or data, identify a number read off a
photo, change an amount — and every tool takes a `saying`, one line in
Beetle's own voice that the screen shows while it works. The tools put up
the same panels the script does, so the chat does not know which Beetle
answered; and the model never moves money, since a panel's button still goes
through the passcode. A photo is read on the device and the words go to the
model. The model's memory of the conversation is the chat's own transcript,
rebuilt on every ask, so a chat reopened from the day carries on. When the
model cannot answer — the key refused, no network — the script answers
instead, with a note saying why.

The key comes from the phone's keychain, set on the lab's "Beetle's model"
screen, or from the build (`EXPO_PUBLIC_ANTHROPIC_API_KEY` at export time;
the Phone workflow passes the repository secret `ANTHROPIC_API_KEY` there,
so adding that secret puts the model behind Beetle on the phone). Neither is
the shape a shipped app should have: that is a server that keeps the key,
and `EXPO_PUBLIC_ANTHROPIC_BASE_URL` is where it goes when there is one. The
model is called with plain `fetch`, since React Native is not a runtime the
SDK supports; `npm test` drives it against a fake API to check the request,
the tool loop, the steps, the panels and the fallback.

Every chat is part of the day. Closing the card files the conversation at
the top of Today — what you asked, what it came to, when — and opening the
card again starts a new one, Beetle opening with something it noticed. A
chat's row picks it back up where it was, panels and all. Beetle starts
chats too: when something needs handling, its prompt is there in the day
with a dot, waiting to be opened. The Chats chip shows only those; All has
them with everything else. They are kept on the phone, per account.

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
two limits on), a server for the model's key, the receipt behind a line in
the day, and the shortcuts as the frame ends up drawing them.
