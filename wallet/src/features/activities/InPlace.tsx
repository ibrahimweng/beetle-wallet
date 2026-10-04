/* A settled line of Activities, opened where it is.

   Nothing new is pushed and nothing fills the screen. The line stays in its
   place, sharp, and the page under it goes soft behind a frost of white —
   still there, just out of focus — the way Fuse opens a coin in its list.
   Under the line the rest of it comes in as plain rows on the frost, the
   way Fuse's Solana widget lays its own out: no card, no border, no shadow;
   each fact a label at the left and its figure at the right, lined up under
   the line's own words, and a dashed rule between the groups. First who and
   where — the bank and the account always said — then the money (the
   amount, the fee, the balance after), then anything written with it and
   the session id, kept back until it is asked for, since it only matters
   when the transaction is being queried. Then Share receipt and Set it up,
   side by side. The ··· for the rest — Ask Beetle about this, Report a
   problem — sits at the top right beside the page's title, which stays
   sharp over the frost while it is on the screen.

   A line still on its way, one that did not go and one that came back open
   the same way (Round 13: every transaction in place). What it is comes
   first under the line, with what to know about it, and its two things to
   do are its next steps instead: ask about it, or try again, or check the
   number. The page each state used to open is behind See the details. The
   receipt right after paying opens this way too, over the page paid from
   (receipts/Over.tsx).

   It is one movement: what comes in under the line is measured first,
   unseen, and then the frost's blur grows, the line lifts (if it must, for
   the rows to fit above the foot) and the rows arrive one after another,
   all together. A tap anywhere off it, or the phone's back, and it all goes
   back the way it came. */
import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { GlyphTitle, HistoryRow, Icon, Label, Meta, MoreButton, Tap, Veil, away, blurred, colour, frame, motion, settle, toast, useStill, type Rect } from '../../design';
import type { IconName } from '../../icons';
import { copyText } from '../receive/clipboard';
import { ReceiptShare, useReceipt, useReceiptMenu } from '../receipts/use';
import type { Field, Receipt } from '../receipts/receipts';
import type { LedgerRow } from '../home/account';
import { useLine } from '../transfers/use';
import { bankOf, firstOf, personOf, returnReference } from '../transfers/states';
import { draft } from '../send/hand';
import { askHome } from '../more/More';
import { groupAccount, naira } from '../../lib/format';

/** Where a line sits when it was opened by a link rather than a tap: under the page's head. */
const LINKED_TOP = 180;
/** Room kept clear under what grows in: the bar goes down while a line is open, so only the phone's own foot. */
const FOOT_ROOM = 28;
/** How far a finger can move and still have tapped. */
const TAP_SLOP = 12;
/** The rows line up under the line's own words: past its 40 glyph and the 12 beside it. */
const TEXT_COLUMN = 52;
/** How long it takes to open: a little quicker than a page. */
const OPEN_MS = motion.enter - 40;

/** A line that has not settled: still on its way, did not go, or came back. */
export type LineState = 'pending' | 'failed' | 'reversed';

/** `at` is where the line was, `head` where the page's title row was, each in the window, when it was opened. */
export type Opened = { id: string; glyph: IconName; name: string; detail: string; amount: string; at: Rect | null; head?: Rect | null; state?: LineState };

export function InPlace({
  line,
  onClose,
  share = false,
  stay = false,
}: {
  line: Opened;
  onClose: () => void;
  share?: boolean;
  /** a receipt with an address of its own stays under the page it leads to, so Back comes back to it */ stay?: boolean;
}) {
  const router = useRouter();
  const still = useStill();
  const { height: H } = useWindowDimensions();
  const { receipt } = useReceipt(line.id);
  const { row } = useLine(line.id);
  const [sharing, setSharing] = useState(share);
  const [session, setSession] = useState(false);
  /* the rows as drawn, for the picture the share sheet hands out */
  const slip = useRef<View>(null);
  const at = line.at ?? { x: frame.sidePad, y: LINKED_TOP, w: 393 - frame.sidePad * 2, h: 72 };
  /* the page's title, kept sharp over the frost while it is on the screen, with the ··· on its row */
  const head = line.head && line.head.y + line.head.h > 0 ? line.head : null;

  /* 0 to 1 as it opens; how far the line lifts to make room under it */
  const t = useSharedValue(still ? 1 : 0);
  const lift = useSharedValue(0);
  const going = useRef(false);
  const begun = useRef(still);
  const downAt = useRef<{ x: number; y: number } | null>(null);
  const close = () => {
    if (going.current) return;
    going.current = true;
    if (still) return onClose();
    lift.value = withTiming(0, { duration: motion.leave, easing: away });
    t.value = withTiming(0, { duration: motion.leave, easing: away }, done => {
      if (done) runOnJS(onClose)();
    });
  };
  const closeRef = useRef(close);
  closeRef.current = close;
  /* leading somewhere: the line goes back into its place first, unless it stays under what it leads to */
  const leaveTo = (go: () => void) => {
    if (stay) return go();
    closeRef.current();
    setTimeout(go, motion.leave);
  };
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sharing) setSharing(false);
      else closeRef.current();
      return true;
    });
    return () => sub.remove();
  }, [sharing]);

  /* the opening, once: the lift and the rows together, from where they were measured */
  const begin = (up: number) => {
    if (begun.current) {
      lift.value = still ? -up : withTiming(-up, { duration: OPEN_MS, easing: settle });
      return;
    }
    begun.current = true;
    lift.value = withTiming(-up, { duration: OPEN_MS, easing: settle });
    t.value = withTiming(1, { duration: OPEN_MS, easing: settle });
  };
  /* should the measuring never come (no receipt for the line), it opens anyway */
  useEffect(() => {
    if (still) return;
    const late = setTimeout(() => {
      if (!begun.current) begin(0);
    }, 260);
    return () => clearTimeout(late);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  /* what comes in has its height: lift the line if the two would run past the foot */
  const measured = (rowsH: number) => {
    if (!receipt) return;
    const bottom = at.y + at.h + 8 + rowsH;
    const over = Math.max(0, bottom - (H - FOOT_ROOM));
    begin(Math.min(over, Math.max(0, at.y - 120)));
  };

  const held = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));
  const dots = useAnimatedStyle(() => ({ opacity: t.value }));

  return (
    <View style={StyleSheet.absoluteFill} testID="in-place">
      <Veil tone="frost" intensity={70} t={t} testID="in-place-veil" />
      <Pressable
        style={StyleSheet.absoluteFill}
        accessibilityRole="button"
        accessibilityLabel="Back to Activities"
        onPressIn={e => (downAt.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY })}
        onPress={e => {
          /* a tap puts it away; a swipe across the frost is not a tap, and the pages hold still under it */
          const d = downAt.current;
          if (d && Math.hypot(e.nativeEvent.pageX - d.x, e.nativeEvent.pageY - d.y) > TAP_SLOP) return;
          close();
        }}
        testID="in-place-away"
      />
      <Animated.View style={[{ position: 'absolute', left: at.x, width: at.w, top: at.y }, held]} pointerEvents="box-none">
        {/* the line itself, where it was, sharp over the frost */}
        <View pointerEvents="none" testID="in-place-line">
          <HistoryRow glyph={line.glyph} name={line.name} detail={line.detail} amount={line.amount} />
        </View>
        <View style={{ marginTop: 4 }} onLayout={e => measured(e.nativeEvent.layout.height)}>
          {receipt ? (
            <Details
              t={t}
              receipt={receipt}
              name={line.name}
              slip={slip}
              session={session}
              onSession={() => setSession(true)}
              onShare={() => setSharing(true)}
              state={line.state && row ? stateOf(line.state, row, router, line.id, leaveTo) : null}
              onRepeat={() => {
                const to =
                  receipt.kind === 'transfer'
                    ? `/rule?offer=again&row=${line.id}`
                    : `/rule?offer=${receipt.kind === 'in' ? 'salary' : receipt.kind === 'convert' ? 'dollars' : receipt.kind === 'saving' ? 'salary' : 'ikeja'}`;
                leaveTo(() => router.push(to as never));
              }}
            />
          ) : null}
        </View>
      </Animated.View>
      {head ? (
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: head.x, top: head.y, width: head.w }, dots]} testID="in-place-head">
          <GlyphTitle glyph="clock" title="Activities" />
        </Animated.View>
      ) : null}
      {/* the ··· for the rest, at the top right beside the page's title */}
      {receipt ? (
        <Animated.View style={[s.dots, head ? { top: head.y + (head.h - 36) / 2 } : null, dots]}>
          <Menu receipt={receipt} id={line.id} onLeave={go => leaveTo(go)} />
        </Animated.View>
      ) : null}
      {sharing && receipt ? <ReceiptShare receipt={receipt} slip={slip} onDismiss={() => setSharing(false)} /> : null}
    </View>
  );
}

function Menu({ receipt, id, onLeave }: { receipt: Receipt; id: string; onLeave: (go: () => void) => void }) {
  const items = useReceiptMenu(receipt, id).map(it => ({
    ...it,
    onPress: () => onLeave(it.onPress),
  }));
  return <MoreButton items={items} testID="in-place-more" />;
}

/* What comes in under the line: the rows in their groups, the session id
   kept back, and the two things to do with it. Each row arrives a beat after
   the one above it, out of the same blur. */
function Details({
  t,
  receipt,
  name,
  slip,
  session,
  onSession,
  onShare,
  onRepeat,
  state,
}: {
  t: SharedValue<number>;
  receipt: Receipt;
  name: string;
  slip: React.RefObject<View | null>;
  session: boolean;
  onSession: () => void;
  onShare: () => void;
  onRepeat: () => void;
  /** a line that has not settled: what it is, and its next steps in place of Share and Set it up */
  state: StateWords | null;
}) {
  const groups = groupsOf(receipt.fields, name, receipt.kind);
  /* a line that has not settled names its bank from the people the day knows, where the line itself does not carry it */
  if (state?.bank && !groups.some(g => g.some(([l]) => l === 'Bank'))) groups.unshift([['Bank', state.bank]]);
  const copy = async () => {
    toast((await copyText(receipt.session)) ? 'The session id copied. Paste it anywhere.' : 'This build cannot reach the clipboard.');
  };
  const copyToken = async () => {
    toast((await copyText(receipt.token ?? '')) ? 'The token copied. Paste it anywhere.' : 'This build cannot reach the clipboard.');
  };
  let i = 0;
  return (
    <View ref={slip} collapsable={false} style={s.rows} testID="in-place-card">
      {state ? (
        <Arrive t={t} i={i++}>
          <View style={s.state} testID="in-place-state">
            <View style={[s.stateDisc, { backgroundColor: state.tone }]}>
              <Icon name={state.glyph} size={14} colour="#ffffff" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Label>{state.title}</Label>
              <Meta tone="secondary">{state.sub}</Meta>
            </View>
          </View>
          <Dashed />
        </Arrive>
      ) : null}
      {groups.map((group, g) => (
        <View key={g}>
          {g ? (
            <Arrive t={t} i={i++}>
              <Dashed />
            </Arrive>
          ) : null}
          {group.map(([label, value]) => (
            <Arrive key={label} t={t} i={i++}>
              <View style={s.row} testID="in-place-row">
                <Meta tone="secondary">{label}</Meta>
                <Label style={s.value} numberOfLines={1}>
                  {value}
                </Label>
              </View>
            </Arrive>
          ))}
        </View>
      ))}
      {receipt.token ? (
        <Arrive t={t} i={i++}>
          {/* a prepaid bill's token: what was paid for, so always shown, with a button to copy it */}
          <View style={s.row} testID="in-place-token">
            <Meta tone="secondary">Token</Meta>
            <View style={s.sessionValue}>
              <Label style={[s.value, { fontVariant: ['tabular-nums'] }]} numberOfLines={1}>
                {receipt.token}
              </Label>
              <Tap accessibilityRole="button" accessibilityLabel="Copy the token" onPress={() => void copyToken()} scale={0.9} style={s.copy} hitSlop={8}>
                <Icon name="copy" size={14} colour={colour.textSecondary} />
              </Tap>
            </View>
          </View>
        </Arrive>
      ) : null}
      <Arrive t={t} i={i++}>
        {/* the session id: only when it is asked for, since it matters only when the transaction is queried */}
        {session ? (
          <View style={s.row} testID="in-place-session">
            <Meta tone="secondary">{receipt.sessionLabel}</Meta>
            <View style={s.sessionValue}>
              <Label style={[s.value, { fontVariant: ['tabular-nums'] }]} numberOfLines={1}>
                {receipt.session}
              </Label>
              <Tap accessibilityRole="button" accessibilityLabel="Copy the session id" onPress={() => void copy()} scale={0.9} style={s.copy} hitSlop={8}>
                <Icon name="copy" size={14} colour={colour.textSecondary} />
              </Tap>
            </View>
          </View>
        ) : (
          <Tap accessibilityRole="button" accessibilityLabel={`Show the ${receipt.sessionLabel.toLowerCase()}`} onPress={onSession} style={s.row} hitSlop={4}>
            <Meta tone="secondary">{receipt.sessionLabel}</Meta>
            <Label tone="accent">Show it</Label>
          </Tap>
        )}
      </Arrive>
      <Arrive t={t} i={i++}>
        {state ? (
          <View style={s.actions}>
            {state.actions.map(a => (
              <Tap key={a.label} accessibilityRole="button" accessibilityLabel={a.label} onPress={a.onPress} scale={0.96} style={s.action} testID="in-place-next">
                <Icon name={a.glyph} size={16} colour={colour.ink} />
                <Label numberOfLines={1}>{a.label}</Label>
              </Tap>
            ))}
          </View>
        ) : (
          <View style={s.actions}>
            <Tap accessibilityRole="button" accessibilityLabel="Share receipt" onPress={onShare} scale={0.96} style={s.action} testID="in-place-share">
              <Icon name="share" size={16} colour={colour.ink} />
              <Label>Share receipt</Label>
            </Tap>
            <Tap accessibilityRole="button" accessibilityLabel={receipt.nudge.action} onPress={onRepeat} scale={0.96} style={s.action} testID="in-place-repeat">
              <Icon name="history-filled" size={16} colour={colour.ink} />
              <Label>{receipt.nudge.action}</Label>
            </Tap>
          </View>
        )}
      </Arrive>
    </View>
  );
}

type StateWords = { glyph: IconName; tone: string; title: string; sub: string; bank?: string; actions: { label: string; glyph: IconName; onPress: () => void }[] };

/** What a line that has not settled says in place, and its next steps: the
    words the state pages used (transfers/Transfer.tsx), made short. `leave`
    puts the line away first, then goes. */
function stateOf(state: LineState, row: LedgerRow, router: ReturnType<typeof useRouter>, id: string, leave: (go: () => void) => void): StateWords {
  const bank = bankOf(row);
  const first = firstOf(row.name);
  const who = personOf(row);
  const where = who ? `${who.bank} · ${groupAccount(who.number)}` : undefined;
  const page = () => leave(() => router.push(`/transfer/${id}` as never));
  const again =
    (typing = false) =>
    () =>
      leave(() => {
        draft.put({ who: personOf(row), amount: Math.abs(row.amount), amountNote: 'The same as before', typing });
        router.push('/send' as never);
      });
  if (state === 'pending')
    return {
      glyph: 'clock',
      tone: colour.accent,
      title: 'Still on its way',
      bank: where,
      sub: `Sent at ${row.time}, not confirmed by ${bank} yet. Do not send it again: this one is still live.`,
      actions: [
        { label: 'Ask about it', glyph: 'chat', onPress: () => leave(() => askHome(router, 'Ask about this transfer', `${naira(Math.abs(row.amount))} to ${row.name} at ${row.time}`)) },
        { label: 'See the details', glyph: 'chevron', onPress: page },
      ],
    };
  if (state === 'failed')
    return {
      glyph: 'alert',
      tone: colour.alert,
      title: 'It did not go',
      bank: where,
      sub: `${bank} turned it down at ${row.time}. Your balance is exactly what it was.`,
      actions: [
        { label: 'Try again', glyph: 'up', onPress: again() },
        { label: 'See the details', glyph: 'chevron', onPress: page },
      ],
    };
  return {
    glyph: 'back',
    tone: colour.ink,
    title: 'It came back',
    bank: where,
    sub: `Returned at ${row.time}: ${first}'s account could not be credited. Reference ${returnReference(row.id)}.`,
    actions: [
      { label: 'Check the number', glyph: 'search', onPress: again(true) },
      { label: `Try ${first} again`, glyph: 'up', onPress: again() },
    ],
  };
}

/* One row coming in: a beat after the one above it, out of a blur and up from 6 under its place. */
function Arrive({ t, i, children }: { t: SharedValue<number>; i: number; children: React.ReactNode }) {
  const from = Math.min(0.5, 0.18 + i * 0.05);
  const style = useAnimatedStyle(() => {
    const k = Math.max(0, Math.min(1, (t.value - from) / (1 - from)));
    return { opacity: k, transform: [{ translateY: 6 * (1 - k) }], ...blurred((1 - k) * motion.blur) };
  });
  return <Animated.View style={style}>{children}</Animated.View>;
}

/* The rule between groups: dashes, as Fuse draws its own. */
function Dashed() {
  return (
    <View style={s.dashed} testID="in-place-rule">
      {Array.from({ length: 36 }).map((_, k) => (
        <View key={k} style={s.dash} />
      ))}
    </View>
  );
}

/** What a line's own note says, by the kind of line: a transfer's is the
    bank and the number, a card's the place it paid, a top-up's the number it
    went to, a bill's the meter. A saving's says nothing the line does not. */
const NOTE_AS: Partial<Record<Receipt['kind'], string | null>> = { service: 'Paid at', card: 'Paid at', airtime: 'Number', bill: 'Meter', saving: null };
/** A note that says when, read as its own row: Renews 28 September. */
const WHEN_NOTE = /^(Renews|Valid until|Due|Ends) (.+)$/;

/** The facts in their groups. Who and where first, with the bank and the
    account always said: the line names who, so a transfer's To row becomes
    the bank and the number it went to (a card's, the place it paid). Then
    the money, without the total (the amount and the fee say it). Then what
    was written with it. */
export function groupsOf(fields: Field[], name: string, kind?: Receipt['kind']): [string, string][][] {
  const where: [string, string][] = [];
  const money: [string, string][] = [];
  const words: [string, string][] = [];
  for (const [label, value, note] of fields) {
    if (/^Total /.test(label)) continue;
    if (label === 'Amount' || label === 'Fee' || label === 'Balance after') money.push([label, value]);
    else if (label === 'To' || label === 'From') {
      if (value === name) {
        const as = kind ? NOTE_AS[kind] : undefined;
        if (!note || as === null) continue;
        if (as === 'Meter') where.push([as, note.replace(/^Meter /, '')]);
        else where.push([as ?? (label === 'To' ? 'Bank' : 'Their bank'), note]);
      } else where.push([label, note ? `${value} · ${note}` : value]);
    } else {
      const when = note ? WHEN_NOTE.exec(note) : null;
      words.push([label, note && !when ? `${value} · ${note}` : value]);
      if (when) words.push([when[1]!, when[2]!]);
    }
  }
  const rank = (l: string) => ['Bank', 'Their bank', 'Paid at', 'Number', 'Meter', 'To', 'From'].indexOf(l);
  where.sort((a, b) => rank(a[0]) - rank(b[0]));
  money.sort((a, b) => ['Amount', 'Fee', 'Balance after'].indexOf(a[0]) - ['Amount', 'Fee', 'Balance after'].indexOf(b[0]));
  return [where, money, words].filter(g => g.length);
}

const s = StyleSheet.create({
  dots: { position: 'absolute', top: frame.topPad + 2, right: frame.sidePad },
  /* plain on the frost: no card, no border, no shadow — lined up under the line's words */
  rows: { paddingLeft: TEXT_COLUMN, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, height: 30 },
  value: { flexShrink: 1, textAlign: 'right' },
  sessionValue: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  dashed: { flexDirection: 'row', justifyContent: 'space-between', overflow: 'hidden', height: 1, marginVertical: 9 },
  dash: { width: 4, height: 1, backgroundColor: colour.ruleStrong },
  copy: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  /* what a line that has not settled is: a small disc in its colour, the words beside it */
  state: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 4 },
  stateDisc: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  /* a quiet button on the frost: white, with a hairline to stand on */
  action: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: colour.surface,
    borderWidth: 1,
    borderColor: colour.rule,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
