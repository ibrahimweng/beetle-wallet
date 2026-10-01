# Beetle · how it is designed

The rules every screen keeps. They come from the owner's words over the
rounds (PLAN.md has the history) and from the Figma file, which stays the
source for sizes and colours (`src/design/tokens.ts`). When a rule and a
frame disagree, the rule is the newer word; the Figma check's allowances
(`test/figma/allowed.json`) say where and why.

## Depth without shadows

- **No drop shadows, anywhere.** No `shadow*`, no `elevation`, no
  `boxShadow`. A surface is told apart from what is under it by:
  - **tone**: white (`surface`) on the pale grey (`surface2`), or the other
    way round; on the dark card, `panel` on `card` and `edge` inside it;
  - **a hairline**: 1 of `rule` (`edge` on the dark card) where two whites meet;
  - **frost**: a blur with a white (or near-black) wash over what is behind;
  - **space**: room around a thing says it is a thing.
- What scrolls under a page's foot fades into the foot's white over 40;
  the bar does the same. No hard edge, no shadow line.

## Type, space and the grid

- Sizes are the file's: Display 32/40, Head 20/24, Row 16/24 semibold,
  Body 16/24, Label 14/20 semibold, Meta 14/20, Caption 12/16.
- Space steps by 4: 4, 8, 12, 16, 20, 24, 32. A page's sides are 20.
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
- Rows arrive one after another, 40–60 apart; never more than a third of
  a second for the lot.
- **Titles arrive with their page**: no title flies from the button that
  opened it or grows into its size.
- Reduced motion on the phone means no motion here: everything lands where
  it ends.

## The foot

- One foot for the app, over the stack. On Home, Activities and Settings it
  is the bar (the three glyphs and the plus). On every other page it is
  Back at the bottom left beside the page's one button, or Back alone.
- Only home has an ask bar.
- Money moves by **Slide to send** (or Slide to take, to pay) in the foot,
  never by a plain button on a page.

## Forms

- **No Beetle bubble on a form page.** A form says what it needs with its
  fields; a field says what matters about itself on the line under it
  (what Everyday can send, the least you can borrow, whose the meter is).
- **The first field is the one that decides the rest**: on Send money it is
  To.
- **Amounts are picked where they are**: the figure, chips of likely amounts
  and a stepped ruler that scrolls under a fixed line, snapping with a light
  haptic click and stopping hard at the cap with a firmer one. Steps: ₦100
  up to ₦10,000, ₦500 up to ₦100,000, ₦1,000 above. A tap on the figure
  types any exact amount. Never a page of its own for an amount.
- A choice of a few (days, a term) is a quiet row with "30 days ▾", not a
  boxed field and not another row of chips beside the amount's chips.

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
- The **passcode sheet** shows the whole of it while the six digits go in:
  who, their bank and account number (or tag), what they receive, the fee,
  and what leaves which account. **Cancel** sits plainly under the pad: the
  sixth digit sends it.

## The chat

- Chips over the input do things **in** the chat: Send, Bills, Data,
  Receive, Loan, in that order. None leads to a screen.
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

## Asking before what cannot be undone

- Signing out and signing out the other phones ask first: a small sheet
  that says what will happen in one or two plain sentences, the action in
  red (it takes something away) and Cancel. Money has its passcode instead.
- What protects does not ask: freezing the money from Not your phone, or
  freezing the card, is one tap, since it has to be quick in a bad moment
  and lifts as easily as it went on.

## Words

- Beetle speaks in the first person, warm, plain and short. Screens use
  sentence case and say what will happen, not what the system is.
- Naira with ₦ and thousands; kobo only where a fee has them.
