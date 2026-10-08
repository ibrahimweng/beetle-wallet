/* The amount, picked on the page it is for — never on a page of its own.

   The figure at the top, large, rolling digit by digit as it changes; a
   tap on it and it is a field, for the exact figure, typed in place. Under
   it the line that says what it is capped at. Then the ruler: ticks
   running under a fixed line at the middle, dragged or flung, settling on
   a step with a light click from the phone at every step it passes, and
   stopping hard — with a firmer knock and a little give — at the end,
   which is the balance, what can be borrowed, or wherever the page says.
   The steps are finer where the money is small: ₦100 up to ₦10,000, ₦500
   up to ₦100,000, ₦1,000 above. Under the ruler, chips of the amounts most
   likely, any one of them a tap. */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, View, type LayoutChangeEvent, type TextStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Label, Meta } from './text';
import { Tap, settle, swipes, useStill } from './motion';
import { colour, dark, type as face } from './tokens';
import { feel } from './haptics';
import { lastStep, pickedAt, stepFor, stepOf, valueAt } from '../lib/steps';

export { lastStep, pickedAt, stepFor, stepOf, valueAt };

/** Where a longer tick goes: every ₦1,000 while the steps are ₦100, every ₦10,000 after. */
const major = (i: number) => {
  const v = valueAt(i);
  return v % (v <= 10_000 ? 1_000 : 10_000) === 0;
};

/** How far apart the steps are drawn. */
const GAP = 10;
/** Where a request has no cap, the ruler still has to end: typing goes past it. */
const RULER_END = 1_000_000;
/** The ruler is drawn in stretches of this many steps, and only the ones near the line are drawn. */
const CHUNK = 100;
const H = 48;

/** Naira, or dollars: the dollars run the same steps a hundred times smaller — $1 up to $100, $5 up to $1,000, $10 above. */
export type Unit = 'naira' | 'dollars';
const SCALE: Record<Unit, number> = { naira: 1, dollars: 0.01 };
const SIGN: Record<Unit, string> = { naira: '₦', dollars: '$' };
const LOCALE: Record<Unit, string> = { naira: 'en-NG', dollars: 'en-US' };
const money = (n: number, unit: Unit = 'naira') => SIGN[unit] + Math.floor(Math.abs(n)).toLocaleString(LOCALE[unit]);
const naira = (n: number) => money(n);
const koboOf = (n: number) => {
  const k = Math.round((Math.abs(n) % 1) * 100);
  return k ? '.' + String(k).padStart(2, '0') : '';
};

/** The picker on a light page, or on the dark card in the chat. */
export type PickerTone = 'light' | 'dark';
type Palette = {
  ink: string;
  faint: string;
  minor: string;
  major: string;
  bg: string;
  bg0: string;
  chip: string;
  chipText: string;
  chipOn: string;
  chipOnText: string;
  note: string;
  cap: string;
  bad: string;
};
const PALETTE: Record<PickerTone, Palette> = {
  light: {
    ink: colour.ink,
    faint: colour.textTertiary,
    minor: colour.ruleStrong,
    major: colour.textSecondary,
    bg: colour.surface,
    bg0: 'rgba(250,250,249,0)',
    chip: colour.surface2,
    chipText: colour.ink,
    chipOn: colour.ink,
    chipOnText: colour.textInverse,
    note: colour.textTertiary,
    cap: colour.accent,
    bad: colour.bad,
  },
  dark: {
    ink: dark.paper,
    faint: dark.label,
    minor: dark.edgeStrong,
    major: dark.label,
    bg: dark.panel,
    bg0: 'rgba(54,48,42,0)',
    chip: dark.edge,
    chipText: dark.paper,
    chipOn: dark.paper,
    chipOnText: colour.ink,
    note: dark.textSoft,
    cap: dark.link,
    bad: '#ffd48a',
  },
};

export type AmountPickerProps = {
  value: number;
  onChange: (amount: number) => void;
  /** the hard stop: the balance, or what can be borrowed; none where anything can be asked for */
  max?: number;
  /** the line under the figure: what it is capped at, or what it is for */
  note?: string;
  /** the amounts most likely, as chips under the ruler; any past the cap are left out */
  chips?: number[];
  /** a chip for all of it, with its own word */
  all?: string;
  unit?: Unit;
  /** light on a page, dark on the chat's card */
  tone?: PickerTone;
  /** the note is a warning: more than there is */
  warn?: boolean;
  testID?: string;
};

export function AmountPicker({ value, onChange, max, note, chips = [], all, unit = 'naira', tone = 'light', warn = false, testID = 'amount-picker' }: AmountPickerProps) {
  const pal = PALETTE[tone];
  const cap = max ?? Infinity;
  const k = SCALE[unit];
  const end = max ?? RULER_END * k;
  const last = lastStep(end / k);
  const [typing, setTyping] = useState(false);
  /* one row of them: three, or two and All of it */
  const shown = chips.filter(c => c <= cap && c !== max).slice(0, all && max ? 2 : 3);
  const pick = (v: number) => {
    feel.pick();
    ruler.current?.to(v, true);
    onChange(v);
  };
  const ruler = useRef<RulerHandle | null>(null);
  const atCap = max !== undefined && value >= max && value > 0;
  return (
    <View style={s.picker} testID={testID}>
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Figure
          pal={pal}
          unit={unit}
          value={value}
          typing={typing}
          onTyping={setTyping}
          cap={cap}
          onType={v => {
            onChange(v);
            ruler.current?.to(v, false);
          }}
        />
        {note ? (
          <Meta style={{ color: warn ? pal.bad : atCap ? pal.cap : pal.note, textAlign: 'center' }} testID="amount-note">
            {atCap && max !== undefined ? `All of it: ${money(max, unit)}${koboOf(max)}` : note}
          </Meta>
        ) : null}
      </View>
      <Ruler pal={pal} handle={ruler} value={value} last={last} end={end} scale={k} unit={unit} onPick={onChange} />
      {shown.length || all ? (
        <View style={s.chips} testID="amount-chips">
          {shown.map(c => (
            <Chip pal={pal} key={c} label={money(c, unit)} on={value === c} onPress={() => pick(c)} />
          ))}
          {all && max !== undefined && max > 0 ? <Chip pal={pal} label={all} on={value === max} onPress={() => pick(max)} /> : null}
        </View>
      ) : null}
    </View>
  );
}

/* ---- the figure ---- */

const FIG: TextStyle = { ...face.display, fontSize: 40, lineHeight: 48, letterSpacing: -1.2, fontVariant: ['tabular-nums'] };
const KOBO: TextStyle = { ...face.display, fontSize: 22, lineHeight: 28, color: colour.textTertiary, fontVariant: ['tabular-nums'] };

/* The figure, each character rolling on its own as it changes — up as the
   amount grows, down as it shrinks — or, tapped, the field it is typed in. */
function Figure({
  pal,
  value,
  typing,
  onTyping,
  onType,
  cap,
  unit,
}: {
  pal: Palette;
  value: number;
  typing: boolean;
  onTyping: (on: boolean) => void;
  onType: (v: number) => void;
  cap: number;
  unit: Unit;
}) {
  const before = useRef(value);
  const dir = useSharedValue(1);
  if (value !== before.current) {
    dir.value = value > before.current ? 1 : -1;
    before.current = value;
  }
  const [text, setText] = useState('');
  /* the field is as wide as what is in it, measured off an unseen twin, so the figure stays centred as it is typed */
  const [w, setW] = useState(24);
  const field = useRef<TextInput>(null);
  /* typing starts afresh: the figure as it stands is the grey hint, and the first digit replaces it */
  const hint = value ? Math.floor(value).toLocaleString(LOCALE[unit]) : '0';
  const open = () => {
    setText('');
    onTyping(true);
    setTimeout(() => field.current?.focus(), 30);
  };
  if (typing)
    return (
      <View style={s.figureRow}>
        <Animated.Text style={[FIG, { color: pal.ink }]}>{SIGN[unit]}</Animated.Text>
        <TextInput
          ref={field}
          value={text}
          onChangeText={t => {
            let v = Number(t.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9) || 0);
            /* past the cap it stops at the cap, with the knock the ruler gives at its end */
            if (v > cap) {
              v = Math.floor(cap);
              feel.stop();
            }
            setText(v ? v.toLocaleString(LOCALE[unit]) : '');
            onType(v);
          }}
          onBlur={() => onTyping(false)}
          onSubmitEditing={() => onTyping(false)}
          keyboardType="number-pad"
          returnKeyType="done"
          placeholder={hint}
          placeholderTextColor={pal.faint}
          style={[FIG, s.field, { width: w, color: pal.ink }]}
          accessibilityLabel="Type the amount"
          testID="amount-field"
        />
        <Animated.Text style={[FIG, s.twin]} onLayout={e => setW(Math.ceil(e.nativeEvent.layout.width) + 4)} aria-hidden>
          {text || hint}
        </Animated.Text>
      </View>
    );
  const whole = money(value, unit);
  const k = koboOf(value);
  return (
    <Tap accessibilityRole="button" accessibilityLabel={`${whole}${k}. Tap to type the amount`} onPress={open} scale={0.97} testID="amount-figure">
      <View style={s.figureRow}>
        {whole.split('').map((ch, i, all) => (
          /* keyed from the right, so the thousands stay put as a digit is added at the left */
          <Roll key={all.length - i} char={ch} dir={dir} style={[FIG, { color: value ? pal.ink : pal.faint }]} height={48} />
        ))}
        {k ? <Animated.Text style={[KOBO, { marginTop: 6, color: pal.faint }]}>{k}</Animated.Text> : null}
      </View>
    </Tap>
  );
}

/* One character of the figure: the new one comes in from below as the old one goes up and out, or the other way. */
function Roll({ char, dir, style, height }: { char: string; dir: { value: number }; style: object; height: number }) {
  const still = useStill();
  const [pair, setPair] = useState<{ now: string; was: string | null }>({ now: char, was: null });
  const t = useSharedValue(1);
  useEffect(() => {
    if (char === pair.now) return;
    setPair({ now: char, was: pair.now });
    if (still) return;
    t.value = 0;
    t.value = withTiming(1, { duration: 180, easing: settle });
  }, [char]); // eslint-disable-line react-hooks/exhaustive-deps
  const coming = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateY: (1 - t.value) * dir.value * height * 0.6 }] }));
  const going = useAnimatedStyle(() => ({ opacity: 1 - t.value, transform: [{ translateY: -t.value * dir.value * height * 0.6 }] }));
  return (
    <View style={{ height, overflow: 'hidden' }}>
      <Animated.Text style={[style, coming]}>{pair.now}</Animated.Text>
      {pair.was !== null && pair.was !== pair.now ? (
        <Animated.Text style={[style, StyleSheet.absoluteFill, going]} aria-hidden>
          {pair.was}
        </Animated.Text>
      ) : null}
    </View>
  );
}

/* ---- the ruler ---- */

type RulerHandle = { to: (v: number, set: boolean) => void };

function Ruler({
  pal,
  handle,
  value,
  last,
  end,
  scale,
  unit,
  onPick,
}: {
  pal: Palette;
  handle: React.MutableRefObject<RulerHandle | null>;
  value: number;
  last: number;
  end: number;
  /** a step's value in the ruler's own money: 1 for naira, 0.01 for dollars */
  scale: number;
  unit: Unit;
  onPick: (v: number) => void;
}) {
  const still = useStill();
  const [width, setWidth] = useState(0);
  /* the step a figure sits on: the cap is the last step, though it is not on the grid */
  const stepAt = (v: number) => Math.min(last, stepFor(v / scale, end / scale));
  const at = stepAt(value);
  /* where the ruler is: step i sits under the line when x is i gaps along */
  const x = useSharedValue(at * GAP);
  const from = useSharedValue(0);
  /** 1 while a finger or a fling moves it: the steps it passes are picks. 2 while it glides to a figure already set (a chip, a tick tapped):
      the figure is that one from the tap, and the steps on the way are not. 0 while it follows a typed figure. */
  const driven = useSharedValue(0);
  const [step, setStep] = useState(at);
  const maxX = last * GAP;

  const onStep = useCallback(
    (i: number, was: number, byHand: boolean) => {
      setStep(i);
      if (!byHand) return;
      onPick(Math.min(end, valueAt(i) * scale));
      if ((i === last || i === 0) && was !== i) feel.stop();
      else feel.tick();
    },
    [onPick, end, last, scale],
  );
  /* a tick tapped: its figure at once, as a chip's is, and the ruler glides to it */
  const tapped = useRef<(i: number) => void>(() => {});
  tapped.current = (i: number) => {
    onPick(Math.min(end, valueAt(i) * scale));
    if (i === last || i === 0) feel.stop();
    else feel.tick();
  };
  const onTapped = useCallback((i: number) => tapped.current(i), []);
  useAnimatedReaction(
    () => Math.max(0, Math.min(last, Math.round(x.value / GAP))),
    (i, was) => {
      if (was !== null && i !== was) runOnJS(onStep)(i, was, driven.value === 1);
    },
    [last, onStep],
  );

  /* moved from outside: a chip, a typed figure, or the page setting it. The figure is already
     set, so the ruler only glides to it: a step passed on the way is not a pick, or a tap on
     Confirm while it glides would take that step instead of the figure tapped */
  handle.current = {
    to(v, set) {
      const target = stepAt(v) * GAP;
      driven.value = set ? 2 : 0;
      if (still) x.value = target;
      else
        x.value = withTiming(target, { duration: 420, easing: settle }, done => {
          if (done) driven.value = 0;
        });
    },
  };
  /* the page changed the amount itself: follow it, without taking it for a pick */
  useEffect(() => {
    const here = Math.min(end, valueAt(Math.max(0, Math.min(last, Math.round(x.value / GAP)))) * scale);
    if (here === value || driven.value !== 0) return;
    handle.current?.to(value, false);
  }, [value, last, end, scale]); // eslint-disable-line react-hooks/exhaustive-deps

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .activeOffsetX([-6, 6])
      .failOffsetY([-14, 14])
      .onStart(() => {
        cancelAnimation(x);
        from.value = x.value;
        driven.value = 1;
        runOnJS(swipes.start)();
      })
      .onUpdate(e => {
        const raw = from.value - e.translationX;
        /* past either end it gives a little, and no further */
        x.value = raw < 0 ? raw * 0.25 : raw > maxX ? maxX + (raw - maxX) * 0.25 : raw;
      })
      .onEnd(e => {
        runOnJS(swipes.end)();
        const v = -e.velocityX;
        /* where a fling would come to rest, settled on the nearest step, and never past the ends */
        const rest = Math.max(0, Math.min(last, Math.round((x.value + v * 0.28) / GAP)));
        x.value = withSpring(rest * GAP, { damping: 30, stiffness: 150, mass: 1, velocity: v, overshootClamping: true }, done => {
          if (done) driven.value = 0;
        });
      });
    /* a tap on a tick goes to it */
    const tap = Gesture.Tap().onEnd(e => {
      const i = Math.max(0, Math.min(last, Math.round((x.value + (e.x - width / 2)) / GAP)));
      driven.value = 2;
      runOnJS(onTapped)(i);
      x.value = withTiming(i * GAP, { duration: 260, easing: settle }, done => {
        if (done) driven.value = 0;
      });
    });
    return Gesture.Exclusive(pan, tap);
  }, [x, from, driven, maxX, last, width, onTapped]);

  const strip = useAnimatedStyle(() => ({ transform: [{ translateX: width / 2 - x.value }] }));
  const chunk = Math.floor(step / CHUNK);
  const chunks = [chunk - 1, chunk, chunk + 1].filter(c => c >= 0 && c * CHUNK <= last);
  const nudge = (d: number) => {
    const i = Math.max(0, Math.min(last, step + d));
    const v = Math.min(end, valueAt(i) * scale);
    onPick(v);
    handle.current?.to(v, true);
  };
  return (
    <GestureDetector gesture={gesture}>
      <View
        style={s.ruler}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        accessibilityRole="adjustable"
        accessibilityLabel="Amount"
        accessibilityValue={{ text: money(value, unit) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={e => nudge(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
        testID="amount-ruler"
      >
        <Animated.View style={[StyleSheet.absoluteFill, strip]} pointerEvents="none">
          {chunks.map(c => (
            <Ticks key={c} from={c * CHUNK} to={Math.min(last, c * CHUNK + CHUNK - 1)} minorFill={pal.minor} majorFill={pal.major} />
          ))}
        </Animated.View>
        {/* the ends fade, so the ruler runs on rather than stops at the page's edge */}
        <LinearGradient colors={[pal.bg, pal.bg0]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.fade, { left: 0 }]} pointerEvents="none" />
        <LinearGradient colors={[pal.bg0, pal.bg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.fade, { right: 0 }]} pointerEvents="none" />
        <View style={[s.line, { left: width / 2 - 1.5, backgroundColor: pal.ink }]} pointerEvents="none" testID="amount-line" />
      </View>
    </GestureDetector>
  );
}

/* One stretch of ticks, drawn as two paths: the short grey ones, and the longer ones at the round figures. */
const Ticks = React.memo(function Ticks({ from, to, minorFill, majorFill }: { from: number; to: number; minorFill: string; majorFill: string }) {
  let minor = '';
  let big = '';
  for (let i = from; i <= to; i++) {
    const cx = (i - from) * GAP;
    if (major(i)) big += `M${cx - 0.75} 14h1.5v22h-1.5z`;
    else minor += `M${cx - 0.75} 24h1.5v12h-1.5z`;
  }
  const w = (to - from) * GAP + 2;
  return (
    <Svg width={w + 2} height={H} style={{ position: 'absolute', left: from * GAP - 1, top: 0 }}>
      <Path d={minor} fill={minorFill} transform="translate(1 0)" />
      <Path d={big} fill={majorFill} transform="translate(1 0)" />
    </Svg>
  );
});

/* ---- a chip ---- */

function Chip({ pal, label, on, onPress }: { pal: Palette; label: string; on: boolean; onPress: () => void }) {
  return (
    <Tap
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      onPress={onPress}
      scale={0.94}
      style={[s.chip, { backgroundColor: on ? pal.chipOn : pal.chip }]}
      testID="amount-chip"
    >
      <Label style={{ color: on ? pal.chipOnText : pal.chipText }}>{label}</Label>
    </Tap>
  );
}

const s = StyleSheet.create({
  picker: { gap: 16 },
  figureRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', height: 48 },
  /* no outline: the browser's focus ring has no place on the figure */
  field: { padding: 0, color: colour.ink, textAlign: 'left', outlineWidth: 0 },
  twin: { position: 'absolute', opacity: 0, left: 0, top: -1000 },
  ruler: { height: H, overflow: 'hidden' },
  fade: { position: 'absolute', top: 0, bottom: 0, width: 56 },
  line: { position: 'absolute', top: 8, width: 3, height: 32, borderRadius: 1.5, backgroundColor: colour.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  chip: { height: 36, borderRadius: 18, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
});
