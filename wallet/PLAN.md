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
sign in with 0803 000 0001 and the code 123456. A number of your own opens
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

## Round 10 · The chat with the bar under it, one ask bar, and amounts picked on the page

Asked by the owner after the Round 9 screens, in three messages, with seven
questions answered. The interface, as it is to be:

**The open chat**

- [x] **Chips on top of the input.** Bills, Data and Services, left-aligned
      exactly on top of the chat's input, quiet on the dark card. The row of
      Bills, Data, Services and Photo under the card goes: Photo repeated the
      camera in the input, and one thing should have one place.
- [x] **The bar under the open chat.** The bar stays when the card opens, the
      same bar as everywhere (Home, Activities, Settings, the plus); the open
      card ends just above it.
- [x] **The bar with the chat open.** Activities or Settings slides the pages
      across and keeps the chat as it is. Home, once, comes back to the chat
      exactly as it was left. Home again, or Home tapped in the chat, closes
      the card back up; pulling down reveals it again.

**The chats drawer**

- [x] **Inside the dark card**, not over the whole page.
- [x] **New chat, quietly**: a small plus and the words 12 beside it,
      left-aligned, as Claude Code draws New session; a line and some room
      before the recent chats. No white pill, no big title, no mark repeated
      on every row.
- [x] **Short, and fading**: solid at the top, softening into a blur toward
      the input, ending above the chips so the input stays in view.
- [x] **In and out**: a swipe right from the edge brings it in; a swipe left
      on the chat, a tap on the chat beside it, or a tap on the input puts it
      away.
- [x] **The Fuse way of moving**: the panel springs in with the finger, its
      rows blur in one after another, and the chat behind recedes a little.

**One ask bar, on home**

- [x] Every page except home loses the ask bar. Its foot is Back beside the
      page's own button, spaced so both are easy to hit, or Back alone. The
      plus stays on the bar of the three pages only.
- [x] All services keeps its search, as a search field at the top of the
      page rather than a chat bar at its foot.
- [x] **A transaction's actions.** The receipt's foot is Back beside Share
      receipt. A ··· at the top right opens a soft pop-up with Ask Beetle
      about this and Report a problem (which leaves the receipt's body).
- [x] **Ask Beetle about this** opens a fresh chat on home with that
      transaction as its context: its card at the top, Beetle's word about
      it, and the conversation about that one transaction.

**Amounts, picked on the page**

The rule, from now on: wherever money is put in, the page offers chips of
likely amounts and a stepped ruler, and the amount changes on the page
itself, never on a page of its own.

- [x] **The picker**: the figure, chips of likely amounts, and a ruler of
      ticks that scrolls under a fixed line as the finger drags, snapping to
      each step with a light haptic click and rolling the figure as it
      goes. It stops hard at the balance, with a firmer click. Steps: ₦100
      up to ₦10,000, ₦500 up to ₦100,000, ₦1,000 above. A tap on the figure
      types any exact amount in place.
- [x] **Where**: Send money, Pay a bill, Airtime, Add money to a goal and
      Convert, capped at the balance; Borrow, capped at what can be borrowed;
      Request money, with no cap; and a new Load card on the virtual card's
      page, capped at the balance, through the passcode to a receipt.
- [x] **Change the amount** as a page of its own goes.
- [x] **No sharp press states**: a row's highlight gets round corners.

**Asked while it was being built**

- [x] **Titles arrive with the page.** A page's title no longer flies up
      from the button that opened it or grows into its size: it comes in
      with the rest of the page, out of the same blur, at the same moment.
- [x] **A line of Activities opens in place**, the way Fuse opens a coin in
      its list: the line stays where it is, sharp, the page goes soft under a
      frost of white, and the rest of it grows in under the line — from
      where, the fee, the amount and the balance after (not who, which the
      line says, and not the total), the session id kept back until asked
      for, then Share receipt and Set it up side by side. No page fills the
      screen.
- [x] **The ··· for an open line** sits at the top right beside the
      Activities title, the title kept sharp over the frost with it: Ask
      Beetle about this, Report a problem.

Decided with the owner: the chips are Bills, Data and Services; the bar
with the chat open works as above; the plus is on the bar everywhere the
bar is; Share receipt sits in the foot with a ··· at the top; the ruler
over a track and knob; steps finer when small; the picker on Borrow,
Request money and loading the virtual card as well.

**Settled while building**

- The open card stops 16 above the bar's row of glyphs, and the bar's white
  and its shadow go bare as the card opens, so the card can come down over
  the top of the surface without a seam. The bar goes down under the
  keyboard (the keyboard is always the chat's there) and out of the way
  under home's sheets — the Receive sheet, the passcode, a receipt or the
  saved list over the chat — which also mends the Receive sheet, whose foot
  the bar had been drawn over.
- Home tapped again is heard by the pages (`tabs.again`): home closes its
  chat on it. The keyboard goes down when the pages turn away from the chat.
- The two chat pages lose their reply bar too, and every row fills where it
  is: on Request, Person (those who have paid before, or somebody new: a
  name and a number), Amount on the picker with no cap, and For (a word, or
  one of four); on the top-up from a message, the plan row opens the
  network's bundles, or airtime on the picker. Send the request and Confirm
  sit in the foot beside Back.
- The whole-balance refusal counts the fee now that the picker stops at all
  that can be sent: All of it, to an account never paid, still stops.
- The ruler takes a finger, a fling (it settles on the step where the fling
  would come to rest) or a tap on a tick, and a chip moves it too; it is
  read as adjustable, a step at a time. The clicks are expo-haptics, held to
  one every 28ms so a fling ticks like a wheel; the web has none. Dollars
  run the same steps a hundred times smaller: $1, $5 and $10.
- Goal's Add money and the card's Load put the picker up on a sheet over
  their page, since neither page has room of its own for it; Send money,
  Pay a bill, Airtime, Convert and Borrow carry it in their own card.
- The card's Load adds to what the card can spend on top of its month; the
  card on home says so too.
- The set's "more" is the four-dot grid, which reads as apps; the three
  dots of the ··· are drawn where they are used.
- A thing that leads somewhere lights with a rounded wash 8 wider than it
  on either side, its own layer, instead of a background on its box.
- The receipt over Activities (ReceiptOver) goes: a line opens in place,
  and the receipt page keeps the full slip for the chat's card and a share.
- Found in the design pass: a page's foot was a flat white band, so a row
  under it was sliced mid-line. On a page (not the bar) 40 of white fade
  sit over the band, and what scrolls under the foot dissolves into it.
- Found by the walk: a swipe across the frost of an open line counted as a
  tap and put it away. Only a tap does now (a finger that moves more than
  12 is a swipe, and the pages hold still under it).
- Found by the walk: with the picker making Send money taller, the list of
  people paid before reached down under the foot, and the receded Slide to
  send took the tap meant for its last row (on the web a part set to take
  touches keeps taking them under a foot set to take none). The list stops
  above the foot now, and every part of a veiled foot lets touches through.
- Found by the walk: All of it set the cap (₦595,267) and the ruler then
  settled on its nearest step (₦595,000) and said that. The cap is the
  ruler's last step, wherever it falls between steps (`stepFor`, tested).
- Found by the walk: Not enough offered the whole balance, which Send money
  could not take once the fee counted. It offers the balance less the fee
  now, and Send money opens on All of it.
- The Figma check steps over a row's wash when it walks into the row's
  children, and finds the card's Load tile and Checking's Let me pick it by
  their new words; everything else this round moves is in allowed.json
  with its reason (the foot, the picker, the search on All services, the
  receipt's ···).


## Round 11 · Forms that speak under their fields, two kinds of transfer, the chat that does it all, and Borrow made short

Asked by the owner after the Round 10 screens, in five messages, with eight
questions answered. The interface, as it is to be:

**Forms speak under their fields**

- [x] Send money loses Beetle's bubble at the top ("How much for The? Move
      the ruler…"), and so does every form page: Pay a bill, Buy data,
      Airtime, Borrow, Convert, Add money to a goal, Request money. What a
      bubble said that mattered goes on the line under the field it is
      about; what it said that a field already says goes.

**Two kinds of transfer**

- [x] **One first field takes all of it.** On Send money the first field
      is To, and it takes a $tag, a name or an account number:
  - a **$tag** is looked up among Beetle's own accounts, and the Beetle
    account comes back: free, and there at once;
  - a **name** (with a $ or without) brings the closest names, from
    Beetle's accounts and from the people paid before, each with its bank;
  - **ten digits** ask for the bank, the likely ones first (worked out from
    the number itself, the way the banks' check digit does), then the name
    on the account is looked up and shown, so the owner sees it is the
    right person before anything can move.
- [x] **The bank is always said**: on Send money, in the chat, on the
      passcode sheet, on the receipt and in Activities. A Beetle account
      says Beetle, with its $tag.
- [x] **Beetle to Beetle is free and instant.** To another bank: free under
      ₦10,000, ₦26.88 up to ₦50,000, ₦53.75 above.
- [x] **In the chat**: a $tag, or someone named as a Beetle account, gives
      the Beetle account. Any other name is looked for among the people
      paid before, and a card asks "Is this the person?" with the account
      number and the bank filled in, the amount picker (its figure tapped to
      type), and Confirm. A number asks for the bank, and the name is looked
      up in the card.

**The passcode says what it sends**

- [x] While the six digits go in, the sheet shows the whole of it at the
      top: who, their bank and account number (or $tag), what they receive,
      the fee, and what leaves which account. Bills, data, airtime, loans
      and conversions say what they are in the same rows.
- [x] **Cancel**, plainly, under the pad: the sixth digit sends it.

**The chat does it in the chat**

- [x] The chips over the input are things to do, not doors: **Send, Bills,
      Data, Receive, Loan**, in that order. None leaves the chat; each puts
      its card up in the conversation, with Beetle's one line above it.
- [x] **Bills is electricity**: the company, then Prepaid or Postpaid (two
      toggles), then the meter number, looked up as soon as it reads right;
      then the amount and Pay. A small **Recent** at the card's top right
      grows the card itself into a list of the meters paid before, which
      scrolls; one tap fills the card and it settles back.
- [x] **Data**: the number (its network shown as it is typed), the plan,
      Buy; Recent lists the lines topped up before.
- [x] **Send**: the To field as on Send money, the amount, Confirm; Recent
      lists the people paid before.
- [x] **Receive**: the account's details to copy or share, and its $tag.
- [x] **Loan**: the amount, the days, what is paid back and when, Borrow.
- [x] A card that has all it needs pays from where it is: its button goes
      to the passcode, and the receipt and Beetle's word follow. No second
      card to confirm the first.

**No drop shadows; DESIGN.md**

- [x] No drop shadow anywhere. Surfaces part by tone, by a hairline, by
      frost and by space.
- [x] **DESIGN.md** in the app's folder sets the rules down: the shadows,
      the amount picker, round press states, the foot, forms without
      bubbles, the bank always said, the passcode's breakdown, asking before
      what cannot be undone.
- [x] **An open line of Activities is plain**, the way Fuse's Solana widget
      is: its facts as rows on the frost, labels left and figures right,
      lined up under the line's own words, a dashed rule between the groups.
      No card, no border, no shadow.

**Smoother**

- [x] The frost and the veils come in by their blur growing, not by fading
      a blur (the phone draws a fading blur badly, which is the jerk).
- [x] An opening line lifts and its facts come in as one movement, measured
      before it moves, not lifted after.
- [x] Rows arrive one after another with a short stagger, on the same
      easing everywhere.

**Are you sure?**

- [x] Sign out and Sign out everywhere else ask first, in a small sheet
      that says what will happen, with the action in red and Cancel. (The
      freezes and the pause switch were on this list; they do not ask — see
      Settled while building.)

**Borrow, short**

- [x] The amount picker stays at the top, the first thing on the page.
- [x] The days are a row of the breakdown: "30 days ▾", no box, a small
      list to pick from; the figures under it change as it changes.
- [x] The breakdown is tight: labels left, figures right, the total the
      strongest line. What matters is there: what is paid back in all, the
      payments and the first of them, how it is collected, and what happens
      if a payment is missed.
- [x] Missing a payment: no collateral; a late fee each week it is overdue;
      what is due is taken from money arriving in Everyday; after 30 days
      late it is reported to the credit bureau. Said plainly, before the
      slide.
- [x] The rest (the interest and the fee one by one, paying early) is behind
      a tap.
- [x] Finish setting up moves to the bottom.

**A pass over spacing and placement**, on every page this round touches and
the ones beside them: nothing too loose, nothing cramped, the main thing
first.

Decided with the owner: the bubble goes from every form page; a typed
number gets the bank and the name check; tags are written $name; the first
field takes a $tag, a name or a number (a number asks for the bank); in the
chat a tag gives the Beetle account and any other name is checked against
the people paid before in a card with the amount picker and Confirm; Beetle
to Beetle is free and instant; the days on Borrow are a plain "30 days ▾"
in the breakdown; a missed payment costs a late fee and is taken from money
coming in, with no collateral.

**Settled while building**

- The overview pages (the goal, Dollars, Bills, the card, Money health) keep
  Beetle's word at the top: they are not forms, and what Beetle says there is
  the point of the page. Request money and the top-up from a photo lost
  theirs and read as forms, with the page's own head.
- Asking first is for signing out and signing the other phones out. Freezing
  (from Not your phone, or the card) does not ask: it protects, it has to be
  quick in a bad moment, and it lifts as easily as it went on. Standing
  instructions pause with a switch that flips back, so that does not ask
  either; nothing in the app ends one for good.
- The five chips are words only, so all five fit across the phone.
- In a card the amount comes once what it is for is known (the person, the
  meter, the line), or straight away if it was said.
- The passcode pad shrinks a step when the breakdown above it is long, so
  the sheet never runs off the screen.
- The model puts up the same cards as the scripted Beetle (prepare_transfer
  is a card), so the phone looks the same whichever is answering.
- Recent, on the card, replaces the saved-people peek over the chat.
- A new ask while a card is up gets its own card under the words; anything
  less (an amount, the bank) fills the card that is up.
- A card says nothing above its fields unless something is wrong; its
  greyed button says what is still missing (Pick the bank, Pick how much).
  Beetle's line over a name says who was found and at which bank; the card
  asks "Is this the person?".
- An open line in Activities names its note by what it is: the bank for a
  transfer, Paid at for a card, Number for a top-up, Meter for a bill; a
  saving's note says nothing the line does not, so it goes. "Renews 28
  September" is a row of its own instead of a cut-off line.
- When money lands is said one way everywhere: Instantly to a Beetle
  account, In a few seconds to another bank, Under a minute above ₦50,000.
- A transfer's fee comes off Everyday with it. The balance had been taking
  the amount alone; now what the passcode says leaves Everyday (₦20,026.88
  for ₦20,000 at GTBank) is what leaves, and Balance after on the receipt
  agrees. A conversion's fee still comes out of the dollars.
- The whole balance to an account never paid is refused wherever it is
  asked: on Send money, in words ("send everything to 0123456789", before
  the bank is even asked for), and from a card, before the passcode.
- Change on a picked person keeps what was typed, so another bank is a tap
  away; emptying the field brings the people paid before back under it.
- Words that are a chip's ("borrow", "my account number") put up that
  chip's card in the chat; words that are a page (the month's bills,
  asking someone for money) still open the page.
- Closed, the chat and its chips are hidden from a screen reader and from a
  finger, so the card's own Send and Receive are the only ones there.
- Pages arrive on the settle curve (moving at once, coming to rest slowly)
  and the stack's own cross-fade is short, so the page's column arriving out
  of its blur is the movement.
- A breakdown on a page is 44 a row (Convert's), a tighter 28–32 on a card
  or a sheet; DESIGN.md says so.
- The web build draws no browser focus ring on a field: the phone never does.


## Round 12 · Saving in four taps, being paid made short, and blur under the white

Asked by the owner after Round 11, in two messages, with four questions
answered: a blur wherever a white gradient backs something; the Receive
sheet without From a card, without the QR code and without a page for a
bank transfer, so being paid is the sheet itself; the save flow built
"considering the 4 clicks law of a fast and easy interface"; and, once it
is done, the app's problems in short direct points.

**Blur under the white**

- [x] The page foot's white fade and the bar's have the blur under them that
      the More sheet and the receipts already have: four stacked sheets of
      blur, each fading at its own end, under the white, so what scrolls under
      the foot softens as it goes. On the phone the blur grows in strength as
      the fade comes in, rather than a blurred layer fading.

**Being paid, from the sheet itself**

- [x] Receive (the card, the shortcut, More, a new account's button) puts up
      the sheet with the account's own details on it: the account number at
      Beetle and the $tag, each with Copy, and Share details under them. Then
      Ask someone and In dollars, and Done.
- [x] From a card is gone, and so are the QR code and the pages Bank
      transfer opened (Three ways to be paid 222:199, Your code 221:2), at the
      owner's word. "How do I get paid" typed at home or asked from a page is
      the chat's Receive card, as the chip is.

Taps: Receive (1), Copy (2). Receive (1), Share details (2).

**Saving, fast and easy** (the owner's answers: several goals; keep the goal
page, made shorter; pause or end a goal, edit a goal, take money out, a
Save chip in the chat, and a goal started in three taps)

- [x] **Several goals**, kept per account on the phone. The demo account
      starts with Holiday (₦250,000 by 12 March), the frames' goal; a new
      account starts with none. The first goal is the one the payday slice,
      round ups and cash back go to; any other is fed by hand. End the first
      and the next one takes the feeds.
- [x] **The goal page, shorter.** Savings on home opens it on the first goal,
      as before. Under the head, the goals as pills with + New goal at the
      end, a tap switching in place; the ring and what is put aside; **Add
      money** and **Take out** straight under it; Beetle's line; what feeds it
      as one row that opens the Feed sheet; the line that nothing is locked.
      All of it above the foot, so nothing on the way to saving needs a
      scroll.
- [x] **··· at the top right**: Edit goal, Pause goal (Start again while it
      is paused) and End goal in red.
- [x] **A goal in three taps.** + New goal puts up a sheet already filled:
      the next idea (Rent, Emergency fund, School fees, A new phone…), its
      usual target on the amount picker, and a date to match (by when, a
      quiet row with "In 6 months ▾"). Start saving makes it. The name is a
      field to type over.
- [x] **Edit** is the same sheet titled Edit and the goal's name, with
      Save changes.
- [x] **Pause** is one tap and lifts as easily (Start again): the feeds into
      that goal wait and its date moves; Add money still works. Money is
      tight, on the Rules page, still pauses every goal at once.
- [x] **End**: with money in it, the passcode sheet says the goal ends and
      what goes back to Everyday, and the line and its receipt follow; empty,
      the sheet that asks first, End goal in red and Cancel.
- [x] **Take out**: the amount picker, stopping hard at what the goal
      holds, then the passcode, a line in the day and the Taken back
      receipt.
- [x] **The Save chip** in the chat: Send, Bills, Data, Receive, Save, Loan.
      Its card has the goals as pills (the first picked), the dark picker
      stopping at what Everyday holds, what the goal has so far, and Put ₦X
      into the goal, through the passcode to the receipt card. "save 10k for
      rent" typed is the same card, filled. With no goal yet, the card's
      button starts one.
- [x] **Home's Savings card** with several goals: how many and how far
      along together, the total put aside, and how the first one is going.
- [x] Not enough's "Move it from …" takes from the first goal, by its name.
- [x] Lab places, the walk counting the taps, the Figma check's allowances
      for the shorter page, unit tests for the goals.

Taps, from home: Savings (1), Add money (2), the amount and Put away (3),
the passcode (4). Savings (1), Take out (2), the amount and Take out (3), the
passcode (4). Savings (1), + New goal (2), Start saving (3). Savings (1),
··· (2), Pause goal (3). Savings (1), ··· (2), Edit goal (3), Save changes
(4). Savings (1), ··· (2), End goal (3), the passcode (4). In the open chat:
Save (1), Put away (2), the passcode (3).

**The problems, in short points**: after the round, every flow walked
again and what is wrong said plainly to the owner.

## Round 13 · Pages that slide, glass instead of white, and every transaction in place

Asked by the owner after Round 12, testing on the phone, with four questions
answered: the frosted white pill for the bar; the pages' foot loses its
white too; the lines still on their way, failed or sent back and the
receipt right after paying both open in place; the promos as one
full-width card with dots.

**Pages that slide**

- [x] Every page comes and goes with the phone's own sliding page movement,
      and the swipe back from the left edge works on the phone. The
      cross-fade, the page's column arriving out of a blur, the tapped
      thing lighting up and the screen receding behind it all go: the slide
      is the movement. The stack is expo-router's JavaScript stack, so the
      phone and the web move the same way.
- [x] Each page carries its own foot, so the foot slides in and out with its
      page (and follows the finger on the swipe back) instead of changing
      shape in place.
- [x] Card, Services, Loan and Savings, opened from home's four cards, slide
      in over home with a frosted, blurred background, so home shows
      through behind them. Pages opened from them slide in over them as
      usual. Home stays mounted underneath (a see-through page, not a
      pushed one), which is what lets it show.

**Glass instead of white**

- [x] The bar has no white under it. Home, Activities and Settings sit in a
      rounded pill of frosted white glass that hugs them (12 of padding, no
      outline). The black plus stays beside it. A soft blur, with no white
      in it, sits under both.
- [x] Other pages' foot loses its white the same way: Back in a frosted white
      circle, the page's button as it is, a soft blur behind.
- [x] The top of every page with a title has a soft blur instead of white,
      and the title shrinks as the page scrolls, to the size of the word
      Wallet on home's black card (14), staying at the top. Scrolled back to
      the top, it grows back. The line under the title fades as it shrinks.
      It shrinks where it is, at the top left (not moved to the middle as
      iOS does), so it never crosses the ··· at the right. The blur behind
      it is stronger than the foot's, so rows passing under the small title
      are a smear and the title reads.

**Home**

- [x] The Services card starts on All services. A swipe shows Bills,
      Airtime and Data (the owner's order), and the dots count four.
- [x] One promo card, the width of the page, directly under the black card
      and above the four cards: Beetle's own features, swiped one at a time,
      with small dots under it. Each opens what it offers: Finish setting up
      (until it is done), Start a goal in three taps (or Save in four taps
      once there is a goal), Borrow up to the most Beetle lends (once set
      up), Pay light and TV in two taps. A sideways swipe that starts on the
      card moves the card, not the pages.

**Every transaction in place** (the MTN data line the owner sent: the line
stays, the facts come in under it on the frost, Share receipt and Set it up)

- [x] Every line in Activities opens in place, not only the settled ones. A
      line still on its way, one that did not go and one that came back say
      so in place (Still on its way, It did not go, It came back), with the
      bank and the account under To, and their next steps: Ask about it,
      Try again or Try Sarah again, Check the number, and See the details
      for the state's own page. Insights keep their own behaviour.
- [x] The receipt right after paying (Send money, a bill, data, airtime, a
      loan, a goal, loading the card) opens the same way, over a frosted
      view of the page paid from. Closing it goes back to where the payment
      started. A bill's token is a row of its own, tapped to copy.

**From the phone** (the owner, testing the Round 12 update in Expo Go: the
chats drawer would not open, and Expo Go closed on a slide — between Home,
Activities and Settings, and on the swipe back from the edge)

- [x] The drawer comes in from a swipe that starts anywhere within a
      thumb's width (44) of the chat's left edge, the way react-navigation's
      drawers take it, not only on the 16 of soft light: on a phone a swipe
      "from the edge" lands well inside the glass. A swipe from the middle
      of the chat is still the chat's; a tap on the light still opens it.
- [x] The swipe back from the edge is now the JavaScript stack's own (the
      native stack's, with the cross-fade, is gone with Round 13's slide).
- [x] What stops the app is kept: an error that would close it is written to
      the keychain first, and the next time a build with the lab opens it says
      what it was, with Copy the details. An error inside the screens no
      longer closes anything: Something went wrong, with Try again. Every call
      made on the phone's animation thread is checked to be a worklet or to go
      through runOnJS (a test now holds the whole app to it,
      test/worklets.test.mjs); none was found wrong. If Expo Go still closes
      on a slide and nothing is said after, the stop is in the phone's own
      code, and the phone's crash report (Settings, Privacy & Security,
      Analytics Data, Expo Go) says where.

- [x] The cause, from the first update with the keeper in it (the owner's
      phone: "[Worklets] Cannot copy value of type KeyboardImpl"): the chats
      drawer's gestures, since Round 9, put the keyboard away by calling
      React Native's Keyboard from the animation thread, which cannot take
      it. Touching the drawer's edge stopped the app; in Round 13 the swipe
      belongs to the whole of home, so home stopped as it opened. They now
      call a function of the drawer's own through runOnJS, and the test of
      the animation thread checks what it reaches for as well as what it
      calls: nothing from a package but Reanimated's, nothing made with
      new, no router.

**Found on the way**

- [x] An amount chip (All of it among them) set the figure, then the ruler
      gliding to it set every step it passed, so a tap on Confirm in that
      moment took a step on the way: ₦594,000 instead of all of it, past
      the whole-balance rule. A chip, a tick tapped or a step by the screen
      reader now sets the figure at once and the ruler only glides.
- [x] A toast that came up while another was fading went with it; each now
      goes only when its own fade ends.
- [x] Sending the whole balance to an account never paid was now and then
      let through: the amount and the fee, added as decimals, came to a
      hair under the balance. The rule compares them in kobo.

**Expo Go**: every round that reaches the phone ends with a QR code for the
update, to scan with the iPhone camera.

## Round 14 · Home as the owner drew it, and the four cards' pages as sheets

Asked by the owner after Round 13. Home was edited in the Figma file
(Flows › Home, as the app is now, 1403:13497) with four questions
answered: the promo's × hides the promos until Beetle next opens; on a
phone with the home line the bar sits just over the line; only the four
cards' foot line gets smaller; the promo lines up with the four cards.
Then: the pages the four cards open were hard to read over the frosted
home, so they become white sheets from the bottom, nearly the height of
the screen, closed by a swipe down or Back, and a page opened from a sheet
comes up as a sheet over it (drawn after the Fuse wallet's own sheets, a
picture the owner sent).

**Home, from the owner's frame**

- [x] The black card loses the word Wallet and is 300 tall (was 352). Total
      balance starts at 80, the pills sit 24 under the chip, and the
      grabber 20 above the card's edge, with no words under it. The figure
      still glides into the header when the card opens. The first-time dip
      stays, without the words "Pull down to ask Beetle".
- [x] Send and Receive are white pills, 100 by 36: the glyph in a 36 square
      and the word after it in ink, 24 apart.
- [x] The page's sides are 24 (were 20), so the promo and the four cards
      line up at 24. The frame keeps the promo 353 wide; the build lines it
      up with the cards, 345.
- [x] The promo's words are smaller (the title 14 on a line of 16, the line
      under it 11), its dots sit inside it at the bottom right, and a small
      × at its top right folds the promos away, the four cards rising into
      their place. They come back the next time Beetle opens.
- [x] The four cards' foot line is 10 (was 12). The word and the figure
      stay as they were.
- [x] The bar sits 12 from the bottom of the screen and 24 in from either
      side. On an iPhone with Face ID it sits just over the home line
      instead, 21 from the edge, so the line never touches the pill. Its
      soft blur reaches 7 over it (75 tall). Activities and Settings share
      the bar, so it moves there too. Back on other pages keeps its frames'
      place.
- [x] The frame is the check's home now (test/figma/home-now.xml, the
      frame's own layers, and its picture): every piece is measured against
      it.

**The four cards' pages as sheets**

- [x] Savings, Loan, Virtual card and Services come up from the bottom as
      white sheets, edge to edge, their top corners round (38), stopping
      just under the status bar. Home steps back behind: a little narrower,
      its top showing 10 over the sheet, and greyed a little. Every line on
      them reads: there is no frosted home behind the words any more.
- [x] A page opened from a sheet comes up as a sheet over it, and the one
      under it steps back the same way: Airtime from All services, the
      pages a goal leads to, the card's rules, and the rest. Back puts away
      the one on top. On the phone a swipe down from a sheet's grabber or
      title does too; the web stack has no gestures, so there Back is the
      way.
- [x] A sheet the stack starts with (the lab opens a page so) is the whole
      screen, laid out as a page, as its frame draws it.

**Expo Go**: a QR code for the update, as every round that reaches the
phone ends.

## Round 15 · The offers in the black card

Asked by the owner after Round 14: "i did some changes for the black card
and moved the promo card into it". The frame is Flows › Home again
(1403:13497, inside 1420:14730), with a second card beside it, Empty promo
(1420:14685), for when there is no offer. Three questions answered: the
quiet card shows only when there are no offers, and the × still folds the
offers away; its line is the owner's words fitted to the account; each
offer keeps its own colour on the black.

- [x] The black card is 392 tall and holds the offers: 36 under Send and
      Receive, 345 wide at 24 a side, the grabber 24 under them and 16 over
      the card's edge. The four cards start 24 under the card, as before.
      A pull down on an offer is the card's, a swipe across it is the
      offers', and the offers go with the rest of the closed card as it
      opens.
- [x] On the black an offer is a faint wash of its own colour, its tile in
      that colour, its title white and the line under it in a soft shade of
      the colour, both 12 on a line of 16. The dot showing is white and the
      others a deep shade. The frame draws the green; blue, violet and
      orange take the same strength and come out as bright, so each reads
      as well. The × is the frame's, 8 across.
- [x] The × folds the offers away: the black card gets 108 shorter (their
      room, the card and the 24 under it), down to 284 with the grabber 36
      under the pills, and the four cards rise. They come back the next time
      Beetle opens.
- [x] With nothing to offer, a quiet card stands in their place and the
      black card keeps its height: a ring rather than a ground, a grey tile
      with the freeze glyph, No promo over a line that is true for the
      account (Start your Holiday savings with your first deposit while the
      goal is empty, Start a savings goal with your first deposit with no
      goal, Add to Holiday whenever you like once it has money). It has no ×
      and no dots, and a tap takes the step. Today there is always an
      offer, so the lab has a place for it: Home › Nothing to offer.
- [x] The four cards are 24 apart both ways (were 12), 160 wide.
- [x] Both frames are the check's: test/figma/home-now.xml for home, and
      test/figma/home-quiet.xml for the quiet card.

**Expo Go**: a QR code for the update, as every round that reaches the
phone ends.

## Round 16 · A receipt that closes cleanly, and the empty card after the ×

Asked by the owner after Round 15, from a picture of a receipt on
Activities half way through closing: the receipt and the list showed
through each other, and the white over them had no blur. And: the No
promo card is an empty state, there so the black card keeps its shape
once the promos are put away, and its title was misspelled (the owner's
answer: No promos).

- [x] A line opened in place closes in two steps. What came in under it,
      the ··· and the title drawn over the frost go first, while the frost
      stays whole and the line settles back into its place; then the frost
      clears. The receipt and the page are never both sharp at once.
- [x] The frost's blur thins as it clears, on the web as on the phone. A
      browser only blurs what is behind an element while nothing over the
      element is see-through, so a fading frost lost its blur on the first
      frame and left the page sharp under the white. The veils and the
      ground a sheet opens over now thin their blur instead of fading it.
- [x] The line drawn over the frost is drawn just as the page draws it, a
      line still on its way with its status glyph, so when the frost has
      cleared it is the page's own line under it, nothing doubled.
- [x] The × on the offers puts them away until Beetle next opens and the
      empty card takes their place (correcting Round 15, where the card got
      shorter): the black card keeps its 392 and nothing under it moves.
      The offers fade out and the empty card fades in where they were. Its
      title is No promos; the line under it is still true for the account.
- [x] The walk reads every frame of a receipt closing and holds it to
      that: the rows gone before the frost thins, the blur thinning over
      several frames, all of it gone within 0.6s.

**Expo Go**: a QR code for the update, as every round that reaches the
phone ends.

## Round 17 · The line itself opens

Asked by the owner after Round 16, testing the preview: the line that
opened was a second one drawn over the list, so with the smallest lag the
two showed, one over the other. The line in the list has to be the one
that opens, its rows growing under it, with the same look and no box. Two
answers: the rest of the page frosted where it is; the lines below pushed
down.

- [x] A line of Activities opens in the list: the line stays as it is,
      and its rows (the same rows as before: who and where, the money, the
      session id kept back, Share receipt and Set it up) grow in under it.
      The lines below go down to make room and come back up when it
      closes. Nothing is drawn over the line, so at no moment can there be
      two of it.
- [x] The rest of the page goes soft where it is, under the frost, above
      the line and below its rows, the frost following them down as they
      grow. The frost is in the page's own white, so the line on the page
      sits on the same ground as the frost round it, with no edge or box.
      The page's title stays sharp at the top, the ··· beside it.
- [x] If the rows would run off the screen, the page scrolls up in step
      with them, never taking the line under the head, and back down as it
      closes. The page holds still otherwise while a line is open.
- [x] A tap on the frost or on the line, or the phone's back, closes it:
      the rows go first while the frost stays whole, then they fold away as
      the frost clears. A line asked for by a link opens the same way.
- [x] The receipt right after paying still opens over the page it was
      paid from, as before: there is no line there to open.
- [x] The walk counts the line at every frame of the opening (always
      one), and checks the lines below go down by what grew in.

**Expo Go**: a QR code for the update, as every round that reaches the
phone ends.

## Round 18 · A foot that stays put and changes shape

Asked by the owner after Round 17, testing the preview: on Activities the
shrunk title drew over the cards scrolled under it; a square showed round
the bar's three glyphs; the three glyphs should turn into Back smoothly
when a page opens, and back; and the sheets that come up from the bottom
should rise on a good ease, a sheet coming up over another smoothly too.
The owner's answer on the foot: it stays where it is and changes shape.

- [x] The shrunk title reads alone. The soft blur at the top of a page
      was strongest above the title, where there is nothing to read, and
      already thinning where the title stood, so a line passing under it
      showed through; it now holds at its strongest down past the title,
      10 under its line, and only then fades, on the phone as on the web,
      so what passes under the title is a haze. And the web draws it: a
      browser only blurs behind a box while nothing round it is masked,
      rounded or see-through, and the blur was masked from outside, so it
      was never drawn there; each sheet of it now carries its own mask.
- [x] No square round the bar's glyphs: on the web a blur is not clipped
      by the rounded box round it, so the pill's blur now takes the pill's
      corners itself.
- [x] The foot is drawn once, over every page, and stays where it is while
      the pages slide in and out above it (reversing Round 13, where each
      page carried its own). Going to a page, the pill draws in to Back's
      circle, the glyphs fading as the arrow comes in; the plus goes and
      then the page's button slides in beside Back. Going back, the circle
      grows into the pill. Between two pages Back stays and the button
      hands over: the one going fades, then the next slides in; the same
      page's button saying something else (a new amount on the slide)
      changes where it is. The change starts on the frame the page starts
      to slide.
- [x] The first frame of a change could fall a moment before the change
      began on the web, and on a curve that leaves as quickly as `settle`
      the pill stepped 13 wider before drawing in; the foot holds its
      changes to their ends.
- [x] Sheets rise on a long, settling curve, half a second up and a little
      less down, and the sheet or home under one steps back on the same
      curve. The web stack moved nothing it was not told how to move, so on
      the web the sheets used to appear at once; they move there now too.
- [x] The walk waits for a sheet to stop before measuring it.

**Expo Go**: a QR code for the update, as every round that reaches the
phone ends.

## Round 19 · Receipts as a sheet, and the rows on the phone

Asked by the owner after Round 18, from two pictures taken in Expo Go:
a line opened on Activities showed its frost but none of its rows. And:
the receipt after adding money to savings, borrowing, a card payment and
services was the Activities view of a line, when it should be a sheet up
from the bottom with the full detail and a secondary button to the
Activities page; and in the chat, no View full receipt: the full detail in
that sheet over the chat. The owner's answers: every payment's receipt is
the sheet; Done with See in Activities under it, Share small in the
sheet; the chat's sheet keeps See in Activities too.

- [x] The rows of a line opened on Activities come in on the phone. The
      box they grow in starts with no height, and the phone measures what
      is in the flow of a column against the column's own height (Yoga,
      for any parent that is not a scroll), so they measured as their 4 of
      padding and never grew; a browser does not do this, so the web and
      the walk never showed it. What a growing box holds now lies loose in
      it (`LOOSE`, design/motion.tsx), measured by the same layout engine
      at its full height. The same fix where the same trap was set: an ask
      card in the chat that grows into its list, and the way in's slots.
- [x] A receipt sheet (receipts/ReceiptSheet.tsx): the frames' All done in
      the floating sheet the passcode uses. The title and when, Share
      receipt small and the ··· (Ask Beetle about this, Report a problem)
      at its top; the tick, the amount and who, the status; the slip with
      every field and the session id to copy, a bill's meter token over it
      in its grey card, as the Bill paid frame has it; Done in black, See
      in Activities plain under it. It scrolls between its top and its
      buttons when the whole is taller than it may be, and never goes up
      under the status bar. A line not settled has its own glyph, colour
      and title (On its way, It did not go, It came back).
- [x] Every receipt right after paying is that sheet, over the page paid
      from: money sent, a bill, data, airtime, a loan, money into a goal,
      loading the card, and dollars bought (which ended on the Converted
      page; that page stays in the lab for its frame). Done goes back to
      where the payment started, See in Activities to the record. A
      receipt by its address is the same sheet.
- [x] In the chat a receipt card has no line to a full receipt; a tap on
      it brings the same sheet up over the chat, Done back to the chat as
      it was, See in Activities to the record.
- [x] A transfer's Set it up (the same again) stays on its line opened on
      Activities; the sheet keeps to the receipt and its two ways on.
- [x] The walk follows the sheet: after every payment, from the chat with
      Done and See in Activities, the ··· from it into a dispute.

**Expo Go**: a QR code for the update, as every round that reaches the
phone ends.

## Round 20 · The chat's receipt opens where it is, in the dark

Asked by the owner after Round 19: in the chat, not a sheet from the
bottom; the dark card that expands, as before, but with every detail of
the transaction in it. Two answers: Share and See in Activities at its
foot; as tall as it needs, the less important things kept back, the
background blurred as before, no outline round it once open, looking and
behaving like a dark Activities line. And: the icon beside the Activities
title goes; the chats drawer a little brighter than the chat.

- [x] A receipt card in the chat opens in place (agent/ChatOpen.tsx): the
      card stays where it is in the chat, its outline goes and it reaches
      out to the chat's right edge, and under what it says grow the rows a
      line on Activities grows, in the dark's inks: the bank and the
      account, where it came from, the money, the balance after, anything
      written with it, when, and the session id behind Show it; then Share
      receipt and See in Activities. The chat moves up in step just enough
      for the card to stand clear of the header and the ask bar, and
      everything else goes soft under a frost of the chat's dark. A tap on
      the frost or the card, or the phone's back, closes it in two steps,
      the rows first. Round 19's sheet keeps to the receipts after paying.
- [x] The rows (activities/InPlace's Details) take the dark: labels in its
      grey, figures in white, Show it in the accent lifted for the dark,
      the dashes and buttons in its raised grey; a label keeps its words on
      one line and a long figure beside it is cut short instead.
- [x] The Activities title stands alone at the left, no glyph beside it.
- [x] The chats drawer's ground is a step lighter (#222224) than the chat.

**Expo Go**: a QR code for the update, as every round that reaches the
phone ends.

## Round 21 · Light at the card's edge, after NameDrop

Asked by the owner after Round 20: a more dramatic opening for the chat,
the pull down kept, after Apple's tap to share between two phones: as they
meet, an anticipation that starts as a soft arc of blur with streaks and
aberration in it, a pulse as the contact goes, and a soft light that dies
down the page. Looked into (Apple's own, and its copies in Metal, SpriteKit
and AGSL; what Expo Go carries), sketched over the app, and four answers:
the light gathers at the card's pulled edge; it pulses once the card is
pulled far enough, the card going on by itself; white with warm and cool
edges; and a quiet reverse on closing.

- [x] One shader for the light (home/glow.ts), in the words Skia's SkSL and
      WebGL's GLSL share: on the phone Skia draws it over the card, fed
      from the card's own numbers where they move, so it keeps up with the
      finger whatever the chat is doing (home/Light.tsx); on the web WebGL
      draws it a frame at a time, only while there is light
      (home/Light.web.tsx). Nothing is drawn or shown at rest.
- [x] The pull gathers a soft bow of white at the middle of the card's
      edge, streaked, its rim split warm outside and cool inside, whole
      where letting go has always opened the card (0.35 of the way); what
      the card holds is drawn out a little toward it.
- [x] There the card goes on by itself, finger down or not, and the light
      pulses: a flash where it gathered, a fringed ring and a fainter echo
      85 ms behind it running out through the opening chat, and the bow
      riding the edge down to the foot as it dies, in 1.4 s at most. A
      fling open before it got there pulses all the same; let go short of
      it and the light ebbs with the card.
- [x] Closing, from a push up, Home or the phone's back, a quieter glow
      rises along the edge and is gone before it shuts. No ring.
- [x] The phone answers the light: a tick a quarter of the way, a soft
      knock at half, a light one at three quarters, a firm knock at the
      pulse and a soft one with its echo.
- [x] Skia 2.6.2, the one Expo Go carries for SDK 57. An installed APK built
      before it has no Skia: there the card opens as before, without the
      light, until the next APK. No light for somebody who has asked their
      phone to keep still.
- [x] Tested: how much a pull gathers, the knocks, the closing glow, what
      the shader is handed, and the shader itself compiled and drawn by
      Skia's own CanvasKit (nothing at rest, the light at the pulled edge,
      a ring out from where it fired).

**Expo Go**: a QR code for the update, as every round that reaches the
phone ends.

## Round 23 · What the analysis after Round 21 found, fixed

Asked by the owner after Round 21: look over the whole project for
problems, then fix all of them. (Round 22, the camera at the top of the
Receive sheet and the plus taken off, waits on the owner's word.)

Money

- [x] What leaves is checked against Everyday everywhere it can leave: the
      chat's cards, Save, a loan's slide, bills, data, a meter, a card
      loaded, a goal's money; past it, Beetle says what it comes to and
      what Everyday holds. A figure below nothing shows its minus.
- [x] The balance kept to the kobo: a fee that rounds is never let past
      the last kobo; dollars spent are rounded up to the cent, never down.
- [x] The caps on Spending limits are kept: past one transfer's cap or the
      day's, the passcode is not enough (no face) and the three words are
      typed in full, as What happens at the line shows. The demo's day, as
      its frames draw it, has ₦84,000 out already, so the next ₦16,000 is
      past it. Not your phone's freeze and the twelve hours after a new
      passcode are kept too: nothing leaves until then.
- [x] A changed amount draws its card again (the fee, a bill's units and its
      token follow it). Money that came back is covered once, not again on
      every tap. A loan counts what is already out against the limit, and
      its payments add up to what is paid back, to the naira. Not enough's
      Move it from Holiday goes through the passcode, and opened from a
      bill, data or a top up it goes back there rather than to Send.
- [x] Today ends: a line keeps the moment it moved and is today, yesterday
      or earlier by the phone's calendar; a receipt's date is the phone's
      own day.

Security

- [x] The build's keys (123456 and 654321) open only the lab and the demo
      account; every other account needs its own passcode, in every build.
- [x] The app locks: opened with an account signed in, and back after the
      wait Ask again after sets, it asks for the face (where Face ID is on)
      or the passcode. Not you? signs out.
- [x] Three wrong tries shut the gate for half a minute, then five minutes,
      half an hour, two hours; the gate is kept on the phone, so closing
      the app does not open it.
- [x] Each account's passcode is its own, stretched (PBKDF2 over SHA-256,
      versioned so it can be made stronger); one kept the old way moves
      across the first time it is typed right.
- [x] A new passcode asks for the one it is now (or the face) first;
      Reveal asks before the card's whole number shows; Face ID off in Lock
      and privacy means no face is asked for.
- [x] The lab and the model's page are only in builds with the lab. A link
      cannot put words in the owner's mouth: home asks only questions the
      app sent itself.
- [x] No Anthropic key in a published build: the phone workflow no longer
      passes one, a build reads one only while developing, the web
      preview's packaging refuses a bundle that carries one, and Beetle can
      talk to a server of its own that keeps the key. A new chat says, in
      small print, when Claude is answering and what goes to Anthropic.
- [x] Who somebody is (phone, ID record, ID number, address) is kept in the
      secure store, moved there from plain storage; Android keeps no backup
      of the app's data. The workflows' token reads and nothing more; the
      packages go in before the Expo token is in the run; eas-cli is pinned.
- [x] The demo account's number is made up now (0803 000 0001); it was the
      owner's own.

Screens

- [x] The camera is one of the app's pages, so what it opens stays in one
      stack: Done on a bill paid from a photo no longer comes back to a
      live Continue. Closing it calls off what it was about to do; a bill or
      data camera says when a photo is neither, and the photo goes only to
      the chat or Send. The samples read as themselves in Expo Go. Where the
      build cannot read photos, the camera says so; it no longer promises
      codes or screenshots it does not take.
- [x] An answer still on its way goes to the chat that asked, wherever that
      chat is by then; a photo into a closed card no longer files the last
      chat twice.
- [x] VoiceOver: the slide is a button there, the card opens the chat with
      a double tap, the chats drawer comes in properly, and a line of the
      record or a receipt in the chat says its money, its way and its time.
- [x] Back from a page opened straight from its address goes home; a
      receipt that is not on this phone says so and goes; More's close sits
      exactly on the plus; the deprecated blur setting is gone (it warned on
      every blur); the words that spoke of rounds and frames speak plainly.

Housekeeping

- [x] Expo's packages at the versions SDK 57 expects, TypeScript back to
      6.0; the audit's safe fixes (the one critical one with them); the
      app's config without its deprecated fields; the photos permission
      says it is for receipts.

What code cannot do: the owner's number is still in the repository's
history (rewriting a public history is the owner's call); no key was ever
published (the phone workflow's runs show the secret empty), so there is
nothing to revoke; and an APK built before this round needs building again
for the backup setting and the splash's new place (everything else comes
as an update).

## Since the rounds

- [x] The mark leaves the card's header (the owner's word, testing on the
      phone): Settings is the gear on the bar, so the header's mark was a
      second way to the same place. The header keeps the word Wallet at its
      left, and the figure takes that place as the card opens. The home
      frames still draw the mark; the check allows its absence by name.
- [x] No page has Beetle's bubble (the owner's answer after Round 11).
      Round 11 kept the bubble on the pages that explain rather than ask
      (Not enough, Check this number, It did not go, Dollars, Bills and the
      rest of the states); the owner said to take those off too. What
      Beetle says on a page is now a plain line in the secondary grey,
      where the bubble was. Where it offers something, the line is in ink
      in a white card, over the card's button. Activities' insight cards
      keep the mark beside their title, with the words plain under it. The
      check allows each missing bubble by name and place, and holds what
      came up into its room to the frame moved by that much (a band of the
      frame that moved as one), so those pieces are still measured.
- [x] The chat's transfer card is titled Send money (the owner's answer
      after Round 11). "Beetle Transfers" read as Beetle-to-Beetle only,
      even for a GTBank transfer. The Data, Airtime and Bills cards keep
      their titles.

## Kept out on purpose

- The full receipt page (A transfer 239:7829, Data bought 239:8418, A bill
  paid 490:13497, Money in 490:12465): since Round 13 no transaction has a
  page of its own, so those four frames left the check; since Round 19 a
  receipt comes up as a sheet with what they draw, which is not the page
  they draw, so they stay out.
  The share sheet over a receipt (472:10886, 472:11590) is still checked.
- Three ways to be paid (222:199) and Your code (221:2), with the QR, and
  paying in from a card: the owner took them off after Round 11, so being
  paid is the Receive sheet's own details. Their fixtures left the check.
- Fixed savings (money locked for a set time): Take out works on every goal
  whenever it is wanted, and All services says Fixed savings are not in
  Beetle yet.
- The file's older home (225:3): the card and the day in the app are the
  home to keep.
- The dock at the foot of home: the ask bar lives in the card. Other screens
  keep the dock their frames give them.
- The prototype in `mobile/` is a mirror of the frames to read from, not code
  to move over: the app is built on its own design system and motion.
