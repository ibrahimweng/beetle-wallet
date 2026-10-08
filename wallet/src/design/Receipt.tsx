/* A receipt, as the frames draw one: the tick on its green disc (the brand's
   clay coin, turning once, since Round 26: a transaction confirmed), the amount
   and a line under it, the status chip; then the slip, a white card with a
   hairline, in two columns of label over value, a line across for what was
   written, a dashed rule before the money and before the reference, and the
   reference with a button to copy it. Labels are 12 on 16; who and what are
   16 on 24; money is 14 on 20, which is the frame's own distinction.
   Measured off the All done frame: the columns 147.5 wide with 16 between,
   4 from a label to its value, 20 between blocks and either side of a rule. */
import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from './Icon';
import { Coin } from './Coin';
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

  return (
    <>
      {/* the frame's row: the words at its top, the tick 8 down, the chip centred */}
      <View style={s.top} testID="receipt-top">
        {mark ? (
          <View style={[s.disc, { backgroundColor: mark.tone }]} testID="receipt-icon">
            <Icon name={mark.glyph} size={24} colour={colour.textInverse} />
          </View>
        ) : (
          /* settled: the coin in the disc's place and at its size (larger, the sheet's edge cut it), turning once as the receipt arrives */
          <View style={s.coin} testID="receipt-icon">
            <Coin size={52} delay={220} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Arrive testID="amount">
            <Display tone={good ? 'good' : 'ink'}>{amount}</Display>
          </Arrive>
          <Meta tone="secondary">{line}</Meta>
        </View>
        <Pill tone={mark?.tone} testID="receipt-status">
          {status}
        </Pill>
      </View>
      {head}
      <Card outline style={[s.slip, { paddingBottom: 20 + tail }]} testID="receipt">
        {blocks.map((b, i) => (
          /* the frame's height at the least: a value that wraps (a narrower slip, in the sheet) takes the room it needs */
          <View key={b.key} style={{ marginTop: i ? blocks[i - 1]!.after : 0, minHeight: b.height }}>
            {b.el}
          </View>
        ))}
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
      </Card>
    </>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: space.s4, minHeight: 67 },
  disc: { width: 52, height: 52, borderRadius: 26, backgroundColor: colour.good, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  coin: { width: 52, height: 52, marginTop: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 30, marginTop: 18, paddingLeft: 12, paddingRight: 12, borderRadius: 15, backgroundColor: colour.goodTint },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colour.good },
  slip: { gap: 0, paddingTop: 20, paddingHorizontal: 21 },
  pair: { flexDirection: 'row', gap: 16 },
  cell: { flex: 1, gap: 4 },
  wide: { flex: undefined, width: '100%' },
  rule: { width: '100%', borderTopWidth: 1, borderStyle: 'dashed', borderColor: colour.rule },
  session: { flexDirection: 'row', alignItems: 'flex-start', gap: space.s4 },
  copy: { width: 32, height: 32, borderRadius: 16, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
});
