# The plan — Beetle, the whole app

Everything between where the app is and the whole of it. Each item is checked
off only when it is built, checked against its frame, and walked in the
running bundle, never when it is written. The rounds go in order; nothing in a
later round starts before the round it depends on is done.

The home screen in the app is the one to keep: the black card with the balance,
Send and Receive, the pull down into the chat, the day under it. The file's
older home (225:3) is not used. Everything else is built from the frame named
beside it, with its sizes and its words.

## Testing the app as a whole

The app opens as itself on every build: the welcome the first time, home
after that. The feature-by-feature door — the lab, every place on its own —
stays for the checks and for a look at a rare state, behind a long press on
the version line in Settings, and nothing of it shows while the app is being
used as an app. The day the frames are drawn around is the owner's account:
sign in with 0906 911 3588 and the code 123456. A number of your own opens
a new account with an empty day.

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

- [x] Send on the card, and Send money in the More sheet, open the send form
      (pay 332:9851): the amount, who to, the reference, from, arrives, the
      fee, and Slide to send — the slide is the foot's own kind, beside Back
- [x] Who to: a saved person (the people the account has paid), an account
      number typed (typed 209:209), or one read off a photo (scan 209:2,
      found 205:2) — the reader already in the app
- [x] Slide to send, then the passcode (confirm 239:7762), Face ID first
      where enrolled and Face ID missed (noface 331:9488)
- [x] All done (donesend 239:7829) and Share (472:10886), already built in
      round 1, reached from here
- [x] The states of a transfer, from the receipt and from the day: Still on
      its way (pending 206:2), It did not go (failed 206:77), It came back
      (reversed 206:153), Not enough (short 208:88), Check this number
      (misread 957:20338), I sent it wrong (alreadygone 957:20392)
- [x] What went wrong? (wrong 206:225), Asking for it back (recall 207:2),
      Change the amount (amend 222:148) — its Use button in the foot beside
      Back, as every page keeps its one button
- [x] The ledger's three unsettled rows open their own states — from
      Activities, where they stand; home's day shows what settled
- [x] Lab places for each state

Taps: Send (1), a saved person (2), the amount and slide (3), the passcode
(4). With a photo: Send (1), the camera (2), take it (3), slide and passcode
(4) — the passcode is the fourth tap because the slide is a drag.

Decided with the user: both ways, each with its frame — the page from Send
and More, the chat's panel for a typed ask; the fee is the receipts' rule
(nothing under ₦10,000, then the banks' own with the tax) everywhere; the
gate shuts for thirty seconds and the line says so; a transfer sent from
the page is a line in the day with its receipt, and no chat is filed for it.

## Round 4 · Being paid, and asking

- [x] Receive on the card, the shortcut, the new account's button and More
      opens the Receive sheet (332:9555): bank transfer, from a card, ask
      someone, in dollars; the rows that lead to a page send the sheet down
      first
- [x] Three ways to be paid (ways 222:199) and Your code (mycode 221:2), the
      code drawn for real: a QR of the account made on the phone, read back
      in a unit test, shared as a picture and saved to Photos
- [x] Ask someone: Request (225:1606), the typed and photographed ways in
      (typedask 225:1928, foundreq 225:1551), Request sent (sent 239:8294);
      the camera reads the photo first, and a message asking to be paid puts
      the sheet up over it; the reply bar fills what is missing
- [x] Money in (donein 490:12465), from round 1, reached from the day and
      from an arrival: the chat Beetle starts about it carries the receipt's
      card
- [x] The receive pane built earlier folds into these frames; nothing exists
      twice
- [x] Lab places for each, the Figma check for the seven frames, the walk

Taps: Receive (1), bank transfer (2), copy (3). Receive (1), ask someone (2),
who and how much (3), send the request (4).

Decided while building: the typed frame draws its bar on the closed card
above the keyboard, and this build's bar lives in the open chat, so the bar
there took the frame's active state (the send disc beside it) and the
check anchors on the bar; the Request frame draws Back in its head, and
the build keeps it at the bottom left by the rule; a request files a chat
from Beetle with its card, and a line in the day would have looked like
money that came; the people who can be asked are this build's own list
with a line each, until an account service says who has paid.

## Round 5 · Bills, data and the services drawer

- [x] Bills (217:67) and Pay a bill (powerpay 217:2), the passcode, Bill paid
      (power 490:13497) and its share (490:13595)
- [x] A bill from a photo: Scan a bill (222:97), What I read (meter 210:2),
      Confirm (confirmmeter 210:71)
- [x] All services (215:2), Buy data (airtime 215:170 and buy 221:165), the
      typed and photographed ways in (typedbuy 225:2973, foundsvc 225:2620),
      Confirm (confirmbuy 239:8474), All done (done 239:8418), Share (472:11590)
- [x] Borrow (loan 217:181); Virtual card (card 218:2) from Cards on All
      services, as built in round 2
- [x] The shortcuts under the open chat hand these to their pages — Bills,
      Data, Services, Photo — and the insight cards hand theirs to the chat,
      as before; both reach the same receipts
- [x] Lab places for each, the Figma check for the thirteen frames, the walk

Taps: Services (1), Data (2), the slide (3), the passcode (4). Bills (1),
the light (2), the slide (3), the passcode (4).

Decided while building: typed asks for a bill or data stay in the chat, as
round 3 decided, so the pages are reached from the shortcuts, All services,
a photo and the lab, and their "You typed" line is the lab's; the Receive
shortcut under the open chat repeated the card's Receive, so Services took
its place; Mum's line is 0803 214 4471 wherever she is, where two frames
print a number a digit short; the bar on Borrow fills against the limit as
the frame draws it, and the interest, the fee and the payments are this
build's own figures until a lender is behind the app; a loan lands as money
in, with Beetle's own chat rather than an arrival's, since nothing was sent;
a top-up read off a photo files a chat with its card, as a request does,
while the pages that are not chats (Pay a bill, Buy data, Borrow) put their
line in the day and open the receipt, as Send money does; the camera was
redrawn to its frames, with the sample photos in its gallery, so the walk
picks a sample by name; the share sheet's picture works now, through the
same capture Your code uses, and the PDF waits for a later round; the
chat's own panel for data keeps its name, Beetle Data, where the frame
titles it Beetle Airtime.

## Round 6 · Dollars, putting money away, money health

- [x] Dollars (279:8211), Convert (279:8299), Converted (296:8850); the
      dollars chip on the card opens Dollars
- [x] Pay from your dollars (payfrom 301:9464, paydollars 301:9565)
- [x] Holiday, the goal (219:2), the rule that feeds it (saverule 224:122),
      Paused (204:2); No goal yet (emptygoal 964:21229)
- [x] Money health (223:2), from the row on home
- [x] Draft (222:2), from the button
- [x] Lab places for each, the Figma check for the eleven frames, the walk
      through converting, paying from the dollars, feeding the goal, adding
      to it, pausing it, the score's offer, a new account's goal and the
      draft

Decided while building: the dollars chip opens Dollars itself (typed
"what about dollars" stays a question for the chat, as the artifact page
says it does; "convert" opens Convert); the dollars held are the account's
own plus every conversion and every payment from them on this phone, so no
new store; a conversion is a line in the day of its own kind whose page is
Converted; sending from the dollars is free and leaves the naira balance
alone; the goal's Paused state is the Rules page's Money is tight switch,
so the two are one; round ups and cash back are the goal's own switches
rather than standing instructions, so the Rules page keeps its frame; the
Draft frame is the file's older home with a keyboard over it, so it is a
lab place for the typing state with a draft waiting in the bar; the score,
the goal's figures and the rate are the demo's own.

## Round 7 · When it goes wrong, and what runs on its own — done

- [x] Checking (973:20644), off a transfer the photo filled in, and I will
      not do this one (973:20699), off the whole balance to an account never
      paid; the chat refuses the same way
- [x] Your dispute (disputeopen 959:20338) and The dispute is closed
      (disputeend 959:20393), from What went wrong and Asking for it back
- [x] You are offline (nonetwork 959:20420), shown when the network is not
      there, and the chat's own line for it
- [x] Standing instructions in full: the rules that run, the one a receipt
      offers ("Rent again next month?"), pausing one; every "later round"
      toast swept
- [x] Lab places for each, the Figma check for the five frames, the walk
      through a dispute from a receipt, a fraud report, the closed one and
      its letter, Checking off a slip, the refusal on the page and in the
      chat, offline with the queue, the goal's take-back and the receipt's
      own offer

Decided while building: Checking is reached from the Send money page's
note under a person the photo filled in, and from the lab, rather than as
a state of the chat — a typed ask keeps the chat's own panel, as round 3
decided; an account Beetle has never seen reads as four minutes old, the
demo's own reading, until a bank's look-up stands behind it; the demo's
dispute sits fixed on its third day and the closed one is a lab place, so
the frame's home keeps its rows (no dispute chat is seeded); the network's
signal is the web's own for now — expo-network is left out so the Expo Go
build keeps working — and on a phone the page is a lab place; the
receipt's offer is a fourth instruction kept beside the three and listed
once it is on, rather than a kind of rule per reference; "is not in the
frames yet" is what every unbuilt thing now says, so the app never
promises a round.

## Round 8 · Finishing setting up, and the first day — done

- [x] Where you live (finish 316:9491), A photo of an ID (idcard 316:9538),
      Where your money comes from (income 317:9488), Everything is on (full
      317:9528), as stages of the way in from the ready screen's card and
      from wherever a limit is in the way; the limits these turn on (the
      day's cap up to ₦1,000,000, dollars, borrowing) read by the ready
      list, the offer on Spending limits, Dollars and Borrow, and the
      card's chip
- [x] The first home (firsthome 964:20807), The first question (firstask
      964:21033), Nothing yet (emptyactivity 964:21113) — the new account's
      day on the app's own screens: the New account chip, the empty
      Activities with Beetle's word, the chat's plain answer with its lock
      line
- [x] Lab places for the four stages, the first question and the empty
      Activities; the Figma check for the frames; the walk through finishing
      setting up from the ready screen, the limits after, the new account's
      home, its first question and its Activities

Decided while building: the three answers are stages of the one-screen way
in rather than pages of their own, so the trail, the wash and the motion
are the ones the account was opened with; they are kept apart from the way
in's progress, per account, so Settings can open them on any later day;
the caps on Spending limits are what you set, so the demo keeps its
frame's ₦100,000 a day while Everything is on says a million: finishing
raises the ceiling, not the cap;
the ID photo is the camera on a phone and the face step's moment on the
web, and only the number read off it is kept beside the account's own
name; an account Beetle has never seen finishing setting up turns the
frames' figures on, since no bank's check stands behind this build; the
first home keeps the app's own home (the older layout's words are taken,
its layout is not, as the rule for home says), so its check measures the
pieces the two share; the first question is the chat's own state, drawn
on the card as every chat is, with a lock line under the bubble as the
frame draws it.

## Round 9 · Three pages, the home grid, and the receipt over its page

Asked by the owner after testing on the phone, with four questions
answered. The interface, as it is to be:

- **Three pages side by side**, in the bar's order: Home, Activities,
  Settings. A swipe to the left goes forward, a swipe to the right goes
  back; the pages follow the finger and settle on the nearest one. A tap
  on a glyph goes there too. The bar is drawn once, over all three: the
  page you are on in black, the others grey, the gear solid like the house
  and the clock, and the plus with More. It does not move or redraw as the
  pages change. A page deeper than these (a receipt, Lock, Send money)
  keeps Back at the bottom left as before.
- **The pages stand still** while something is open over them: a
  transaction's receipt (a swipe to the right closes it, as the back swipe
  on an iPhone does), the chat on home, a sheet, More. A swipe that starts
  on the Services card belongs to that card.
- **Home** is the black card as it is (the word Wallet, the balance, the
  dollars chip, Send, Receive, the pull down into the chat) and under it a
  grid of four cards, two by two, laid out the way Fuse lays out its own:
  pale grey, a 32 glyph at the top left, a small grey label and a bold
  figure at the foot. **Savings** says the most: the goal's ring, what is
  put aside against the target and the pace; Paused when money is tight;
  Start a goal where there is none. **Loan** is what could be borrowed.
  **Card** is the virtual card's last digits, or Frozen. **Services** holds
  Airtime, Bills and Data to swipe through inside the card, three small
  dots under them; a tap on the one showing opens it, a tap on the word
  Services opens All services. No dollar wallet yet.
- **Activities** takes everything the day held: Money health at the top,
  All / Insights / In / Out, the insights among the lines, today and
  yesterday, and Beetle's word at the foot. A line opens its receipt in
  one step, grown out of the line.
- **A receipt opens over the page it came from**, not instead of it: that
  page blurred under a progressive gradient, see-through at the top and
  solid at the foot, white over a light page and dark over the chat. Back,
  or a swipe to the right, closes it.
- **In the chat**, the receipt card opens in place a little larger, with a
  few lines more than it had and Share: never a full or half screen. The
  recent chats leave the day for a drawer in the chat: a soft gradient at
  the screen's left edge while the chat is open, and a swipe to the right
  brings the drawer in from the left with New chat at its top and the
  chats under it. New leaves the header for it. None of this shows outside
  the chat.
- **More** opens over the page blurred under white: 76% at the top, as the
  owner's Actions frame (204:85) sets it, and solid at the foot.

Measured from Fuse (its home and More, frame by frame from the case
study's video): the cards 167 × 150 on a 393 screen, 24 in from the sides
and 10 apart; the glyph 32, 20 in from the corner; the label 14 grey and
the figure 18 bold at the foot; More's backdrop nearly white, the page
under it heavily blurred. On this app's grid: 20 in, 12 apart, 170 × 152,
rounded 20.

- [x] The pager and the fixed bar; the gear solid
- [x] Activities off home; the chats into the drawer in the chat
- [x] The grid: Savings, Loan, Card, Services with its three pages
- [x] The receipt over its page, grown from the line; the chat's receipt
      in place
- [x] More's white backdrop
- [x] Lab places, the Figma check, the walk, README, the artifact

Settled while building:

- **The gear.** The file has a solid house and a solid clock but only the
  outline gear, and what it calls `settings-filled` is a receipt's slip —
  which is what the bar showed after the last round. The solid gear is
  derived from the file's own gear in `scripts/generate-icons.mjs`: its
  cog filled, the same line run round its edge so it keeps the outline's
  size, and its centre left open.
- **The receipt over its page is not a route.** A native modal is
  presented over the whole window on iOS, and would cover the one foot
  that has to stay over it with Back and the ask bar; so the receipt over
  Activities is drawn by the page itself, with Back closing it. The flows
  that end on a receipt (Send money, a bill, data, the loan) still open
  `/receipt/[id]` as a page, and so does The full receipt from the chat.
- **In the chat the card opens where it is** and says a few lines more
  (who and where, the fee, the balance after), with Share and the full
  receipt: never a full or a half screen, as asked. A request's card is
  not a receipt and still opens the request.
- **Under the open card** only the row of shortcuts is left (the day was
  there), so the chat is taller, as the frame draws it.
- **A tap that ends a swipe is not a tap.** A phone cancels the touch under
  a swipe; the web does not, so the pager, the Services card, the drawer
  and the receipt's back swipe say when they swipe and `Tap` lets the tap
  at its end go (`swipes` in `src/design/motion.tsx`). A drag that no
  swipe takes is held the same way: on the web `Tap` lets a click go once
  the pointer has travelled 16 from where it went down, as a phone lets a
  press go once the finger leaves it.
- **Back to home** is the white under the open card, clear of the
  shortcuts: the gaps between them answer nothing, so a shortcut just
  missed does not close the chat. A screen reader's activate, which would
  land on that row, closes it by name.
- **The drawer, put away, is not drawn**, so its shadow does not lie along
  the screen's left edge over the white under the card.
- **The bar stays put through the card's first-time dip.** It used to dip
  with the card, and the pages turning in the middle of that dip made it
  jump; it now goes down only as the card opens past the dip.
- **A look at every screen, and what it found.** A solid glyph's details
  are drawn in the file as white lines over the fill, and once every line
  took the screen's colour they vanished into it: Lock and privacy showed a
  blank square, the card a blob with its stripe's ends poking out, the
  shield no tick, the clock no hands. They are cut out now, through a mask
  (sixteen glyphs). The bar's clock is the file's own again and the three
  glyphs are sized to look one size. On home the ring is the size of the
  other glyphs, the card's glyph is its line one like the rest, and
  Services is laid out like the other three (the glyph at the top, the
  dots level with it, the word and the name at the foot); each card's last
  line is short enough not to be cut on any phone. On Activities the four
  segments span the column. A receipt opens over paper-white, near solid
  from the top, so the page under it is no smudge behind its words. The
  drawer's head sits level with the chat's, its edges on one line, and the
  edge's light fades up and down as well as across.
- **A browser will not blur through a clipped box.** More now sits outside
  the foot's clip, and the pager does not clip on the web, so the veils
  blur the page on the web as they do on the phone.

Decided with the owner: the recent chats live in a drawer in the chat,
not on Activities; the four cards are Savings, Loan, Card and Services,
with airtime and bills under Services; the cards are equal and Savings is
the richest of them; a transaction opens its receipt in one step.

## Since the rounds

- [x] The mark leaves the card's header (the owner's word, testing on the
      phone): Settings is the gear on the bar, so the header's mark was a
      second way to the same place. The header keeps the word Wallet at its
      left, and the figure takes that place as the card opens. The home
      frames still draw the mark; the check allows its absence by name.

## Kept out on purpose

- The file's older home (225:3): the card and the day in the app are the
  home to keep.
- The dock at the foot of home: the ask bar lives in the card. Other screens
  keep the dock their frames give them.
- The prototype in `mobile/` is a mirror of the frames to read from, not code
  to move over: the app is built on its own design system and motion.
