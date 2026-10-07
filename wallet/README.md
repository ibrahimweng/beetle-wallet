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
comes back, a face, a passcode typed twice, the account being ready, and
finishing setting up: where you live, a photo of an ID, where the money comes
from, and everything being on), signing in, and three pages side by side
under one bar — home, with the black card and Savings, Loan, Card and
Services under it; Activities, the record; and Settings — swiped between
like pages on an iPhone, and the chat the card turns into when it is
pulled down, where Beetle sends money, tops up, buys data and reads an
account number off a photo.

How it looks and moves is set down in [`DESIGN.md`](DESIGN.md): no drop
shadows, forms that speak under their fields, the amount picker, the bank
always said, asking before what cannot be undone, and the rest. A screen
keeps those rules; where a Figma frame disagrees, the rule is the newer word.

Each feature is a folder under `src/features/`. The app opens as itself in
every build; every build but the production one also carries the **lab**, a
screen behind a long press on the version line in Settings that lists the
features so each can be tried on its own. See [the lab](#the-lab).

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
| `npm test` | the rules of the way in: what counts as a Nigerian number, what a passcode may not be, where each step leads, how the mock services answer; the scripted Beetle and what it asks for; the model against a fake API, its ask panel and its tools; what Beetle knows of the country — the networks by prefix, the plans, the companies, the meters, what was paid before; the gate before money moves; the hour a chat carries on for; the receipts' figures; the order of the record; the three words past a limit; and that what runs on the phone's animation thread — a gesture's callbacks, an animated style, an animation's last callback — calls nothing that is not a worklet and reaches for nothing that cannot be copied there (React Native's Keyboard, a router, anything made with new), the stops the web never shows (`test/worklets.test.mjs`) |
| `npm run bundle` | the same JavaScript the phone runs, exported for the web into `dist/` |
| `npm run flow` | from the boot to the welcome and on to home, then out (Sign out asking first) and back in as the demo account, with the doors that should be shut tried on the way and the lab opened from the version line; the card pulled down and traced as it opens down to the bar that stays under it, with the six chips over the input putting their cards up in the chat, Activities and back to the chat as it was and Home again closing it, money sent by asking and let through by the passcode, the card pulled just past where it opens and held there going on by itself with its light coming and going and Home closing it with the quiet glow, the account's details opened and copied, the saving counted — four taps to put money away, three to start a goal — with a goal edited, paused and ended, money taken out and the Save chip's card, a photo taken with the browser's stand-in camera and read, money arriving, the model screen, the four cards on home, the Services card swiped through and the pages swiped between, a chat carried on and New chat in the drawer, the receipt card opening where it is in the chat's dark with every detail, closed with a tap on the frost and See in Activities turning to the record, and every receipt after paying as the sheet with the share sheet, the offers in the black card and its × leaving the empty card in their place, the empty card when there is nothing to offer, the Services card starting on All services, the bar's glass pill, Savings as a sheet over home and Airtime as a sheet over the Services sheet, a title shrinking on Settings, Settings with every row followed — the switches kept, a new passcode, the three words past a limit, an instruction offered and set up, the other devices signed out, the phone that is not yours frozen, the card revealed and frozen — the bar and More under its white veil, the pages sliding under a bar that stays put, the record narrowed to In and to Insights and a line opened in place over the frost — not who, not the total, the session id kept back, its ··· with Ask Beetle about this — and closed with a tap off it, every frame of the close read to see the rows go before the frost thins, the four asks — a transfer with no amount, data for a new number, airtime on the own line, a bill from a new meter and from one paid before — each filled on its card or from Recent, its button saying what is still missing, and taken from that button through the passcode to its receipt; money sent from the Send money page — To as a $tag, as a number with its bank picked and the name checked, and from the people paid before; the amount moved on the ruler and typed in place, a reference typed, the slide, the passcode with the whole of it and Cancel, the receipt, and the line on Activities — then filled from a message, from a photo, stopped hard at what Everyday can send, and from a digit the reader was not sure of; every state of a transfer and every way out of it; the face that did not take; and the lab's places opened on their own; every screen photographed into `shots/` |
| `npm run figma` | every built screen — thirty-eight of them — against its Figma frame: each named piece where the frame puts it, within three of the frame's figure or of that figure snapped to the 4-point grid; the frame's words on the screen; what is off on purpose listed with its reason; the frame and the screen side by side in `shots/figma/` |

## On the frame

Every screen is built from its frame in the Figma file and held to it.
`test/figma/<key>.xml` is the frame's layer listing as the file reports it,
`<key>.png` its picture, and `test/figma/screens.json` says which lab place
shows the screen and which pieces to measure. `npm run figma` opens each
screen, waits for it to stop moving, and compares every piece's place and
size with the frame's. The frames carry odd numbers — a row 42 tall, a
column starting at 346.4 — and the app keeps every size and gap on the
4-point grid, so a piece counts when it is within two of the frame's figure
or of that figure snapped to the grid. What is off on purpose is in
`test/figma/allowed.json` with its reason — a number that is the account's
own, a frame whose spacing is the odd one out among its siblings, a line
reworded for six digits — and nothing else passes. Two frames box their
head at 59 and let its second line run under the first card; the build
gives the line its room, so those screens are anchored on that card and
everything below is held to the frame from there, with the anchor's own
offset reported and allowed by name like anything else. The frames give
many pages Beetle's mark and a bubble; no page has one (DESIGN.md, Pages),
so each of those bubbles is allowed as missing, by name and place. What came
up into its room is not let off: an allowance can name a band of the frame
that moved as one, by how much and why, and every piece in it is still held
to the frame, moved by that much.
`shots/figma/<key>.png` lays the frame and the screen side by side with
the verdict beside them.

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
| A passcode | six digits typed twice, kept stretched for that account alone; in the lab `654321` and `123456` pass too, so trying it never means thinking one up | the same digit six times, a run, a repeated pair, your year of birth, and the handful everybody picks |
| Finishing setting up | Finish setting up on the ready screen, or wherever a limit it lifts is in the way (Spending limits, Dollars, Borrow, the New account chip on the card): a street and an area typed into one card, Take it for the ID (the camera on a phone, a moment on the web), one tap on where the money comes from, and Take me in; the day's cap can then be raised to ₦1,000,000, and dollars and borrowing open | a street or an area under three letters; Continue waits for a source to be picked; Back on every step, to the ready screen or to the page that opened it |
| Welcome back | `0803 000 0001`, the demo account's made-up number, opens the demo account, history and all; any number that opened an account on this device opens that one | a number nobody has opened an account with, with a way to open one |
| The chat | "Send 20k to Sarah", "top up my light", "buy data", "what about dollars", "how much do I have"; the people it knows are Sarah Adeyemi, Chidi Okafor, Musa Danjuma and John Doe, by name or account number | more than the balance; a name it does not know; anything else, with what it can do |
| Send money | Send on the card, or Send money in More: someone paid before, a ten-digit number typed, or one read off a photo; any amount up to what Everyday holds; a reference; Slide to send, then the passcode | more than the balance: Not enough, with three ways to close it; a digit the reader was not sure of: Check this number, with both readings |
| The fee | nothing under ₦10,000; ₦26.88 up to ₦50,000 and ₦53.75 above, the banks' own with the tax on it, on the page, in the chat's panel and on the receipt alike | |
| Before money moves | the account's own passcode, or `654321` and `123456` in the lab and on the demo account; the face, on a phone with one enrolled and Face ID on in Lock and privacy; past one transfer's cap or the day's, the three words typed in full after the passcode (the demo's day has ₦84,000 out already) | three wrong tries shut the gate for half a minute, then five minutes, half an hour, two hours, kept on the phone; a face that does not take says so in red, and the face key tries again |
| Opening the app | with an account signed in, and back after the wait Ask again after sets: the face or the passcode, as before money moves; Not you? signs out | the same gate: three wrong tries shut it |
| Being paid | Receive on the card, the Receive shortcut or Receive in More: the sheet with the account number and the $tag, Copy on each and Share details, then Ask someone and In dollars; "how do I get paid" typed at home puts the chat's Receive card up; the lab can have ₦50,000 arrive from Sarah | a build that cannot reach the clipboard says to read it off the sheet; nothing here can take money out |
| Asking for money | "ask musa for 20k for the rent balance" typed at home, a photo of a message asking for the account (the sample message in this build), or Ask someone on the Receive sheet; the people it can ask are Musa Danjuma, Sarah Adeyemi and Chidi Okafor, or a name with a phone number typed in the reply bar; the amount on the keypad; Send the request once it has a date | a reply with no name or figure in it says so; asking cannot move money, so there is no passcode |
| Saving | Savings on home, Add money, Put away, the passcode: four taps; + New goal, filled with the next idea (Rent, Emergency fund, School fees…), and Start saving: three; Take out, Edit goal, Pause goal and End goal from the page and its ···; the Save chip in the open chat, or "save 10k for rent" typed there | more than Everyday holds, or than the goal holds when taking out, stops the picker hard; a goal with nothing in it ends after the sheet that asks first, one with money in it through the passcode |
| Beetle's model | a key kept on the phone from the lab's model screen, or a server of Beetle's own named at export time, puts Claude behind Beetle (a key in a build only while developing); without one the script answers | a key that is refused, or no network: the script answers, with a note saying why |
| A photo | on the phone, the camera and the device's own reader; on the web and in Expo Go a stand-in, which says so on the camera: the samples read as themselves (the slip as Sarah Adeyemi at GTBank, `0234 5678 90`, the message as Musa asking for 20k for the rent balance, the bill and the data message), and a photo taken reads as the sample the camera was opened for | a photo with no ten-digit number on it; opened for a bill or for data, a photo that is neither, said, with the camera staying; on the Send money page, a reading the reader is not sure of stops at Check this number; a message asking to be paid stops at Read from your photo, over the camera |

## How it is put together

| Folder | What it is |
|---|---|
| `app/` | The routes: the loading screen, the lab, the way in as one screen, home, Send money and the pages around it, a receipt, a transfer's state pages, the request and Request sent, the goals, Bills, Pay a bill and What I found, All services, Buy data and the top-up, Borrow, Activities and the answer, Settings and the pages its rows lead to. `expo-router` reads this folder as the map. |
| `src/design/` | The design system read off the Figma file: tokens, type, icons, motion, and the pieces every screen is made of — among them the amount picker (`Amount.tsx`, and `AmountSheet.tsx` for a page with no room for it), the ··· and its pop-up (`Menu.tsx`), the soft blurs and the frosted glass (`Glass.tsx`), a page's title shrinking as it scrolls (`collapse.ts`, `PageHead.tsx`), and the phone's clicks and knocks (`haptics.ts`) |
| `src/icons.ts` | The 96 glyphs, generated from `../src/icons.js` by `npm run icons`, which puts the line widths the file draws them at (0.075 of the box for a glyph, 0.10 for a bare mark) and round ends back on every stroked path, and cuts a solid glyph's white details (the face in Face ID, the card's stripe, the shield's tick, the clock's hands, the house's door) out of it through a mask, so they show whatever the glyph sits on; never edited by hand |
| `src/features/onboarding/` | The way in: the step machine (`machine.ts`), what is remembered and the session (`store.tsx`), the rules (`validation.ts`), the one screen and its choreography (`WayIn.tsx`), what each stage of it shows (`views.tsx`, `stages.ts`), and the guard that keeps home for a session |
| `src/features/tabs/` | The three pages side by side (`Pager.tsx`): which one shows and what holds them still (`tabs.ts`), what a page knows of itself (`page.tsx`), and the old addresses that turn to one (`Redirect.tsx`) |
| `src/features/home/` | Home: the card (`WalletCard.tsx`, closed and open and the drag between), the haze at its head and its foot (`Frost.tsx`), the offers inside it (`Promos.tsx`), the four cards under that (`Grid.tsx`), the page around them with the chat, the drawer and the sheets (`Home.tsx`), the ask bar in its two states (`AskBar.tsx`), what the record shows for an account (`account.ts`), what moved on this phone since (`moves.ts`), and the once-only dip (`first.ts`) |
| `src/features/agent/` | The chat: the conversation and what Beetle is waiting for (`conversation.tsx`), the list (`Chat.tsx`), the dark pieces it is drawn with — what was said, the panels, the dots (`Dark.tsx`) — the ask panel with its fields (`AskPanel.tsx`) and the list of what was paid before that grows out of it (`SavedPeek.tsx`), the receipt's card, which opens where it is in the chat's dark with every detail (`ReceiptCard.tsx`, `ChatOpen.tsx`), and the chats, Beetle's prompts among them (`chats.ts`), with the hour they carry on for (`hour.ts`) and the drawer they live in (`Drawer.tsx`) |
| `src/features/scan/` | The camera from its frames (`Scan.tsx`): every way it can go wrong, the photo read on the spot and drawn back with what was found, the sample photos in its gallery (`sample.ts`), the sheet a message puts up over it (`ReadSheet.tsx`) and the rows it and What I found lay their pieces on (`ReadRows.tsx`), and the photo's way back to the screen that asked (`handoff.ts`) |
| `src/features/passcode/` | The gate before money moves: the passcode on its sheet over the chat (`Passcode.tsx`) and the check itself, with the tries and the lock (`check.ts`) |
| `src/features/receive/` | Being paid: the Receive sheet (`ReceiveSheet.tsx`), the account's own details the sheet and the chat's card hand out (`details.ts`) and the way they are copied and shared (`share.ts`), a card's picture shared or saved (`picture.ts`), money arriving (`arrival.ts`), and the clipboard |
| `src/features/request/` | Asking for money: who can be asked (`people.ts`), what the pages hand each other (`hand.ts`), the words typed at home that are a page (`intent.ts`), Read from your photo over the camera (`FoundSheet.tsx`), the Request page (`Request.tsx`) and what Beetle says on it (`words.ts`), the requests kept (`requests.ts`), and Request sent (`Asked.tsx`) |
| `src/features/bills/` | Bills: the billers and the month (`billers.ts`), the page that pays one (`PayBill.tsx`), the month's page (`Bills.tsx`), What I found for a bill read off a photo (`Meter.tsx`), and what the pages hand each other (`hand.ts`) |
| `src/features/services/` | All services: the drawer (`Services.tsx`) and what it lists, with the way the bar's words find one (`services.ts`) |
| `src/features/data/` | Data and airtime: the page (`BuyData.tsx`), the sheet over the camera for a message asking for data (`TopupSheet.tsx`), the chat that prices a top-up read off a photo (`Topup.tsx`), and what the pages hand each other (`hand.ts`) |
| `src/features/loan/` | Borrow: what a loan costs (`loan.ts`) and the page (`Loan.tsx`) |
| `src/features/dollars/` | Dollars: the rate, the fee and the sums (`dollars.ts`), the page (`Dollars.tsx`), Convert (`Convert.tsx`) and Converted (`Converted.tsx`), and the Pay from sheet the paying pages put up (`PayFromSheet.tsx`) |
| `src/features/goal/` | Putting money away: the goals and where each stands, the ideas a new one is filled with and the words that mean saving (`goals.ts`), the goals kept on the phone (`store.ts`), the frames' Holiday and what feeds the first goal (`goal.ts`), the page with its pills, its ··· and its sheets (`Goal.tsx`), the sheet a goal is started or changed on (`GoalSheet.tsx`), the sheet that feeds it (`FeedSheet.tsx`), and what the keypad hands back (`hand.ts`) |
| `src/features/health/` | Money health: the score and the five habits (`health.ts`) and the page (`Health.tsx`) |
| `src/features/send/` | Sending money: the page (`Send.tsx`), Not enough (`Short.tsx`), Check this number (`Misread.tsx`), and what the pages hand back to the one under them (`hand.ts`) |
| `src/features/transfers/` | A transfer that is not done: Still on its way, It did not go and It came back (`Transfer.tsx`), What went wrong? (`Wrong.tsx`), Asking for it back (`Recall.tsx`), I sent it wrong (`AlreadyGone.tsx`), what each says about a line (`states.ts`) |
| `src/features/receipts/` | A receipt for every line of the record: the record and the frames' own figures (`receipts.ts`), the receipt sheet every payment ends on, the chat's receipt and a receipt by its address open as (`ReceiptSheet.tsx`, `Over.tsx` for the address), what a receipt's view shares — the receipt, its ··· and sharing it (`use.tsx`), the share sheet (`ShareSheet.tsx`); the card in the chat is `src/features/agent/ReceiptCard.tsx` |
| `src/features/more/` | The one foot every screen shares (`Foot.tsx`): the bar on the three pages and under the open chat, and on a page Back beside its button, Back and Slide to send, or Back alone, morphing from the one to the other; and More, the actions up out of its plus (`More.tsx`), with the way a page hands a question, or a transaction, to the chat on home |
| `src/features/activities/` | The record (`Activities.tsx`) in the frame's order (`rows.ts`), a line opened where it is, the line itself, with the frost round it (`OpenLine.tsx`), a receipt opened over the page it came from and the rows both show (`InPlace.tsx`), and the answer to a question about spending (`Answer.tsx`) |
| `src/features/settings/` | Settings from the gear on the bar (`Settings.tsx`), Your details on its sheet (`Details.tsx`), what the pages set, kept per account (`prefs.ts`), and the pages: Lock and privacy, Spending limits and Past your own limit (`words.ts` holds the three words), Standing instructions and Set this up?, Devices, Not your phone, A new passcode, Virtual card |
| `src/lab/` | The lab: which builds have it (`enabled.ts`), every feature and the places in it with the state each needs (`catalogue.ts`), the screen, and the tab that comes back to it |
| `src/services/` | `AuthService`, `IdentityService`, `AgentService` (Beetle: the model in `model.ts` where there is a key, the script in `agent.ts` where there is not), what Beetle knows of the country (`nigeria.ts`: the networks by prefix, the data plans, the electricity companies, what a meter number looks like, a `MeterService` that says whose a meter is, and the people, lines and meters paid before), `ReaderService` (the device's text reader, or a stand-in), storage and hashing behind interfaces, with the mocks this build runs on, and the last problem that stopped the app, kept for the next open (`problems.ts`) |
| `src/lib/` | Formatting: digit groups, naira and kobo, dates; and the amount picker's steps (`steps.ts`) |
| `test/` | The unit tests, and the browser walk of the way in |
| `artifact/` | `npm run artifact` packages the exported bundle as a page that can be hosted anywhere, even inside another page: the phone in a frame with the keys to the mocks beside it |

Progress along the way in is kept in `AsyncStorage`, so closing the app halfway
brings you back to the step you were on. The session and the passcode hash
are kept in the device's secure store (`expo-secure-store`), with a plain
fallback on the web where there is none. The passcode itself is never kept:
a random salt and a SHA-256 of salt and code are, and `checkPasscode` compares
against that.

## The lab

The app opens as itself in every build: the welcome on a new phone, the
step somebody left off on, or home. Behind it, in every build but the
production one, is the lab: every feature and, inside each, the places
worth opening on their own — every stage of the way in, home as a new
account and as the demo one, each ask, each state of a transfer. Tap a
place and the app is put in the state that place needs — the steps before
it done, a session where one is wanted — and opens there. The passcode
step is one tap away, not six. The lab is behind a long press on the
version line at the foot of Settings; once it has been opened, a small
dark tab on the right edge of every other screen comes back to it, until
Leave the lab puts the tab away. The checks start at the lab directly, at
`/lab`.

The lab also says which build it is (the update it is running and when it was
sent) and can fetch the latest one on the spot, instead of waiting for the
next open. "Forget everything on this phone" clears the session and the way
in.

A phone keeps no log a tester can read, so the app keeps its own last
problem (`src/services/problems.ts`): an error that would stop it is
written to the keychain before it does, and the next time a build with the
lab opens it says what it was, with Copy the details. An error inside the
screens stops nothing: the screen says something went wrong, with Try
again (and, with the lab, the error's own words). If Expo Go closes and
nothing is said the next time, the stop was in the phone's own code, below
the app.

Which builds have it is decided in `src/lab/enabled.ts`: every build except
one on the `production` update channel, so the preview APK, Expo Go, the web
export and a development build all carry it and the production build never
does. `EXPO_PUBLIC_LAB=0` or `=1` at export time overrides that either way,
and `eas.json` sets it to `0` for the production profile as well.

To add a feature: make its folder under `src/features/`, give it a route
under `app/`, and add it to `FEATURES` in `src/lab/catalogue.ts` with the
places to open and the state each needs. `npm test` checks the catalogue —
every stage of the way in listed once, each seeded with exactly the way
there.

## Finishing setting up, and the first day

The ready screen's Finish setting up card opens the three answers every
Nigerian bank asks for, as stages of the same one-screen way in
(`src/features/onboarding/setupViews.tsx`, the answers kept per account in
`src/features/setup/`): Where you live, from its frame — the street and
the area, town and state typed into one card, the two steps still to come
greyed under it, What it opens with the three things on dashed rings, and
the word that this is the same check every bank runs, asked once and not
sold; A photo of an ID — the frame to lay it flat in, Take it, which is
the camera on a phone (the number read off the card comes back to the
step) and a moment on the web, and the word that only the name and the
number are read and the photo stays on the phone; Where your money comes
from — one tap on a salary, a business, family or friends, or something
else; and Everything is on, with the three steps done above, the tick
beside the title, the four things now on landing one after another, and
Take me in. Back sits at the bottom left beside Continue on every step,
as the frames draw it, and goes to the ready screen or to the page that
opened setting up. Until it is done the ready screen's list keeps Hold
dollars and Send up to ₦1,000,000 a day off, Spending limits carries the
offer with how far the day's cap can then go, Dollars and Borrow carry it
too, and the card's chip reads New account and opens it; once it is done
the cap can be raised to a million (the caps you set stay yours, as the
Spending limits frame draws them) and the chip is the dollars again.
The demo account has finished, by its frames.

A new account's first day is the frames' words on the app's own screens:
the card with ₦0.00 and the New account chip, and under it Savings asking
for a first goal and Loan saying it comes once setting up is done;
Activities with Nothing has moved yet, the segments, and Beetle's word
that every line here will open a receipt you can keep, send on, or
dispute; and the first question — "What can you do?" on an account
with nothing in it gets Very little yet, and I would rather say so, with
the lock line that Beetle only tells you things it has seen in your own
money. The demo account, asked the same, hears what Beetle does.

## The three pages

Home, Activities and Settings sit side by side, in the bar's order, and
are one screen (`src/features/tabs/`). A swipe to the left goes on to the
next page and a swipe to the right comes back; the pages follow the finger
and settle on the nearest one once it lets go — on the next one past a
third of the width or on a flick — and past Home or past Settings they
give a little and spring back. A tap on a glyph turns them too. The bar is
drawn once over all three, so it never moves or redraws as the pages do:
the page showing in black, the others grey, each glyph solid — the house,
the clock, and a gear filled from the file's own outline gear (the file has
no solid one; `scripts/generate-icons.mjs` derives it) — and the plus. The
three are sized by what they draw rather than by their boxes, so they look
one size: the house and the clock at 24, the gear, which fills nearly all
of its box, at 21.

The pages hold still while something is open over one of them: the chat on
home, the Receive sheet, a receipt over Activities, Your details, More. A swipe that starts on the Services card or on an offer is the
card's. With a receipt up,
a swipe to the left goes nowhere and the swipe an iPhone goes back with
closes it. The old addresses, `/activities` and `/settings`, turn the pages
to their page, and a link from anywhere (a question for Beetle, Receive
from More, the record's See log) turns them to the page it needs. On the
web a page off to the side is taken out of the page while they rest, so
what the checks read is the page showing.

## Home and the chat

Under the card, four cards two by two, the way Fuse lays out its own:
pale grey, rounded 20, a 32 glyph at the top left and at the foot a small
grey word, a bold figure and a line of 10 under it, 24 in from the
screen's sides (the owner's home frame, Round 14) and 24 apart (Round 15). Savings says the most — the goal's ring in
green with the pot in it, Holiday and how far along, what is put aside,
and how it is going: a fortnight ahead, paused for now (the ring gone
grey), what it is aiming for while nothing is in it, or, with no goal,
Start a goal. With several goals it says how many and how far along they
are together, with the total put aside. Loan is what could be borrowed once
setting up is done. Card is the virtual card by its last four, with what
is left to spend this month or Frozen. Services is laid out like the other three and starts on All services; a
swipe inside it brings Bills, Airtime and Data, the glyph and the name
sliding together and four small dots at the top right following the
swipe, and a tap opens the one showing. Each card's page comes up from the
bottom as a white sheet, nearly the height of the screen, and home steps
back behind it, a little narrower, its top showing over the sheet's; a
page opened from a sheet comes up as a sheet over it, and Back (or, on the
phone, a swipe down from the sheet's top) puts away the one on top
(`src/design/sheetStack.tsx`). A sheet comes up in half a second on a
curve that settles gently into place, and the one under steps back on it. There is no dollar wallet on home yet; the chip
on the card is the way to the dollars.

Inside the black card, under Send and Receive, the offers
(`src/features/home/Promos.tsx`, Round 15): what Beetle has for this
account, most useful first — Finish setting up until it is done, Start a
goal in three taps (Save in four taps once there is one), Borrow once
borrowing is open, Pay light and TV in two taps — one at a time on a faint
wash of its own colour, the title white and the line under it a soft shade
of that colour, swiped across, with small dots inside it at its bottom
right. A tap opens what it offers. A sideways swipe that starts on it
moves it, not the pages; a pull down is the card's. A small × at its top
right puts the offers away until Beetle next opens, and the empty card
takes their place so the black card keeps its shape (Round 16): a ring, a
grey tile, No promos over a next step that is true for the account, which
a tap takes. With nothing to offer at all it is there too (the lab's Home
› Nothing to offer shows it).

The black card at the top holds the balance, Send and Receive as two white
pills, the offers and a grabber, with no words over them or under it (the
owner's home frame, Round 14 and Round 15); Settings is the gear on the bar at the foot. Pull it and it becomes the chat: it grows down to
just over the bar — which stays, the same bar as everywhere, its white
going bare as the card comes over it — while the figure
glides up into the header, shrinking as it goes, to its left; the buttons
soften away; the
conversation arrives from below with the ask bar at the card's foot. The
header and the foot are a haze: the conversation runs up under the one and
down under the other and shows through, softened and darkened, near solid at
the card's edge and thinning to nothing — the top haze ends under the header
and the foot haze at the middle of the ask bar, so a bubble on its way out
simply dims until it is gone, with no line anywhere; the figure keeps its
contrast, the bar sits over the tail of the conversation, and the card keeps
its silhouette. (Each sheet of the blur is masked by a gradient so its own end
fades — a `MaskedView` on the phone, CSS on the web.) The bar is the way
round and the way back: Activities or Settings on it turns the pages and
leaves the chat as it is; Home, once, comes back to it just as it was left;
Home again — or Home tapped while in the chat — closes it, the card going
back up. A push up on the header or on the chat once it has scrolled to its
end, or the phone's own back, closes it too. The first time on a phone, the card dips on its own,
once, so the pull is seen.

Pulled, the card gathers light along its edge, where the finger is (Round
21, the owner's word, after Apple's NameDrop: `src/features/home/glow.ts`
and `Light.tsx`): a soft bow of white rising from the middle of the edge,
streaked, its rim split warm outside and cool inside, growing with the pull
while what the card holds is drawn out a little toward it, and the phone
answering it a step at a time, a tick and two soft knocks. Pulled as far as
letting go has always opened it, the card goes on by itself, finger down or
not, and the light pulses: a flash where it gathered and a firm knock, a
fringed ring and a fainter echo running out through the opening chat, and
the bow riding the edge down to the foot as it dies, all in under a second
and the open no slower for it. Let go short of that and the light ebbs with
the card. Closing, a quieter glow rises along the edge and is gone before it
shuts. On the phone Skia draws it (in Expo Go, and in any APK built after it
was added; an older APK opens the card as before, without the light), on the
web the same shader in WebGL; somebody who has asked their phone to keep
still gets no light. The keyboard shrinks the open
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
panel's button and the passcode comes up on a sheet over the chat, as the
frame draws it — the screen behind turned down and out of focus, the amount
and who it is going to at the top, the six dots and the big pad under them,
a line at the foot saying nothing moves until the last digit lands — and the
money moves only when the code is right (on a phone with a face enrolled,
the face is asked first and the pad is the way past it). A wrong code shakes
the dots and says how many tries are left; the third wrong one shuts the
gate for thirty seconds. A tap on the chat behind the sheet, or a pull down
on it, puts it away with nothing moved. Then the panel says Sent,
Beetle says where the money is, Activities has the line, and a
receipt lands in the chat in a few words — the amount, who it went to,
when, Successful. A tap on it opens it where it is, the way a line opens
on Activities but in the chat's dark (Round 20, the owner's word; no sheet
from the bottom in the chat, `src/features/agent/ChatOpen.tsx`): the card
loses its outline, reaches out to the chat's right edge and grows every
detail under what it says — the bank and the account, where it came from,
the money, the balance after, anything written with it, when, and the
session id, kept back behind Show it — with Share receipt and See in
Activities at its foot. The chat moves up just enough for the card to
stand clear of the header and the ask bar, and everything else, those
too, goes soft under a frost of the chat's dark. A tap on the frost or on
the card, or the phone's back, folds it back: the rows first, then the
frost. Nothing in the chat leads off to a full receipt. The amount on a
panel can be corrected by tapping it.

On top of the ask bar, left-aligned with it, three quiet chips: Bills, Data
and Services, each a quick way into what the chat can do; they step out of
the way while something is typed. The camera is in the bar, and only there:
one thing, one place.

Receive, on the card, puts up the Receive sheet (see Being paid). Money
arriving lands in three places at once: the caption on the card says what
came while the figure comes back into focus, Activities has the line under
In, and Beetle starts a chat about it, waiting in the chats drawer with a
dot, with the receipt's card in it. The lab has a place that makes a
sample arrival happen.

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
rebuilt on every ask, so a chat reopened from the drawer carries on. When the
model cannot answer — the key refused, no network — the script answers
instead, with a note saying why.

Where Beetle answers from, the first that is there: a key kept in the
phone's keychain, set on the lab's "Beetle's model" screen and sent straight
to Anthropic; a server of Beetle's own that keeps the key
(`EXPO_PUBLIC_ANTHROPIC_BASE_URL` at export time, which the Phone workflow
takes from the repository variable `ANTHROPIC_BASE_URL`): the phone sends it
no key at all; and, only while developing (`__DEV__`), a key from the build
(`EXPO_PUBLIC_ANTHROPIC_API_KEY`). Never put a key in a published build, and
never add one as a repository secret for the Phone workflow: anything in a
published bundle can be read by anyone who has the bundle, and the
repository is public. The web preview's packaging refuses a bundle that
carries a key. A new chat says, in small print, when Claude is answering:
what is typed, and the words read off a photo, go to Anthropic. The model is
called with plain `fetch`, since React Native is not a runtime the SDK
supports; `npm test` drives it against a fake API to check the request, the
tool loop, the steps, the panels and the fallback, and that a server of
Beetle's own is sent no key.

The chats live in the chat, in a drawer inside its dark card, and nowhere
else. While the chat is open a soft light runs down the card's left edge;
a swipe to the right that starts near it — anywhere within a thumb's
width, 44, of the edge, since on a phone a swipe "from the edge" lands well
inside the glass — brings the drawer in from the left, following the
finger (a tap on the light does too). It sits under the
card's header and stops short of the ask bar: its dark is solid at the top
and thins on the way down into a blur of the chat, over the chips, so the
ask bar under it stays in sight and in reach. At its top a quiet New chat —
a plus and the words, 12 apart, left-aligned — then a hairline, then the
chats, today's and yesterday's, a line each with its time, the open one on
a faint ground and an unopened one of Beetle's with a dot. As it comes in
its rows arrive one after another out of a blur and the chat behind steps
back — a little to the right, dimmer, softer — the way Fuse moves. A swipe
to the left anywhere on it, a tap on the chat beside it, a tap on the ask
bar, or the phone's back puts it away; with the chat closed there is no
edge and no drawer. Closing the card files the conversation — what you asked, what it
came to, when. A chat carries on for an hour from its last message: a pull
down within the hour picks it up where it was, and after the hour the next
pull down starts a new one, Beetle opening with something it noticed. New
chat files the chat and starts a fresh one at once. A chat picked in the
drawer picks up where it was, panels and all, and becomes the one that
carries on. Beetle starts chats too: when something needs handling, its
prompt is there in the drawer with a dot, waiting to be opened. They are
kept on the phone, per account.

## What Beetle asks for

Money does not move on half an ask, and it moves from where it is asked.
Every ask in the chat is a card: the same dark card, with the fields the
thing needs, what was said already in them and the rest empty (the user's
choice: one card with the missing fields, not one question at a time). A
transfer needs who and how much; data needs the number and the plan;
airtime needs the number and the amount; a bill needs the company, prepaid
or postpaid, the meter number and the amount. The card says nothing above
its fields unless something is wrong; while something is missing its
button says what, greyed (Pick the bank, Pick how much, Type the meter
number), and once it has all it needs the button says what it does —
Confirm ₦20,000, Pay ₦8,000, Buy 1GB · ₦800 — and goes to the passcode,
which shows the whole of it while the digits go in, then the receipt card
and Beetle's word. There is no second card to confirm the first. Words work
as well as fields: an amount or a bank typed into the ask bar goes into the
card that is up; a new ask while one is up ("send 5k to 0123456785" under
Sarah's card) gets its own card under the words; and a question in the
middle — the balance, dollars — is answered without losing the card.

The chips over the input are things to do, not doors: **Send, Bills, Data,
Receive, Save, Loan**, in that order. Each puts its card up in the chat with
Beetle's one line above it — Bills is the light: the company, Prepaid or
Postpaid, the meter number; Receive is the account's number and its $tag,
to copy or share; Save is the goals as pills, the dark picker stopping at
what Everyday holds, what the goal has so far, and Put ₦X into the goal,
through the passcode to the receipt card; Loan is the amount, the days,
what is paid back and when, and Borrow. "borrow", "my account number" or
"save 10k for rent" typed in the chat is the same card as its chip.

What Beetle knows (`src/services/nigeria.ts`) fills in what it can. A
phone number shows its network as it is typed, read off its first four
digits — MTN, Airtel, Glo, 9mobile — and a number that does not start like
one is said so. Data is typed as a size or an amount ("5gb", "2000"), or
picked from the three likeliest plans as chips under the field, with All
plans a tap away; a plan on the wrong network is refused. Amounts are the
amount picker, dark (see Amounts); when the number is already known it
sits compact with Change beside it. A bill's meter is looked up as soon as it reads right and the company
and the kind are known, and the name and address on it appear under the
field; a meter the company does not know is said so. Prepaid amounts say
about how many units they buy. Nothing over the balance goes through.

A small **Recent** at the card's top right grows the card itself into the
list of what was paid before, which scrolls: the people the day and the
ledger show paid (with their bank and account, when, how many times), the
lines topped up (with the network and the last plan or amount), the meters
paid (the company, the kind, the number). A tap fills the card and it
settles back. The list is built from what
moved on this phone, the day the frames draw, and what the demo account
paid in earlier months; a repeat needs no asking: "data for mum" is Mum's
MTN line and the 5GB she had last time, "airtime for dad" is Dad's ₦1,000,
"pay my light bill" or "the usual" is the Ikeja Electric meter and the
₦8,000 it usually takes, "mum's flat" the postpaid one at Eko. Both
Beetles ask the same way: the script reads the words; the model has
`find_account`, `find_line`, `find_meter`, `list_plans`, `lookup_meter`
and `ask_for`, which puts up or fills the same card, and
`prepare_transfer`, `prepare_data`, `prepare_airtime` and `prepare_bill`,
which put up the card ready to pay. The lab has
a place for each ask, and the walk fills them from the card and from
Recent and takes them through the passcode to the receipt. The ask panel has
no frame of its own; its sub-cards, chips (the frame's 112×62, two lines)
and the initials row are read off the Pay a bill and Buy data frames.

## Sending money

Send on the card and Send money in More open the Send money page
(`src/features/send/Send.tsx`): who it is going to first, since it decides
the rest, then the amount, a reference, and from where, when it lands and
the fee, each on its own white card in one grey one, and Slide to send at
the foot beside Back. No bubble from Beetle over it: each card says what
matters on its own line.

**Two kinds of transfer, always told apart.** The To field
(`src/features/send/ToField.tsx`) takes all three ways of saying who:

- a **$tag** (`$tobi`) is looked up in Beetle's own directory
  (`src/services/recipients.ts`) and the Beetle account comes back: free,
  and there at once;
- a **name** brings the closest names, from Beetle's accounts and from the
  people paid before, each with its bank;
- **ten digits** ask which bank, the likely ones first — worked out from
  the number itself, the way the CBN's check digit is, and the newer banks
  first for a phone number — then the name on the account is looked up
  there and shown, so it is seen to be the right person before anything can
  move. A bank the number cannot be at says so.

The people paid before wait under the empty field, one tap each, and the
camera at its end reads a number off a slip. The bank is always said: on
the page, in the chat, on the passcode sheet, on the receipt and in
Activities; a Beetle account says Beetle with its $tag. The amount is
picked where it is, on the amount picker (see Amounts): the ruler, which
stops hard at all Everyday can send once the fee is counted, what was sent
to them before and a round figure as chips with All of it, or the figure
tapped and typed. The reference is typed in place. The fee: nothing to a
Beetle account; to another bank nothing under ₦10,000, ₦26.88 up to
₦50,000 and ₦53.75 above. It lands Instantly to Beetle, In a few seconds to
a bank, Under a minute above ₦50,000. The slide's knob
follows the finger; let go past four fifths of the way and it lands at
the end and the passcode comes up, before that and it springs back; until
there is someone and an amount the pill is the pale grey. The passcode
sheet shows the whole of it at its top while the six digits go in — who,
their bank and number or $tag, what they receive, the fee, what leaves
which account — and Cancel sits plainly under the pad, since the sixth
digit sends it. After the passcode the line goes into the record — Activities sees it the moment it
is added — and its receipt opens, with Back to home.

Past the balance the slide leads to Not enough, from its frame: what is
short, the three figures, and three ways to close it — from the Holiday
goal, which takes the shortfall back as a line in the record and comes back
with the whole amount on the page, what there is now with the rest on
payday, which puts that amount on the page, or asking someone who owes
you, which opens the request to Musa filled. A
digit the reader was not sure of leads to Check this number, from its
frame: the number as read, where it came from, the other reading in
amber, Beetle's word that it will not choose on its own, and the three
ways — the one, the other, or typing it — each going back onto the page.
The stand-in reader is sure of the sample slip; the lab opens Check this
number on a slip it is not sure of. A typed ask in the chat keeps the
chat's own panel (the user's choice: both ways, each with its frame); the
page's "You typed" column is what a message brings when it is handed
over, and the lab opens the page filled from one.

## When a transfer is not done

A line still on its way, that did not go or that came back opens its own
page from Activities, its title coming up from the line's words
(`src/features/transfers/`). These pages explain rather than ask, and
what Beetle says on them is a plain line, never a bubble: bubbles are the
chat's. Still on its way: the ring turning, the
warning not to send it again, the three steps with the last one waiting,
Beetle's word on when it comes back on its own, and a message offered
for the moment it lands. It did not go: the red mark, the green word that
the balance is whole, whose afternoon it is, try again now — which opens
the Send money page filled — or another way, which says the Zenith
account is not in the frames yet — and the offer to keep trying. It came
back: the black mark, when it left and came back and why, the reference,
and the account number to check or the same again,
both on the page. The figures are the line's own: the day's failed
transfer is Chidi Okafor's, the returned one Musa Danjuma's.

A receipt's "Something wrong with this?" opens What went wrong?, from its
frame: the three things that can be wrong with a payment, Beetle's word
on which it can do itself and which only a bank can, and the payment. The
wrong person leads to Asking for it back: Beetle Recall at work on a
light panel — reported, sent to the bank, the person asked to approve,
their answer still to come — what this is and is not, a message to her
through the bank, which lands as a chat, and a dispute if she has not
answered, which opens Your dispute. Where Beetle read the number off a
photo, the wrong
person leads instead to I sent it wrong: the digit was Beetle's own, so
the money comes back today as a line in the record with its receipt, or the
bank is asked to recall it. Beetle says they for everyone it has not been
told about. The passcode sheet, from the Face ID missed frame: a face
that did not take says so in red, the face key tries again, and from
then the foot says what three wrong tries cost — thirty seconds in this
build, and the line says so.

## When it goes wrong

They say it never arrived, on What went wrong?, opens Your dispute
(`src/features/dispute/`), from its frame: Beetle Dispute at work on a
light panel with the day it is on — reported, the bank told, its answer
due, the money back — Where this actually is, with what the bank has and
the day it has to answer by, See what was filed, which lays out the
wording and what went with it, and Add something to it, which opens the
chat with the dispute named. I did not make this payment opens the same
page as a fraud report and freezes the card first; Open a dispute on
Asking for it back files one for a recall. A dispute filed on this phone
is kept per account, opens as a card in a chat from Beetle that leads back
to it, and counts its days from the day it was filed; the demo account's
own dispute over Sarah's ₦20,000 is on its third day. The dispute is
closed, from its frame, is the same page once the bank has decided: the
tick, the green word that the money is already in the balance, the steps
with their days, and the offer of the closing letter, which lands as a
chat to share from. The demo's closed one is a lab place, since its open
one has not been decided.

Checking, from its frame, is Beetle's reasoning on a transfer it filled in
off a photo (`src/features/send/Checking.tsx`): on Send money, where the
reader filled the figure, the note under the person opens it — Beetle
Reasoning on a light panel, How I decided with the times paid, the usual
amount and its reference, and what was read — and the two ways go back
to Send money with the usual amount, or to the keypad. I will not do this
one, from its frame, is where the slide lands when the whole balance is
about to go to an account this phone has never paid: the mark, what was
typed, how old the account is and that it has never been paid, Beetle's
word, three ways — ₦20,000 instead, which fills Send money, Wait until
tomorrow, which files the chat that asks again then, or It really is me,
Face ID and then a call, which files the chat that says the call is
coming — and why it stopped, in a note. The chat refuses the same way:
"send everything to 0123456789" gets Beetle's word to send ₦20,000 first.
An account Beetle has never seen reads as four minutes old, the way the
frame draws it, until a bank's look-up stands behind it
(`src/services/rules.ts`).

You are offline, from its frame, is where the slide lands with no network
(`src/features/offline/`): the mark, how long the phone has been off,
when the balance was last checked, Beetle's word that nothing done here
is lost, Queue it for later, which files the queued transfer as a chat and
goes home, Pay by USSD instead, which says the code to dial, and lite
mode while data is short, a switch kept per account. The web knows when
the network goes; a transfer asked for in the chat then gets Beetle's
word that it will not send against a balance it cannot check, and nothing
is filed. On a phone the network's own signal comes with a later build,
so there the page is a lab place.

A transfer's receipt now offers the same payment again next month — Rent
again next month? — and Set this up? fills the offer from the line: when
it would run (the first of every month for rent, every Friday for the
grocer, the start of every term for school fees, the same day every month
for the rest), and Set it up turns it on. Standing instructions lists it
with the others, with a switch that pauses it like theirs. And everywhere
a page once said a thing would come with a later round, it now says the
thing is not in the frames yet.

## Being paid

Receive — on the card, on the new account's empty day, and in More from
any page — puts up a sheet over everything: the arrow down on its disc, the
word, the line "Give these to whoever is paying you", and on a grey card the
account's own details — the account number at Beetle, with the name on it,
and the $tag, free and instant from another Beetle account — each with Copy
at its end. Share details under the card hands all of it on at once, the
same words the chat's Receive card shares. Under that, the two other ways
money comes: Ask someone, and In dollars, each a row that sends the sheet
down and opens its page. Done sends it back; so does a tap outside it or a
pull down on its head. The owner took From a card off it after Round 11,
with the QR code and the page Bank transfer used to open (Three ways to be
paid and Your code), so being paid is two taps from the card: Receive, then
Copy or Share details. "How do I get paid" typed at home, or asked from a
page, puts the chat's Receive card up instead of a page.

## Asking for money

A request is not money moving, so nothing about it needs the passcode, and
the page says so at its foot. It can begin three ways: "ask musa for 20k for
the rent balance" typed in the chat at home, which is a page rather than an
answer; a photo of a message asking for the account, which the camera reads
first and answers with Read from your photo over itself — the amount and
what it is for from the photo, the person matched to someone who has paid
before, and where the request reaches them — with Ask Musa, Retake, and Not
this person, which goes on without the person; and Ask someone on the
Receive sheet.

The Request page, from its frame, is a chat of its own: Beetle's mark and
name in the head, what was said (or read, with the camera's glyph) as a
black pill on the right, Beetle's word on who it found — "Musa Danjuma, the
line ending 4471. He is the only Musa who has ever paid you." — and Beetle
Requests at work on a light panel: Person, where it reaches them, Amount,
For, and Expires, which is picked once the person and the amount are there
and comes to In 7 days; Send the request in the foot beside Back. What is
missing is asked for, and each row fills where it is, on a sheet over the
page: Person, the people who have paid before or somebody new (a name and
a phone number); Amount, the picker, with no cap, since anyone can be asked
for anything; For, a word or two, or one of four. There is no reply bar. The people this build can ask, and the lines it reaches them on, are
its own; a real account service will fill them from what came in.

Sending files the request (kept per account, so its page holds across a
restart) and puts Request sent in its place, from its frame: the tick on
its blue disc, the figure and who was asked, what for, when it lapses and
the reference, Beetle's word that it will say the moment the money lands,
and its offer to remind them if nothing comes — Set that up leads to the
standing instruction, and Set it up lists it under Standing instructions.
Beetle files a chat about the request in the chats drawer, with the request's card
in it, which opens the page again: nothing about a request is more than two
taps from home.

## Bills

Bills, the chip over the chat's ask bar, opens the month from its frame:
Beetle's word on what the month comes to and how much of it is spoken for,
five marks for the five bills with how many are covered, and the rows — the
light due Thursday that a standing instruction pays (Ikeja Electric follows
the instruction in Settings, so turning it off there uncovers the light
here), the television and the internet with nothing behind them yet, the
waste and Mum's data already paid. A row opens the page that pays it; Add a
bill sits beside Back at the foot and says what it waits for. The billers
and the month are this build's own (`src/features/bills/billers.ts`); an
account service will fill them from what came through.

## Paying a bill

Pay a bill, from its frame, is the Send money page for a biller: the meter
or the account it is paid on, the figure, and from where and what lands,
each on its own white card in one grey one, Beetle's word above them, three
figures to pick from under (with what each buys: about 38 kWh, two months,
100GB), the line about what lands, and Slide to pay beside Back. The meter
card opens the meters paid before with the camera under them; a meter at
another company makes the page that company's. The figure opens the keypad
page, which hands it back. The slide leads to the passcode — with the
biller's glyph on a square in the avatar's place, as the frame draws it —
and the receipt after, with the token above the slip, and the line in the
day.

A bill can also be read off a photo. The camera pointed at a bill
(`/scan?for=bill`, from the meters list) says so at its head, and when the
photo is read it draws the photo back in the middle with the meter it found
in a chip under it, then goes on to What I found: the bill as read — the
company, the meter, the figure and the address on it, boxed the way the
frame boxes them, with What I read to see the reader's own lines — then the
question that matters before a token is bought, Is this your meter?, with
what the bill says beside what the company says the meter is (the
`MeterService` look-up), and Yes, that is mine or No; under them the three
pieces the payment needs, each ticked. Continue leads to the passcode and
the receipt with the token. The camera itself is now drawn from its frames:
close at the top left and the light at the top right, the word on what to
point it at, the gallery of sample photos, the shutter and the code reader
along the foot, and a line under them.

## All services

All services, from its frame, is the drawer: the eight used most as tiles —
Airtime, Data, Power, Send, Cable TV, Betting, Loan, Cards — then Bills,
Save and borrow, and Money as rows, each a way into a page this build has
(Power, Cable TV, Internet and Waste open Pay a bill on that biller; Data
and Airtime open Buy data; Loan opens Borrow; Cards opens Virtual card;
Request money opens the request; Send opens Send money) or a word about
which round brings it. A search field at the top narrows them as you type,
by name or a word for one ("light", "dstv", "borrow"); on return a page for
words that are one opens, and anything it does not find can go to Beetle on
home. The foot is Back. The Services chip over the chat's ask bar opens it,
as does "services" typed there.

## Buying data

Buy data, from its frame, opens on the line topped up most — Mum's MTN
line — with the bundle she had last month: whose line, the bundle with its
price, and from where and what the round-up feeds (the Holiday goal), each
on its own card; Beetle's word above; the other bundles nearest in price to
pick from; the other lines topped up as their initials, with a plus for
another; and Slide to buy beside Back. The line card opens the lines
topped up before with a number to type and the camera under them; a line
brings its usual bundle with it. Buy airtime is the same page with the
amount picker in the bundle's place, stopping at what there is to pay
from, and other figures to pick from. The slide leads to the passcode, with the network and the size on its
row, and the receipt after.

A message asking for data, shown to the camera, is read on the spot: Read
from your photo comes up over the camera with the line and its network,
whose it is where a saved line matches, the figure and the bundle it buys,
and Top up Mum, Retake, and Not this line. Top up Mum opens the top-up
chat, from its frame: what was read as a black pill with the camera's
glyph, Beetle's word on whose line it is — and, where she asked for less
than she usually gets and ran dry early last month, that it has priced the
bigger bundle too — and Beetle Data at work: the line, whose, the plan, the
price, and Cheaper?, which it checks and answers, the lock line that nothing
leaves before the face and the passcode, and Confirm in the foot beside
Back. The plan row changes the bundle where it is: the network's bundles
in a list, or airtime on the amount picker. Confirm leads to the passcode; the line goes into the record,
the chat is filed with the receipt's card in it, and the receipt opens.
"2k data for mum" typed at home still goes to Beetle in the chat, as
decided in round 3; the pages are reached from Services, the shortcuts, a
photo and the lab.

## Borrowing

Borrow is short: the amount first, on the picker, up to the limit; under
it a tight breakdown — Pay back over "90 days ▾", a plain row that opens a
short list of 30, 60 and 90 days with the payments each comes to; what is
paid back in all, the strongest line; the payments and the first of them;
and how it is taken (from Everyday, on the day). If a payment is missed and
the cost line by line are a tap away: no collateral; a late fee each week a
payment is overdue; what is due taken from money arriving in Everyday; the
credit bureau told after 30 days late. Finish setting up sits at the foot
where borrowing still waits on it, and Slide to take beside Back. The figures are this build's own
(`src/features/loan/loan.ts`) until a lender stands behind the app; the
frame's ₦150,000 for 90 days comes to ₦169,500 in three payments of
₦56,500. The slide leads to the passcode, and the money then lands the way
any money in does: on the card, as a line in the record, and as a chat from
Beetle with the receipt's card, which opens Money in from Beetle Loans.
"borrow" or "how much can I borrow" typed in the chat is the Loan card
there (see What Beetle asks for); Loan on All services and the Loan card
on home open the page.

## Dollars

The dollars chip on the card opens Dollars, from its frame: what is held
and what it is worth today, Convert and Send, the rate and how it moved
this week, Beetle's word on holding them, where each dollar came from, the
note on whose hands they are in, and the line that nothing is locked. The
holding is the account's own plus every conversion and every payment from
the dollars on this phone (`src/features/dollars/dollars.ts`); the rate is
one rate all day, ₦1,552 to the dollar, until a market feed stands behind
the app. Dollars on All services opens the page too.

Convert takes naira into dollars, or, with the swap between the two
places, dollars back into naira: the figure typed with what it comes to
under it, the rate, the fee (free under $500, one percent over) and what
you get, and Slide to convert beside Back. The slide leads to the passcode;
the line goes into the record, the dollars change hands, and its receipt
comes up over the page as the sheet every payment ends on (Round 19): the
tick, what went into or out of the dollars, the rate you got, the fee and
the totals; Done goes back past Convert to Dollars. The Converted page the
frames draw (the rate you got, what the dollars come to now, and the offer
to move ₦20,000 across every payday) stays in the lab, for its frame.

Paying from the dollars: the From row on Send money, Pay a bill and Buy
data opens Pay from — Everyday with what it holds, Dollars with what they
are worth today, a tick on the one chosen — and picking Dollars makes the
page pay from them at the rate on it: the figure in dollars under the
amount, no fee, and the line that the rate is held for sixty seconds once
you slide. The naira balance is left alone; the receipt says From Dollars
with what left them. "convert" or "buy dollars" typed at home opens
Convert; "what about dollars" stays a question for the chat.

## Putting money away

Savings on home opens the goal page on the first goal; so do Savings pot on
All services and "my goal" typed at home. The page is the Holiday frame's,
made shorter at the owner's word so nothing on the way to saving needs a
scroll: under the head, the goals as pills with + New goal at the end, a tap
switching in place; the ring with what is put aside; **Add money** and
**Take out** straight under it; Beetle's line on the pace (what a month
would get it there, or, for the demo's Holiday, the frame's "a fortnight
ahead"); what feeds it as one row — the payday slice, round ups and cash
back, and what they bring in a month — that opens the Feed sheet; and the
line that nothing is locked. The ··· at the top right holds Edit goal,
Pause goal (Start again while it is paused) and End goal, in red.

Saving is four taps from home: Savings, Add money, the amount and Put away,
the passcode. The amount picker comes up on a sheet stopping at what
Everyday holds; the line goes into the record as Put away, its receipt
opens, and the ring moves. Take out is the same the other way: the picker
stops at what the goal holds, All of it among its chips, and the receipt
reads Taken back.

A goal is three taps from home: Savings, + New goal, Start saving. The
sheet comes filled with the next thing people save for that is not a goal
already — Rent at ₦600,000 in a year, then Emergency fund, School fees, A
new phone, Holiday — its figure on the amount picker and the date as a
quiet row ("In a year · 3 October 2027 ▾") that opens its four in place;
the name is a field to type over. "Save up for a car" typed at home opens
the same sheet named A car. Edit goal is the same sheet with the goal's own
name, figure and date, and Save changes. Pause goal is one tap and lifts
as easily: the feeds into it wait, Add money still works ("Add money
anyway"), and Beetle's line carries Start again. End goal with money in it
goes through the passcode, which says the goal ends and what comes back to
Everyday; empty, the sheet that asks first, End goal in red and Cancel.

Several goals are kept on this phone per account
(`src/features/goal/store.ts`). The demo starts with Holiday, ₦250,000 by
12 March, the frames' goal; a new account with none. The first goal is the
one the payday slice, round ups and cash back go to — the Rules page, a
rule's offer and Buy data's round-up line all say its name — and any other
is fed by hand; end the first and the next takes the feeds. Not enough
takes its shortfall from the first goal that holds enough.

The Save chip in the open chat puts the same saving on a card: the goals
as pills (the first picked, or the one the words named), the dark picker
stopping at what Everyday holds, what the goal has so far, and Put ₦X into
the goal, through the passcode to the receipt card and Beetle's word on how
far along it is: Save, Put away, the passcode — three taps. With no goal
yet, the card's button opens the new-goal sheet.

While Money is tight this month is on (the switch at the top of Standing
instructions), every goal is Paused, from its frame: the feeds wait, the
date moves from 12 March to 9 April, and Start again on Beetle's line lifts
it. An account with no goal sees Goals with nothing put aside yet, Start a
goal and Set it up, from its frame. The demo Holiday's figures are the
frames' own (`src/features/goal/goal.ts`) until an account service keeps
them.

## Money health

The Money health row on home opens the page from its frame: the score on a
ring with how it moved, Beetle's word on what holds it down, the five
habits that move it — checking before sending, saving on payday, the
balance kept covered, only you opening the app, watching where it goes —
with where each stands, the offer to hold ₦5,000 back on payday with
Set it up under it (a standing instruction, once said yes to), and the
note that this is not a credit score and never leaves the phone. The
habits read the switches in Settings and the transfers on this phone; the
score is the demo's own (`src/features/health/health.ts`) until an account
service works it out. "money health" typed at home opens the page.

## Receipts

Every line on Activities opens where it is, the way Fuse opens a
coin in its list (`src/features/activities/OpenLine.tsx`): nothing is
pushed and nothing fills the screen. The line itself opens (Round 17,
the owner's word): it stays in its place in the list, sharp, nothing drawn
over it, and the rest of the page goes soft where it is behind a frost of
the page's own white — still there, out of focus — above the line and
below what grows in under it, while the bar steps out of the way. Under
the line the rest of it grows in, in the list, out of a blur, the lines
below going down to make room: what the line does not already say. Not who
(the line says that) and not the total (the amount and the fee say that):
where it came from and the fee, the amount and the balance after, anything
written with it, and the session id, kept back behind Show it, since it
only matters when the transaction is being queried. Then Share receipt and
the thing Beetle offers — Set it up, the same again — side by side. The ···
for the rest sits at the top right beside the page's title, which stays
sharp with it: Ask Beetle about this, Report a problem. A line low on the page scrolls up with what grows under it, just enough for
it to fit, and back down as it closes. A tap on the frost or on the line again, or the phone's back,
puts it all back — what grew in first, then the frost clearing as it folds away — a tap, not a swipe: a finger that moves
across the frost leaves it open — and the pages hold still while it is open. On the phone what grows in lies
loose in the box that grows (Round 19: measured in its flow it never grew there; see `LOOSE` in
`src/design/motion.tsx`).

A line still on its way, one that did not go and one that came back open
the same way. What happened comes first under the line, on a glyph of its
colour — Still on its way, It did not go, It came back — with the bank and
the account and what to know about it, and its next steps take the place
of Share receipt and Set it up: Ask about it, Try again, or Check the
number and Try Sarah again. The page each state used to open is behind
See the details. A bill's meter token is a row of its own, tapped to
copy.

The receipt right after paying — Send money, a bill, data, airtime, a loan,
money into a goal, loading the card, dollars bought — is not drawn this
way (Round 19, the owner's word): it comes up from the bottom as the
receipt sheet over the page paid from (`src/features/receipts/
ReceiptSheet.tsx`), and so does a receipt in the chat and a receipt by its
address. It is the frames' All done in a sheet: the title and when, the
tick with the amount and who, the status (a line not settled has its own
glyph and colour), then the slip with every field and the session id to
copy, a bill's meter token over it in its grey card. Share receipt is a
small button at its top beside the ···; Done, in black, goes back to where
the payment started; See in Activities, plain under it, goes to the
record. A swipe down, a tap behind it or the phone's back is Done. When
the whole of it is taller than the sheet may be, the receipt scrolls
between its top and its two buttons; the sheet never goes up under the
status bar. The ··· opens a small pop-up, grown from the dots over a
light white wash (`src/design/Menu.tsx`): Ask Beetle about this, which
files whatever chat there was and opens a fresh one on home about that one
transaction — what it is set down as a note Beetle reads, and Beetle asking
what you want to know — and Report a problem, which for a transfer opens
What went wrong?. Share receipt opens the frame's
sheet: WhatsApp and Save to photos take a picture of the receipt
(`src/features/receive/picture.ts`) and hand it to the phone's share sheet or
put it in Photos, Somewhere else hands the words to the phone, with the
balance and the full account numbers left off, and the PDF comes with a
later round. A data receipt's line reads the way the share frame says it:
₦2,500 of data for Mum. The lines the frames draw carry the frames' own figures
(`src/features/receipts/receipts.ts`); a line this phone added carries what
its panel or its arrival knew, kept per account by `src/features/home/moves.ts`
so the balance and the receipts hold across a restart.

## Amounts

Wherever money is put in, it is picked on the page it is for, never on a
page of its own (`src/design/Amount.tsx`). The figure sits at the top,
large, each digit rolling on its own as it changes — up as the amount
grows, down as it shrinks; a tap on it and it is a field, for the exact
figure, typed in place (starting afresh, the figure as it stands the grey
hint). Under it, the line that says what it is capped at. Then the ruler:
ticks running under a fixed black line at the middle, the longer ones at
the round figures, fading out at both ends. A drag moves it under the
finger; a fling settles on the step where it would come to rest; a tap on
a tick goes there. The phone clicks lightly at every step it passes (held
to one every 28ms, so a fling ticks like a wheel) and knocks once, firmer,
at the end, where the ruler gives a little and goes no further: the
balance, what can be borrowed, or all that can be sent once the fee is
counted. The steps are finer where the money is small — ₦100 up to ₦10,000,
₦500 up to ₦100,000, ₦1,000 above (`src/lib/steps.ts`, with its tests) —
and a typed figure needs no step at all. The cap is the ruler's last step
wherever it falls between steps, so All of it is the cap itself, not the
round figure under it. Under the ruler, a row of chips: the likely
amounts, and All of it where there is a cap. A chip, or a tick tapped, sets
the figure at once and the ruler glides to it; the steps it passes on the
way are not picks, so a tap on Confirm while it glides takes the figure
tapped. Dollars run the
same steps a hundred times smaller.

It is on Send money, Pay a bill and Airtime (capped at what there is to pay
from), Convert (in naira or in dollars, whichever it leaves from), Borrow
(capped at what can be borrowed), Request money (no cap: anyone can be
asked for anything), and, on a sheet over the page since neither page has
room for it, Add money on the goal and Load on the virtual card. Load card
sits in the card page's foot beside Back: the picker, the passcode, a line
in the record and its receipt, and the card can spend what was loaded on
top of what its month allows. The keypad page called Change the amount is
gone.

## The foot, the bar and More

The foot is drawn once over every page (`src/features/more/Foot.tsx`)
and stays where it is while the pages slide in and out above it, changing
shape from one page's foot to the next (Round 18, the owner's word; from
Round 13 to Round 17 each page carried its own and it slid with the page).
Going to a page, the bar's pill draws in to Back's circle where it sits,
its three glyphs fading as the arrow comes in, while the plus fades away
and the page's button slides in beside Back; going back, the circle grows
into the pill again. Between two pages Back stays put and the button
hands over: the one going fades where it is, then the next slides in.
There is no white under it: what scrolls under the foot goes soft
under a blur that grows toward the edge, with no white in it, so a white
page reads as white and a card passing under reads as a card, blurred. On
the three pages it is the bar: Home, Activities and Settings in a rounded
pill of frosted white glass that hugs them, 12 of padding round the
glyphs and no outline, the page showing in black; and the black plus to
the side. It is drawn once for all three and stays where it is as they
turn. It stays under the open chat, and goes down under the keyboard and
out of the way under a sheet. On a page that needs a way back it is Back,
in a circle of the same glass, beside the page's one button (Send the
request, Load card), or Back and Slide to send (Send money), or Back
alone; no page but home carries an ask bar, and the plus stays on the bar
of the three pages. Back is always at the bottom left, 20 in, with 12
clear between it and the button so each is its own tap.
Each screen says what its foot holds (`useFoot`); the foot shows the
screen in front (`FootScope` round every screen, `FootHost` over the
stack, in `app/(app)/_layout.tsx`), and
the numbers are the frames' docks: 104 tall, the row 56 with 24 above and
below, 20 in from either side, Back 44, the button 56; the slide is 60
tall, as the Send money frame draws it. The blur under the foot reaches
40 above the row, so what scrolls under it dissolves instead of being
cut. While something is open over a page — a
sheet, the list of people paid before — the foot recedes or goes down, and
takes no touches until it comes back; the list of people stops above it. A
screen that says nothing — the way in, the lab, the camera, a new passcode —
has none, and the foot goes down out of the way.

The plus opens More, from its frame: the screen behind goes soft under a
white veil, almost entirely white — the frame's 76% over a real blur at the
top, solid by the foot, as Fuse does it — and the actions come up out of
the button, the nearest first,
each with its own coloured glyph. The frame draws five; the bar carries
Activities and Settings, so the sheet keeps Camera, Send money and
Receive. The plus turns into a cross on the way in and back on the way
out, and anywhere that is not an action closes it; closing runs the whole
thing backwards before the screen goes. Send money opens the Send money
page from anywhere; from a page, Receive goes back to home with the Receive
sheet up.

## Activities

The second of the three pages holds all of the record, from its frame:
Money health at the top, All / Insights / In / Out to narrow it, today and
yesterday, what Beetle noticed set among the lines, and what Beetle makes
of it at the foot. What is still on its way, did not go or came back
stands first with its status glyph and a chevron, and what settled follows
on the grey square; each line opens where it is (see Receipts):
the line stays sharp, the page goes soft under a white frost, and its facts
come in under the line's own words as plain rows — the way Fuse's Solana
widget does it, no card, no border, no shadow — the bank and the number
first (Paid at for a card, Number for a top-up, Meter for a bill), then
the money, then what was written, with the session id kept back until it
is asked for, and Share receipt beside the offer at the foot. What you moved into your own goal is not in
it: that money is still yours. "Where your money went" opens the answer, from its frame: what was asked as
the head, Beetle's line, the figure with its change and the six months
behind it, where it went, and what Beetle would do about it.

## Settings

The gear on the bar turns to Settings, the third page, from its frame: the Plus
card, and three groups of rows — what keeps the money yours, your account,
about — with what each is set to at its end. Every row leads somewhere.
Your details opens a sheet with the name, the number, the account number to
copy and when the account was opened; Sign out asks first, in a small
sheet that says what signing out does, with Sign out in red and Cancel. Lock and privacy
has the switches — Face ID, what other people can see — kept on this phone
per account (`src/features/settings/prefs.ts`), Passcode leading to a new
one on the keypad, the passcode it is now (or the face) first, then six
digits twice with the weak ones refused, and Ask again after cycling
through the waits, which the app keeps: away that long, and it asks for the
face or the passcode again before anything shows
(`src/features/lock/AppLock.tsx`). Spending limits shows where today
stands against the day's cap — the figure is the day's own — the three
caps, and what happens at the line; Show me what that looks like opens Past
your own limit, where the passcode is done and the three words are typed in
full, letter by letter, with the button waiting for the last one. Standing
instructions has the one switch that pauses the saving, the three
instructions with a switch and a log each, and Add an instruction, which
offers one on Set this up? — the same page a receipt's offer opens — and
Set it up turns it on. Devices lists everywhere the account is open with
the odd one marked, and Sign out everywhere else asks first, then leaves
this phone alone. Freezing does not ask: it has to be quick in a bad
moment, and it lifts as easily as it went on.
Keys and recovery opens Not your phone, what recovery looks like: freeze
the money, then prove it is you with the passcode it is now (or the face)
and set a new one, which lifts the freeze; sending then waits twelve hours.
Cards opens the virtual card: its face, Reveal for ten seconds after the
passcode, Freeze kept on the phone and greying the face, Load card, Rules
to the instructions, and how much of its ceiling has gone; there is one
card for now. Beetle Plus, Contact support and Give feedback open the
chat with the question asked; Notifications and Saved people say what they
are waiting on.

The camera at the end of the ask bar reads an account number off whatever it
sees — a slip, a screen, a card. On a phone with the build that carries it,
Google's on-device text reader does the reading, offline; the web and Expo
Go use a stand-in that reads the samples in `assets/` as themselves, says
on the camera that it is a stand-in, and reads a photo taken as the sample
the camera was opened for. The camera is one of the app's own pages, so a
bill read off a photo opens What I found in its place, in the same stack. The scripted
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
is in `tokens.ts`. Within a screen, whatever arrives comes out of a blur and
whatever leaves goes back into one: the thing going softens and fades in
280ms, the next sharpens and fills in 520ms. A press dips to 96% in 90ms and springs back
past full. A marker lands beside a step 140ms after the step's label has
changed. A button's label changes through a blur rather than being swapped.
The wash at the top of a step recedes while you type. The ticks on the ready
screen land one after another, and the balance on home comes into focus
rather than counting up. Things arrive on the settle curve — moving at
once and coming to rest slowly. A frost or a
veil comes in by its blur growing, never by fading a layer that is already
blurred (the phone draws that badly, and it reads as a jerk); and where
something lifts to make room, as a line on Activities does for its facts,
what comes in is measured first, so the lift and the arrival are one
movement. All of it runs on one family of curves, and all of it stops for
anyone who has asked their phone to reduce motion.

Between pages it is the phone's own movement, at the owner's word in
Round 13: a page slides in from the right over the one it came from, which
gives way a little to the left, and going back slides it out to the
right; on the phone a swipe from the left edge takes it back under the
finger. The stack is expo-router's JavaScript stack (`app/(app)/_layout.tsx`),
so the phone and the web move alike. The foot does not slide: it stays
where it is and changes shape, the bar's pill drawing in to Back as the
page comes (Round 18). Card, Services, Loan and Savings come up from the
bottom instead, as white sheets over home, which steps back behind them
(Round 14); a page opened from one comes up as a sheet over it. A sheet
rises on a long, settling curve, quick off the mark and easing gently
into place, half a second up and a little less down, and the one under it
steps back on the same curve, on the web as on the phone (Round 18).
Where nothing needs a page, nothing is pushed: a line on Activities opens
where it is, the line itself, its facts growing in under it as the page
goes soft under white (Round 17), and closes in two steps, its facts going
first while the white stays whole and then the white clearing, its blur
thinning as it goes (Round 16); the receipt right after paying comes up
from the bottom as the receipt sheet over where it was paid from (Round
19), and a receipt in the chat opens where it is like a line on
Activities, in the chat's dark (Round 20). The three pages turn on a spring that settles without running
past, carrying the finger's speed when it lets go.

A page's title stays at the top while the column scrolls under it, a soft
blur growing behind it (`src/design/collapse.ts`): over the first 56 of
scroll it shrinks about its top left corner to 14, the size of the word
Wallet on home's black card, and the line under it is gone by half way.
Scrolled back to the top, it grows back.

`npm run flow` traces the moments that matter — the first screen change,
the ticks, the balance, the card opening under a finger, the first-time
dip, a page sliding in from the right with its foot, a title shrinking
as Settings scrolls and growing back, the pages sliding under a bar that
stays put, a line's facts coming in under it — and fails if they are not
moving the way that file says.

## What comes next

The rounds in `PLAN.md` are built. What is left is what no frame draws:
a server for the model's key, the bank's own services behind the
interfaces, and the frames' later rounds as they are drawn.
