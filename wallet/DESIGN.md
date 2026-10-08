# Beetle · how it is designed

The rules every screen keeps. They come from the owner's words over the
rounds (PLAN.md has the history), from the Figma file, which stays the
source for sizes, and from the brand (Round 25), which is the source for
colours, faces and the mark (`src/design/tokens.ts`). When a rule and a
frame disagree, the rule is the newer word; the Figma check's allowances
(`test/figma/allowed.json`) say where and why.

## The brand

- **Clean, with warmth in the ink** (Round 25, from the brand file and the
  owner's word). Where the frames have black, the app has the brand's ink
  `#2b2721`; the page is a neutral white `#fafaf9`, only just off pure, so
  the screens read clean and professional, never moody; the pale grey is
  `#f1f0ed`, a step down. The dark card and the chat are the way in's very
  dark brown `#1a130d` (Round 28), with the brand's paper `#fbefe3` for what
  was white on them and its clay `#bcaa97` for the mark and the kobo. The words below still say white and black for
  the page and the card: read them as the neutral white and the ink.
- **One loud colour**: the orange `#f04f22`, for what moves (a switch on, a
  bar filling, the caret, a dot that is new) and for what is a link, where
  words take the deeper `#b8390f` so they read on the paper. Red is a
  crimson `#b42318`, kept apart from it. The greens, the gold and the
  networks' own colours stay what they say.
- **Two faces, and only two** (Round 27, the owner's word): Geist, and
  Sentient for a page's main title and nowhere else; body, subtitles and
  the figures (the balance, an amount) are Geist. Geist ships as Beetle
  Sans, the open face with the naira sign added; Sentient comes from
  Fontshare as the app opens, its licence keeping it out of the repository,
  until the owner's own face takes its place. A weight is asked for by name
  (`font('600')`), never with fontWeight.
- **The mark** is the ladybird in flight that is also a B, out of the brand
  file's own vector: in ink on the paper, in clay on the dark, cream on the
  ink for the app's icon. Beetle thinking says **Beetling…** beside it.
- **Light, not paint**: the brand's oil-slick colours are light (the card's
  border as it is pulled), never a flat fill.
- **The way in is dark** (Round 27, the owner's frame): the opening and
  every step of the way in are on the very dark brown `#1a130d`, the words
  white over the tan `#99826e`, the button white with the brown on it, the
  keys and cards a step up from the ground, the logo and its name in the
  frame's tan `#c9b9a6`. A screen asks for it with `<Scheme value="dark">`
  and the pieces take their colours from it. The app after sign-in stays on
  the white.
- **Two coins**, rendered from the owner's own models: the punch-holed coin
  turns on the way in, all the way round every three seconds with a slow
  ease in and out, the soft blur under it travelling round its rim with it;
  the coin with the logo and its words turns where money is confirmed, on a
  receipt in the tick's place and on the chat's receipt card in the
  glyph's, a turn and a half landing face on.
- **The coin walks you in** (Round 28): the way in has no washes of colour;
  the holed coin is one coin from the welcome to home. Open an account and
  it rises into the room at the top of the steps, moving up and growing
  smaller as the finished steps stack under it; done, it comes to the
  middle and breathes, and the dark takes an impact (it swells, blurs and
  fades) while an oval opens fast onto home.
- **The logo first** (Round 28): the opening is the logo and its name in the
  middle, out of a blur that passes across them, then rising to the
  welcome's place at the top.
- **The drawings** (Round 26): a wing's veins across a top corner (the steps
  of the way in after the first, the lock, faint in the paper on the dark
  card). Light, behind everything, outside the layout, never over words: a
  screen with one keeps every size it had.

## Depth without shadows

- **No drop shadows, anywhere.** No `shadow*`, no `elevation`, no
  `boxShadow`. A surface is told apart from what is under it by:
  - **tone**: white (`surface`) on the pale grey (`surface2`), or the other
    way round; on the dark card, `panel` on `card` and `edge` inside it;
  - **a hairline**: 1 of `rule` (`edge` on the dark card) where two whites meet;
  - **frost**: a blur with a white (or near-black) wash over what is behind;
  - **space**: room around a thing says it is a thing.
- **Glass, not white** (the owner's word, Round 13). What scrolls under a
  page's foot or the bar goes soft under a blur that grows toward the edge,
  reaching 40 above the row, with no white in it: a white page reads as
  white and a card passing under reads as a card, blurred. No hard edge, no
  shadow line, no white band. The top of a page with a title is the same
  soft blur, stronger, and at its strongest down past the shrunk title
  before it fades (Round 18), so a row passing under the title is a haze
  and the title reads alone.
- **Frosted white glass** for what sits over the page: the bar's Home,
  Activities and Settings in a pill that hugs them (12 of padding, no
  outline), and Back in a circle of it. A page that opens over home (Card,
  Services, Loan, Savings) has home behind it, frosted, as its ground.
- **A white gradient always has a blur under it** (Round 12): the More
  sheet's veil, the frost a line opens over. The blur is stacked sheets,
  each fading at its own end, so it thins with the white; on the phone it
  grows in strength as the white comes in.

## Type, space and the grid

- Sizes are the file's: Display 32/40 and Title 32/40 in the serif, Head 20/24, Row 16/24 semibold,
  Body 16/24, Label 14/20 semibold, Meta 14/20, Caption 12/16. Where the
  owner's home frame sets smaller words, Small 11/16 (the quiet card's
  line) and Fine 10/16 (the foot line of home's four cards); nowhere else.
  An offer on the black card is Caption, its title and its line alike.
- Space steps by 4: 4, 8, 12, 16, 20, 24, 32. A page's sides are 20; home's
  are 24 (Round 14, the owner's frame).
- **Label left, figure right.** A list of facts is rows: the label in the
  secondary grey at the left, the figure in ink at the right, one line
  each, tight: 28–32 a row in a breakdown on a card or a sheet, 40–44 on a
  page, 52–56 where a row is tapped. The total is the strongest line.
- The main thing first. What matters for the decision is on the page; what
  is only sometimes wanted is one tap away ("More about this loan", "Show
  it"), never a wall of rows.

## Pressing and moving

- **No sharp press states.** A thing that leads somewhere lights with a
  rounded wash, 8 wider than it each side, on its own layer. A tap dips a
  thing to 0.96 and springs it back.
- **One family of motion** (`src/design/motion.tsx`): things arrive out of
  a blur on `settle`, leave on `away`; springs are `lift` (sheets), `keys`
  (cards, drawers) and `arrive`.
- **A blur comes in by growing**, not by fading a blurred layer: animate the
  blur's strength and the wash's opacity, never the opacity of a parent of a
  blur (the phone draws that badly, and it reads as a jerk).
- **One movement, measured first.** Where something lifts to make room,
  measure before moving, so the lift and the arrival are the same motion.
- **What a growing box holds lies loose in it** once the box has a height
  (`LOOSE`, Round 19). The phone lays a column's content out within the
  column's height, so content in the flow of a box with a height measures
  no taller than the box already is, and a box growing from nothing stays
  nothing; a browser does not do this, so only the phone shows it.
- Rows arrive one after another, 40–60 apart; never more than a third of
  a second for the lot.
- **Pages slide the way the phone's own do** (Round 13): in from the right
  over the page they came from, out to the right, the swipe from the left
  edge taking them back under the finger. Nothing else moves between
  pages: no cross-fade, no screen receding, nothing lighting up, but the
  foot, which stays put and changes shape (Round 18; see The foot). A title
  comes with its page; none flies from the button that opened it. What
  home's four cards open comes up from the bottom instead, as a sheet, and
  so does anything opened from a sheet (Round 14; see Pages).
- **A title shrinks as its page scrolls**, staying at the top: over the
  first 56 of scroll, about its top left corner, to 14, the size of the
  word Wallet on home's card; the line under it is gone by half way.
  Scrolled back to the top, it grows back.
- Reduced motion on the phone means no motion here: everything lands where
  it ends.

## The foot

- **The foot stays put and changes shape** (Round 18, the owner's word).
  It is drawn once, over every page, and does not slide with them. On
  Home, Activities and Settings it is the bar (the three glyphs in their
  glass pill, and the plus). On every other page it is Back at the bottom
  left beside the page's one button, or Back alone.
- Going to a page, the pill draws in to Back's circle where it is, the
  glyphs fading as the arrow comes in; the plus is gone before the page's
  button slides in beside Back, so the two are never drawn over each
  other. Going back, the circle grows into the pill. Between two pages
  Back stays and the button hands over the same way: the one going fades,
  then the next slides in. All of it on `settle`, in step with the page.
- The bar sits 12 from the bottom of the screen and 24 in from either side
  (the owner's home frame). On a phone with the home line it sits just over
  the line instead, never on it.
- Only home has an ask bar.
- Money moves by **Slide to send** (or Slide to take, to pay) in the foot,
  never by a plain button on a page.

## Home

- The black card holds the balance, its reading in dollars, **Send and
  Receive as white pills**, **the offers**, and a grabber, with no words
  over or under them (Round 15: the offers moved into the card).
- **The offers**, 36 under the pills and 24 in from either side: Beetle's
  own features for this account, most useful first, one at a time with
  small dots inside at the bottom right. Each is a faint wash of its own
  colour with its tile in that colour, the title white and the line under
  it a soft shade of the colour; the dot showing is white, the others a
  deep shade. A tap opens what it offers; a sideways swipe that starts on
  it is its own, not the pages', and a pull down is the card's. **Its ×
  puts the offers away until Beetle next opens**, and the empty card takes
  their place.
- **The empty card** keeps the black card's shape where the offers were,
  once the × has put them away or when there are none: a ring, a grey
  tile, No promos over a next step that is true for the account. No × and
  no dots. Nothing under the black card moves.
- Then the four cards, 24 apart both ways. **Services starts on All
  services**; Bills, Airtime and Data come after a swipe.
- **Pulling the card lights its border softly** (Round 21 after Apple's
  NameDrop, made quieter in Round 24, the owner's word): a fine line just
  inside the edge, warm on its outer side and cool on its inner, softly, a
  faint glow inward from it, strongest along the bottom curve and thinning
  up the sides; whole where letting go opens the card. There the card **goes
  on by itself, finger down or not**, and the border swells once and fades.
  No streaks, no light at the foot, no ring. Closing, a quieter glow along
  the border. The phone knocks with it: a tick and two soft knocks as it
  gathers, a firm one at the swell. No light for somebody who has asked
  their phone to keep still.

## Transactions

- **Every transaction opens in place** (Round 13): the line stays, sharp,
  the page goes soft under a white frost and the facts come in under the
  line. On Activities **the line itself opens** (Round 17): its facts grow
  in under it in the list, pushing the lines below down, and nothing is
  ever drawn over it; the frost lies round it in the page's own white, so
  there is no edge or box. The receipt right after paying opens over the
  page paid from. There is no full receipt page.
- A line not settled — still on its way, did not go, came back — says what
  happened in place, with the bank and the account, and offers its next
  steps where a settled one offers Share receipt and Set it up.
- What Beetle noticed (the insights) keeps its own behaviour.

## Pages

- **A receipt comes up as a sheet from the bottom** (Round 19, the
  owner's word): right after any payment, from the chat, and by its
  address. The whole of it, as the frames' All done draws it, in the
  floating sheet the passcode and the share sheet use: the title and when,
  Share receipt (small) and the ··· at its top, the tick, the amount and
  who with the status, the slip with every field and the session id, and
  Done in black with See in Activities plain under it. A line opened on
  Activities keeps its own view, in place.
- **What home's four cards open comes up as a sheet** (Round 14): white,
  edge to edge, round at the top, stopping just under the status bar, home
  stepped back and greyed a little behind it. Nothing is ever read over a
  blurred page. A page opened from a sheet comes up as a sheet over it, the
  one under stepping back; Back, or a swipe down from the sheet's top, puts
  away the one on top.
- **A sheet rises on a long, settling curve** (Round 18): quick off the
  mark and easing gently into place, 0.5s up and 0.4s down
  (cubic-bezier 0.32, 0.72, 0, 1), the one under it stepping back on the
  same curve. The web moves it too.

- **No Beetle bubble on any page.** Bubbles belong to the chat. What Beetle
  has to say on a page is a plain line in the secondary grey, where the
  frames set the mark and the bubble. Where it offers something ("Want a
  message the moment it lands?"), the line is in ink in a white card with a
  hairline, over the card's button. What Beetle noticed, on Activities,
  keeps its card: the mark beside its title, the words plain under it.

## Forms

- A form says what it needs with its fields; a field says what matters
  about itself on the line under it (what Everyday can send, the least you
  can borrow, whose the meter is).
- **The first field is the one that decides the rest**: on Send money it is
  To.
- **Amounts are picked where they are**: the figure, chips of likely amounts
  and a stepped ruler that scrolls under a fixed line, snapping with a light
  haptic click and stopping hard at the cap with a firmer one. Steps: ₦100
  up to ₦10,000, ₦500 up to ₦100,000, ₦1,000 above. A tap on the figure
  types any exact amount. Never a page of its own for an amount.
- A choice of a few (days, a term) is a quiet row with "30 days ▾", not a
  boxed field and not another row of chips beside the amount's chips.
- **What is tapped is what is set**: a chip or a tick sets the figure at
  once; the ruler only glides to it, and the steps it passes are not picks.
- **Back is always at the bottom left** (Round 31, the owner's word), on
  every page, step and sheet that has one: the foot's Back, the circle
  beside a step's button, the keypad's own bottom left key, the camera's
  foot. Never at the top. Every step of the way in has one, except the
  welcome and the screens after the account is opened.
- **A step is named for what it asks** (Round 30, the owner's word): Enter
  mobile number, OTP verification, BVN number, Password, Face scan and
  username. The line under the title says why, in one sentence.
- **The box being typed into stays in view**: a screen with one rides up
  over the keyboard, and what is above the title folds away while the
  keyboard is up, so the box and the button are never under it.
- **Ask for the least, and never twice**: a number or an email that has an
  account is offered Log in, not a second account; a paper that gives the
  address and the email means they are not asked for again.
- **Safety is in what it takes, not in what it says**: a new phone needs the
  code, the password and the face once; getting an account back needs the
  number's code, the BVN and a live face before anything is shown; after
  it, a day's hold and This wasn't me.

## Sending money

- **Two kinds of transfer, always told apart.** Each says when it lands
  in the same words everywhere: Instantly to a Beetle account; In a few
  seconds to another bank, or Under a minute above ₦50,000.
  - To a **Beetle account**, by its tag, written `$name`: looked up in
    Beetle's directory, free and instant.
  - To **another bank**, by the ten-digit number and the bank: the likely
    banks first (from the number's check digit), then the name on the
    account is looked up and shown before anything can move.
- **The bank is always said**: on the page, in the chat, on the passcode
  sheet, on the receipt and in Activities. A Beetle account says "Beetle ·
  $tag".
- **The whole balance to an account never paid is refused**, wherever it is
  asked — the page, the words, a card in the chat — with the ways out.
  What the passcode says leaves Everyday, fee and all, is what leaves.
- The **passcode sheet** shows the whole of it while the six digits go in:
  who, their bank and account number (or tag), what they receive, the fee,
  and what leaves which account. **Cancel** sits plainly under the pad: the
  sixth digit sends it.

## The chat

- Chips over the input do things **in** the chat: Send, Bills, Data,
  Receive, Save, Loan, in that order. None leads to a screen. They are
  words only, close enough together that all six fit across the phone.
- The transfer card is titled **Send money**, the same as the page, for a
  Beetle account and for any other bank.
- The chats drawer comes in from a swipe that starts **within a thumb's
  width (44) of the left edge**, not only on the light drawn there: an edge
  a finger has to hit exactly is an edge a phone misses. Its ground is **a
  step lighter than the chat** (#222224 over the chat's #141414, Round 20),
  so it reads as a layer over it.
- **A receipt in the chat opens where it is** (Round 20, the owner's word),
  as a line opens on Activities but in the chat's dark: the card loses its
  outline, reaches out to the chat's edge and grows every detail, the less
  important (the session id) kept back until asked for, Share receipt and
  See in Activities at its foot; everything else under a frost of the
  chat's dark, the header and the ask bar too. Never a sheet in the chat.
- A card in the chat that has all it needs pays from where it is: its
  button goes to the passcode. A small **Recent** grows the card itself
  into a list of what was paid before.
- A name that is not a tag is checked against the people paid before, and
  the card asks "Is this the person?" with their bank and number filled in.
  Beetle's line above it says who was found and where, not the question
  again.
- A card says nothing above its fields unless something is wrong (no meter
  by that number, more than Everyday holds). What is still missing, its
  button says, greyed: Pick the bank, Pick how much, Type the meter number.
- A new ask while a card is up ("send 5k to 0123456785" under Sarah's card)
  gets its own card below the words; words that only add to the card that
  is up (an amount, the bank) fill it where it is.

## Being paid

- **Receive is the sheet itself**: the account number and the $tag, each
  with Copy, Share details under them, then Ask someone and In dollars.
  No code to scan, no paying in from a card, and no page in between: being
  paid is two taps from the card.

## Saving

- **Four taps to put money away** from home: Savings, Add money, the amount
  and Put away, the passcode. Add money and Take out sit straight under the
  ring, never below the fold.
- **Several goals, as pills** under the page's head, + New goal at the end;
  a tap switches in place. The first goal is the one the automatic feeds go
  to; the pages that name where they go say its name.
- **A new goal comes filled** — the next idea, its usual figure, a date to
  match — so starting one is three taps; everything on it can be changed
  before or after.
- What is done to a goal sits in its **···**: Edit goal, Pause goal (or
  Start again), End goal in red. Pausing does not ask: it lifts as easily as
  it goes on, and the line on the page offers Start again.
- **Money out of a goal goes through the passcode**, ending a goal with
  money in it included. An empty goal ends after the sheet that asks first.

## Asking before what cannot be undone

- Signing out and signing out the other phones ask first: a small sheet
  that says what will happen in one or two plain sentences, the action in
  red (it takes something away) and Cancel. Money has its passcode instead.
- What protects does not ask: freezing the money from Not your phone, or
  freezing the card, is one tap, since it has to be quick in a bad moment
  and lifts as easily as it went on.
- What shows the money's keys asks first, as money does: a new passcode
  asks for the one it is now (or the face), Reveal asks before the card's
  whole number shows, and the app itself asks on opening and after the wait
  Ask again after sets. The face only where Face ID is on in Lock and
  privacy; past a cap, never the face, since a face can be held up to a
  phone.

## Everyone

- Whatever a finger drags, VoiceOver can do with a double tap: the slide
  is a button there, the card opens the chat, the chats' edge brings the
  drawer in. A line of money says its way (in or out), its amount and its
  own words after its name.

## Words

- Beetle speaks in the first person, warm, plain and short. Screens use
  sentence case and say what will happen, not what the system is.
- Words say only what is true of this build: nothing about rounds or frames,
  nothing promised that is not there (a code the camera cannot read, a
  screenshot the chat cannot take). Something not built says so plainly:
  "not in Beetle yet".
- Naira with ₦ and thousands; kobo only where a fee has them.
