/* The way in, as one screen.

   Nothing here navigates until home. The screen stays; what changes is the
   colour of the wash at the top, the glyph above the title, the stack of
   finished steps above that, the title, the line under it, what sits
   beneath, and what waits at the bottom. A step that is done sends its
   title up into the stack — the words themselves travel, shrinking as they
   go — and the next step's title takes its place. Content arrives from below
   out of a blur and leaves upward into one; the keypad and the button rise
   and drop like a keyboard. Going back runs the same movements the other
   way.

   What each stage shows is in views.tsx. This file is the choreography. */
import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { interpolateColor, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Body, Button, Display, Head, Icon, Keypad, Meta, Pane, Pop, Row as RowText, Swap, Tick, Wash, away, blurred, colour, keys, motion, settle, soft, standard, useLeave, useStill } from '../../design';
import type { IconName } from '../../icons';
import { useApp } from './store';
import { useFocused } from './useGuard';
import { initialStage, rowsFor, type Row, type Stage } from './stages';
import { buildView, type Bar, type Ctx, type Note } from './views';

/* The geometry the glide is written against: a 32 glyph, 8 under it, the
   title 40 tall; the stack 20 above the band, its rows 24 tall with 16
   between, a row's label 36 in. */
const SIDE = 20;
const GLYPH = 32;
const GLYPH_GAP = 8;
const ROW_H = 24;
const ROW_GAP = 16;
const STACK_GAP = 20;
const ROW_INSET = 36;
/** from the title's top to the top of the row it becomes */
const ROW_DY = -(STACK_GAP + ROW_H + GLYPH + GLYPH_GAP);

type Dir = 1 | -1;
type TitleMove = 'up' | 'down' | 'plain';

export function WayIn() {
  const app = useApp();
  const router = useRouter();
  const still = useStill();
  const focused = useFocused();
  const { leaving, leave } = useLeave();

  const [stage, setStage] = useState<Stage | null>(null);
  const [dir, setDir] = useState<Dir>(1);
  const [titleMove, setTitleMove] = useState<TitleMove>('plain');
  const [digits, setDigits] = useState('');
  const [note, setNote] = useState<Note>(null);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [wait, setWait] = useState(0);
  const [first, setFirst] = useState<string | null>(null);
  const [faceState, setFaceState] = useState<'idle' | 'checking' | 'failed'>('idle');
  const [unknown, setUnknown] = useState(false);
  const [phoneIn, setPhoneIn] = useState('');
  const [lastNumber, setLastNumber] = useState('');
  const [words, setWords] = useState(1);
  const gone = useRef(false);
  const stageRef = useRef<Stage | null>(null);
  stageRef.current = stage;

  /* where to start, once what the device knows has been read back */
  useEffect(() => {
    if (app.ready && stage === null) setStage(initialStage(app.progress, app.session));
  }, [app.ready, stage, app.progress, app.session]);

  /* a session that has seen the ready screen belongs at home */
  useEffect(() => {
    if (app.ready && focused && app.session && !app.progress.accountNumber && !gone.current) router.replace('/home');
  }, [app.ready, focused, app.session, app.progress.accountNumber, router]);

  /* the half minute a code is given before another can be asked for */
  useEffect(() => {
    if (!(stage === 'code' || stage === 'signcode') || wait <= 0) return;
    const t = setTimeout(() => setWait(w => w - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, wait]);

  /* the welcome's four words, taking turns */
  useEffect(() => {
    if (stage !== 'welcome' || still) return;
    const t = setInterval(() => setWords(i => (i + 1) % 4), 1600);
    return () => clearInterval(t);
  }, [stage, still]);

  const go = useCallback(
    (next: Stage, direction: Dir = 1) => {
      const cur = stageRef.current;
      if (cur) {
        const before = rowsFor(cur).length;
        const after = rowsFor(next).length;
        setTitleMove(after > before ? 'up' : after < before ? 'down' : 'plain');
      }
      setStage(next);
      setDir(direction);
      setDigits(next === 'number' ? (app.progress.phone ?? '') : '');
      setNote(null);
      setShake(0);
      setBusy(false);
      if (next === 'passcode') setFirst(null);
      if (next === 'face') setFaceState('idle');
      if (next === 'signin') setUnknown(false);
    },
    [app.progress.phone],
  );

  const toHome = useCallback(
    (after?: () => Promise<void>) => {
      gone.current = true;
      leave(async () => {
        await after?.();
        router.replace('/home');
      });
    },
    [leave, router],
  );

  const keyRef = useRef<((k: string) => void) | undefined>(undefined);
  const rows = useMemo(() => (stage ? rowsFor(stage) : []), [stage]);

  if (!stage) return <View style={{ flex: 1, backgroundColor: colour.surface }} />;

  const ctx: Ctx = {
    stage,
    app,
    still,
    digits,
    setDigits,
    note,
    setNote,
    busy,
    setBusy,
    shake,
    bump: () => setShake(s => s + 1),
    wrong,
    setWrong,
    wait,
    setWait,
    first,
    setFirst,
    faceState,
    setFaceState,
    unknown,
    setUnknown,
    phoneIn,
    setPhoneIn,
    lastNumber,
    setLastNumber,
    words,
    go,
    toHome,
  };
  const view = buildView(ctx);
  keyRef.current = view.keypad;
  const bottomKind = view.keypad ? 'keypad' : view.welcome ? 'welcome' : view.bar ? 'bar' : 'none';

  return (
    <Pane leaving={leaving} style={{ flex: 1, backgroundColor: colour.surface }}>
      <WashFade wash={view.wash} receded={!!view.keypad && digits.length > 0} />
      <BackChevron onPress={view.back} />
      <View style={{ flex: 1, paddingHorizontal: SIDE, justifyContent: 'flex-end', paddingBottom: 28, gap: STACK_GAP }}>
        <Stack rows={rows} above={view.above} aboveKey={view.above ? stage : 'none'} dir={dir} />
        <HeadBand icon={view.icon} tint={view.tint} title={view.title} small={!!view.small} sub={view.sub} stage={stage} move={titleMove} dir={dir} />
        <Slot id={view.bodyKey} from={dir * 24} to={dir * -24}>
          {view.body}
        </Slot>
      </View>
      <Slot id={`bottom:${bottomKind}`} from={120} to={120} delay={120} spring>
        {bottomKind === 'keypad' ? (
          <View style={{ paddingHorizontal: SIDE, opacity: busy ? 0.5 : 1 }}>
            <Keypad onKey={k => keyRef.current?.(k)} />
            <View style={{ height: 24 }} />
          </View>
        ) : bottomKind === 'bar' && view.bar ? (
          <BarBlock bar={view.bar} />
        ) : bottomKind === 'welcome' ? (
          <View style={{ paddingHorizontal: SIDE, paddingBottom: 36 }}>
            <Button label="Open an account" onPress={() => go('number')} />
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 16 }}>
              <Body tone="tertiary">Already have one?</Body>
              <Pressable onPress={() => go('signin')} accessibilityRole="button">
                <RowText tone="accent">Sign in</RowText>
              </Pressable>
            </View>
          </View>
        ) : null}
      </Slot>
    </Pane>
  );
}

/* ---- the wash ---- */

/* The colour at the top. A new colour fades in as the old one fades out, so
   the wash reads as one thing changing colour; no colour fades it away. While
   digits are being typed it recedes, and comes back if the field is cleared. */
type WashLayer = { key: number; wash?: { tone: string; height?: number }; out: boolean };
function WashFade({ wash, receded }: { wash?: { tone: string; height?: number }; receded: boolean }) {
  const still = useStill();
  const [layers, setLayers] = useState<WashLayer[]>(() => [{ key: 0, wash, out: false }]);
  const tone = wash?.tone;
  const height = wash?.height;
  useEffect(() => {
    setLayers(current => {
      const alive = current.filter(l => !l.out);
      const last = alive[alive.length - 1];
      if (last && last.wash?.tone === tone && last.wash?.height === height) return current;
      const key = (current[current.length - 1]?.key ?? 0) + 1;
      const going = alive.map(l => ({ ...l, out: true }));
      if (!tone) return [...going, { key, wash: undefined, out: false }];
      return [...going, { key, wash: { tone, height }, out: false }];
    });
  }, [tone, height]);
  const drop = useCallback((key: number) => setLayers(current => current.filter(l => l.key !== key)), []);

  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(receded ? 1 : 0, { duration: still ? 0 : motion.recede, easing: soft });
  }, [receded, still, t]);
  const receding = useAnimatedStyle(() => ({ opacity: 1 - t.value * 0.65 }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: 260 }, receding]}>
      {layers.map((l, i) => (
        <WashPane key={l.key} layer={l} first={i === 0 && layers.length === 1} onGone={() => drop(l.key)} />
      ))}
    </Animated.View>
  );
}

function WashPane({ layer, first, onGone }: { layer: WashLayer; first: boolean; onGone: () => void }) {
  const still = useStill();
  const t = useSharedValue(first || still ? 1 : 0);
  const gone = useRef(onGone);
  gone.current = onGone;
  useEffect(() => {
    if (layer.out) {
      t.value = withTiming(0, { duration: still ? 0 : motion.enter, easing: soft }, finished => {
        if (finished) runOnJS(gone.current)();
      });
    } else if (!first) {
      t.value = withTiming(1, { duration: still ? 0 : motion.enter, easing: soft });
    }
  }, [layer.out]); // eslint-disable-line react-hooks/exhaustive-deps
  const fading = useAnimatedStyle(() => ({ opacity: t.value }));
  if (!layer.wash) return null;
  return (
    <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0 }, fading]}>
      <Wash tone={layer.wash.tone} height={layer.wash.height} />
    </Animated.View>
  );
}

/* ---- the way back ---- */

function BackChevron({ onPress }: { onPress?: () => void }) {
  const still = useStill();
  const t = useSharedValue(onPress ? 1 : 0);
  useEffect(() => {
    t.value = withTiming(onPress ? 1 : 0, { duration: still ? 0 : motion.swap, easing: settle });
  }, [!!onPress]); // eslint-disable-line react-hooks/exhaustive-deps
  const fading = useAnimatedStyle(() => ({ opacity: t.value }));
  return (
    <Animated.View pointerEvents={onPress ? 'auto' : 'none'} style={[{ position: 'absolute', top: 52, left: 8, zIndex: 2 }, fading]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onPress} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="back" size={22} />
      </Pressable>
    </Animated.View>
  );
}

/* ---- the stack above the title ---- */

type Shown = { row: Row; mode: 'still' | 'in' | 'out' };

/* The steps done so far, one row each, and on the welcome the four words
   instead. A row arrives as its title glides up into it and leaves as the
   title glides back down. */
function Stack({ rows, above, aboveKey, dir }: { rows: Row[]; above: ReactNode; aboveKey: string; dir: Dir }) {
  const [shown, setShown] = useState<Shown[]>(() => rows.map(row => ({ row, mode: 'still' })));
  useEffect(() => {
    setShown(current => {
      const alive = current.filter(r => r.mode !== 'out');
      const have = alive.map(r => r.row.label).join('|');
      const want = rows.map(r => r.label).join('|');
      if (have === want) return current;
      const last = rows[rows.length - 1];
      const keep = alive.map(r => ({ ...r, mode: 'still' as const }));
      if (last && rows.length === alive.length + 1 && rows.slice(0, -1).map(r => r.label).join('|') === have) return [...keep, { row: last, mode: 'in' }];
      const going = alive[alive.length - 1];
      if (going && alive.length === rows.length + 1 && alive.slice(0, -1).map(r => r.row.label).join('|') === want) return [...keep.slice(0, -1), { ...going, mode: 'out' }];
      return rows.map(row => ({ row, mode: 'still' as const }));
    });
  }, [rows]);
  const drop = useCallback((label: string) => setShown(current => current.filter(r => !(r.mode === 'out' && r.row.label === label))), []);
  return (
    <View>
      <Slot id={aboveKey} from={dir * 24} to={dir * -24}>
        {above}
      </Slot>
      {shown.map(r => (
        <StackRow key={r.row.label} row={r.row} mode={r.mode} onGone={() => drop(r.row.label)} />
      ))}
    </View>
  );
}

function StackRow({ row, mode, onGone }: { row: Row; mode: Shown['mode']; onGone: () => void }) {
  const still = useStill();
  const t = useSharedValue(mode === 'in' && !still ? 0 : 1);
  const gone = useRef(onGone);
  gone.current = onGone;
  useEffect(() => {
    if (mode === 'in' && !still) t.value = withTiming(1, { duration: motion.enter, easing: settle });
    if (mode === 'out')
      t.value = withTiming(0, { duration: still ? 0 : motion.enter, easing: settle }, finished => {
        if (finished) runOnJS(gone.current)();
      });
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps
  const sizing = useAnimatedStyle(() => ({ height: (ROW_H + ROW_GAP) * t.value }));
  /* the words are the ghost's until it lands; the row's own take over at the end */
  const showing = useAnimatedStyle(() => ({ opacity: mode === 'still' ? 1 : Math.max(0, Math.min(1, (t.value - 0.84) / 0.16)) }));
  return (
    <Animated.View style={[{ overflow: 'hidden', justifyContent: 'flex-end' }, sizing]}>
      <Animated.View style={[{ height: ROW_H + ROW_GAP, paddingTop: ROW_GAP, flexDirection: 'row', alignItems: 'center', gap: 12 }, showing]}>
        {mode === 'in' ? (
          <Pop delay={Math.round(motion.enter * 0.84)}>
            <Icon name={row.icon} size={24} />
          </Pop>
        ) : (
          <Icon name={row.icon} size={24} />
        )}
        <Body tone="tertiary">{row.label}</Body>
      </Animated.View>
    </Animated.View>
  );
}

/* ---- the head band: glyph, title, line ---- */

function HeadBand({ icon, tint, title, small, sub, stage, move, dir }: { icon: IconName | 'tick'; tint?: string; title: string; small: boolean; sub: string; stage: Stage; move: TitleMove; dir: Dir }) {
  return (
    <View style={{ gap: GLYPH_GAP }}>
      <Glyph icon={icon} tint={tint} />
      <TitleTrack title={title} small={small} stage={stage} move={move} dir={dir} />
      <Swap value={sub}>{shown => <Meta tone="secondary">{shown}</Meta>}</Swap>
    </View>
  );
}

/* The glyph above the title. A new one lands a beat after the old has gone. */
type GlyphLayer = { key: string; icon: IconName | 'tick'; tint?: string; out: boolean };
function Glyph({ icon, tint }: { icon: IconName | 'tick'; tint?: string }) {
  const key = `${icon}|${tint ?? ''}`;
  const [layers, setLayers] = useState<GlyphLayer[]>(() => [{ key, icon, tint, out: false }]);
  useEffect(() => {
    setLayers(current => {
      const live = current.find(l => !l.out);
      if (live && live.key === key) return current;
      return [...current.filter(l => !l.out).map(l => ({ ...l, out: true })), { key, icon, tint, out: false }];
    });
  }, [key, icon, tint]);
  const drop = useCallback((k: string) => setLayers(current => current.filter(l => !(l.out && l.key === k))), []);
  return (
    <View style={{ width: GLYPH, height: GLYPH }}>
      {layers.map(l => (
        <GlyphLayerView key={l.key} layer={l} onGone={() => drop(l.key)} />
      ))}
    </View>
  );
}

function GlyphLayerView({ layer, onGone }: { layer: GlyphLayer; onGone: () => void }) {
  const still = useStill();
  const t = useSharedValue(1);
  const gone = useRef(onGone);
  gone.current = onGone;
  useEffect(() => {
    if (!layer.out) return;
    t.value = withTiming(0, { duration: still ? 0 : motion.leave, easing: away }, finished => {
      if (finished) runOnJS(gone.current)();
    });
  }, [layer.out]); // eslint-disable-line react-hooks/exhaustive-deps
  const fading = useAnimatedStyle(() => ({ opacity: t.value, ...blurred((1 - t.value) * 4) }));
  const glyph = layer.icon === 'tick' ? <Tick on size={GLYPH} /> : <Icon name={layer.icon} size={GLYPH} colour={layer.tint} />;
  return (
    <Animated.View style={[{ position: 'absolute', top: 0, left: 0 }, fading]}>
      {layer.out ? glyph : <Pop>{glyph}</Pop>}
    </Animated.View>
  );
}

/* The title, and where it goes when the stage changes. Up: it glides into
   the stack, shrinking from 32 to 16 and greying, while the new title
   arrives from below. Down: the row's words glide back into the title's
   place. Plain: the old leaves upward into a blur and the new arrives from
   below. A title that changes within a stage swaps in place. */
type Ghost = { text: string; kind: 'up' | 'down' | 'plain' | 'swap'; dir: Dir; key: number };
function TitleTrack({ title, small, stage, move, dir }: { title: string; small: boolean; stage: Stage; move: TitleMove; dir: Dir }) {
  const still = useStill();
  const [shown, setShown] = useState({ title, stage, small });
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [waiting, setWaiting] = useState(false);
  if (title !== shown.title) {
    const kind: Ghost['kind'] = stage === shown.stage ? 'swap' : move;
    if (!still) {
      setGhost({ text: kind === 'down' ? title : shown.title, kind, dir, key: Date.now() });
      setWaiting(kind === 'down');
    }
    setShown({ title, stage, small });
  }
  const landed = useCallback(() => {
    setGhost(null);
    setWaiting(false);
  }, []);
  return (
    <View style={{ minHeight: small ? 24 : 40 }}>
      <TitleText key={`${shown.stage}:${shown.title}`} text={shown.title} small={shown.small} dir={dir} hidden={waiting} />
      {ghost ? <GhostTitle key={ghost.key} ghost={ghost} onDone={landed} /> : null}
    </View>
  );
}

function TitleText({ text, small, dir, hidden }: { text: string; small: boolean; dir: Dir; hidden: boolean }) {
  const still = useStill();
  const t = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    t.value = withDelay(160, withTiming(1, { duration: motion.enter, easing: standard }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const arriving = useAnimatedStyle(() => ({
    opacity: hidden ? 0 : t.value,
    transform: [{ translateY: (1 - t.value) * 12 * dir }],
    ...blurred((1 - t.value) * motion.blur),
  }));
  const T = small ? Head : Display;
  return (
    <Animated.View style={arriving} testID="title">
      <T>{text}</T>
    </Animated.View>
  );
}

function GhostTitle({ ghost, onDone }: { ghost: Ghost; onDone: () => void }) {
  const p = useSharedValue(ghost.kind === 'down' ? 1 : 0);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const finish = (finished?: boolean) => {
      if (finished) runOnJS(done.current)();
    };
    if (ghost.kind === 'up') p.value = withTiming(1, { duration: motion.enter, easing: settle }, finish);
    else if (ghost.kind === 'down') p.value = withTiming(0, { duration: motion.enter, easing: settle }, finish);
    else p.value = withTiming(1, { duration: motion.leave, easing: away }, finish);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const moving = useAnimatedStyle(() => {
    if (ghost.kind === 'up' || ghost.kind === 'down') {
      /* p is how far along the row's place it is: 0 at the title, 1 in the stack */
      const last = ghost.kind === 'up' ? Math.max(0, Math.min(1, (p.value - 0.84) / 0.16)) : 0;
      const early = ghost.kind === 'down' ? Math.max(0, Math.min(1, (1 - p.value) / 0.16)) : 1;
      return {
        opacity: ghost.kind === 'up' ? 1 - last : early,
        fontSize: 32 + (16 - 32) * p.value,
        lineHeight: 40 + (24 - 40) * p.value,
        color: interpolateColor(p.value, [0, 1], [colour.ink, colour.textTertiary]),
        transform: [{ translateX: ROW_INSET * p.value }, { translateY: ROW_DY * p.value }],
      };
    }
    return {
      opacity: 1 - p.value,
      fontSize: 32,
      lineHeight: 40,
      color: colour.ink,
      transform: [{ translateY: ghost.kind === 'plain' ? -16 * ghost.dir * p.value : 0 }],
      ...blurred(p.value * motion.blur),
    };
  });
  return (
    <Animated.Text pointerEvents="none" numberOfLines={1} style={[{ position: 'absolute', top: 0, left: 0, fontWeight: '700', letterSpacing: -0.5 }, moving]} testID="ghost">
      {ghost.text}
    </Animated.Text>
  );
}

/* ---- a slot whose content is replaced ---- */

/* What is in the slot arrives from below out of a blur; what was there
   leaves upward into one, drawn where it was until it has gone. The slot's
   height moves smoothly from the old content's to the new, so the head band
   above it never jumps. The bottom of the screen uses the same slot with the
   keypad's spring, going down instead of up. */
type Snap = { key: string; node: ReactNode };
function Slot({ id, children, from = 24, to = -24, delay = 160, spring = false, style }: { id: string; children: ReactNode; from?: number; to?: number; delay?: number; spring?: boolean; style?: StyleProp<ViewStyle> }) {
  const still = useStill();
  const [shownId, setShownId] = useState(id);
  const [leaving, setLeaving] = useState<Snap | null>(null);
  const last = useRef<ReactNode>(children);
  if (id !== shownId) {
    if (!still) setLeaving({ key: `${shownId}:${Date.now()}`, node: last.current });
    setShownId(id);
  }
  last.current = children;
  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => setLeaving(null), motion.leave + 60);
    return () => clearTimeout(t);
  }, [leaving]);
  const h = useSharedValue(-1);
  const sizing = useAnimatedStyle(() => (h.value < 0 ? {} : { height: h.value }));
  const measured = (e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.height;
    if (h.value < 0 || still) h.value = next;
    else if (Math.abs(h.value - next) > 0.5) h.value = withTiming(next, { duration: motion.enter, easing: settle });
  };
  return (
    <Animated.View style={[style, sizing]}>
      <Arriving key={shownId} from={from} delay={delay} spring={spring} onLayout={measured}>
        {children}
      </Arriving>
      {leaving ? (
        <Leaving key={leaving.key} to={to}>
          {leaving.node}
        </Leaving>
      ) : null}
    </Animated.View>
  );
}

function Arriving({ children, from, delay, spring, onLayout }: { children: ReactNode; from: number; delay: number; spring: boolean; onLayout: (e: LayoutChangeEvent) => void }) {
  const still = useStill();
  const t = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    t.value = withDelay(delay, spring ? withSpring(1, keys) : withTiming(1, { duration: motion.enter, easing: standard }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const moving = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value),
    transform: [{ translateY: (1 - t.value) * from }],
    ...blurred(Math.max(0, 1 - t.value) * motion.blur),
  }));
  return (
    <Animated.View onLayout={onLayout} style={moving}>
      {children}
    </Animated.View>
  );
}

function Leaving({ children, to }: { children: ReactNode; to: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: motion.leave, easing: away });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const moving = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [{ translateY: t.value * to }],
    ...blurred(t.value * motion.blur),
  }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, bottom: 0 }, moving]} testID="leaving">
      {children}
    </Animated.View>
  );
}

/* The black button at the foot of a stage that is not typing. */
function BarBlock({ bar }: { bar: Bar }) {
  return (
    <View style={{ paddingHorizontal: SIDE, paddingVertical: 24 }}>
      <Button label={bar.label} onPress={bar.onPress} disabled={bar.disabled} />
    </View>
  );
}
