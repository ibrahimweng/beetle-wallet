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
    /* the frames set the glyph 14 above the figure, not the column's 20, and
       bring what follows up close under the line rather than a gap away */
    <View style={{ gap: 14, marginBottom: -10 }}>
      <Icon name={glyph} size={56} colour={tone} />
      <View style={{ gap: 13 }}>
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
        /* the frames draw it at a set height and centre the words in it —
           55 for the green one, 77 for the amber — rather than letting the
           words decide, so a line more or less does not move the screen */
        minHeight: tone === colour.good ? 55 : 77,
        justifyContent: 'center',
        paddingVertical: 4,
        paddingLeft: space.s4,
        paddingRight: 56,
      }}
    >
      {/* the mark's slot is kept whether or not there is one in it, and the
          words stop short of the far edge, which is how the frames set them */}
      <View style={{ width: 24, height: 24 }}>
        {glyph ? <Icon name={glyph} size={24} colour={ink ?? colour.textInverse} /> : null}
      </View>
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

/* The agent asking something, with the one thing you can answer. The frames
   box it in white with a hairline: the mark and the question in the bubble,
   then the answer as a grey pill with a chevron on it. */
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
    <View
      style={{
        gap: space.s3,
        backgroundColor: colour.surface,
        borderWidth: 1,
        borderColor: colour.rule,
        borderRadius: radius.card,
        padding: space.s4,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.s2 }}>
        <Icon name="mark" size={32} colour={colour.accent} />
        <View style={{ flex: 1 }}>
          <Bubble>{question}</Bubble>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onAnswer}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          height: 44,
          borderRadius: radius.pill,
          backgroundColor: colour.surface2,
        }}
      >
        <Row>{answer}</Row>
        <Icon name="chevron" size={16} colour={colour.textTertiary} />
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
   together in the pale grey, one under another, 71 apart badge to badge. */
export function Choices({ children }: { children: ReactNode }) {
  const rows = React.Children.toArray(children);
  return (
    <View style={{ backgroundColor: colour.surface2, borderRadius: radius.card, padding: 4 }}>
      {rows.map((child, i) => (
        <View key={i} style={{ paddingHorizontal: space.s3, paddingVertical: space.s4 }}>
          {child}
        </View>
      ))}
    </View>
  );
}

/* The quiet promise at the end of a screen. The frames set it in the pale blue
   with the line above it in the accent, not as bare text on the page. */
export function FootNote({ title, sub }: { title: string; sub: string }) {
  return (
    <View
      style={{
        alignItems: 'center',
        gap: 4,
        backgroundColor: colour.accentWash,
        borderRadius: radius.md,
        paddingVertical: 12,
        paddingHorizontal: space.s4,
      }}
    >
      <Label tone="accent">{title}</Label>
      <Caption tone="accent" style={{ textAlign: 'center' }}>
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
