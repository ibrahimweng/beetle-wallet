# Build plan — Beetle in React Native

Everything between here and a finished app. Each item is checked off only when
it is done and verified, not when it is written.

The rule for every screen: open the frame named beside it, take the sizes and
the words from that frame, build it with the design system, register it, then
walk it in the running bundle. Never judge a layout by eye, and never invent a
row the design does not have.

---

## 0 · Foundations

- [x] Expo, TypeScript, strict, path aliases
- [x] Icons generated from the Figma export, all 97
- [x] State layer shared with the web build, not forked
- [x] Persistence behind a platform adapter, AsyncStorage here
- [x] Tokens read from the file: type scale, radii, spacing, frame geometry
- [x] Routes generated from the registry, all 100, each naming its frame
- [x] Navigation over every route, with a URL path each
- [x] ToBuild placeholder that names the frame it is missing

## 1 · Design system, from the Components page

- [x] Button — tone × size
- [x] Bubble — who
- [x] Page head — lead
- [x] Tool panel, Tool row — tool, go
- [x] Icon — all glyphs
- [x] Status pill
- [x] Passcode keypad, Pips
- [x] Field · typing
- [x] Dock, Ask bar, Action button
- [x] Screen, Card, ListRow, ActionRow, Divider
- [x] Step trail and step head for the way in
- [x] Top bar
- [x] Sheet
- [x] Receipt
- [x] Keyboard — the typed-entry keyboard, 236 tall, typing for real
- [x] Amount pad — the big-number entry used by send, requests, the pot and convert
- [x] Meter and ring — used by the card, the answer, health, the pot and the pause
- [x] Toggle row — used by settings, lock and standing instructions
- [x] Segmented filter — All / Insights / In / Out, used by home and history
- [x] Activity row — the ledger line, used by home and history
- [x] Insight card — the agent card on home
- [x] Waveform — the listening indicator on the three voice sheets

## 2 · Screens

### Act One · It goes wrong
- [x] checking (973:20644)
- [x] iwillnot (973:20699)
- [x] misheard (957:20338)
- [x] alreadygone (957:20392)
- [x] noface (331:9488) — already routed to Confirm, verify against its own frame
- [x] short (208:88)
- [x] pending (206:2)
- [x] failed (206:77)
- [x] reversed (206:153)
- [x] wrong (206:225)
- [x] recall (207:2)
- [x] amend (222:148)
- [x] disputeopen (959:20338)
- [x] disputeend (959:20393)
- [x] nonetwork (959:20420)

### Act Two · It decides
- [x] rule (207:101)
- [x] rules (207:136)
- [x] settings (272:8208)
- [x] lock (271:8211)
- [x] limits (223:206)
- [x] limitstop (224:2)
- [x] devices (224:53)
- [x] lostphone (957:20438)
- [x] newcode (957:20481)

### Act Three · It works
- [x] home (225:3) — the screen everything returns to
- [x] agentchat — no frame; the live chat, built on Bubble
- [x] ask (205:2)
- [x] scan (209:2)
- [x] typed (209:209)
- [x] pay (332:9851)
- [x] chat (205:57)
- [x] donesend (239:7829)
- [x] share (472:10886)
- [x] asksvc (225:2620)
- [x] typedbuy (225:2973)
- [x] buy (221:165)
- [x] confirmbuy (239:8474)
- [x] done (239:8418)
- [x] sharebuy (472:11590)
- [x] askreq (225:1551)
- [x] typedask (225:1928)
- [x] request (225:1606)
- [x] sent (239:8294)
- [x] scanbill (222:97)
- [x] meter (210:2)
- [x] confirmmeter (210:71)
- [x] power (490:13497)
- [x] sharepower (490:13595)
- [x] bills (217:67)
- [x] powerpay (217:2)
- [x] receive (332:9555)
- [x] ways (222:199)
- [x] mycode (221:2)
- [x] services (215:2)
- [x] airtime (215:170)
- [x] loan (217:181)
- [x] card (218:2)
- [x] history (501:14267)
- [x] answer (218:84)
- [x] donein (490:12465)
- [x] sharein (490:12558)
- [x] doneflat, doneshop, donesub, donecard — past receipts, no frame, built on Receipt
- [x] shareflat, shareshop, sharesub, sharecard — their share sheets
- [x] actions (204:85)
- [x] draft (222:2)
- [x] health (223:2)
- [x] goal (219:2)
- [x] saverule (224:122)
- [x] paused (204:2)
- [x] dollars (279:8211)
- [x] convert (279:8299)
- [x] converted (296:8850)
- [x] payfrom (301:9464)
- [x] paydollars (301:9565)

### Act Four · Getting in
- [x] start, number, code, nin, who, face, passcode, ready
- [x] signin, signcode
- [x] nomatch (333:10529)
- [x] finish (316:9491)
- [x] idcard (316:9538)
- [x] income (317:9488)
- [x] full (317:9528)
- [x] firsthome (964:20807)
- [x] firstask (964:21033)
- [x] emptyactivity (964:21113)
- [x] emptygoal (964:21229)

## 3 · Make it work, not just draw

- [x] Every screen reads the shared store rather than holding its own copy
- [x] Sending, buying, paying a bill, requesting, borrowing, saving and
      converting all move money through `actions`, so balances agree everywhere
- [x] Limits enforced: over the daily cap goes to limitstop, short of the
      balance goes to short
- [x] Toggles, limits and standing instructions persist, through AsyncStorage
- [x] Ask bar answers on every screen it appears on, from `src/state/agent.ts`
- [x] Asking to be shown a screen takes you there, as on the web build

## 4 · Reachable by using it

- [x] Every screen reachable by tapping from the front door, or by asking
- [x] No screen left only reachable by URL
- [x] Back always goes somewhere sensible, never to a dead end
- [x] A route test that fails if any screen is stranded — `npm run reach`

## 5 · Verify

- [x] Type check clean — `npm run typecheck`
- [x] Bundle exports clean — `npm run bundle`
- [x] Every screen renders with no console error — `npm run screens`
- [x] The money flows walked end to end in the bundle — `npm run flows`
- [x] Copy checked against the frames, one pass over all of them —
      `npm run copy`, 1,304 lines from 91 frames, 14 recorded differences
- [x] Geometry checked against the frames for the shared components —
      `npm run geometry`

## 5b · How it moves

- [x] One file for every duration and spring, `src/design/motion.tsx`
- [x] Every screen assembles after the tap instead of appearing
- [x] The direction a screen arrives from matches the tap that asked for it
- [x] Every sheet, keyboard and camera comes up from the bottom
- [x] Every press is answered under the finger before the screen changes
- [x] The button's menu blurs the home and brings the actions up out of the
      button, nearest first, with a bounce; the plus turns into a cross and
      starts turning on the home screen
- [x] Closing the menu runs it backwards rather than cutting
- [x] Reduce motion is honoured, and a screen behind a sheet does not re-enter
- [x] A check that fails if any of it stops moving — `npm run motion`

## 6 · Developer ready

- [x] README current: how to run, what is generated, how to add a screen
- [x] `npm test` runs the type check, lint, format, reachability, the bundle,
      and the five checks against it
- [x] Lint and format config — `eslint.config.js`, `.prettierrc`, both clean
- [x] No placeholder screens left in the running app
- [x] BUILD-PLAN.md fully checked off, or honest about what is not

## 7 · Ship

- [x] Committed and pushed in coherent commits
- [x] Final report saying what was built, what was found, what is left

---

## What is left, honestly

Three things the Figma file leaves open, listed in `test/copy.json` beside the
lines they affect. None of them is a gap in the app; each is a place where the
file says two things and the app had to pick one.

1. The Chat and Confirm frames carry the Bubble component's unoverridden
   default text, about topping up Ikeja Electric, rather than anything about
   the transfer being put together.
2. The Chat and Send money frames price a transfer as Free while the receipt
   for the same transfer charges ₦26.88. The app charges the receipt's rule
   everywhere: ₦25 to NIP plus 7.5% VAT above ₦10,000.
3. The Past your own limit frame is written around a ₦120,000 transfer over a
   ₦100,000 one-transfer cap, while the Spending limits frame sets that cap at
   ₦50,000. Its figures are the frame's, so they do not follow the transfer
   that took you there.

Two more, about the app rather than the file:

- Nothing here reaches a network. The agent answers from the store, which is
  what makes its answers true; a real one would answer from a model with the
  same figures in front of it.
- The camera screens draw what a camera would have read rather than opening
  one. The frames draw the same thing.
