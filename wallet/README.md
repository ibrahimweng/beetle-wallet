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
| `npm test` | the rules of the way in: what counts as a Nigerian number, what a passcode may not be, where each step leads, how the mock services answer; the scripted Beetle and what it asks for; the model against a fake API, its ask panel and its tools; what Beetle knows of the country — the networks by prefix, the plans, the companies, the meters, what was paid before; the gate before money moves; the hour a chat carries on for; the receipts' figures; the order of the record; the three words past a limit |
| `npm run bundle` | the same JavaScript the phone runs, exported for the web into `dist/` |
| `npm run flow` | from the boot to the welcome and on to home, then out and back in as the demo account, with the doors that should be shut tried on the way and the lab opened from the version line; the card pulled down and traced as it opens down to the bar that stays under it, with Bills, Data and Services as chips on the ask bar, Activities and back to the chat as it was and Home again closing it, money sent by asking and let through by the passcode, the account's details opened and copied, a photo taken with the browser's stand-in camera and read, money arriving, the model screen, the four cards on home, the Services card swiped through and the pages swiped between, a chat carried on and New chat in the drawer, the receipt card opened where it is and the receipt pages with the share sheet, Settings with every row followed — the switches kept, a new passcode, the three words past a limit, an instruction offered and set up, the other devices signed out, the phone that is not yours frozen, the card revealed and frozen — the bar and More under its white veil, the pages sliding under a bar that stays put, the record narrowed to In and to Insights and a line opened in place over the frost — not who, not the total, the session id kept back, its ··· with Ask Beetle about this — and closed with a tap off it, the four asks — a transfer with no amount, data for a new number, airtime by the slider, a bill from a new meter and from one paid before — each filled from the panel or from the list of what was paid before and taken through the passcode to its receipt; money sent from the Send money page in its four taps — who from the people paid before, the amount moved on the ruler and typed in place, a reference typed, the slide, the passcode, the receipt, and the line on Activities — then filled from a message, from a photo, stopped hard at what Everyday can send, and from a digit the reader was not sure of; every state of a transfer and every way out of it; the face that did not take; and the lab's places opened on their own; every screen photographed into `shots/` |
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
offset reported and allowed by name like anything else.
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
| A passcode | six digits typed twice; this build also lets `654321` and `123456` through, so trying it never means thinking one up | the same digit six times, a run, a repeated pair, your year of birth, and the handful everybody picks |
| Finishing setting up | Finish setting up on the ready screen, or wherever a limit it lifts is in the way (Spending limits, Dollars, Borrow, the New account chip on the card): a street and an area typed into one card, Take it for the ID (the camera on a phone, a moment on the web), one tap on where the money comes from, and Take me in; the day's cap can then be raised to ₦1,000,000, and dollars and borrowing open | a street or an area under three letters; Continue waits for a source to be picked; Back on every step, to the ready screen or to the page that opened it |
| Welcome back | `0906 911 3588`, the owner's own number, opens the demo account, history and all; any number that opened an account on this device opens that one | a number nobody has opened an account with, with a way to open one |
| The chat | "Send 20k to Sarah", "top up my light", "buy data", "what about dollars", "how much do I have"; the people it knows are Sarah Adeyemi, Chidi Okafor, Musa Danjuma and John Doe, by name or account number | more than the balance; a name it does not know; anything else, with what it can do |
| Send money | Send on the card, or Send money in More: someone paid before, a ten-digit number typed, or one read off a photo; any amount up to what Everyday holds; a reference; Slide to send, then the passcode | more than the balance: Not enough, with three ways to close it; a digit the reader was not sure of: Check this number, with both readings |
| The fee | nothing under ₦10,000; ₦26.88 up to ₦50,000 and ₦53.75 above, the banks' own with the tax on it, on the page, in the chat's panel and on the receipt alike | |
| Before money moves | the passcode set on the way in, or `654321` and `123456` in this build; the face, on a phone with one enrolled | three wrong tries shut the gate for thirty seconds and Beetle says so; a face that does not take says so in red, and the face key tries again |
| Being paid | Receive on the card, the Receive shortcut or Receive in More: the sheet with the four ways money can come; Bank transfer opens Three ways to be paid, with the number to copy and the code to show, share or save; "how do I get paid" typed at home opens the same page; the lab can have ₦50,000 arrive from Sarah | From a card and In dollars say which round brings them; nothing here can take money out |
| Asking for money | "ask musa for 20k for the rent balance" typed at home, a photo of a message asking for the account (the sample message in this build), Ask someone on the sheet or Ask for money on Three ways; the people it can ask are Musa Danjuma, Sarah Adeyemi and Chidi Okafor, or a name with a phone number typed in the reply bar; the amount on the keypad; Send the request once it has a date | a reply with no name or figure in it says so; asking cannot move money, so there is no passcode |
| Beetle's model | a key kept on the phone from the lab's model screen, or one in the build, puts Claude behind Beetle; without one the script answers | a key that is refused, or no network: the script answers, with a note saying why |
| A photo | on the phone, the camera and the device's own reader; on the web and in Expo Go, the sample slip, which reads as Sarah Adeyemi at GTBank, `0234 5678 90`, and the sample message, which reads as Musa asking for 20k for the rent balance | a photo with no ten-digit number on it; on the Send money page, a reading the reader is not sure of stops at Check this number; a message asking to be paid stops at Read from your photo, over the camera |

## How it is put together

| Folder | What it is |
|---|---|
| `app/` | The routes: the loading screen, the lab, the way in as one screen, home, Send money and the pages around it, a receipt, a transfer's state pages, Three ways to be paid and Your code, the request and Request sent, Bills, Pay a bill and What I found, All services, Buy data and the top-up, Borrow, Activities and the answer, Settings and the pages its rows lead to. `expo-router` reads this folder as the map. |
| `src/design/` | The design system read off the Figma file: tokens, type, icons, motion, and the pieces every screen is made of — among them the amount picker (`Amount.tsx`, and `AmountSheet.tsx` for a page with no room for it), the ··· and its pop-up (`Menu.tsx`), and the phone's clicks and knocks (`haptics.ts`) |
| `src/icons.ts` | The 96 glyphs, generated from `../src/icons.js` by `npm run icons`, which puts the line widths the file draws them at (0.075 of the box for a glyph, 0.10 for a bare mark) and round ends back on every stroked path, and cuts a solid glyph's white details (the face in Face ID, the card's stripe, the shield's tick, the clock's hands, the house's door) out of it through a mask, so they show whatever the glyph sits on; never edited by hand |
| `src/features/onboarding/` | The way in: the step machine (`machine.ts`), what is remembered and the session (`store.tsx`), the rules (`validation.ts`), the one screen and its choreography (`WayIn.tsx`), what each stage of it shows (`views.tsx`, `stages.ts`), and the guard that keeps home for a session |
| `src/features/tabs/` | The three pages side by side (`Pager.tsx`): which one shows and what holds them still (`tabs.ts`), what a page knows of itself (`page.tsx`), and the old addresses that turn to one (`Redirect.tsx`) |
| `src/features/home/` | Home: the card (`WalletCard.tsx`, closed and open and the drag between), the haze at its head and its foot (`Frost.tsx`), the four cards under it (`Grid.tsx`), the page around them with the chat, the drawer and the sheets (`Home.tsx`), the ask bar in its two states (`AskBar.tsx`), what the record shows for an account (`account.ts`), what moved on this phone since (`moves.ts`), and the once-only dip (`first.ts`) |
| `src/features/agent/` | The chat: the conversation and what Beetle is waiting for (`conversation.tsx`), the list (`Chat.tsx`), the dark pieces it is drawn with — what was said, the panels, the dots (`Dark.tsx`) — the ask panel with its fields (`AskPanel.tsx`) and the list of what was paid before that grows out of it (`SavedPeek.tsx`), the receipt's card and the same card opened where it is (`ReceiptCard.tsx`, `ChatReceipt.tsx`), and the chats, Beetle's prompts among them (`chats.ts`), with the hour they carry on for (`hour.ts`) and the drawer they live in (`Drawer.tsx`) |
| `src/features/scan/` | The camera from its frames (`Scan.tsx`): every way it can go wrong, the photo read on the spot and drawn back with what was found, the sample photos in its gallery (`sample.ts`), the sheet a message puts up over it (`ReadSheet.tsx`) and the rows it and What I found lay their pieces on (`ReadRows.tsx`), and the photo's way back to the screen that asked (`handoff.ts`) |
| `src/features/passcode/` | The gate before money moves: the passcode on its sheet over the chat (`Passcode.tsx`) and the check itself, with the tries and the lock (`check.ts`) |
| `src/features/receive/` | Being paid: the Receive sheet (`ReceiveSheet.tsx`), Three ways to be paid (`Ways.tsx`), Your code (`MyCode.tsx`) with the QR made and drawn (`qr.ts`, `Code.tsx`) and its picture shared or saved (`picture.ts`), money arriving (`arrival.ts`), and the clipboard |
| `src/features/request/` | Asking for money: who can be asked (`people.ts`), what the pages hand each other (`hand.ts`), the words typed at home that are a page (`intent.ts`), Read from your photo over the camera (`FoundSheet.tsx`), the Request page (`Request.tsx`) and what Beetle says on it (`words.ts`), the requests kept (`requests.ts`), and Request sent (`Asked.tsx`) |
| `src/features/bills/` | Bills: the billers and the month (`billers.ts`), the page that pays one (`PayBill.tsx`), the month's page (`Bills.tsx`), What I found for a bill read off a photo (`Meter.tsx`), and what the pages hand each other (`hand.ts`) |
| `src/features/services/` | All services: the drawer (`Services.tsx`) and what it lists, with the way the bar's words find one (`services.ts`) |
| `src/features/data/` | Data and airtime: the page (`BuyData.tsx`), the sheet over the camera for a message asking for data (`TopupSheet.tsx`), the chat that prices a top-up read off a photo (`Topup.tsx`), and what the pages hand each other (`hand.ts`) |
| `src/features/loan/` | Borrow: what a loan costs (`loan.ts`) and the page (`Loan.tsx`) |
| `src/features/dollars/` | Dollars: the rate, the fee and the sums (`dollars.ts`), the page (`Dollars.tsx`), Convert (`Convert.tsx`) and Converted (`Converted.tsx`), and the Pay from sheet the paying pages put up (`PayFromSheet.tsx`) |
| `src/features/goal/` | Putting money away: the goal and what feeds it (`goal.ts`), the page in its three states (`Goal.tsx`), the sheet that feeds it (`FeedSheet.tsx`), and what the keypad hands back (`hand.ts`) |
| `src/features/health/` | Money health: the score and the five habits (`health.ts`) and the page (`Health.tsx`) |
| `src/features/send/` | Sending money: the page (`Send.tsx`), Not enough (`Short.tsx`), Check this number (`Misread.tsx`), and what the pages hand back to the one under them (`hand.ts`) |
| `src/features/transfers/` | A transfer that is not done: Still on its way, It did not go and It came back (`Transfer.tsx`), What went wrong? (`Wrong.tsx`), Asking for it back (`Recall.tsx`), I sent it wrong (`AlreadyGone.tsx`), what each says about a line (`states.ts`) |
| `src/features/receipts/` | A receipt for every line of the record: the record and the frames' own figures (`receipts.ts`), the page and the pieces it shares (`ReceiptScreen.tsx`), the share sheet (`ShareSheet.tsx`); the card in the chat is `src/features/agent/ReceiptCard.tsx` |
| `src/features/more/` | The one foot every screen shares (`Foot.tsx`): the bar on the three pages and under the open chat, and on a page Back beside its button, Back and Slide to send, or Back alone, morphing from the one to the other; and More, the actions up out of its plus (`More.tsx`), with the way a page hands a question, or a transaction, to the chat on home |
| `src/features/activities/` | The record (`Activities.tsx`) in the frame's order (`rows.ts`), a line opened where it is (`InPlace.tsx`), and the answer to a question about spending (`Answer.tsx`) |
| `src/features/settings/` | Settings from the gear on the bar (`Settings.tsx`), Your details on its sheet (`Details.tsx`), what the pages set, kept per account (`prefs.ts`), and the pages: Lock and privacy, Spending limits and Past your own limit (`words.ts` holds the three words), Standing instructions and Set this up?, Devices, Not your phone, A new passcode, Virtual card |
| `src/lab/` | The lab: which builds have it (`enabled.ts`), every feature and the places in it with the state each needs (`catalogue.ts`), the screen, and the tab that comes back to it |
| `src/services/` | `AuthService`, `IdentityService`, `AgentService` (Beetle: the model in `model.ts` where there is a key, the script in `agent.ts` where there is not), what Beetle knows of the country (`nigeria.ts`: the networks by prefix, the data plans, the electricity companies, what a meter number looks like, a `MeterService` that says whose a meter is, and the people, lines and meters paid before), `ReaderService` (the device's text reader, or a stand-in), storage and hashing behind interfaces, with the mocks this build runs on |
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
home, the Receive sheet, a receipt over Activities, Your details, More. A
swipe that starts on the Services card is the card's. With a receipt up,
a swipe to the left goes nowhere and the swipe an iPhone goes back with
closes it. The old addresses, `/activities` and `/settings`, turn the pages
to their page, and a link from anywhere (a question for Beetle, Receive
from More, the record's See log) turns them to the page it needs. On the
web a page off to the side is taken out of the page while they rest, so
what the checks read is the page showing.

## Home and the chat

Under the card, four cards two by two, the way Fuse lays out its own:
pale grey, rounded 20, a 32 glyph at the top left and at the foot a small
grey word and a bold figure. Savings says the most — the goal's ring in
green with the pot in it, Holiday and how far along, what is put aside,
and how it is going: a fortnight ahead, paused for now while money is
tight (the ring gone grey), what it is aiming for while nothing is in it,
or, with no goal, Start a goal. Loan is what could be borrowed once
setting up is done. Card is the virtual card by its last four, with what
is left to spend this month or Frozen. Services is laid out like the other
three and holds Airtime, Bills and Data to swipe through inside it, the
glyph and the name sliding together and three small dots at the top right
following the swipe; a tap on the one showing opens
it, and a tap on the word Services opens All services. Each card opens its
page, lighting while the page comes out of it. There is no dollar wallet
on home yet; the chip on the card is the way to the dollars.

The black card at the top holds the word Wallet at its left, the balance,
Send and Receive, and a grabber that says pull down; Settings is the gear
on the bar at the foot, so the header carries no mark of its own. Pull it and it becomes the chat: it grows down to
just over the bar — which stays, the same bar as everywhere, its white
going bare as the card comes over it — while the figure
glides up into the header, shrinking as it goes, and takes the word Wallet's
place at its left; the buttons soften away; the
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
end, or the phone's own back, closes it too. The first time on a phone, the card dips on its own
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
when, Successful. A tap on it opens it where it is, the way Fuse opens a
transaction: the card grows a little, out to the chat's edges and down by
a few lines — who and where, the fee, the balance after — with Share and
the full receipt a tap further, over the chat gone soft under a dark veil;
never a full or a half screen. A tap anywhere else folds it back. The
amount on a panel can be corrected by tapping it.

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

The key comes from the phone's keychain, set on the lab's "Beetle's model"
screen, or from the build (`EXPO_PUBLIC_ANTHROPIC_API_KEY` at export time;
the Phone workflow passes the repository secret `ANTHROPIC_API_KEY` there,
so adding that secret puts the model behind Beetle on the phone). Neither is
the shape a shipped app should have: that is a server that keeps the key,
and `EXPO_PUBLIC_ANTHROPIC_BASE_URL` is where it goes when there is one. The
model is called with plain `fetch`, since React Native is not a runtime the
SDK supports; `npm test` drives it against a fake API to check the request,
the tool loop, the steps, the panels and the fallback.

The chats live in the chat, in a drawer inside its dark card, and nowhere
else. While the chat is open a soft light runs down the card's left edge;
a swipe from there to the right brings the drawer in from the left,
following the finger (a tap on the edge does too). It sits under the
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

Money does not move on half an ask. A request that carries everything the
thing needs — "send 20k to Sarah", "2GB for mum", "pay my light bill" —
goes straight to the panel to confirm. One that does not gets an ask panel
in the chat: the same dark card as the panels, with the fields the thing
needs, what was said already in them and the rest empty (the user's
choice: one panel with the missing fields, not one question at a time).
A transfer needs who and how much; data needs the number and the plan;
airtime needs the number and the amount; a bill needs prepaid or postpaid,
the company, the meter number and the amount. The pill reads Needs a bit
until every field is in, then Ready; Continue hands it all back to Beetle,
which says what it is doing, and the panel to confirm lands under it, then
the passcode, then the receipt card. Words work as well as fields: an
amount, a number, a plan, a company typed into the ask bar go into the
panel that is up, and a question in the middle — the balance, dollars — is
answered without losing it.

What Beetle knows (`src/services/nigeria.ts`) fills in what it can. A
phone number shows its network as it is typed, read off its first four
digits — MTN, Airtel, Glo, 9mobile — and a number that does not start like
one is said so. Data is typed as a size or an amount ("5gb", "2000"), or
picked from the three likeliest plans as chips under the field, with All
plans a tap away; a plan on the wrong network is refused. Airtime has an
amount field and a slider under it, ₦100 to ₦10,000 in hundreds, its
stops spaced evenly so the small amounts get as much room as the big
ones; when the number is already known it sits compact with Change beside
it. A bill's meter is looked up as soon as it reads right and the company
and the kind are known, and the name and address on it appear under the
field; a meter the company does not know is said so. Prepaid amounts say
about how many units they buy. Nothing over the balance goes through.

Under the fields a small line — Someone you have paid before, A number you
have topped up, A meter you have paid — blurs the screen and lists them,
the list growing out of the line the way a receipt grows out of its row:
the people the day and the ledger show paid (with their bank and account,
when, how many times), the lines topped up (with the network and the last
plan or amount), the meters paid (the company, the kind, the number). A
tap fills the panel and the list folds back. The list is built from what
moved on this phone, the day the frames draw, and what the demo account
paid in earlier months; a repeat needs no asking: "data for mum" is Mum's
MTN line and the 5GB she had last time, "airtime for dad" is Dad's ₦1,000,
"pay my light bill" or "the usual" is the Ikeja Electric meter and the
₦8,000 it usually takes, "mum's flat" the postpaid one at Eko. Both
Beetles ask the same way: the script reads the words; the model has
`find_line`, `find_meter`, `list_plans`, `lookup_meter` and `ask_for`,
which puts up or fills the same panel, and `prepare_data`,
`prepare_airtime` and `prepare_bill` once nothing is missing. The lab has
a place for each ask, and the walk fills them from the panel and from the
list and takes them through the passcode to the receipt. The ask panel has
no frame of its own; its sub-cards, chips (the frame's 112×62, two lines)
and the initials row are read off the Pay a bill and Buy data frames.

## Sending money

Send on the card and Send money in More open the Send money page, from
its frame (`src/features/send/Send.tsx`): the amount, who it is going to,
a reference, and from where, when it lands and the fee, each on its own
white card in one grey one, Beetle saying where things stand above them,
and Slide to send at the foot beside Back. Four taps: Send, who, the
amount, and the passcode — the slide is a drag. A tap on the person opens
the people paid before, the list growing out of the card the way the ask
panel's does, with a number to type and the camera under them; a typed
number becomes somebody at its tenth digit, and a photo goes through the
reader and comes back as the person on it. The amount is picked where it
is, on the amount picker (see Amounts): the ruler, which stops hard at all
Everyday can send once the fee is counted, what was sent to them before
and a round figure as chips with All of it, or the figure tapped and typed.
There is no page of its own for it any more. The reference is typed in
place. The fee is the receipts' rule: nothing
under ₦10,000, the banks' own with the tax on it above. The slide's knob
follows the finger; let go past four fifths of the way and it lands at
the end and the passcode comes up, before that and it springs back; until
there is someone and an amount the pill is the pale grey. After the
passcode the line goes into the record — Activities sees it the moment it
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
(`src/features/transfers/`). Still on its way: the ring turning, the
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
any page — puts up a sheet over
everything, from its frame: the arrow down on its disc, the word, and the
four ways money can come, each a row with its glyph, its name and a line:
Bank transfer (the number to hand out), From a card, Ask someone, and In
dollars. Done sends it back; so does a tap outside it or a pull down on its
head. Bank transfer and Ask someone send the sheet down first and then open
their page, the page's title growing out of the row; From a card and In
dollars say which round brings them.

Three ways to be paid is the page Bank transfer opens, and the page Beetle
gives for "how do I get paid" typed at home: Beetle's word that there is
nothing to photograph when money is coming in, then three grey cards — the
account number with Copy it, the code with Show it, and asking somebody with
Ask for money — and a note that none of these can take anything out. Show it
opens Your code: a real QR of the account, made on the phone from the
account's own number (this build's own address for it, `beetle://pay`, until
there is a bank behind the app to hand out the standard's), drawn with its
three eyes rounded the way the frame rounds them, on a white card with the
name and the number under it. A unit test reads the code back off its
modules with a QR reader. Share it hands the card's picture to the phone's
share sheet (on the web, with none, the words go to the clipboard); Save it
puts the picture in Photos, asking for the way in the first time (on the
web it downloads the picture). Both pages keep Back at the bottom left;
no page but home carries an ask bar.

## Asking for money

A request is not money moving, so nothing about it needs the passcode, and
the page says so at its foot. It can begin four ways: "ask musa for 20k for
the rent balance" typed in the chat at home, which is a page rather than an
answer; a photo of a message asking for the account, which the camera reads
first and answers with Read from your photo over itself — the amount and
what it is for from the photo, the person matched to someone who has paid
before, and where the request reaches them — with Ask Musa, Retake, and Not
this person, which goes on without the person; Ask someone on the Receive
sheet; and Ask for money on Three ways to be paid.

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

Borrow, from its frame, shows the whole cost before deciding: the figure
with less and more either side and the bar under it against the limit, the
three terms, and the cost row by row — what you get today, the interest at
4% a month, the one-off fee, what it comes to, the payments and the first
of them, a month from today — with the word about paying late at the foot,
and Slide to take beside Back. The figures are this build's own
(`src/features/loan/loan.ts`) until a lender stands behind the app; the
frame's ₦150,000 for 90 days comes to ₦169,500 in three payments of
₦56,500. The slide leads to the passcode, and the money then lands the way
any money in does: on the card, as a line in the record, and as a chat from
Beetle with the receipt's card, which opens Money in from Beetle Loans.
"borrow" or "how much can I borrow" typed at home opens the page; so does
Loan on All services.

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
the line goes into the record, the dollars change hands, and Converted takes
the page's place — the tick, the rate you got, the fee, what the dollars
come to now, and the offer to move ₦20,000 across every payday, which
Set this up turns into a standing instruction. A conversion's line in the
day opens Converted again; its receipt says the rate.

Paying from the dollars: the From row on Send money, Pay a bill and Buy
data opens Pay from — Everyday with what it holds, Dollars with what they
are worth today, a tick on the one chosen — and picking Dollars makes the
page pay from them at the rate on it: the figure in dollars under the
amount, no fee, and the line that the rate is held for sixty seconds once
you slide. The naira balance is left alone; the receipt says From Dollars
with what left them. "convert" or "buy dollars" typed at home opens
Convert; "what about dollars" stays a question for the chat.

## Putting money away

Savings pot on All services, or "my goal" typed at home, opens Holiday,
from its frame: how far along the goal is on a ring with what is put aside
under it, Beetle's word on the pace, what is feeding it row by row — the
payday slice (the standing instruction on the Rules page), round ups from
card payments and the cash back on top ups — Add money and Feed it more,
the line that nothing is locked, and the question of what happens when
money gets tight, which Beetle answers in the chat. Add money puts the
amount picker up on a sheet over the goal, stopping at what Everyday holds,
then the passcode; the line goes into the record as Put away,
its receipt opens, and the ring moves. Feed it more is the sheet from its
frame: the four ways with a switch on each of the three that run on their
own and Set it on the fixed amount, with the note that none of it is
locked away. The switches are kept on this phone with the other settings
(`src/features/settings/prefs.ts`); the payday one is the same switch as
Standing instructions.

While Money is tight this month is on (the switch at the top of Standing
instructions), the goal is Paused, from its frame: the feeds wait, the
cash back still comes in, the date moves from 12 March to 9 April, and
Start again lifts it. An account the design does not seed a goal for sees
Goals with nothing put aside yet, Start a goal and Set it up; Start a goal
starts Holiday from nothing. The goal's figures are the demo's own
(`src/features/goal/goal.ts`) until an account service keeps them.

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

Every settled line on Activities opens where it is, the way Fuse opens a
coin in its list (`src/features/activities/InPlace.tsx`): nothing is
pushed and nothing fills the screen. The line stays in its place, sharp,
and the page under it goes soft behind a frost of white — still there, out
of focus — while the bar steps out of the way. Under the line the rest of
it grows in, out of a blur: what the line does not already say. Not who
(the line says that) and not the total (the amount and the fee say that):
where it came from and the fee, the amount and the balance after, anything
written with it, and the session id, kept back behind Show it, since it
only matters when the transaction is being queried. Then Share receipt and
the thing Beetle offers — Set it up, the same again — side by side. The ···
for the rest sits at the top right beside the page's title, which stays
sharp over the frost with it: Ask Beetle about this, Report a problem. A line low on the page lifts just enough for
what grows under it to fit. A tap anywhere off it, or the phone's back,
puts it all back the way it came — a tap, not a swipe: a finger that moves
across the frost leaves it open — and the pages hold still while it is open.

The card in the chat opens where it is (see Home and the chat), with the
full receipt a tap further; the flows that end on a receipt — Send money, a
bill, data, the loan — open it as its own page. The receipt page is the
frame's: the title with the day and the time and a ··· at its right, the
amount on its tick with the status chip, the slip — who and where in two
columns, what was written, a dashed rule before the money, the fee and what
it was for, the total and the balance after, the session id with a button
to copy it — then what Beetle offers about it. A bill's meter token sits
above the slip with its own copy button. The foot is Back with Share
receipt beside it. The ··· opens a small pop-up, grown from the dots over a
light white wash (`src/design/Menu.tsx`): Ask Beetle about this, which
files whatever chat there was and opens a fresh one on home about that one
transaction — what it is set down as a note Beetle reads, and Beetle asking
what you want to know — and Report a problem, which for a transfer opens
What went wrong?. Share receipt opens the frame's
sheet: WhatsApp and Save to photos take a picture of the receipt (the same
way Your code is shared and saved) and hand it to the phone's share sheet or
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
amounts, and All of it where there is a cap. Dollars run the
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

Every screen shares one foot, over the stack, the way Fuse keeps its own
(`src/features/more/Foot.tsx`). On the three pages it is the bar, drawn
the way Fuse draws its own: a white surface with its top corners rounded
and a soft shadow above it, three solid glyphs at the left — Home,
Activities, Settings, the page showing in black — and the black plus to
the side. It is drawn once for all three and stays where it is as they
turn. It stays under the open chat — its white and its shadow going bare as
the card comes down to just over its glyphs — and goes down under the
keyboard and out of the way under a sheet. On a page that needs a way back
it is Back beside the page's one button (Share receipt, Send the request,
Load card), or Back and Slide to send (Send money), or Back alone; no page
but home carries an ask bar, and the plus stays on the bar of the three
pages. Back is always at the bottom left, 20 in, with 12 clear between it
and the button so each is its own tap. Home to a page is one movement, as
Fuse does it: the plus scales away, the three glyphs fade as the button
comes, and Back slides in from the left edge; back to home runs it in
reverse.
Each screen says what its foot holds while it has focus (`useFoot`), and
the numbers are the frames' docks: 104 tall, the row 56 with 24 above and
below, 20 in from either side, Back 44, the button 56; the slide is 60
tall, as the Send money frame draws it. On a page the foot's white is not
an edge: 40 of fade sit over it, so what scrolls under the foot dissolves
into it instead of being cut. While something is open over a page — a
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
stands first with its status glyph and a chevron, and opens its own page;
what settled follows on the grey square, each line opening its receipt
over the page (see Receipts). What you moved into your own goal is not in
it: that money is still yours. "Where your money went" opens the answer, from its frame: what was asked as
the head, Beetle's line, the figure with its change and the six months
behind it, where it went, and what Beetle would do about it.

## Settings

The gear on the bar turns to Settings, the third page, from its frame: the Plus
card, and three groups of rows — what keeps the money yours, your account,
about — with what each is set to at its end. Every row leads somewhere.
Your details opens a sheet with the name, the number, the account number to
copy and when the account was opened; Sign out signs out. Lock and privacy
has the switches — Face ID, what other people can see — kept on this phone
per account (`src/features/settings/prefs.ts`), Passcode leading to a new
one on the keypad, six digits twice with the weak ones refused, and Ask
again after cycling through the waits. Spending limits shows where today
stands against the day's cap — the figure is the day's own — the three
caps, and what happens at the line; Show me what that looks like opens Past
your own limit, where the passcode is done and the three words are typed in
full, letter by letter, with the button waiting for the last one. Standing
instructions has the one switch that pauses the saving, the three
instructions with a switch and a log each, and Add an instruction, which
offers one on Set this up? — the same page a receipt's offer opens — and
Set it up turns it on. Devices lists everywhere the account is open with
the odd one marked, and Sign out everywhere else leaves this phone alone.
Keys and recovery opens Not your phone, what recovery looks like: freeze
the money, then prove it is you with a new passcode, which lifts the
freeze. Cards opens the virtual card: its face, Reveal for ten seconds,
Freeze kept on the phone and greying the face, Rules to the instructions,
and how much of its ceiling has gone; funding it and a second card come
with their rounds. Beetle Plus, Contact support and Give feedback open the
chat with the question asked; Notifications and Saved people say what they
are waiting on.

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

Between screens the thread is kept, the way Fuse keeps it. Fuse hardly
ever pushes a page: the thing you tapped stays where it is, the rest
recedes under a blur, and the next thing grows out of it. So a line on
Activities does not open a page: its receipt comes over the page in one
step, the amount out of the line's figure, the page soft under white; and
the receipt in the chat grows in place a little, the chat soft under dark.
Where Beetle does need a page, the thing you tapped lights and stays lit,
the screen it is on recedes — dimmer, softer, a touch smaller — and the
next page arrives whole, its title with the rest of it, out of the same
blur and at the same moment: nothing flies across from the button and
nothing grows into a title, which drew the eye to the movement rather
than the page. On the way back the screen comes forward again and the
thing you left from pulses once. All of it is `src/design/journey.tsx`:
a departure records where it started, and the screen left behind pulses
it on the way back. The foot keeps its own thread across the change: the plus scales away,
the glyphs slide right into the ask bar and Back slides in from the left,
in the same 340ms the screens fade in. The three pages turn on a spring
that settles without running past, carrying the finger's speed when it
lets go.

`npm run flow` traces the moments that matter — the first screen change,
the ticks, the balance, the card opening under a finger, the first-time
dip, a title coming up from the row that opened it, the pages sliding
under a bar that stays put, a receipt's amount coming up out of its line
as Back slides in — and fails if
they are not moving the way that file says.

## What comes next

The rounds in `PLAN.md` are built. What is left is what no frame draws:
a server for the model's key, the bank's own services behind the
interfaces, and the frames' later rounds as they are drawn.
