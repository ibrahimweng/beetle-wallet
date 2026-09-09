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
- [ ] Keyboard — the typed-entry keyboard, 393×236
- [ ] Amount pad — the big-number entry used by send, loan, convert
- [ ] Meter / progress ring — used by health and goal
- [ ] Toggle row — used by settings, lock, rules
- [ ] Segmented filter — All / Insights / In / Out, used by history
- [ ] Activity row — the ledger line, used by home and history
- [ ] Insight card — the agent card on home
- [ ] Waveform — the listening indicator

## 2 · Screens

### Act One · It goes wrong
- [ ] checking (973:20644)
- [ ] iwillnot (973:20699)
- [ ] misheard (957:20338)
- [ ] alreadygone (957:20392)
- [ ] noface (331:9488) — already routed to Confirm, verify against its own frame
- [ ] short (208:88)
- [ ] pending (206:2)
- [ ] failed (206:77)
- [ ] reversed (206:153)
- [ ] wrong (206:225)
- [ ] recall (207:2)
- [ ] amend (222:148)
- [ ] disputeopen (959:20338)
- [ ] disputeend (959:20393)
- [ ] nonetwork (959:20420)

### Act Two · It decides
- [ ] rule (207:101)
- [ ] rules (207:136)
- [ ] settings (272:8208)
- [ ] lock (271:8211)
- [ ] limits (223:206)
- [ ] limitstop (224:2)
- [ ] devices (224:53)
- [ ] lostphone (957:20438)
- [ ] newcode (957:20481)

### Act Three · It works
- [ ] home (225:3) — the screen everything returns to
- [ ] agentchat — no frame; the live chat, built on Bubble
- [x] ask (205:2)
- [ ] scan (209:2)
- [ ] typed (209:209)
- [ ] pay (332:9851)
- [x] chat (205:57)
- [x] donesend (239:7829)
- [x] share (472:10886)
- [ ] asksvc (225:2620)
- [ ] typedbuy (225:2973)
- [ ] buy (221:165)
- [ ] confirmbuy (239:8474)
- [ ] done (239:8418)
- [ ] sharebuy (472:11590)
- [ ] askreq (225:1551)
- [ ] typedask (225:1928)
- [ ] request (225:1606)
- [ ] sent (239:8294)
- [ ] scanbill (222:97)
- [ ] meter (210:2)
- [ ] confirmmeter (210:71)
- [ ] power (490:13497)
- [ ] sharepower (490:13595)
- [ ] bills (217:67)
- [ ] powerpay (217:2)
- [ ] receive (332:9555)
- [ ] ways (222:199)
- [ ] mycode (221:2)
- [ ] services (215:2)
- [ ] airtime (215:170)
- [ ] loan (217:181)
- [ ] card (218:2)
- [ ] history (501:14267)
- [ ] answer (218:84)
- [ ] donein (490:12465)
- [ ] sharein (490:12558)
- [ ] doneflat, doneshop, donesub, donecard — past receipts, no frame, built on Receipt
- [ ] shareflat, shareshop, sharesub, sharecard — their share sheets
- [x] actions (204:85)
- [ ] draft (222:2)
- [ ] health (223:2)
- [ ] goal (219:2)
- [ ] saverule (224:122)
- [ ] paused (204:2)
- [ ] dollars (279:8211)
- [ ] convert (279:8299)
- [ ] converted (296:8850)
- [ ] payfrom (301:9464)
- [ ] paydollars (301:9565)

### Act Four · Getting in
- [x] start, number, code, nin, who, face, passcode, ready
- [x] signin, signcode
- [ ] nomatch (333:10529)
- [ ] finish (316:9491)
- [ ] idcard (316:9538)
- [ ] income (317:9488)
- [ ] full (317:9528)
- [ ] firsthome (964:20807)
- [ ] firstask (964:21033)
- [ ] emptyactivity (964:21113)
- [ ] emptygoal (964:21229)

## 3 · Make it work, not just draw

- [ ] Every screen reads the shared store rather than holding its own copy
- [ ] Sending, buying, paying a bill, requesting, borrowing, saving and
      converting all move money through `actions`, so balances agree everywhere
- [ ] Limits enforced: over the daily cap goes to limitstop, short of the
      balance goes to short
- [ ] Toggles, limits and standing instructions persist
- [ ] Ask bar answers on every screen it appears on
- [ ] Asking to be shown a screen takes you there, as on the web build

## 4 · Reachable by using it

- [ ] Every screen reachable by tapping from the front door, or by asking
- [ ] No screen left only reachable by URL
- [ ] Back always goes somewhere sensible, never to a dead end
- [ ] A route test that fails if any screen is stranded

## 5 · Verify

- [ ] Type check clean
- [ ] Bundle exports clean
- [ ] Every screen renders with no console error
- [ ] The four money flows walked end to end in the bundle
- [ ] Copy checked against the frames, one pass over all of them
- [ ] Geometry checked against the frames for the shared components

## 6 · Developer ready

- [ ] README current: how to run, what is generated, how to add a screen
- [ ] `npm test` runs type check, render check and the route check
- [ ] Lint and format config
- [ ] No placeholder screens left in the running app
- [ ] BUILD-PLAN.md fully checked off, or honest about what is not

## 7 · Ship

- [ ] Committed and pushed to main in coherent commits
- [ ] Final report saying what was built, what was found, what is left
