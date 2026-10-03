/* A goal started, or changed, on one sheet. Started, it comes filled: the
   next thing people save for that is not a goal already (Rent, then
   Emergency fund, School fees…), its usual figure on the amount picker and
   a date to match, so Start saving is the third tap from home; or what the
   words named, where they said what it is for. The ideas
   sit as pills over the name, which is a field to type over; what it aims
   for is the picker (a tap on the figure types any amount); by when is a
   quiet row that opens its four in place. Changed, it is the same sheet
   with the goal's own name, figure and date, and Save changes. */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { AmountPicker, Button, Caption, Chevron, Head, Icon, Label, Meta, Sheet, Tap, colour } from '../../design';
import { naira } from '../../lib/format';
import { IDEAS, SPANS, dayWords, dueIn, nextIdea, spanWords, type Goal, type Idea, type Span } from './goals';

export type GoalDraft = { name: string; target: number; due: string };

export function GoalSheet({
  goal,
  goals,
  named,
  onDone,
  onDismiss,
}: {
  /** the goal being changed; none to start one */
  goal?: Goal;
  goals: Goal[];
  /** what the words said it is for ("save up for a car") */
  named?: string;
  onDone: (d: GoalDraft) => void;
  onDismiss: () => void;
}) {
  const editing = !!goal;
  const idea = named ? IDEAS.find(i => i.name.toLowerCase() === named.toLowerCase()) : undefined;
  const first: Idea = named ? (idea ?? { name: named, target: 250_000, months: 6 }) : nextIdea(goals);
  const [name, setName] = useState(goal?.name ?? first.name);
  const [target, setTarget] = useState(goal?.target ?? first.target);
  /* a span picked here, or the goal's own day while none is */
  const [span, setSpan] = useState<Span | null>(editing ? null : first.months);
  const [choosing, setChoosing] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const due = span ? dueIn(span) : (goal?.due ?? dueIn(6));
  const ideas = IDEAS.filter(i => !goals.some(g => g.name.toLowerCase() === i.name.toLowerCase()));
  const take = (i: Idea) => {
    setName(i.name);
    setTarget(i.target);
    setSpan(i.months);
  };
  const clean = name.trim();
  const ok = !!clean && target > 0;
  return (
    <Sheet leaving={leaving} onGone={() => onDone({ name: clean, target, due })} onDismiss={onDismiss} testID="goal-sheet">
      <Head>{editing ? `Edit ${goal.name}` : 'A new goal'}</Head>
      <Meta tone="secondary" style={{ marginTop: 8 }}>
        {editing ? 'What is in it stays where it is.' : 'Filled in for you. Change any of it, or start it as it is.'}
      </Meta>
      {!editing && ideas.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: 8 }}
          style={{ marginTop: 16, marginHorizontal: -20 }}
          testID="goal-ideas"
        >
          <View style={{ width: 12 }} />
          {ideas.map(i => {
            const on = i.name === name;
            return (
              <Tap
                key={i.name}
                accessibilityRole="button"
                accessibilityLabel={i.name}
                accessibilityState={{ selected: on }}
                onPress={() => take(i)}
                scale={0.94}
                style={[s.idea, on && s.ideaOn]}
                testID="goal-idea"
              >
                <Label tone={on ? 'inverse' : 'ink'}>{i.name}</Label>
              </Tap>
            );
          })}
          <View style={{ width: 12 }} />
        </ScrollView>
      ) : null}
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="What it is for"
        placeholderTextColor={colour.textTertiary}
        maxLength={24}
        returnKeyType="done"
        style={[s.input, { marginTop: editing ? 20 : 12 }]}
        accessibilityLabel="Goal name"
        testID="goal-name"
      />
      <View style={{ marginTop: 20 }}>
        <AmountPicker value={target} onChange={v => setTarget(Math.max(0, v))} note="What you are aiming for" chips={[250_000, 500_000, 1_000_000]} testID="goal-target" />
      </View>
      {/* by when: a quiet row, its four opening in place */}
      <Tap accessibilityRole="button" accessibilityLabel={`By ${dayWords(due)}`} accessibilityState={{ expanded: choosing }} onPress={() => setChoosing(c => !c)} style={s.when} testID="goal-when">
        <Meta tone="secondary">By when</Meta>
        <View style={s.whenValue}>
          <Label>{span ? `${spanWords(span)} · ${dayWords(due)}` : dayWords(due)}</Label>
          <Chevron dir={choosing ? 'up' : 'down'} size={14} colour={colour.textTertiary} />
        </View>
      </Tap>
      {choosing ? (
        <View style={s.spans} testID="goal-spans">
          {SPANS.map(m => (
            <Tap
              key={m}
              accessibilityRole="button"
              accessibilityLabel={spanWords(m)}
              accessibilityState={{ selected: m === span }}
              onPress={() => {
                setSpan(m);
                setChoosing(false);
              }}
              style={s.span}
            >
              <Label style={{ flex: 1 }}>{spanWords(m)}</Label>
              <Caption tone="secondary">{dayWords(dueIn(m))}</Caption>
              {m === span ? <Icon name="check" size={14} colour={colour.ink} /> : <View style={{ width: 14 }} />}
            </Tap>
          ))}
        </View>
      ) : null}
      <Button
        label={!clean ? 'Name it first' : !target ? 'Pick how much' : editing ? 'Save changes' : `Start saving for ${clean}`}
        disabled={!ok}
        onPress={() => setLeaving(true)}
        style={{ marginTop: 16 }}
      />
      {!editing ? (
        <Caption tone="tertiary" style={{ textAlign: 'center', marginTop: 10 }}>
          {`${naira(target)} by ${dayWords(due)}. Nothing moves until you add money.`}
        </Caption>
      ) : null}
    </Sheet>
  );
}

const s = StyleSheet.create({
  idea: { height: 36, borderRadius: 18, paddingHorizontal: 14, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  ideaOn: { backgroundColor: colour.ink },
  input: { height: 48, borderRadius: 16, backgroundColor: colour.surface2, paddingHorizontal: 16, fontSize: 16, color: colour.ink, outlineWidth: 0 },
  when: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44, marginTop: 8 },
  whenValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  spans: { borderRadius: 16, backgroundColor: colour.surface2, paddingHorizontal: 12 },
  span: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, borderRadius: 10 },
});
