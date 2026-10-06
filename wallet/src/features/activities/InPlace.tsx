/* What a line of Activities shows when it opens in the list (OpenLine.tsx,
   Round 17): the rows that grow in under it, what a line that has not
   settled says instead, the ··· for it, and how long each part takes. A
   receipt right after paying, by its address or from the chat is no longer
   drawn this way: it comes up whole as the receipt sheet (receipts/
   ReceiptSheet.tsx, Round 19, the owner's word).

   Under the line the rest of it comes in as plain rows, the way Fuse's
   Solana widget lays its own out: no card, no border, no shadow; each fact
   a label at the left and its figure at the right, lined up under the
   line's own words, and a dashed rule between the groups. First who and
   where (the bank and the account always said), then the money (the
   amount, the fee, the balance after), then anything written with it and
   the session id, kept back until it is asked for, since it only matters
   when the transaction is being queried. Then Share receipt and Set it up,
   side by side. The ··· for the rest (Ask Beetle about this, Report a
   problem) sits at the top right beside the page's title.

   A line still on its way, one that did not go and one that came back open
   the same way. What it is comes first under the line, with what to know
   about it, and its two things to do are its next steps instead: ask about
   it, or try again, or check the number. Each row arrives a beat after the
   one above it, out of the same blur. */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { Icon, Label, Meta, MoreButton, Tap, blurred, colour, dark as night, motion, toast, type Rect } from '../../design';
import type { IconName } from '../../icons';
import { copyText } from '../receive/clipboard';
import { useReceiptMenu } from '../receipts/use';
import type { Field, Receipt } from '../receipts/receipts';
import type { LedgerRow } from '../home/account';
import { bankOf, firstOf, personOf, returnReference } from '../transfers/states';
import { draft } from '../send/hand';
import { askHome } from '../more/More';
import { groupAccount, naira } from '../../lib/format';

/** How far a finger can move and still have tapped. */
export const TAP_SLOP = 12;
/** The rows line up under the line's own words: past its 40 glyph and the 12 beside it. */
const TEXT_COLUMN = 52;
/** How long it takes to open: a little quicker than a page. */
export const OPEN_MS = motion.enter - 40;
/** Closing: what came in under the line goes first, while the frost stays whole; then the frost clears. */
export const ROWS_OUT = 140;
export const FROST_OUT = motion.leave - 60;

/** A line that has not settled: still on its way, did not go, or came back. */
export type LineState = 'pending' | 'failed' | 'reversed';

/** A line's status glyph colour, the list's and the line's drawn again over the frost: on its way in the accent, did not go in red, came back and settled in ink. */
export const STATUS_TONE: Record<LineState | 'done', string> = { pending: colour.accent, failed: colour.alert, reversed: colour.ink, done: colour.ink };

/** `at` is where the line was, `head` where the page's title row was, each in the window, when it was opened. */
export type Opened = { id: string; glyph: IconName; name: string; detail: string; amount: string; at: Rect | null; head?: Rect | null; state?: LineState };

export function Menu({ receipt, id, onLeave }: { receipt: Receipt; id: string; onLeave: (go: () => void) => void }) {
  const items = useReceiptMenu(receipt, id).map(it => ({
    ...it,
    onPress: () => onLeave(it.onPress),
  }));
  return <MoreButton items={items} testID="in-place-more" />;
}

/* What comes in under the line: the rows in their groups, the session id
   kept back, and the two things to do with it. Each row arrives a beat after
   the one above it, out of the same blur. */
export function Details({
  t,
  shown,
  receipt,
  name,
  slip,
  session,
  onSession,
  onShare,
  onRepeat,
  state,
  dark = false,
  indent = TEXT_COLUMN,
  second,
  dated = false,
}: {
  t: SharedValue<number>;
  shown: SharedValue<number>;
  receipt: Receipt;
  name: string;
  slip: React.RefObject<View | null>;
  session: boolean;
  onSession: () => void;
  onShare: () => void;
  onRepeat: () => void;
  /** a line that has not settled: what it is, and its next steps in place of Share and Set it up */
  state: StateWords | null;
  /** on the chat's dark: the same rows in its inks (a receipt opened in the chat, Round 20) */
  dark?: boolean;
  /** how far in the rows start: under the line's words on Activities, the card's own edge in the chat */
  indent?: number;
  /** the second thing to do in place of Set it up: See in Activities, in the chat */
  second?: { label: string; glyph: IconName; onPress: () => void };
  /** say the day and the time as a row of its own: the chat's card has only the time, Activities has the day over the line */
  dated?: boolean;
}) {
  const d = dark ? DARK : null;
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
    <View ref={slip} collapsable={false} style={[s.rows, { paddingLeft: indent }]} testID="in-place-card">
      {state ? (
        <Arrive t={t} shown={shown} i={i++}>
          <View style={s.state} testID="in-place-state">
            <View style={[s.stateDisc, { backgroundColor: state.tone }]}>
              <Icon name={state.glyph} size={14} colour="#ffffff" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Label style={d?.value}>{state.title}</Label>
              <Meta tone="secondary" style={d?.label}>
                {state.sub}
              </Meta>
            </View>
          </View>
          <Dashed dark={dark} />
        </Arrive>
      ) : null}
      {groups.map((group, g) => (
        <View key={g}>
          {g ? (
            <Arrive t={t} shown={shown} i={i++}>
              <Dashed dark={dark} />
            </Arrive>
          ) : null}
          {group.map(([label, value]) => (
            <Arrive key={label} t={t} shown={shown} i={i++}>
              <View style={s.row} testID="in-place-row">
                <Meta tone="secondary" style={[s.label, d?.label]}>
                  {label}
                </Meta>
                <Label style={[s.value, d?.value]} numberOfLines={1}>
                  {value}
                </Label>
              </View>
            </Arrive>
          ))}
        </View>
      ))}
      {dated ? (
        <Arrive t={t} shown={shown} i={i++}>
          <View style={s.row} testID="in-place-when">
            <Meta tone="secondary" style={[s.label, d?.label]}>
              When
            </Meta>
            <Label style={[s.value, d?.value]} numberOfLines={1}>
              {receipt.when}
            </Label>
          </View>
        </Arrive>
      ) : null}
      {receipt.token ? (
        <Arrive t={t} shown={shown} i={i++}>
          {/* a prepaid bill's token: what was paid for, so always shown, with a button to copy it */}
          <View style={s.row} testID="in-place-token">
            <Meta tone="secondary" style={[s.label, d?.label]}>
              Token
            </Meta>
            <View style={s.sessionValue}>
              <Label style={[s.value, { fontVariant: ['tabular-nums'] }, d?.value]} numberOfLines={1}>
                {receipt.token}
              </Label>
              <Tap accessibilityRole="button" accessibilityLabel="Copy the token" onPress={() => void copyToken()} scale={0.9} style={s.copy} hitSlop={8}>
                <Icon name="copy" size={14} colour={d ? d.soft : colour.textSecondary} />
              </Tap>
            </View>
          </View>
        </Arrive>
      ) : null}
      <Arrive t={t} shown={shown} i={i++}>
        {/* the session id: only when it is asked for, since it matters only when the transaction is queried */}
        {session ? (
          <View style={s.row} testID="in-place-session">
            <Meta tone="secondary" style={[s.label, d?.label]}>
              {receipt.sessionLabel}
            </Meta>
            <View style={s.sessionValue}>
              <Label style={[s.value, { fontVariant: ['tabular-nums'] }, d?.value]} numberOfLines={1}>
                {receipt.session}
              </Label>
              <Tap accessibilityRole="button" accessibilityLabel="Copy the session id" onPress={() => void copy()} scale={0.9} style={s.copy} hitSlop={8}>
                <Icon name="copy" size={14} colour={d ? d.soft : colour.textSecondary} />
              </Tap>
            </View>
          </View>
        ) : (
          <Tap accessibilityRole="button" accessibilityLabel={`Show the ${receipt.sessionLabel.toLowerCase()}`} onPress={onSession} style={s.row} hitSlop={4}>
            <Meta tone="secondary" style={[s.label, d?.label]}>
              {receipt.sessionLabel}
            </Meta>
            <Label tone="accent" style={d?.link}>
              Show it
            </Label>
          </Tap>
        )}
      </Arrive>
      <Arrive t={t} shown={shown} i={i++}>
        {state ? (
          <View style={s.actions}>
            {state.actions.map(a => (
              <Tap key={a.label} accessibilityRole="button" accessibilityLabel={a.label} onPress={a.onPress} scale={0.96} style={[s.action, d?.action]} testID="in-place-next">
                <Icon name={a.glyph} size={16} colour={d ? d.ink : colour.ink} />
                <Label numberOfLines={1} style={d?.value}>
                  {a.label}
                </Label>
              </Tap>
            ))}
          </View>
        ) : (
          <View style={s.actions}>
            <Tap accessibilityRole="button" accessibilityLabel="Share receipt" onPress={onShare} scale={0.96} style={[s.action, d?.action]} testID="in-place-share">
              <Icon name="share" size={16} colour={d ? d.ink : colour.ink} />
              <Label style={d?.value}>Share receipt</Label>
            </Tap>
            {second ? (
              <Tap accessibilityRole="button" accessibilityLabel={second.label} onPress={second.onPress} scale={0.96} style={[s.action, d?.action]} testID="in-place-second">
                <Icon name={second.glyph} size={16} colour={d ? d.ink : colour.ink} />
                <Label numberOfLines={1} style={d?.value}>
                  {second.label}
                </Label>
              </Tap>
            ) : (
              <Tap accessibilityRole="button" accessibilityLabel={receipt.nudge.action} onPress={onRepeat} scale={0.96} style={[s.action, d?.action]} testID="in-place-repeat">
                <Icon name="history-filled" size={16} colour={d ? d.ink : colour.ink} />
                <Label style={d?.value}>{receipt.nudge.action}</Label>
              </Tap>
            )}
          </View>
        )}
      </Arrive>
    </View>
  );
}

export type StateWords = { glyph: IconName; tone: string; title: string; sub: string; bank?: string; actions: { label: string; glyph: IconName; onPress: () => void }[] };

/** What a line that has not settled says in place, and its next steps: the
    words the state pages used (transfers/Transfer.tsx), made short. `leave`
    puts the line away first, then goes. */
export function stateOf(state: LineState, row: LedgerRow, router: ReturnType<typeof useRouter>, id: string, leave: (go: () => void) => void): StateWords {
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

/* One row coming in: a beat after the one above it, out of a blur and up from 6 under its place. On the way
   out every row goes together, the same way back, before the frost under it clears. */
function Arrive({ t, shown, i, children }: { t: SharedValue<number>; shown: SharedValue<number>; i: number; children: React.ReactNode }) {
  const from = Math.min(0.5, 0.18 + i * 0.05);
  const style = useAnimatedStyle(() => {
    const k = Math.max(0, Math.min(1, (t.value - from) / (1 - from))) * shown.value;
    return { opacity: k, transform: [{ translateY: 6 * (1 - k) }], ...blurred((1 - k) * motion.blur) };
  });
  return <Animated.View style={style}>{children}</Animated.View>;
}

/* The rule between groups: dashes, as Fuse draws its own. */
function Dashed({ dark = false }: { dark?: boolean }) {
  return (
    <View style={s.dashed} testID="in-place-rule">
      {Array.from({ length: 36 }).map((_, k) => (
        <View key={k} style={[s.dash, dark ? DARK.dash : null]} />
      ))}
    </View>
  );
}

/** The rows' inks on the chat's dark (Round 20): the labels in its grey, the figures and the buttons' words in white,
    Show it in the accent lifted for the dark, the dashes and the buttons in its raised grey with no hairline. */
const DARK = {
  label: { color: night.label },
  value: { color: '#ffffff' },
  link: { color: night.link },
  dash: { backgroundColor: night.edgeStrong },
  action: { backgroundColor: night.edgeStrong, borderWidth: 0 },
  ink: '#ffffff',
  soft: night.label,
};

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
  /* plain on the frost: no card, no border, no shadow — lined up under the line's words */
  rows: { paddingLeft: TEXT_COLUMN, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, height: 30 },
  /* a label keeps its words on one line; a long figure beside it is cut short instead */
  label: { flexShrink: 0 },
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
