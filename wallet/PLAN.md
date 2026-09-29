# The plan — Beetle, the whole app

Everything between where the app is and the whole of it. Each item is checked
off only when it is built, checked against its frame, and walked in the
running bundle, never when it is written. The rounds go in order; nothing in a
later round starts before the round it depends on is done.

The home screen in the app is the one to keep: the black card with the balance,
Send and Receive, the pull down into the chat, the day under it. The file's
older home (225:3) is not used. Everything else is built from the frame named
beside it, with its sizes and its words.

## The rule for every screen

1. **Frame first.** Open the frame. Save its picture to `test/figma/<key>.png`
   and its layer numbers to `test/figma/<key>.xml` (what the file says each
   piece measures and where it sits). Both are committed, so the checks run
   without Figma.
2. **Build from the numbers.** Sizes, spacing, radii, type sizes and weights
   come from the frame and from `src/design/tokens.ts`, which was read off the
   frames. Nothing is judged by eye and no row is invented. Every size and gap
   snaps to the 4-point grid: where the frame's figure is odd (21 of card
   padding, a 59.2 tall head) the app uses the nearest 4 (20, 60), so
   everything stays divisible and constant, and the check allows exactly that
   rounding and nothing more.
3. **Register it.** A route under `app/`, a place in the lab (`src/lab/catalogue.ts`)
   with the state it needs, and a line in this file.
4. **Check it.** `npm run figma` opens the screen and measures it against the
   frame: every named piece within a pixel of where the frame puts it and how
   big the frame draws it, once the frame's figure is snapped to the grid;
   type at a size from the scale; the words the frame carries all present (a
   figure that now comes from live state, or a line reworded on purpose, is
   listed in `test/figma/allowed.json` with why).
   It also lays the frame and the screen side by side into `shots/figma/` for a
   look — the look and feel have to read as the same screen.
5. **Walk it.** `npm run flow` reaches the screen the way a person would and
   photographs it, including the states that say no.
6. **Count the taps.** Every process from home ends within four taps. The
   count is written beside the flow below and the walk asserts it.

The motion is the one language throughout (`src/design/motion.tsx`): things
arrive out of a blur and leave into one, a press dips and springs back, the
same curves everywhere. The More sheet moves the way the frame and the
earlier work set: the screen behind blurs, the items come up out of the
button, the plus turns into a cross.

## What every round ends with

Typecheck, unit tests, the bundle, the Figma check, the walk, the README,
one commit on main, the Phone workflow's update to Expo Go, the artifact,
screenshots to the owner.

---

## Round 0 · The check itself — done

- [x] `test/figma/` — the frame's picture and numbers for every screen built
      so far (the way in, home closed and open, the passcode), and for each
      new screen as it comes
- [x] `test/figma.mjs` — opens each screen through the lab, waits for it to
      stop moving, measures the named pieces against the frame's numbers,
      checks the frame's words are on the screen, and composes the
      side-by-side picture
- [x] `test/figma/allowed.json` — the differences allowed on purpose, each
      with a reason: a live number, a frame whose own spacing is the odd one
      out, a line reworded for six digits
- [x] `npm run figma` in `verify` and in the Tests workflow
- [x] A first pass over what is already built: the way in's column and the
      welcome's words put on the frames; the closed card's figure, chip and
      discs put on theirs; the passcode rebuilt as the frame's sheet
      (239:7762) with the big pad, on a `Sheet` the More sheet and the rest
      will share. Still to come with their rounds: the receive pane (Round 4),
      the shortcuts' own frame, Settings (Round 1)

## Round 1 · Chats that carry on, and receipts — done

A chat lasts an hour from its last message. Closing the card keeps it; a pull
down within the hour continues it; after the hour the next pull down starts a
new one. A chat reopened from the day becomes the one that carries on. An
unread prompt from Beetle waits in the day and never takes the pull down.

- [x] Chats carry `lastAt`; the hour rule in `src/features/agent/chats.ts`,
      with a unit test; the rule holds across a restart
- [x] "New" at the top right of the open card — a word with a small glyph, in
      the header, arriving with the open pieces — files the chat and starts a
      fresh one with Beetle's greeting
- [x] Receipts — `src/features/receipts/`: the record (what moved, to whom,
      from where, fee, total, balance after, when, the session id), kept per
      account, one for every line the day already shows
- [x] The receipt card in the chat: after the passcode the panel becomes a
      summarized card (the amount, where it went, when, Successful) and a tap
      opens the full receipt
- [x] The receipt screen, `/receipt/[id]`, from the frames: a transfer
      (donesend 239:7829), data bought (done 239:8418), a bill paid (power
      490:13497), money in (donein 490:12465); the `Receipt` piece itself in
      the design system with the frame's two columns, dashed rules, and the
      session line with its copy button
- [x] Share receipt (the share sheet 472:10886, 472:11590, 490:13595, 490:12558):
      WhatsApp and Somewhere else through the phone; the picture and the PDF
      come with round 5
- [x] The dock the frame gives the receipt screen: back, "Ask about this
      transfer", the camera — asking opens home's chat with the receipt named
- [x] Every line in the day opens its receipt; an arrival gets one too
- [x] "Something wrong with this?" opens the What went wrong screen (round 7);
      until then the row is there and says the round it lands in
- [x] The mark at the top left opens Settings (272:8208): the page, the Plus
      card, the three sections, Your details (name, number, account number,
      member since) and Sign out working; home's own Sign out link goes
- [x] Lab places: a chat that carries on (with New), a receipt in the chat,
      each receipt kind, the share sheet, Settings, Your details

Taps: a transfer from the chat is pull down (1), type, Send this (2), Confirm
(3), the passcode (4).

## Round 2 · The bar, the More sheet, Activities, Settings in full

The non-chat interface is a click through. The bottom bar carries Home,
Activities and Camera, and a single More button to the side, as the frame
draws it. The bar shows on home with the card closed and on the screens the
frames give a bar to; the open chat has the shortcuts row instead.

- [x] The bottom bar — Home, Activities, Settings, and the black plus to
      the side, drawn like Fuse's; goes down as the card opens and comes
      back as it closes
- [x] The More sheet (actions 204:85): Camera, Send money, Receive — the
      frame's five less the two the bar carries — each with its coloured
      glyph, right aligned above the button;
      the screen behind blurs; the items come up out of the button and settle;
      the plus turns into a cross; anywhere else closes it; closing runs
      backwards before the screen goes; the same sheet from the plus on
      Activities, Standing instructions and the card
- [x] Activities (history 501:14267): everything that moved, newest first,
      All / In / Out, today and yesterday, each settled row to its receipt,
      the other states waiting on round 3; the answer to a spending question
      (answer 218:84) from the day's insight
- [x] Settings in full: Lock and privacy (lock 271:8211), Spending limits
      (limits 223:206) and Past your own limit (limitstop 224:2), Standing
      instructions (rules 207:136) and Set this up (rule 207:101), Devices
      (devices 224:53), Keys and recovery (lostphone 957:20438, newcode
      957:20481), Your details, Notifications (no frame; says so), Saved
      people (round 3), Cards (card 218:2), Contact support and Give feedback
      (into the chat), Sign out; what the pages set is kept per account
- [x] Beetle Plus: the card on Settings opens the chat asking about it
- [x] Lab places for each, the Figma check on all twelve frames, the walk
      through every page

Done. Notes: two frames (lock, answer) box their head at 59 and let its
second line run under the first card; the build gives the line its room and
the check anchors those screens on the card. The card frame's root layer is
itself named Card. The bar and More overlapped on Camera and History; the
answer was Home, Activities and Settings on the bar, and More without
History and Settings.

Taps: More (1), History (2), a line (3) is a receipt. More (1), Settings (2),
a row (3).

## Round 2.5 · Continuity

Fuse hardly ever pushes a page: the thing you tapped stays where it is,
the rest recedes under a blur, and the next thing grows out of it. Where
Beetle needs a page, the thread is kept: the thing you tapped lights and
stays lit, the screen recedes, the next page's head arrives from the
tapped thing's own place carrying its words, the body follows out of a
blur, and on the way back the thing you left from pulses once.

- [x] The kit (src/design/journey.tsx): the origin store, departures that
      light and recede, arrivals that carry the words, the screen's own
      recession, the pulse on the way back
- [x] The peek: a line in the day or in Activities grows into its receipt
      summary in place, the rest receding; The full receipt carries the
      amount into the page
- [x] The journeys: the mark and the bar to Settings and Activities, See
      all, the card tile, the spend insight, the chat's receipt card,
      Settings' rows to their pages, Passcode to the new one, Show me what
      that looks like, Add an instruction, the receipt's offer
- [x] The record's page titled Activities, as the bar and the day call it
- [x] The walk traces a journey and the peek mid-motion; README; the check

Done. The bar, the chat, the day, Activities and every Settings page lead
away through src/design/journey.tsx; a screen opened from the lab or a
link simply fades in.

## Round 2.6 · What Beetle asks for before money moves

A request that does not carry everything a transaction needs gets asked
for the rest, in a panel in the chat with the fields it needs, pre-filled
with what was said; a request naming someone or something paid before
skips the asking. Then the confirm panel, the six-digit passcode, the
receipt.

- [x] Questions first: one panel with the missing fields (the answer);
      data typed as a size or an amount with the likely plans as chips and
      all of them a tap away; airtime with a slider and a small Change
      beside a number already known
- [x] Knowledge: the networks by prefix (MTN, Airtel, Glo, 9mobile) and the
      network shown as the number is typed; the discos (Ikeja, Eko, AEDC,
      JED, KEDCO, IBEDC, EEDC, PHED, BEDC, KAEDCO, YEDC); prepaid or
      postpaid and the meter number; data plans per network; a lookup that
      returns the name on a meter; the beneficiaries kept per account —
      people paid, numbers topped up, meters paid (src/services/nigeria.ts)
- [x] The ask panel: amount, number with the network badge, plan chips,
      meter with its kind and disco; a small line under it — Someone you
      have paid before, A number you have topped up, A meter you have paid —
      that blurs the screen and lists the recent ones (the peek); picking
      one fills the panel and it processes
- [x] The scripted Beetle and the model's tools ask the same way, and take
      a repeat
- [x] Lab places, the walk through each ask to the receipt, README

Done. Notes: the ask panel has no frame; its sub-cards, chips and initials
row follow the Pay a bill and Buy data frames. A linear airtime slider
cramped ₦100–₦1,000 into a tenth of it, so its stops are spaced evenly.
"Top up" alone is airtime now; "top up my light" is still the meter.

## Round 2.7 · Back, always at the bottom left

As Fuse does it: on a page that needs a way back, the plus goes, the pill
with Home, Activities and Settings slides to the right, and Back slides in
from the left edge at the bottom left, so Back is always in the same
place — beside a confirmation button too.

- [x] A question first: the frames' inner pages carry Back and the ask bar
      (and the plus on some); Fuse carries Back and the pill. Which does an
      inner page's foot hold? — Back with the ask bar, morphing as Fuse does
- [x] One foot for the whole app, in the root layout over the stack,
      morphing with the route: the pill sliding, Back sliding in from the
      left, the plus scaling away; the pages' own docks folding into it
      (src/features/more/Foot.tsx; each screen declares with useFoot)
- [x] The pages with a button at the foot keep Back beside it
- [x] The walk and the check updated

Done. Notes: the foot lives over the stack, so it no longer recedes with a
page that leads away; the glyphs' departures recede the screen with focus
through the journey's own record of it. The docks' pieces keep their
frame numbers, so the check measures them where it did. A screen that
declares no foot — the way in, the lab, the camera, a new passcode — has
none.

## Round 3 · Sending money, four taps

- [ ] Send on the card, and Send money in the More sheet, open the send form
      (pay 332:9851): the amount, who to, the reference, from, arrives, the
      fee, and Slide to send
- [ ] Who to: a saved person (the people the account has paid), an account
      number typed (typed 209:209), or one read off a photo (scan 209:2,
      found 205:2) — the reader already in the app
- [ ] Slide to send, then the passcode (confirm 239:7762), Face ID first
      where enrolled and Face ID missed (noface 331:9488)
- [ ] All done (donesend 239:7829) and Share (472:10886), already built in
      round 1, reached from here
- [ ] The states of a transfer, from the receipt and from the day: Still on
      its way (pending 206:2), It did not go (failed 206:77), It came back
      (reversed 206:153), Not enough (short 208:88), Check this number
      (misread 957:20338), I sent it wrong (alreadygone 957:20392)
- [ ] What went wrong? (wrong 206:225), Asking for it back (recall 207:2),
      Change the amount (amend 222:148)
- [ ] The ledger's three unsettled rows on home open their own states
- [ ] Lab places for each state

Taps: Send (1), a saved person (2), the amount and slide (3), the passcode
(4). With a photo: Send (1), the camera (2), take it (3), slide and passcode
(4) — the passcode is the fourth tap because the slide is a drag.

## Round 4 · Being paid, and asking

- [ ] Receive on the card, and in the More sheet, opens Receive (332:9555):
      bank transfer, from a card, ask someone, in dollars
- [ ] Three ways to be paid (ways 222:199) and Your code (mycode 221:2), the
      code drawn for real
- [ ] Ask someone: Request (225:1606), the typed and photographed ways in
      (typedask 225:1928, foundreq 225:1551), Request sent (sent 239:8294)
- [ ] Money in (donein 490:12465) and its share, from round 1, reached from
      the day and from an arrival
- [ ] The receive pane built earlier folds into these frames; nothing exists
      twice

Taps: Receive (1), bank transfer (2), copy (3). Receive (1), ask someone (2),
who and how much (3), send the request (4).

## Round 5 · Bills, data and the services drawer

- [ ] Bills (217:67) and Pay a bill (powerpay 217:2), the passcode, Bill paid
      (power 490:13497) and its share (490:13595)
- [ ] A bill from a photo: Scan a bill (222:97), What I read (meter 210:2),
      Confirm (confirmmeter 210:71)
- [ ] All services (215:2), Buy data (airtime 215:170 and buy 221:165), the
      typed and photographed ways in (typedbuy 225:2973, foundsvc 225:2620),
      Confirm (confirmbuy 239:8474), All done (done 239:8418), Share (472:11590)
- [ ] Borrow (loan 217:181) and Virtual card (card 218:2)
- [ ] The shortcuts under the open chat and the insight cards on home hand
      these to the chat, as now; the click-through versions reach the same
      receipts

Taps: More (1), Services (2), Buy data (3), confirm with the passcode (4).

## Round 6 · Dollars, putting money away, money health

- [ ] Dollars (279:8211), Convert (279:8299), Converted (296:8850); the
      dollars chip on the card opens Dollars
- [ ] Pay from your dollars (payfrom 301:9464, paydollars 301:9565)
- [ ] Holiday, the goal (219:2), the rule that feeds it (saverule 224:122),
      Paused (204:2); No goal yet (emptygoal 964:21229)
- [ ] Money health (223:2), from the row on home
- [ ] Draft (222:2), from the button

## Round 7 · When it goes wrong, and what runs on its own

- [ ] Checking (973:20644) and I will not do this one (973:20699), as states
      of the chat
- [ ] Your dispute (disputeopen 959:20338) and The dispute is closed
      (disputeend 959:20393), from What went wrong
- [ ] You are offline (nonetwork 959:20420), shown when the network is not
      there, and the chat's own line for it
- [ ] Standing instructions in full: the rules that run, the one a receipt
      offers ("Rent again next month?"), pausing one

## Round 8 · Finishing setting up, and the first day

- [ ] Where you live (finish 316:9491), A photo of an ID (idcard 316:9538),
      Where your money comes from (income 317:9488), Everything is on (full
      317:9528); the limits these turn on
- [ ] The first home (firsthome 964:20807), The first question (firstask
      964:21033), Nothing yet (emptyactivity 964:21113) — the new account's
      day, which the app already shows in part

## Kept out on purpose

- The file's older home (225:3): the card and the day in the app are the
  home to keep.
- The dock at the foot of home: the ask bar lives in the card. Other screens
  keep the dock their frames give them.
- The prototype in `mobile/` is a mirror of the frames to read from, not code
  to move over: the app is built on its own design system and motion.
