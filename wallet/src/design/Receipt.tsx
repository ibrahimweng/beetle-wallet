/* A receipt, as the frames draw one: the tick on its green disc (the brand's
   logo coin, turning once, since Round 26: a transaction confirmed), the amount
   and a line under it, the status chip; then the slip, a white card with a
   hairline, in two columns of label over value, a line across for what was
   written, a dashed rule before the money and before the reference, and the
   reference with a button to copy it. Labels are 12 on 16; who and what are
   16 on 24; money is 14 on 20, which is the frame's own distinction.
   Measured off the All done frame: the columns 147.5 wide with 16 between,
   4 from a label to its value, 20 between blocks and either side of a rule.

   Round 37, the owner's word: the coin is the middle of it, bigger, turning
   on a loop, with the amount and the line centred under it and the status
   under them; on the slip who and where (From, To, what was written) stay,
   and the money and the reference fold away under Show details. */
import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from './Icon';
import { CoinHero } from './Coin';
import { Caption, Display, Label, Meta, Row } from './text';
import { Arrive } from './journey';
import { Card } from './Screen';
import { colour, space } from './tokens';
import { Tap } from './motion';
import type { IconName } from '../icons';

export type ReceiptField = [label: string, value: string, note?: string];

/** A receipt for a line that has not settled (on its way, did not go, came back): its own glyph on the disc, and its
    colour on the disc and the chip, where a settled one has the tick on green (Round 19: a receipt sheet can open on
    any line). Six-digit colours only: the chip's ground is the colour, faint. */
export type ReceiptMark = { glyph: IconName; tone: string };

/** A label across the whole slip rather than half of it. */
const WIDE = ['Narration', 'What', 'For', 'They wrote'];
/** The perforation goes before these. */
const RULE_BEFORE = ['Amount'];
/** The money block: pairs of these are 42 tall, whatever their values say. */
const MONEY = ['Amount', 'Fee', 'Total charged', 'Total credited', 'Balance after'];
const money = (v: string) => v.startsWith('₦');

/* The frames rule a receipt with a dashed line: the perforation on a slip. */
export function Rule() {
  return <View style={s.rule} />;
}

/** The status chip: a dot and a word on the green tint, or on the faint of a line's own colour. */
export function Pill({ children, tone, testID }: { children: string; tone?: string; testID?: string }) {
  return (
    <View style={[s.pill, tone ? { backgroundColor: `${tone}1f` } : null]} testID={testID}>
      <View style={[s.dot, tone ? { backgroundColor: tone } : null]} />
      <Caption style={{ color: tone ?? colour.goodText }}>{children}</Caption>
    </View>
  );
}

function Cell({ field, wide }: { field: ReceiptField; wide: boolean }) {
  const [label, value, note] = field;
  return (
    <View style={[s.cell, wide && s.wide]}>
      <Caption tone="secondary">{label}</Caption>
      {money(value) ? <Label>{value}</Label> : <Row>{value}</Row>}
      {/* a money field's note — the fee's, even where the fee is Free — goes under the pair, not in the cell */}
      {note && !MONEY.includes(label) ? <Caption tone="tertiary">{note}</Caption> : null}
    </View>
  );
}

export function Receipt({
  amount,
  line,
  status = 'Successful',
  fields,
  session,
  sessionLabel = 'Session ID',
  good = false,
  onCopy,
  head,
  tail = 0,
  mark,
  open = true,
  onToggle,
}: {
  amount: string;
  line: string;
  status?: string;
  fields: ReceiptField[];
  session: string;
  sessionLabel?: string;
  /** money in: the frames set the figure itself in green */
  good?: boolean;
  onCopy?: () => void;
  /** what sits between the amount and the slip, on a bill: the token */
  head?: ReactNode;
  /** room the frame leaves under the reference, or takes away: the data
      slip leaves a line of it, the money-in slip runs the id to its edge */
  tail?: number;
  /** a line that has not settled: its glyph and colour in place of the tick on green */
  mark?: ReceiptMark;
  /** the money and the reference showing; with `onToggle`, Show details opens them */
  open?: boolean;
  onToggle?: () => void;
}) {
  /* The frames box each block a little shorter than its words and set 20
     between the boxes, so the blocks here take the frames' heights and let
     their last line run over: a pair of who and where 60, a line across 42,
     one with a note under it 60, a pair of money 42. A note under money sits
     8 below it. */
  const blocks: { key: string; el: ReactNode; height?: number; after: number }[] = [];
  let pair: ReceiptField[] = [];
  let notes: string[] = [];
  const flush = (key: string) => {
    if (!pair.length) return;
    const identity = !pair.every(f => MONEY.includes(f[0]));
    const [a, b] = pair;
    blocks.push({
      key,
      height: identity ? 60 : 42,
      after: notes.length ? 8 : 20,
      el: (
        <View style={s.pair}>
          <Cell field={a!} wide={false} />
          {b ? <Cell field={b} wide={false} /> : <View style={s.cell} />}
        </View>
      ),
    });
    for (const [i, n] of notes.entries())
      blocks.push({
        key: `${key}n${i}`,
        after: 20,
        el: (
          <Caption tone="tertiary" style={{ height: 16 }}>
            {n}
          </Caption>
        ),
      });
    pair = [];
    notes = [];
  };
  fields.forEach((f, i) => {
    if (RULE_BEFORE.includes(f[0])) {
      flush(`p${i}`);
      blocks.push({ key: `r${i}`, after: 20, el: <Rule /> });
    }
    if (WIDE.includes(f[0])) {
      flush(`p${i}`);
      blocks.push({ key: `w${i}`, height: f[2] ? 60 : 42, after: 20, el: <Cell field={f} wide /> });
      return;
    }
    pair.push(f);
    if (f[2] && MONEY.includes(f[0])) notes.push(f[2]);
    if (pair.length === 2) flush(`p${i}`);
  });
  flush('last');
  blocks.push({ key: 'rule', after: 20, el: <Rule /> });

  /* who and where stay (From, To, and what was written); from the first perforation on, the money and the reference fold away */
  const cut = blocks.findIndex(b => b.key.startsWith('r') || b.key === 'rule');
  const kept = cut < 0 ? blocks : blocks.slice(0, cut);
  const folded = cut < 0 ? [] : blocks.slice(cut);
  const drawn = (list: typeof blocks, first: boolean) =>
    list.map((b, i) => (
      /* the frame's height at the least: a value that wraps (a narrower slip, in the sheet) takes the room it needs */
      <View key={b.key} style={{ marginTop: i ? list[i - 1]!.after : first ? 0 : 20, minHeight: b.height }}>
        {b.el}
      </View>
    ));
  return (
    <>
      {/* the coin in the middle, the amount and the line under it, the status under them */}
      <View style={s.hero} testID="receipt-top">
        {mark ? (
          <View style={[s.disc, { backgroundColor: mark.tone }]} testID="receipt-icon">
            <Icon name={mark.glyph} size={36} colour={colour.textInverse} />
          </View>
        ) : (
          <View style={s.coin} testID="receipt-icon">
            <CoinHero size={HERO} />
          </View>
        )}
        <Arrive testID="amount">
          <Display tone={good ? 'good' : 'ink'} style={{ textAlign: 'center' }}>
            {amount}
          </Display>
        </Arrive>
        <View style={s.lineRow}>
          <Meta tone="secondary" style={{ textAlign: 'center' }}>
            {line}
          </Meta>
          <Pill tone={mark?.tone} testID="receipt-status">
            {status}
          </Pill>
        </View>
      </View>
      {head}
      <Card outline style={[s.slip, { paddingBottom: open ? 20 + tail : 4 }]} testID="receipt">
        {drawn(kept, true)}
        {open ? (
          <>
            {drawn(folded, false)}
            {/* the frame sets the copy button 2 under the row's top, beside the label */}
            <View style={[s.session, { marginTop: 20 }]}>
              <View style={{ flex: 1, gap: 4 }}>
                <Caption tone="secondary">{sessionLabel}</Caption>
                <Label style={{ maxWidth: 241 }}>{session}</Label>
              </View>
              <Tap accessibilityRole="button" accessibilityLabel={`Copy the ${sessionLabel.toLowerCase()}`} onPress={onCopy} style={[s.copy, { marginTop: 2 }]} testID="receipt-copy">
                <Icon name="copy" size={16} colour={colour.textSecondary} />
              </Tap>
            </View>
          </>
        ) : null}
        {onToggle ? (
          <Tap
            accessibilityRole="button"
            accessibilityLabel={open ? 'Hide details' : 'Show details'}
            accessibilityState={{ expanded: open }}
            onPress={onToggle}
            style={[s.toggle, open ? s.toggleOpen : null]}
            testID="receipt-toggle"
          >
            <Label>{open ? 'Hide details' : 'Show details'}</Label>
            <View style={{ transform: [{ rotate: open ? '-90deg' : '90deg' }] }}>
              <Icon name="chevron" size={14} colour={colour.ink} />
            </View>
          </Tap>
        ) : null}
      </Card>
    </>
  );
}

/** The coin's square at the middle of a receipt. */
const HERO = 96;

const s = StyleSheet.create({
  hero: { alignItems: 'center', gap: 6 },
  disc: { width: 84, height: 84, borderRadius: 42, backgroundColor: colour.good, alignItems: 'center', justifyContent: 'center', marginVertical: 14 },
  coin: { width: HERO, height: HERO },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 26, paddingLeft: 10, paddingRight: 10, borderRadius: 13, backgroundColor: colour.goodTint },
  lineRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: 8, rowGap: 6, marginTop: -4 },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, marginTop: 2, borderTopWidth: 1, borderTopColor: colour.rule, marginHorizontal: -21 },
  toggleOpen: { marginTop: 16, marginBottom: -16 - 4 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colour.good },
  slip: { gap: 0, paddingTop: 16, paddingHorizontal: 21 },
  pair: { flexDirection: 'row', gap: 16 },
  cell: { flex: 1, gap: 4 },
  wide: { flex: undefined, width: '100%' },
  rule: { width: '100%', borderTopWidth: 1, borderStyle: 'dashed', borderColor: colour.rule },
  session: { flexDirection: 'row', alignItems: 'flex-start', gap: space.s4 },
  copy: { width: 32, height: 32, borderRadius: 16, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
});
