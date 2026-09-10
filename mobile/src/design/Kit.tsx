/* The rest of the kit: the pieces the money, services and onboarding frames
   use that the first pass did not need. Everything here is drawn to the same
   figures as the components it sits beside — 20 between things in a column,
   56 for a button, 24 for a card. */
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, ScrollView, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { Icon } from './Icon';
import { Body, Caption, Display, Head, Label, Meta, Row, Title } from './text';
import { Card, Divider } from './Screen';
import { Sheet } from './Sheet';
import { Button } from './Button';
import { Keypad, Pips } from './Keypad';
import { IconName } from '../icons';
import { colour, radius, space } from './tokens';

/* ---- the small things ---- */

/* What you said, as the design draws it: a black bubble on the right with the
   microphone beside it. */
export function Said({
  children,
  mic = true,
  onPress,
}: {
  children: string;
  mic?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `Say it again: ${children}` : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        alignSelf: 'flex-end',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        opacity: pressed && onPress ? 0.6 : 1,
      })}
    >
      {mic ? <Icon name="mic" size={16} colour={colour.textTertiary} /> : null}
      <View
        style={{
          backgroundColor: colour.ink,
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 10,
          maxWidth: 280,
        }}
      >
        <Body tone="inverse">{children}</Body>
      </View>
    </Pressable>
  );
}

export function Chip({ label, on = false, onPress }: { label: string; on?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={{
        backgroundColor: on ? colour.accentWash : colour.surface2,
        borderRadius: radius.pill,
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}
    >
      <Label tone={on ? 'accent' : 'ink'}>{label}</Label>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s2 }}>{children}</View>;
}

/* The round tick beside a thing that is on, hollow when it is not. */
export function Tick({ on }: { on: boolean }) {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: on ? colour.good : 'transparent',
        borderWidth: on ? 0 : 2,
        borderColor: colour.rule,
      }}
    >
      {on ? <Icon name="check-small" size={13} colour={colour.textInverse} /> : null}
    </View>
  );
}

/* Initials in a circle, the way the file draws a person. */
export function Avatar({
  initials,
  size = 36,
  tone = colour.accentWash,
  text = colour.accent,
}: {
  initials: string;
  size?: number;
  tone?: string;
  text?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: tone,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Label style={{ color: text }}>{initials}</Label>
    </View>
  );
}

/* A glyph in a circle, used where the file wants an icon to read as a token
   rather than as a control. */
export function Badge({
  glyph,
  size = 44,
  tone = colour.surface3,
  ink = colour.ink,
}: {
  glyph: IconName;
  size?: number;
  tone?: string;
  ink?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: tone,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={glyph} size={Math.round(size * 0.5)} colour={ink} />
    </View>
  );
}

/* A centred text button, the quiet way out of a screen. */
export function Ghost({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ alignSelf: 'center', opacity: pressed ? 0.5 : 1 })}
    >
      <Row tone="accent">{label}</Row>
    </Pressable>
  );
}

/* ---- measures ---- */

/* A straight bar. Used by the card ceiling and by the months on the answer
   screen. */
export function Meter({ pct, tone = colour.accent }: { pct: number; tone?: string }) {
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: colour.rule, overflow: 'hidden' }}>
      <View
        style={{
          width: `${Math.max(0, Math.min(100, pct))}%`,
          height: 8,
          borderRadius: 4,
          backgroundColor: tone,
        }}
      />
    </View>
  );
}

/* The big ring, with whatever the frame puts in the middle. */
export function Ring({
  pct,
  size = 150,
  tone = colour.accent,
  children,
}: {
  pct: number;
  size?: number;
  tone?: string;
  children?: ReactNode;
}) {
  const stroke = size * 0.094;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
      }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colour.rule} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={tone}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${(c * Math.max(0, Math.min(100, pct))) / 100} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>{children}</View>
    </View>
  );
}

/* Drag to pick a figure. Used only by the loan screen, which is the one place
   the design draws a slider. */
export function Slider({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}) {
  const [width, setWidth] = useState(0);
  const at = useRef(value);
  at.current = value;
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: ev => {
        if (!width) return;
        const x = Math.max(0, Math.min(width, ev.nativeEvent.locationX));
        const raw = min + (x / width) * (max - min);
        onChange(Math.round(raw / step) * step);
      },
    }),
  ).current;
  const pct = (value - min) / (max - min);
  return (
    <View
      {...pan.panHandlers}
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="adjustable"
      accessibilityValue={{ min, max, now: value }}
      style={{ height: 44, justifyContent: 'center' }}
    >
      <View style={{ height: 6, borderRadius: 3, backgroundColor: colour.rule }}>
        <View
          style={{ width: `${pct * 100}%`, height: 6, borderRadius: 3, backgroundColor: colour.accent }}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          left: Math.max(0, pct * (width - 26)),
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: colour.surface,
          borderWidth: 2,
          borderColor: colour.accent,
        }}
      />
    </View>
  );
}

/* ---- choosing ---- */

export type Choice = { id: string; label: string; sub?: string };

export function Picker({
  options,
  value,
  onChange,
}: {
  options: Choice[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <Card style={{ gap: 0 }}>
      {options.map((o, i) => (
        <View key={o.id}>
          {i ? <Divider /> : null}
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected: o.id === value }}
            onPress={() => onChange(o.id)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.s3,
              paddingVertical: space.s3,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Row>{o.label}</Row>
              {o.sub ? <Meta tone="secondary">{o.sub}</Meta> : null}
            </View>
            <Tick on={o.id === value} />
          </Pressable>
        </View>
      ))}
    </Card>
  );
}

/* A part of a form you can change, drawn as label, value and the word the
   design uses for it. */
export function EditRow({
  label,
  value,
  sub,
  onPress,
}: {
  label: string;
  value: string;
  sub?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.s3,
        opacity: pressed && onPress ? 0.6 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Caption tone="secondary">{label}</Caption>
        <Row>{value}</Row>
        {sub ? <Caption tone="tertiary">{sub}</Caption> : null}
      </View>
      {onPress ? <Label tone="accent">Change</Label> : null}
    </Pressable>
  );
}

/* Label on the left, value on the right — the shape most of the small cards
   in the file are made of. */
export function Between({
  label,
  value,
  tone = 'ink',
}: {
  label: string;
  value: string;
  tone?: 'ink' | 'good' | 'secondary' | 'bad';
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
      <Caption tone="secondary" style={{ flex: 1 }}>
        {label}
      </Caption>
      <Label tone={tone}>{value}</Label>
    </View>
  );
}

/* ---- typing ---- */

const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
] as const;

/* The typed-entry keyboard, 236 tall on the frame. It types for real, which
   is the only way the typed screens are worth having. */
export function Keyboard({ onKey, action = 'send' }: { onKey: (k: string) => void; action?: string }) {
  const key = (k: string, wide?: number, dark?: boolean, label?: string) => (
    <Pressable
      key={k}
      accessibilityRole="button"
      accessibilityLabel={label ?? k}
      onPress={() => onKey(k)}
      style={({ pressed }) => ({
        flex: wide ?? 1,
        height: 42,
        marginHorizontal: 2,
        borderRadius: 5,
        backgroundColor: dark ? colour.ruleStrong : colour.surface,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.5 : 1,
      })}
    >
      {k === 'del' ? <Icon name="del" size={20} /> : <Body>{label ?? k}</Body>}
    </Pressable>
  );
  return (
    <View
      style={{ height: 236, backgroundColor: colour.surface3, paddingTop: 8, paddingHorizontal: 3, gap: 10 }}
    >
      <View style={{ flexDirection: 'row' }}>{ROWS[0].map(k => key(k))}</View>
      <View style={{ flexDirection: 'row', paddingHorizontal: 18 }}>{ROWS[1].map(k => key(k))}</View>
      <View style={{ flexDirection: 'row' }}>
        {key('shift', 1.5, true, '⇧')}
        {ROWS[2].map(k => key(k))}
        {key('del', 1.5, true, 'del')}
      </View>
      <View style={{ flexDirection: 'row' }}>
        {key('123', 1.5, true, '123')}
        {key(' ', 5, false, 'space')}
        {key(action, 2, true, action)}
      </View>
    </View>
  );
}

/* A line being typed, with the caret the design draws at the end of it. */
export function TypedLine({ value, placeholder }: { value: string; placeholder?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 40 }}>
      <Title tone={value ? 'ink' : 'tertiary'}>{value || placeholder || ''}</Title>
      <View style={{ width: 2, height: 28, backgroundColor: colour.accent }} />
    </View>
  );
}

/* ---- the camera ---- */

/* The dark screen the two scan frames are drawn on: a heading, whatever it
   has read, and the shutter with its two neighbours. */
export function CameraScreen({
  title,
  sub,
  children,
  onShutter,
  foot,
}: {
  title: string;
  sub: string;
  children?: ReactNode;
  onShutter: () => void;
  foot?: string;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: '#101216' }}>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingTop: 72,
          paddingBottom: 60,
          gap: space.s5,
          alignItems: 'center',
        }}
      >
        <Head tone="inverse">{title}</Head>
        <Meta tone="tertiary">{sub}</Meta>
        {children}
        <View style={{ height: 10 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 30 }}>
          <View style={{ opacity: 0.7 }}>
            <Icon name="grid" size={24} colour={colour.textInverse} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Take the photo"
            onPress={onShutter}
            style={({ pressed }) => ({
              width: 68,
              height: 68,
              borderRadius: 34,
              backgroundColor: colour.surface,
              borderWidth: 5,
              borderColor: '#4b5160',
              opacity: pressed ? 0.7 : 1,
            })}
          />
          <View style={{ opacity: 0.7 }}>
            <Icon name="power" size={24} colour={colour.textInverse} />
          </View>
        </View>
        {foot ? (
          <Caption tone="tertiary" style={{ textAlign: 'center' }}>
            {foot}
          </Caption>
        ) : null}
      </ScrollView>
    </View>
  );
}

/* What the camera read, as the white card the frames draw over the feed. */
export function ReadCard({
  who,
  glyph,
  tone,
  when,
  kind,
  lines,
  unsure,
  slip,
}: {
  who: string;
  glyph?: IconName;
  tone?: string;
  when: string;
  kind?: string;
  lines: string[];
  unsure?: string;
  slip?: string;
}) {
  return (
    <View
      style={{ backgroundColor: colour.surface, borderRadius: 16, padding: 14, width: '100%', gap: space.s2 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          {glyph ? (
            <Badge glyph={glyph} size={28} tone={tone ?? colour.surface3} />
          ) : (
            <Avatar initials={who.slice(0, 2)} size={28} />
          )}
          <Caption tone="secondary">{who}</Caption>
        </View>
        <Caption tone="tertiary">{when}</Caption>
      </View>
      {kind ? <Caption tone="secondary">{kind}</Caption> : null}
      <View style={{ gap: space.s2, alignItems: 'flex-start' }}>
        {lines.map(t => (
          <View
            key={t}
            style={{
              backgroundColor: colour.accentWash,
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Label tone="accent">{t}</Label>
          </View>
        ))}
        {unsure ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{
                backgroundColor: '#fdf2dd',
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <Label style={{ color: '#7a5b12' }}>{unsure}</Label>
            </View>
            <Caption style={{ color: '#7a5b12' }}>not sure</Caption>
          </View>
        ) : null}
      </View>
      {slip ? <Caption tone="tertiary">{slip}</Caption> : null}
    </View>
  );
}

/* ---- what is behind a sheet ---- */

/* The screen a sheet is over, drawn dim. React Native has no blur without a
   native module, so the design's blur reads here as the same dimming the
   sheet already uses. */
export function Quiet({ children }: { children: ReactNode }) {
  return (
    <View style={{ flex: 1, opacity: 0.45 }} pointerEvents="none">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 72, gap: space.s5 }}>
        {children}
      </ScrollView>
    </View>
  );
}

/* ---- saying something happened ---- */

type Listener = (text: string) => void;
let listener: Listener | null = null;

/** Say one short thing at the bottom of the screen. */
export const toast = (text: string) => listener?.(text);

export function ToastHost() {
  const [text, setText] = useState<string | null>(null);
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    listener = t => setText(t);
    return () => {
      listener = null;
    };
  }, []);
  useEffect(() => {
    if (text === null) return;
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 140, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setText(null));
    }, 2400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  if (text === null) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: 120,
        opacity: fade,
        backgroundColor: colour.ink,
        borderRadius: radius.md,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <Meta tone="inverse">{text}</Meta>
    </Animated.View>
  );
}

/* ---- the card ---- */

export function CardFace({
  only,
  number,
  name,
  expiry,
}: {
  only: string;
  number: string;
  name: string;
  expiry: string;
}) {
  return (
    <View style={{ backgroundColor: colour.accentDeep, borderRadius: radius.lg, padding: 22, gap: 30 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Caption tone="inverse" style={{ flex: 1, fontWeight: '600', letterSpacing: 1 }}>
          {only}
        </Caption>
        <Icon name="card" size={22} colour={colour.textInverse} />
      </View>
      <Head tone="inverse" style={{ fontWeight: '500', letterSpacing: 1.2 }}>
        {number}
      </Head>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Caption tone="inverse" style={{ opacity: 0.7, fontSize: 10, letterSpacing: 1 }}>
            CARD HOLDER
          </Caption>
          <Caption tone="inverse">{name}</Caption>
        </View>
        <View style={{ gap: 2 }}>
          <Caption tone="inverse" style={{ opacity: 0.7, fontSize: 10, letterSpacing: 1 }}>
            EXPIRES
          </Caption>
          <Caption tone="inverse">{expiry}</Caption>
        </View>
      </View>
    </View>
  );
}

/* ---- a code somebody can point a camera at ---- */

/* Drawn to the shape of a real code — three finders with their separators,
   both timing rows, filler in between. It is a picture of a code, not an
   encoder, because nothing here reaches a network. */
export function QrCode({ size = 176 }: { size?: number }) {
  const N = 21;
  /* one flat row of modules: true dark, false light, null still to fill */
  const grid: (boolean | null)[] = Array(N * N).fill(null);
  const put = (x: number, y: number, v: boolean) => {
    grid[y * N + x] = v;
  };
  const finder = (ox: number, oy: number) => {
    for (let y = -1; y <= 7; y++)
      for (let x = -1; x <= 7; x++) {
        const gx = ox + x,
          gy = oy + y;
        if (gx < 0 || gy < 0 || gx >= N || gy >= N) continue;
        const ring = x === 0 || x === 6 || y === 0 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        const inside = x >= 0 && x <= 6 && y >= 0 && y <= 6;
        put(gx, gy, inside ? ring || core : false);
      }
  };
  finder(0, 0);
  finder(N - 7, 0);
  finder(0, N - 7);
  for (let i = 8; i < N - 8; i++) {
    put(i, 6, i % 2 === 0);
    put(6, i, i % 2 === 0);
  }
  put(8, N - 8, true);

  let s = 99;
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      s = (s * 1103515245 + 12345) % 2147483648;
      const at = grid[y * N + x];
      const on = at === null || at === undefined ? s % 100 > 47 : at;
      if (on) cells.push(<Rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#000" />);
    }
  return (
    <View style={{ backgroundColor: colour.surface, padding: 14, borderRadius: 16, alignSelf: 'center' }}>
      <Svg width={size} height={size} viewBox="-1 -1 23 23">
        {cells}
      </Svg>
    </View>
  );
}

/* ---- money in words ---- */

export const naira = (n: number) => '₦' + Math.floor(n).toLocaleString('en-NG');
export const nairaFull = (n: number) =>
  '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const signed = (n: number) => (n < 0 ? '−' : n > 0 ? '+' : '') + naira(Math.abs(n));

/* Nothing here yet, drawn the way the empty frames draw it. */
export function Empty({
  glyph,
  title,
  body,
  note,
}: {
  glyph: IconName;
  title?: string;
  body: string;
  note?: string;
}) {
  return (
    <View
      style={{
        backgroundColor: colour.surface2,
        borderRadius: radius.card,
        paddingVertical: 30,
        paddingHorizontal: 18,
        gap: space.s3,
        alignItems: 'center',
      }}
    >
      <Icon name={glyph} size={32} colour={colour.textSecondary} />
      {title ? <Head>{title}</Head> : null}
      <Body tone="secondary" style={{ textAlign: 'center' }}>
        {body}
      </Body>
      {note ? (
        <Caption tone="tertiary" style={{ textAlign: 'center' }}>
          {note}
        </Caption>
      ) : null}
    </View>
  );
}

/* The big figure a screen is about, with its line under it. */
export function BigMoney({
  amount,
  note,
  onPress,
  change,
}: {
  amount: string;
  note?: string;
  onPress?: () => void;
  change?: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.s2,
          opacity: pressed && onPress ? 0.6 : 1,
        })}
      >
        <Display>{amount}</Display>
        {change ? <Label tone="accent">{change}</Label> : null}
      </Pressable>
      {note ? <Meta tone="tertiary">{note}</Meta> : null}
    </View>
  );
}

/* ---- the two sheets every flow ends with ---- */

/* Share this receipt. Four ways out, and the line about what is left off
   every copy that leaves the phone. */
export function ShareSheet({
  line,
  onClose,
  behind,
}: {
  line: string;
  onClose: () => void;
  behind?: ReactNode;
}) {
  const way = (glyph: IconName, title: string, sub: string) => (
    <Pressable
      key={title}
      accessibilityRole="button"
      onPress={onClose}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.s5,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icon name={glyph} size={20} />
      <View style={{ flex: 1, gap: 2 }}>
        <Row>{title}</Row>
        <Meta tone="secondary">{sub}</Meta>
      </View>
      <Icon name="chevron" size={16} colour={colour.textTertiary} />
    </Pressable>
  );
  return (
    <Sheet onClose={onClose} behind={behind}>
      <View style={{ alignItems: 'center' }}>
        <Icon name="share" size={28} />
      </View>
      <View style={{ gap: 8 }}>
        <Head>Share this receipt</Head>
        <Meta tone="tertiary" style={{ fontSize: 16, lineHeight: 24 }}>
          {line}
        </Meta>
      </View>
      <View style={{ gap: 28 }}>
        {way('chat', 'WhatsApp', 'The picture, ready to send')}
        {way('camera', 'Save to photos', 'It stays on this phone')}
        {way('receipt', 'Save as PDF', 'The full record, for an office')}
        {way('grid', 'Somewhere else', 'Messages, mail, anywhere you share')}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        <Icon name="eye" size={16} colour={colour.textTertiary} />
        <Meta tone="secondary" style={{ flex: 1 }}>
          Your balance and the full account numbers are left off every copy that leaves the phone.
        </Meta>
      </View>
      <Button label="Done" tone="grey" onPress={onClose} />
    </Sheet>
  );
}

/* The passcode over whatever is being paid for. Six digits and it goes; the
   face is the way past it on a phone that has one. */
export function PassSheet({
  amount,
  title,
  sub,
  hint,
  onDone,
  onClose,
  behind,
  error,
}: {
  amount: string;
  title: string;
  sub?: string;
  hint: string;
  onDone: () => void;
  onClose: () => void;
  behind?: ReactNode;
  error?: string;
}) {
  const [digits, setDigits] = useState('');
  const key = (k: string) => setDigits(d => (k === 'del' ? d.slice(0, -1) : (d + k).slice(0, 6)));
  useEffect(() => {
    if (digits.length < 6) return;
    const t = setTimeout(onDone, 150);
    return () => clearTimeout(t);
    /* the sixth digit is what finishes it */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);
  return (
    <Sheet onClose={onClose} behind={behind}>
      <View style={{ alignItems: 'center', gap: space.s3 }}>
        <Display>{amount}</Display>
        <Row>{title}</Row>
        {sub ? <Meta tone="tertiary">{sub}</Meta> : null}
      </View>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Head>Enter your passcode</Head>
        <Meta tone={error ? 'bad' : 'secondary'}>{error ?? 'Or tap the face to use Face ID.'}</Meta>
      </View>
      <Pips filled={digits.length} />
      <Keypad onKey={key} onFace={onDone} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
        <Icon name="lock" size={16} colour={colour.textTertiary} />
        <Meta tone="secondary">{hint}</Meta>
      </View>
    </Sheet>
  );
}
