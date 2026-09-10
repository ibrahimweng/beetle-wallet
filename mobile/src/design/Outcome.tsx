/* The shape every outcome screen in Act One is drawn on. Read off the frames:
   a 56 status glyph, the amount at 32 bold, a 14 regular line under it, facts
   as 16 regular against 16 semibold 56 apart, a banner with a 24 glyph, the
   agent's line beside a 32 mark, and choices as a 20 glyph with a 16 semibold
   title over a 14 regular line, 72 apart, with a chevron on the right. */
import React, { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from './Icon';
import { Bubble } from './Bubble';
import { Body, Caption, Display, Label, Meta, Row } from './text';
import { IconName } from '../icons';
import { colour, radius, space } from './tokens';
import { Tap } from './motion';

export function BigStatus({
  glyph,
  amount,
  line,
  tone,
}: {
  glyph: IconName;
  amount: string;
  line: string;
  tone?: string;
}) {
  return (
    <View style={{ gap: space.s5 }}>
      <Icon name={glyph} size={56} colour={tone} />
      <View style={{ gap: 4 }}>
        <Display>{amount}</Display>
        <Meta tone="secondary">{line}</Meta>
      </View>
    </View>
  );
}

export function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <View style={{ gap: 32 }}>
      {rows.map(([k, v]) => (
        <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: space.s4 }}>
          <Body tone="secondary" style={{ flex: 1 }}>
            {k}
          </Body>
          <Row style={{ textAlign: 'right' }}>{v}</Row>
        </View>
      ))}
    </View>
  );
}

/* The one line that says where the money stands. The frames fill it in the
   tone rather than leaving it on the page: amber where something is waiting,
   green where nothing was lost, with the words in white over it. */
export function Banner({
  text,
  glyph,
  tone = colour.warn,
  ink,
}: {
  text: string;
  /* only some of the frames put a mark on it; the green ones are words alone */
  glyph?: IconName;
  tone?: string;
  /* the glyph's own colour, where the frame gives it one — the amber banner
     carries a green mark, not a white one */
  ink?: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.s3,
        backgroundColor: tone,
        borderRadius: radius.card,
        paddingVertical: space.s4,
        paddingHorizontal: space.s4,
      }}
    >
      {glyph ? <Icon name={glyph} size={24} colour={ink ?? colour.textInverse} /> : null}
      <Row tone="inverse" style={{ flex: 1 }}>
        {text}
      </Row>
    </View>
  );
}

/* What the agent says about the screen. The frames always put it in the pale
   blue bubble with the mark beside it, never as bare text on the page. */
export function AgentSay({ children }: { children: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.s2 }}>
      <Icon name="mark" size={32} colour={colour.accent} />
      <View style={{ flex: 1 }}>
        <Bubble>{children}</Bubble>
      </View>
    </View>
  );
}

/* The agent asking something, with the one thing you can answer. */
export function AgentAsk({
  question,
  answer,
  onAnswer,
}: {
  question: string;
  answer: string;
  onAnswer?: () => void;
}) {
  return (
    <View style={{ gap: space.s5, backgroundColor: colour.surface2, borderRadius: 20, padding: space.s4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.s4 }}>
        <Icon name="mark" size={32} colour={colour.accent} />
        <Body style={{ flex: 1 }}>{question}</Body>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onAnswer}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        <Row>{answer}</Row>
        <Icon name="chevron" size={20} />
      </Pressable>
    </View>
  );
}

export function ChoiceRow({
  glyph,
  title,
  sub,
  onPress,
  tone,
}: {
  glyph: IconName;
  title: string;
  sub: string;
  onPress?: () => void;
  tone?: string;
}) {
  return (
    <Tap
      accessibilityRole="button"
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.s3,
      }}
    >
      {/* the glyph sits on a white square, the way the frames set it */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: colour.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={glyph} size={20} colour={tone} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Row>{title}</Row>
        <Meta tone="secondary">{sub}</Meta>
      </View>
      <Icon name="chevron" size={16} colour={colour.textTertiary} />
    </Tap>
  );
}

/* The two or three ways out of a screen that went wrong. The frames box them
   together in the pale grey, one under another with a rule between. */
export function Choices({ children }: { children: ReactNode }) {
  const rows = React.Children.toArray(children);
  return (
    <View style={{ backgroundColor: colour.surface2, borderRadius: radius.card, padding: space.s3 }}>
      {rows.map((child, i) => (
        <View key={i} style={{ paddingHorizontal: space.s2, paddingVertical: space.s2 }}>
          {child}
        </View>
      ))}
    </View>
  );
}

export function FootNote({ title, sub }: { title: string; sub: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <Label>{title}</Label>
      <Caption tone="secondary" style={{ textAlign: 'center' }}>
        {sub}
      </Caption>
    </View>
  );
}

/* The "how I decided" card: a heading, then reasons behind a 16 glyph. The
   design uses check for the settled part and lock for the parts it cannot
   move, never a warning triangle. */
export function ReasonList({
  title,
  rows,
  note,
}: {
  title: string;
  rows: [IconName, string][];
  note?: string;
}) {
  return (
    <View style={{ backgroundColor: colour.surface2, borderRadius: 20, padding: space.s4, gap: space.s4 }}>
      <Body tone="secondary">{title}</Body>
      <View style={{ gap: space.s4 }}>
        {rows.map(([g, t]) => (
          <View key={t} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.s3 }}>
            <Icon name={g} size={16} colour={g === 'check' ? colour.ink : colour.textTertiary} />
            <Meta style={{ flex: 1 }}>{t}</Meta>
          </View>
        ))}
      </View>
      {note ? <Meta tone="secondary">{note}</Meta> : null}
    </View>
  );
}
