/* The pieces the settings pages, Activities and the answer are made of, each
   drawn to its frame's numbers: the facts on a rule, the pale-blue note at
   the foot of a page, a banner, a big status, a numbered step, a choice, a
   device, a cap, what is out today against the line, a meter, the All / In /
   Out segments, a line of the record, a page head with a glyph, a grey pill
   with a glyph in it, the card's face and its tools, and Beetle saying
   something on a page, on its own or in a white card — with a button under
   it where the card offers something. The transfer states add a ring that
   turns while money is on its way, the steps it has taken, a tool at work
   on a light panel, and a few ways out on one card. */
import React, { ReactNode, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from './Icon';
import { Bubble } from './Bubble';
import { Button } from './Button';
import { Body, Caption, Display, Head, Label, Meta, Row, Title } from './text';
import type { IconName } from '../icons';
import { colour, radius } from './tokens';
import { Tap, keys, useStill } from './motion';
import { measure, useArrival, useDeparture, type Rect } from './journey';

/* ---- a page's head with a glyph beside the title ---- */

/* The record's frame sets a 40 box with the glyph in it before the title,
   and the line under both. The box and the title's box share the top of the
   column, so nothing is pulled up here the way the plain head is. */
export function GlyphHead({ glyph, title, sub }: { glyph: IconName; title: string; sub: string }) {
  /* opened from the bar, the glyph arrives from the bar's own; from words, the title carries them; otherwise the head fades in */
  const a = useArrival();
  const target = !a.from ? 'all' : a.from.words ? 'title' : 'glyph';
  const box = (
    <View style={s.box40} testID="head-glyph">
      <Icon name={glyph} size={22} colour={colour.ink} />
    </View>
  );
  const on = (which: string) => (target === which ? { ref: a.ref, onLayout: a.onLayout, style: a.style } : {});
  return (
    <Animated.View {...on('all')} style={[{ gap: 8, marginBottom: -5 }, target === 'all' ? a.style : null]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Animated.View {...on('glyph')}>{box}</Animated.View>
        <Animated.View {...on('title')}>
          <Title>{title}</Title>
        </Animated.View>
      </View>
      <Body tone="tertiary">{sub}</Body>
    </Animated.View>
  );
}

/* ---- Beetle saying something on a page ---- */

/* The mark, and the line in its bubble, 12 apart, as the frames set it. */
export function Say({ children, style, testID }: { children: ReactNode; style?: object; testID?: string }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, style]} testID={testID}>
      <Icon name="mark" size={32} colour={colour.accent} />
      <View style={{ flex: 1 }}>
        <Bubble>{children}</Bubble>
      </View>
    </View>
  );
}

/* The same, in a white card with a hairline: what Beetle noticed about the
   page, at its foot. The frame's card is 104 tall around an 80 bubble, 16
   above it and 8 under. Where the card offers something, a 48 button sits
   under the bubble: the frames box the bubble's row at 70 whatever the
   bubble's height and put the button 13 under the box, so a two-line bubble
   runs 3 short of the button and a one-line one leaves 27. */
export function SayCard({
  children,
  action,
  onAction,
  disabled = false,
  row = 70,
  tight = false,
  testID,
}: {
  children: ReactNode;
  action?: string;
  onAction?: () => void;
  disabled?: boolean;
  /** the bubble's row, as the frame boxes it: 70 on most offers */
  row?: number;
  /** the offline frame's card: the button 12 under the row, and 6 under the button */
  tight?: boolean;
  testID?: string;
}) {
  return (
    <View style={[s.sayCard, action ? s.sayCardOffer : null, tight ? { paddingBottom: 6 } : null]} testID={testID}>
      {action ? (
        <View style={{ height: row, overflow: 'visible' }}>
          <Say>{children}</Say>
        </View>
      ) : (
        <Say>{children}</Say>
      )}
      {action ? <Button label={action} size={48} onPress={onAction} disabled={disabled} style={{ marginTop: tight ? 12 : 13 }} /> : null}
    </View>
  );
}

/* ---- what was typed, and picks ---- */

/* The words that brought the page, under "You typed", as the Send money,
   Pay a bill and Buy data frames set them. */
export function YouTyped({ said, testID = 'you-typed' }: { said: string; testID?: string }) {
  return (
    <View style={{ gap: 8 }} testID={testID}>
      <Caption tone="secondary">You typed</Caption>
      <Body tone="secondary">{said}</Body>
    </View>
  );
}

/* Three things to pick from in a row, each on a grey card 62 tall with a
   figure over a line: the amounts a bill is usually paid in, the other
   bundles. The picked one is white with a hairline. */
export function Picks<T extends string | number>({ items, value, onPick, testID }: { items: { value: T; big: string; small: string }[]; value: T | null; onPick: (v: T) => void; testID?: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }} testID={testID}>
      {items.map(it => {
        const on = it.value === value;
        return (
          <Tap
            key={String(it.value)}
            accessibilityRole="button"
            accessibilityLabel={it.big}
            accessibilityState={{ selected: on }}
            onPress={() => onPick(it.value)}
            style={[s.pick, on ? s.pickOn : null]}
          >
            <Label>{it.big}</Label>
            <Meta tone="secondary">{it.small}</Meta>
          </Tap>
        );
      })}
    </View>
  );
}

/* ---- facts, notes, banners ---- */

/* What a rule comes to: the label in grey, what it is set to at the end of
   the line, 56 a row. The last row's value can be quiet, where the frame
   greys the condition. */
export function Facts({
  rows,
  inset = 12,
  row = 56,
  testID,
}: {
  rows: { label: string; value: string; quiet?: boolean; /** the figure in a colour: what is short, in amber */ tone?: string; /** the label in bold: what a loan comes to */ strong?: boolean }[];
  /** what the figure keeps from the right edge */ inset?: number;
  /** a row's height: 56 on most frames, 54 on the loan's */ row?: number;
  testID?: string;
}) {
  return (
    <View testID={testID}>
      {rows.map(r => (
        <View key={r.label} style={[s.fact, { height: row }]}>
          {r.strong ? (
            <Row style={{ flex: 1 }}>{r.label}</Row>
          ) : (
            <Body tone="secondary" style={{ flex: 1 }}>
              {r.label}
            </Body>
          )}
          <Row tone={r.quiet ? 'secondary' : 'ink'} style={[{ textAlign: 'right', paddingRight: inset }, r.tone ? { color: r.tone } : null]}>
            {r.value}
          </Row>
        </View>
      ))}
    </View>
  );
}

/* The quiet promise at the foot of a page, in the pale blue: the line above
   centred in the accent, the sentence under it not. */
export function FootNote({ title, sub, style }: { title: string; sub: string; style?: object }) {
  return (
    <View style={[s.footNote, style]} testID="footnote">
      <Label tone="accent" style={{ textAlign: 'center' }}>
        {title}
      </Label>
      <Caption tone="accent">{sub}</Caption>
    </View>
  );
}

/* The one line that says where the money stands, filled in its tone with
   the words in white and a 24 glyph before them, 78 tall — or 56, tight
   around two lines, where a frame draws it so. */
export function Banner({
  text,
  glyph,
  tone = colour.warn,
  ink = colour.textInverse,
  tight = false,
  testID,
}: {
  text: string;
  glyph?: IconName;
  tone?: string;
  ink?: string;
  tight?: boolean;
  testID?: string;
}) {
  return (
    <View style={[s.banner, { backgroundColor: tone }, tight ? s.bannerTight : null]} testID={testID}>
      <View style={{ width: 24, height: 24 }}>{glyph ? <Icon name={glyph} size={24} colour={ink} /> : null}</View>
      <Row tone="inverse" style={{ flex: 1 }}>
        {text}
      </Row>
    </View>
  );
}

/* A 56 glyph, the figure under it, and the line under that: how a screen
   that stopped something opens. */
export function BigStatus({
  glyph,
  tone,
  amount,
  line,
  lead,
}: {
  glyph?: IconName;
  tone?: string;
  amount: string;
  line: string;
  /** something drawn in the glyph's place: the ring that turns */ lead?: ReactNode;
}) {
  return (
    <View style={{ gap: 16 }} testID="status">
      {lead ?? (glyph ? <Icon name={glyph} size={56} colour={tone ?? colour.ink} /> : null)}
      <View style={{ gap: 12 }}>
        <Display>{amount}</Display>
        <Meta tone="secondary">{line}</Meta>
      </View>
    </View>
  );
}

/* A step in a list of them: a 28 disc, green with a tick once it is done,
   black with its number until then, and the words after it. */
export function Step({ n, done, children, right }: { n: number; done?: boolean; children: ReactNode; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={[s.disc28, { backgroundColor: done ? colour.good : colour.ink }]}>
        {done ? (
          <Icon name="check" size={16} colour={colour.textInverse} />
        ) : (
          <Label tone="inverse" style={{ textAlign: 'center' }}>
            {n}
          </Label>
        )}
      </View>
      <Row style={{ flex: 1 }}>{children}</Row>
      {right}
    </View>
  );
}

/* One way out, on its own grey card: a glyph on a white 32 square, the title
   over its line, a chevron at the end, 62 tall. */
export function ChoiceRow({ glyph, title, sub, onPress, to, testID }: { glyph: IconName; title: string; sub: string; onPress?: () => void; to?: string; testID?: string }) {
  const j = useDeparture({ id: `choice:${title}`, to, words: title });
  return (
    <Tap ref={j.ref} accessibilityRole="button" accessibilityLabel={title} onPress={to ? j.onPress : onPress} style={[s.choice, j.style]} testID={testID}>
      <View style={[s.box32, { backgroundColor: colour.surface }]}>
        <Icon name={glyph} size={16} colour={colour.ink} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Label>{title}</Label>
        <Caption tone="secondary">{sub}</Caption>
      </View>
      <Icon name="chevron" size={16} colour={colour.textTertiary} />
    </Tap>
  );
}

/* A ring that turns while money is on its way: the grey track and a
   quarter of it in the accent, going round. */
export function Ring({ size = 56, tone = colour.accent, width = 4 }: { size?: number; tone?: string; /** the band's weight */ width?: number }) {
  const still = useStill();
  const r = useSharedValue(0);
  useEffect(() => {
    if (!still) r.value = withRepeat(withTiming(360, { duration: 1400, easing: Easing.linear }), -1, false);
  }, [still, r]);
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  const ring = { position: 'absolute' as const, width: size, height: size, borderRadius: size / 2, borderWidth: width };
  return (
    <View style={{ width: size, height: size }} testID="ring">
      <View style={[ring, { borderColor: colour.rule }]} />
      <Animated.View style={[ring, { borderColor: 'transparent', borderTopColor: tone }, spin]} />
    </View>
  );
}

/* The steps a thing has taken, 44 a row: a 22 disc, green with a tick once
   the step is done and an empty ring until then, the step in grey, and when
   it happened — or what is waited for — at the end. A hairline between
   the rows, and a little room between them where a frame gives it. */
export type StepRow = {
  label: string;
  value: string;
  done: boolean;
  /** still being worked out: a ring turning in the disc's place */
  working?: boolean;
  /** a row that can be changed with a tap */
  onPress?: () => void;
  /** a chevron at the end, where the frame draws one */
  chevron?: boolean;
};

export function StepRows({ rows, gap = 0, disc = 22, testID }: { rows: StepRow[]; gap?: number; /** the disc's size: 22 on most frames, 18 on a request's */ disc?: number; testID?: string }) {
  return (
    <View style={{ gap }} testID={testID}>
      {rows.map((r, i) => (
        <Tap
          key={r.label}
          accessibilityRole={r.onPress ? 'button' : undefined}
          accessibilityLabel={r.onPress ? r.label : undefined}
          onPress={r.onPress}
          disabled={!r.onPress}
          style={[s.stepRow, i ? s.hairTop : null]}
          testID="step-row"
        >
          {r.working ? (
            <Ring size={disc} width={disc >= 22 ? 3 : 2} />
          ) : (
            <View style={[s.disc22, { width: disc, height: disc, borderRadius: disc / 2 }, r.done ? { backgroundColor: colour.good } : { borderWidth: 1.5, borderColor: colour.ruleStrong }]}>
              {r.done ? <Icon name="check" size={disc >= 22 ? 12 : 10} colour={colour.textInverse} /> : null}
            </View>
          )}
          <Meta tone="secondary" style={{ flex: 1 }}>
            {r.label}
          </Meta>
          {r.done ? <Label>{r.value}</Label> : <Meta tone="secondary">{r.value}</Meta>}
          {r.chevron ? <Icon name="chevron" size={12} colour={colour.textTertiary} /> : null}
        </Tap>
      ))}
    </View>
  );
}

/* A tool at work, in daylight: the chat's panel drawn on a white card with a
   hairline — a 32 square with the tool's glyph, its name, and a chip saying
   it is running, on a grey band 48 tall — with its steps under. */
export function LightPanel({
  glyph,
  title,
  status,
  rows,
  centre = false,
  disc = 22,
  foot,
  testID,
}: {
  glyph: IconName;
  title: string;
  status: string;
  rows: StepRow[];
  /** the name in the middle of the band, as a request's panel sets it */
  centre?: boolean;
  disc?: number;
  /** what sits under the rows: a request's one button */
  foot?: ReactNode;
  testID?: string;
}) {
  return (
    <View style={s.panel} testID={testID}>
      <View style={s.panelHead}>
        <View style={[s.box32, { backgroundColor: colour.surface }]}>
          <Icon name={glyph} size={16} colour={colour.ink} />
        </View>
        <Label style={{ flex: 1, textAlign: centre ? 'center' : 'left' }}>{title}</Label>
        <View style={s.status} testID="panel-status">
          <View style={s.dot} />
          <Caption style={{ fontWeight: '600' }}>{status}</Caption>
        </View>
      </View>
      <View style={{ paddingTop: 4, paddingBottom: foot ? 0 : 12, paddingHorizontal: 12 }}>
        <StepRows rows={rows} disc={disc} />
      </View>
      {foot ? <View style={{ padding: 12 }}>{foot}</View> : null}
    </View>
  );
}

/* A few ways out on one grey card, 72 a row: a glyph on a white 40 square,
   the title over its line, a chevron at the end, and a hairline between
   the rows. Each row can lead to a page the way a choice on its own does. */
export type Way = { glyph: IconName; title: string; sub: string; onPress?: () => void; to?: string; testID?: string };

export function ChoiceList({ items, testID }: { items: Way[]; testID?: string }) {
  return (
    <View style={s.choices} testID={testID}>
      {items.map((it, i) => (
        <BigChoice key={it.title} {...it} first={i === 0} />
      ))}
    </View>
  );
}

function BigChoice({ glyph, title, sub, onPress, to, first, testID }: Way & { first: boolean }) {
  const j = useDeparture({ id: `choice:${title}`, to, words: title });
  return (
    <Tap ref={j.ref} accessibilityRole="button" accessibilityLabel={title} onPress={to ? j.onPress : onPress} style={[s.bigChoice, first ? null : s.hairTop, j.style]} testID={testID}>
      <View style={[s.box40, { backgroundColor: colour.surface }]}>
        <Icon name={glyph} size={20} colour={colour.ink} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Row>{title}</Row>
        <Meta tone="secondary">{sub}</Meta>
      </View>
      <Icon name="chevron" size={16} colour={colour.textTertiary} />
    </Tap>
  );
}

/* A device this account is open on: the glyph on a white square, the name
   over where and when, and a tag at the end where the frame marks one out,
   amber for the odd one. 74 a row. */
export function DeviceRow({ glyph, title, where, tag, odd = false }: { glyph: IconName; title: string; where: string; tag?: string; odd?: boolean }) {
  return (
    <View style={s.device} testID="device">
      <View style={[s.box40, { backgroundColor: colour.surface }]}>
        <Icon name={glyph} size={20} colour={colour.ink} />
      </View>
      {/* the frame centres a 40 box and lets the line under the name run 4 past it */}
      <View style={{ flex: 1, gap: 4, marginTop: 4 }}>
        <Row>{title}</Row>
        <Caption tone="secondary">{where}</Caption>
      </View>
      {tag ? (
        <View style={[s.tag, { backgroundColor: odd ? colour.warn : colour.rule }]}>
          <Caption style={{ fontWeight: '600' }}>{tag}</Caption>
        </View>
      ) : null}
    </View>
  );
}

/* A cap: what it is over its line, the figure, and a chevron, 66 a row. The
   figure takes what it needs and the words the rest; a long line wraps at
   the frame's 202. */
export function CapRow({ title, sub, value, onPress }: { title: string; sub: string; value: string; onPress?: () => void }) {
  return (
    /* the frame sets the words 13 down whether the line wraps or not, and centres the figure */
    <Tap accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={s.cap}>
      <View style={{ flex: 1, gap: 4, paddingTop: 13 }}>
        <Row>{title}</Row>
        <Caption tone="secondary" style={{ maxWidth: 202 }}>
          {sub}
        </Caption>
      </View>
      <View style={{ flexShrink: 0, paddingTop: 21 }}>
        <Row>{value}</Row>
      </View>
      <View style={{ marginTop: 25 }}>
        <Icon name="chevron" size={16} colour={colour.textTertiary} />
      </View>
    </Tap>
  );
}

/* The filled part of a line: how much of the day, or of the card's ceiling, has gone. */
export function Meter({ pct, height = 10, tone = colour.accent }: { pct: number; height?: number; tone?: string }) {
  const still = useStill();
  const t = useSharedValue(still ? pct : 0);
  useEffect(() => {
    t.value = withSpring(pct, keys);
  }, [pct, t]);
  const fill = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(100, t.value))}%` }));
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: colour.rule, overflow: 'hidden' }} testID="meter">
      <Animated.View style={[{ height, borderRadius: height / 2, backgroundColor: tone }, fill]} />
    </View>
  );
}

/* What is out today against what you set: the two labels, the figure, the
   meter, and the line that says what is left. */
export function Usage({ out, of, pct, note }: { out: string; of: string; pct: number; note: string }) {
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Meta tone="secondary">Out today</Meta>
        <Meta tone="secondary">of {of}</Meta>
      </View>
      {/* the frame gives the figure a 44 box */}
      <Display style={{ marginBottom: 4 }}>{out}</Display>
      <Meter pct={pct} />
      <Meta tone="secondary">{note}</Meta>
    </View>
  );
}

/* ---- the record ---- */

/* All, In, Out: a grey pill with the chosen one on white, each 40 tall with
   24 either side of its word, 4 in from the pill. */
export function Segments({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={s.segments} testID="segments">
      {options.map(o => {
        const on = o === value;
        return (
          <Tap key={o} accessibilityRole="button" accessibilityLabel={o} accessibilityState={{ selected: on }} onPress={() => onChange(o)} scale={0.97} style={[s.segment, on ? s.segmentOn : null]}>
            <Label tone={on ? 'ink' : 'secondary'}>{o}</Label>
          </Tap>
        );
      })}
    </View>
  );
}

/* A line of the record. One that settled has its glyph on a grey square and
   its figure in black, 70 tall. One still on its way, or that did not go, or
   that came back, has its status glyph bare and coloured, its figure in grey,
   and a chevron, 64 tall, and leads to its own page. */
export function HistoryRow({
  glyph,
  tone,
  name,
  detail,
  amount,
  status = false,
  onPress,
  onOpen,
  journey,
  to,
}: {
  glyph: IconName;
  tone?: string;
  name: string;
  detail: string;
  amount: string;
  status?: boolean;
  onPress?: () => void;
  /** opened in place: given where the row is, so the detail can grow out of it */
  onOpen?: (at: Rect) => void;
  /** the row's id on a journey, so it pulses when its receipt is left */
  journey?: string;
  /** the page a line that is not done leads to; its title arrives from the line's own words */
  to?: string;
}) {
  const j = useDeparture({ id: journey ?? `row:${name}`, to, words: to ? detail.split(' · ')[0] : undefined });
  return (
    <Tap
      ref={j.ref}
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={() => (onOpen ? void measure(j.ref).then(onOpen) : to ? void j.onPress() : onPress?.())}
      style={[status ? s.statusRow : s.doneRow, j.style]}
      testID={status ? 'status-row' : 'done-row'}
    >
      {status ? (
        <Icon name={glyph} size={28} colour={tone ?? colour.ink} />
      ) : (
        <View style={s.box40}>
          <Icon name={glyph} size={20} colour={colour.ink} />
        </View>
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <Row>{name}</Row>
        {status ? <Caption tone="secondary">{detail}</Caption> : <Meta tone="secondary">{detail}</Meta>}
      </View>
      {status ? <Body tone="secondary">{amount}</Body> : <Row>{amount}</Row>}
      {status ? <Icon name="chevron" size={16} colour={colour.textTertiary} /> : null}
    </Tap>
  );
}

/* ---- a grey pill with a glyph and a few words ---- */

export function PillRow({ glyph, label, onPress, to, testID }: { glyph: IconName; label: string; onPress?: () => void; to?: string; testID?: string }) {
  const j = useDeparture({ id: `pill:${label}`, to, words: label });
  return (
    <Tap ref={j.ref} accessibilityRole="button" accessibilityLabel={label} onPress={to ? j.onPress : onPress} style={s.pill} testID={testID}>
      <Icon name={glyph} size={18} colour={colour.ink} />
      <Label>{label}</Label>
    </Tap>
  );
}

/* A line of small print with its glyph on a 32 square: a line that wraps
   starts level with the square's top, a short one sits centred on it, which
   is how the frames set each. */
export function NoteRow({ glyph, children, centre = false }: { glyph: IconName; children: ReactNode; centre?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: centre ? 'center' : 'flex-start', gap: 12 }}>
      <View style={s.box32}>
        <Icon name={glyph} size={16} colour={colour.ink} />
      </View>
      <Meta tone="secondary" style={{ flex: 1 }}>
        {children}
      </Meta>
    </View>
  );
}

/* ---- the card ---- */

/* The card's face, 194 tall: the mark on a white square and whose card it is
   across the top, the chip, the number, and the holder and the expiry along
   the foot. */
export function CardFace({ only, number, name, expiry, frozen = false }: { only: string; number: string; name: string; expiry: string; frozen?: boolean }) {
  return (
    <LinearGradient colors={frozen ? ['#3a3f4d', '#141722'] : ['#1e3a8a', '#0a0f24']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.face} testID="card-face">
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={s.faceMark}>
          <Icon name="mark" size={18} colour={colour.accent} />
        </View>
        <Caption tone="inverse" style={{ flex: 1, textAlign: 'right', fontWeight: '600', letterSpacing: 1.4 }}>
          {only}
        </Caption>
      </View>
      <View style={s.chip}>
        <View style={s.chipLine} />
        <View style={s.chipLine} />
      </View>
      <Head tone="inverse" style={{ fontWeight: '500', letterSpacing: 3 }}>
        {number}
      </Head>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Caption tone="inverse" style={{ opacity: 0.7, letterSpacing: 1 }}>
            CARD HOLDER
          </Caption>
          <Caption tone="inverse" style={{ fontWeight: '600', letterSpacing: 1 }}>
            {name}
          </Caption>
        </View>
        <View style={{ gap: 4, alignItems: 'flex-end' }}>
          <Caption tone="inverse" style={{ opacity: 0.7, letterSpacing: 1 }}>
            EXPIRES
          </Caption>
          <Meta tone="inverse">{expiry}</Meta>
        </View>
      </View>
    </LinearGradient>
  );
}

/* The four things you can do to a card, on one grey card: a 22 glyph in its
   own colour over a word. */
export function Tools({ items }: { items: { glyph: IconName; label: string; tone?: string; onPress?: () => void }[] }) {
  return (
    <View style={s.tools} testID="tools">
      {items.map(t => (
        <Tap key={t.label} accessibilityRole="button" accessibilityLabel={t.label} onPress={t.onPress} scale={0.94} style={s.tool}>
          <Icon name={t.glyph} size={22} colour={t.tone ?? colour.ink} />
          <Caption tone="ink">{t.label}</Caption>
        </Tap>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  box40: { width: 40, height: 40, borderRadius: 12, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  box32: { width: 32, height: 32, borderRadius: 10, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  disc28: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sayCard: { backgroundColor: colour.surface, borderWidth: 1, borderColor: colour.rule, borderRadius: radius.card, paddingTop: 15, paddingBottom: 7, paddingHorizontal: 15 },
  sayCardOffer: { paddingBottom: 15 },
  bannerTight: { minHeight: 56, paddingVertical: 4 },
  disc22: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 44 },
  hairTop: { borderTopWidth: 1, borderTopColor: colour.rule },
  pick: { flex: 1, height: 62, borderRadius: 16, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: 'transparent' },
  pickOn: { backgroundColor: colour.surface, borderColor: colour.rule },
  panel: { backgroundColor: colour.surface, borderWidth: 1, borderColor: colour.rule, borderRadius: 20, overflow: 'hidden' },
  panelHead: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 12, backgroundColor: colour.surface2 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 24, paddingHorizontal: 10, borderRadius: 12, backgroundColor: colour.surface, borderWidth: 1, borderColor: colour.rule },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colour.accent },
  choices: { backgroundColor: colour.surface2, borderRadius: radius.card, paddingVertical: 4, paddingHorizontal: 16 },
  bigChoice: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 72 },
  fact: { flexDirection: 'row', alignItems: 'center', height: 56, gap: 16 },
  footNote: { gap: 4, backgroundColor: colour.accentWash, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 16 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 78, borderRadius: radius.card, paddingLeft: 16, paddingRight: 48, paddingVertical: 12 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 62, paddingHorizontal: 16, backgroundColor: colour.surface2, borderRadius: radius.card },
  device: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 74 },
  tag: { height: 24, borderRadius: 12, paddingHorizontal: 12, justifyContent: 'center' },
  cap: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, height: 66 },
  segments: { flexDirection: 'row', alignSelf: 'center', padding: 4, gap: 4, borderRadius: 24, backgroundColor: colour.surface2 },
  segment: { height: 40, paddingHorizontal: 24, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: colour.surface },
  statusRow: { flexDirection: 'row', alignItems: 'center', height: 64, paddingLeft: 5, gap: 16, borderRadius: 16 },
  doneRow: { flexDirection: 'row', alignItems: 'center', height: 70, gap: 12, borderRadius: 16 },
  pill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: radius.pill, backgroundColor: colour.surface2 },
  face: { borderRadius: radius.card, padding: 20, gap: 16, height: 194 },
  faceMark: { width: 24, height: 24, borderRadius: 7, backgroundColor: colour.surface, alignItems: 'center', justifyContent: 'center' },
  chip: { width: 34, height: 25, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.22)', paddingTop: 9, gap: 3, paddingHorizontal: 4 },
  chipLine: { height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.45)' },
  tools: { flexDirection: 'row', gap: 4, backgroundColor: colour.surface2, borderRadius: radius.card, paddingVertical: 12, paddingHorizontal: 8 },
  tool: { flex: 1, alignItems: 'center', gap: 8, paddingTop: 4 },
});
