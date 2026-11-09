/* The two cards of Can I afford it (Round 43), drawn on the chat's dark the
   way the loan and save cards are.

   - AffordCard: the answer, held to the month. The verdict in its pill, then
     each thing set aside with when it leaves and whether what is there now or
     the next pay covers it, and what is free after the purchase, a day.
   - ChooseCard: a question about the month, answered by a tap, never typed.
     The likely answer comes first, with why (what sign-up or setting up
     said). One option goes at once; where several can be ticked, Continue
     sends them. Answered, it keeps what was picked, dimmed. */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Caption, Icon, Label, Meta, Row, Tap, colour, dark, font } from '../../design';
import { naira } from '../../lib/format';
import type { AffordCheck, Question } from '../afford/plan';

const VERDICT = {
  yes: { pill: 'You can', dot: '#34c759' },
  tight: { pill: 'Tight', dot: '#ffb340' },
  no: { pill: 'Not now', dot: '#ff6b5a' },
} as const;

export function AffordCard({ check }: { check: AffordCheck }) {
  const v = VERDICT[check.verdict];
  const price = check.usd ? `$${check.usd.toLocaleString('en-NG')} · ${naira(check.cost)}` : naira(check.cost);
  return (
    <View style={s.panel} testID="afford-card" accessibilityLabel={`${v.pill}: ${check.what} for ${price}`}>
      <View style={s.head}>
        <View style={s.icon}>
          <Icon name="chart" size={16} colour={dark.paper} />
        </View>
        <Label style={{ flex: 1, color: dark.paper }} numberOfLines={1}>{`${capital(check.what)} · ${price}`}</Label>
        <View style={s.pill} testID="afford-verdict">
          <View style={[s.dot, { backgroundColor: v.dot }]} />
          <Caption style={{ color: dark.pillText, ...font('600') }}>{v.pill}</Caption>
        </View>
      </View>
      <View style={s.body}>
        <Meta style={{ color: dark.label, paddingBottom: 4 }}>{`Set aside before your pay on ${check.payday}`}</Meta>
        {check.rows.map(r => (
          <View key={r.label} style={s.line}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Icon name="check" size={14} colour={r.from === 'now' ? '#34c759' : dark.textSoft} />
              <View style={{ flex: 1 }}>
                <Label style={{ color: dark.paper }} numberOfLines={1}>
                  {r.label}
                </Label>
                <Caption style={{ color: dark.textSoft }}>{r.from === 'now' ? `${r.when}, covered now` : `${r.when}, from your pay`}</Caption>
              </View>
            </View>
            <Label style={{ color: r.from === 'now' ? dark.paper : dark.textSoft }}>{naira(r.amount)}</Label>
          </View>
        ))}
        <View style={s.rule} />
        <Totals label="Free to spend now" value={naira(check.free)} />
        <Totals label={`After ${check.what === 'it' ? 'this' : check.what}`} value={check.after < 0 ? `−${naira(-check.after)}` : naira(check.after)} strong />
        {check.after >= 0 ? <Totals label={`A day until ${check.payday}`} value={naira(check.perDay)} /> : <Totals label="Fits easily today" value={naira(check.comfortable)} />}
      </View>
    </View>
  );
}

function Totals({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={s.line}>
      <Meta style={{ color: dark.label }}>{label}</Meta>
      {strong ? <Row style={{ color: dark.paper }}>{value}</Row> : <Label style={{ color: dark.paper }}>{value}</Label>}
    </View>
  );
}

export function ChooseCard({
  question,
  step,
  of,
  state,
  picked,
  onPick,
}: {
  question: Question;
  step: number;
  of: number;
  state: 'open' | 'done';
  picked?: string[];
  onPick: (ids: string[]) => void;
}) {
  const open = state === 'open';
  /* several at once: the likely ones ticked to start with, so a tap on Continue is often all it takes */
  const [ticked, setTicked] = useState<string[]>(() => picked ?? (question.multi ? question.options.filter(o => o.likely).map(o => o.id) : []));
  const chosen = open ? ticked : (picked ?? []);
  return (
    <View style={s.panel} testID="choose-card">
      <View style={s.head}>
        <View style={s.icon}>
          <Icon name="list" size={16} colour={dark.paper} />
        </View>
        <Label style={{ flex: 1, color: dark.paper }}>Your month</Label>
        <View style={s.pill}>
          <Caption style={{ color: dark.pillText, ...font('600') }}>{open ? `${step} of ${of}` : 'Answered'}</Caption>
        </View>
      </View>
      <View style={[s.body, !open && { opacity: 0.72 }]} pointerEvents={open ? 'auto' : 'none'}>
        <Row style={{ color: dark.paper, paddingBottom: 8 }}>{question.title}</Row>
        <View style={{ gap: 6 }}>
          {question.options.map(o => {
            const on = chosen.includes(o.id);
            return (
              <Tap
                key={o.id}
                accessibilityRole={question.multi ? 'checkbox' : 'radio'}
                accessibilityLabel={o.label}
                accessibilityState={question.multi ? { checked: on } : { selected: on, checked: on }}
                aria-checked={on}
                onPress={() => {
                  if (!open) return;
                  if (question.multi) setTicked(t => (t.includes(o.id) ? t.filter(x => x !== o.id) : [...t, o.id]));
                  else {
                    setTicked([o.id]);
                    onPick([o.id]);
                  }
                }}
                style={[s.option, on && s.optionOn]}
                testID={`choose-${question.id}-${o.id}`}
              >
                <View style={[question.multi ? s.box : s.radio, on && s.markOn]}>{on ? <Icon name="check" size={12} colour={colour.ink} /> : null}</View>
                <View style={{ flex: 1 }}>
                  <Label style={{ color: dark.paper }}>{o.label}</Label>
                  {o.sub ? <Caption style={{ color: o.likely ? dark.link : dark.textSoft }}>{o.sub}</Caption> : null}
                </View>
              </Tap>
            );
          })}
        </View>
      </View>
      {question.multi && open ? (
        <View style={{ paddingHorizontal: 12 }}>
          <Tap accessibilityRole="button" accessibilityLabel="Continue" onPress={() => onPick(ticked)} style={[s.action, s.actionReady]} testID="choose-continue">
            <Row style={{ color: colour.ink }}>{ticked.length ? 'Continue' : 'None of these'}</Row>
          </Tap>
        </View>
      ) : null}
    </View>
  );
}

const capital = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

const s = StyleSheet.create({
  panel: { backgroundColor: dark.panel, borderWidth: 1, borderColor: dark.edge, borderRadius: 24, overflow: 'hidden', paddingBottom: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 12, backgroundColor: dark.edge, borderBottomWidth: 1, borderBottomColor: dark.edgeStrong },
  icon: { width: 32, height: 32, borderRadius: 12, backgroundColor: dark.edgeStrong, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 24, paddingHorizontal: 8, borderRadius: 12, backgroundColor: dark.edge, borderWidth: 1, borderColor: dark.edgeStrong },
  dot: { width: 6, height: 6, borderRadius: 3 },
  body: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6 },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 40 },
  rule: { height: 1, backgroundColor: dark.edgeStrong, marginVertical: 6 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: dark.edge, borderWidth: 1, borderColor: dark.edge },
  optionOn: { borderColor: dark.paper },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: dark.textSoft, alignItems: 'center', justifyContent: 'center' },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: dark.textSoft, alignItems: 'center', justifyContent: 'center' },
  markOn: { backgroundColor: dark.paper, borderColor: dark.paper },
  action: { height: 52, borderRadius: 26, marginTop: 10, alignItems: 'center', justifyContent: 'center' },
  actionReady: { backgroundColor: dark.paper },
});
