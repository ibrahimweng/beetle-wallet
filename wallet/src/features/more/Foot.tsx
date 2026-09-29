/* One foot for the whole app, over the stack, the way Fuse keeps its own.
   On home it is the bar: Home, Activities and Settings as bare glyphs at
   the left, the black plus at the right, on a white surface with its top
   corners rounded and a soft shadow above. On a page that needs a way
   back it becomes Back and the ask bar — or Back and the page's one
   button — so Back is always at the bottom left. The change is one
   movement: the plus scales away, the three glyphs slide right and become
   the bar, and Back slides in from the left edge; on the way back it runs
   in reverse. Each screen says what its foot holds (`useFoot`), and the
   foot morphs to it when that screen has focus; a screen that says
   nothing has none. More, up out of the plus, lives here too, since the
   plus does. The dock's numbers are the frames': 104 tall, the row 56 and
   24 above and below, 16 in from either side, Back 44, the bar 48, the
   button 56. */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useNavigation, usePathname, useRouter } from 'expo-router';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ActionButton, Button, Icon, Tap, blurred, colour, frame, motion, settle, useDeparture, useStill } from '../../design';
import type { IconName } from '../../icons';
import { More, moreTo, type MoreItem } from './More';

export const BAR_H = 56 + 2 * frame.dockPad;

/** What a screen's own overlay does to the foot: under a peek's blur it
    recedes with the rest; under a sheet from the bottom it goes out of the way. */
export type Veil = 'recede' | 'away';

export type FootSpec =
  /** home: the bar, going down with the card as it opens */
  | { kind: 'bar'; open?: SharedValue<number>; hidden?: boolean; onPick?: (item: MoreItem) => void; veil?: Veil }
  /** a page: Back and the ask bar, with the plus where the frame draws one */
  | { kind: 'ask'; placeholder: string; onAsk: (q: string) => void; onScan?: () => void; more?: boolean; onPick?: (item: MoreItem) => void; veil?: Veil }
  /** a page with one thing to do: Back beside its button */
  | { kind: 'button'; label: string; onPress: () => void; disabled?: boolean; veil?: Veil }
  | { kind: 'none' };

/* ---- what the screen with focus declared ---- */

type Held = { path: string; spec: FootSpec };
const NONE: FootSpec = { kind: 'none' };
let held: Held = { path: '', spec: NONE };
let moreWanted = false;
const listeners = new Set<() => void>();
const tell = () => listeners.forEach(l => l());

export const foot = {
  /** More, from outside the foot: the lab opens home with it up */
  openMore() {
    moreWanted = true;
    tell();
  },
};

/** The shape of a spec, without what it does: a change of it is worth pushing. */
const shapeOf = (s: FootSpec) => {
  switch (s.kind) {
    case 'bar':
      return `bar|${s.hidden ? 1 : 0}|${s.open ? 1 : 0}|${s.veil ?? ''}`;
    case 'ask':
      return `ask|${s.placeholder}|${s.more ? 1 : 0}|${s.veil ?? ''}`;
    case 'button':
      return `button|${s.label}|${s.disabled ? 1 : 0}|${s.veil ?? ''}`;
    default:
      return 'none';
  }
};

/** What a screen's foot holds while it has focus. Callbacks are read at
    press time, so the spec may be written inline. */
export function useFoot(spec: FootSpec) {
  const path = usePathname();
  const navigation = useNavigation();
  const latest = useRef(spec);
  latest.current = spec;
  const shape = shapeOf(spec);
  const push = useCallback(() => {
    const s = latest.current;
    let wrapped: FootSpec = s;
    if (s.kind === 'ask') {
      wrapped = {
        ...s,
        onAsk: q => {
          const n = latest.current;
          if (n.kind === 'ask') n.onAsk(q);
        },
        onScan: () => {
          const n = latest.current;
          if (n.kind === 'ask') n.onScan?.();
        },
        onPick: s.onPick
          ? item => {
              const n = latest.current;
              if (n.kind === 'ask') n.onPick?.(item);
            }
          : undefined,
      };
    } else if (s.kind === 'button') {
      wrapped = {
        ...s,
        onPress: () => {
          const n = latest.current;
          if (n.kind === 'button') n.onPress();
        },
      };
    } else if (s.kind === 'bar') {
      wrapped = {
        ...s,
        onPick: s.onPick
          ? item => {
              const n = latest.current;
              if (n.kind === 'bar') n.onPick?.(item);
            }
          : undefined,
      };
    }
    held = { path, spec: wrapped };
    tell();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, shape]);
  /* said as the screen mounts, if it is the one with focus — so the foot
     morphs as the screen arrives, not after — and again whenever focus returns */
  useEffect(() => {
    if (navigation.isFocused()) push();
  }, [push, navigation]);
  useFocusEffect(
    useCallback(() => {
      push();
    }, [push]),
  );
}

/* ---- the foot itself ---- */

/** How far the foot goes down to be out of the way. */
const AWAY = BAR_H + 16;
/** The glyph row: three 44 targets 12 apart, the first 18 in. */
const PILL_LEFT = 18;
const PILL_W = 44 * 3 + 12 * 2;

export function Foot() {
  const pathname = usePathname();
  const router = useRouter();
  const still = useStill();
  const { width: W } = useWindowDimensions();
  const [cur, setCur] = useState<Held>(held);
  const [more, setMore] = useState(false);
  useEffect(() => {
    const l = () => {
      setCur({ ...held });
      if (moreWanted) {
        moreWanted = false;
        setMore(true);
      }
    };
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  /* the spec of the screen showing; one declared for another screen is
     stale, and a screen that declares nothing has no foot after a beat */
  const [spec, setSpec] = useState<FootSpec>(NONE);
  useEffect(() => {
    if (cur.path === pathname) {
      setSpec(cur.spec);
      return;
    }
    const t = setTimeout(() => setSpec(NONE), 200);
    return () => clearTimeout(t);
  }, [cur, pathname]);

  const kind = spec.kind;
  const page = kind === 'ask' || kind === 'button';
  const hasAction = kind === 'bar' || (kind === 'ask' && !!spec.more);
  const open = kind === 'bar' ? spec.open : undefined;
  const barHidden = kind === 'bar' && !!spec.hidden;
  const veil = kind === 'none' ? undefined : spec.veil;
  const away = kind === 'none' || veil === 'away';

  /* 0 the bar, 1 a page; 1 where a plus stays; 1 for a button rather than the ask bar; 1 gone */
  const t = useSharedValue(page ? 1 : 0);
  const a = useSharedValue(hasAction ? 1 : 0);
  const b = useSharedValue(kind === 'button' ? 1 : 0);
  const hide = useSharedValue(away ? 1 : 0);
  const dim = useSharedValue(veil === 'recede' ? 1 : 0);
  const kb = useSharedValue(0);
  const prev = useRef(kind);
  const hiddenAt = useRef(0);
  useEffect(() => {
    const from = prev.current;
    prev.current = kind;
    if (kind === 'none') hiddenAt.current = Date.now();
    /* a foot appearing from nothing takes its shape at once; only a change of
       shape is a movement — and a foot that was gone for a moment between two
       screens still moves from the one shape to the other */
    const brief = from === 'none' && Date.now() - hiddenAt.current < 700;
    const jump = still || (from === 'none' && !brief);
    const go = (sv: SharedValue<number>, v: number) => {
      sv.value = jump ? v : withTiming(v, { duration: motion.screen, easing: settle });
    };
    if (kind !== 'none') {
      go(t, page ? 1 : 0);
      go(a, hasAction ? 1 : 0);
      go(b, kind === 'button' ? 1 : 0);
    }
    hide.value = still ? (away ? 1 : 0) : withTiming(away ? 1 : 0, { duration: motion.screen, easing: settle });
  }, [kind, page, hasAction, away, still, t, a, b, hide]);
  /* under a peek's blur the foot recedes with the rest, and comes forward again after */
  useEffect(() => {
    const v = veil === 'recede' ? 1 : 0;
    dim.value = still ? v : withTiming(v, { duration: v ? motion.leave : motion.enter, easing: settle });
  }, [veil, still, dim]);

  /* what is drawn inside the moving box: the glyphs stay through a morph
     away from them and go once it is done, the bar likewise */
  const [glyphsUp, setGlyphsUp] = useState(!page);
  const [barUp, setBarUp] = useState(page);
  useEffect(() => {
    if (page) {
      setBarUp(true);
      const x = setTimeout(() => setGlyphsUp(false), still ? 0 : motion.screen + 40);
      return () => clearTimeout(x);
    }
    if (kind === 'bar') {
      setGlyphsUp(true);
      const x = setTimeout(() => setBarUp(false), still ? 0 : motion.screen + 40);
      return () => clearTimeout(x);
    }
    return undefined;
  }, [page, kind, still]);

  /* the keyboard lifts a page's foot on iOS, where the window does not shrink for it; home's card handles its own */
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const s = Keyboard.addListener('keyboardWillShow', e => {
      kb.value = withTiming(e.endCoordinates.height, { duration: 220, easing: settle });
    });
    const h = Keyboard.addListener('keyboardWillHide', () => {
      kb.value = withTiming(0, { duration: 220, easing: settle });
    });
    return () => {
      s.remove();
      h.remove();
    };
  }, [kb]);

  const surface = useAnimatedStyle(
    () => ({
      transform: [{ translateY: hide.value * AWAY + (open ? open.value : 0) * AWAY - kb.value * t.value }],
      borderTopLeftRadius: 32 * (1 - t.value),
      borderTopRightRadius: 32 * (1 - t.value),
      shadowOpacity: 0.06 * (1 - t.value),
      opacity: 1 - dim.value * 0.55,
      ...blurred(dim.value * 6),
    }),
    [open],
  );
  const backStyle = useAnimatedStyle(() => ({
    left: 16 + 4 * b.value,
    opacity: t.value,
    transform: [{ translateX: -64 * (1 - t.value) }],
  }));
  const boxStyle = useAnimatedStyle(() => {
    const pad = 16 + 4 * b.value;
    const left = pad + 44 + 8;
    const width = W - left - pad - a.value * (56 + 8);
    const height = 44 + (4 + 8 * b.value) * t.value;
    return {
      left: PILL_LEFT + (left - PILL_LEFT) * t.value,
      width: PILL_W + (width - PILL_W) * t.value,
      height,
      top: frame.dockPad + (56 - height) / 2,
    };
  });
  const glyphsStyle = useAnimatedStyle(() => ({ opacity: 1 - t.value }));
  const barStyle = useAnimatedStyle(() => ({ opacity: t.value * (1 - b.value) }));
  const buttonStyle = useAnimatedStyle(() => ({ opacity: t.value * b.value }));
  const plusStyle = useAnimatedStyle(() => {
    const v = 1 - t.value * (1 - a.value);
    return { opacity: v, transform: [{ scale: 0.001 + v }] };
  });

  const pick = (item: MoreItem) => {
    setMore(false);
    const s = spec;
    if ((s.kind === 'bar' || s.kind === 'ask') && s.onPick) s.onPick(item);
    else moreTo(router, item);
  };
  const live = kind !== 'none' && !barHidden && !veil;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[s.surface, surface]} pointerEvents={live ? 'box-none' : 'none'} testID={kind === 'bar' ? 'bar' : 'foot'}>
        <Animated.View style={[s.back, backStyle]} pointerEvents={page ? 'auto' : 'none'}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={s.backHit}>
            <Icon name="back" size={22} />
          </Pressable>
        </Animated.View>
        <Animated.View style={[s.box, boxStyle]} pointerEvents="box-none">
          {glyphsUp ? (
            <Animated.View style={[StyleSheet.absoluteFill, glyphsStyle]} pointerEvents={kind === 'bar' ? 'auto' : 'none'}>
              <Glyphs home={pathname === '/home'} />
            </Animated.View>
          ) : null}
          {barUp && kind !== 'button' ? (
            <Animated.View style={[StyleSheet.absoluteFill, barStyle]} pointerEvents={kind === 'ask' ? 'auto' : 'none'}>
              <AskField
                placeholder={spec.kind === 'ask' ? spec.placeholder : 'Ask, or show me a photo'}
                onAsk={q => spec.kind === 'ask' && spec.onAsk(q)}
                onScan={() => (spec.kind === 'ask' ? spec.onScan?.() : undefined)}
              />
            </Animated.View>
          ) : null}
          {kind === 'button' ? (
            <Animated.View style={[StyleSheet.absoluteFill, buttonStyle]}>
              <Button label={spec.label} disabled={spec.disabled} onPress={spec.onPress} />
            </Animated.View>
          ) : null}
        </Animated.View>
        <Animated.View style={[s.plus, plusStyle]} pointerEvents={hasAction ? 'auto' : 'none'}>
          <ActionButton onPress={() => setMore(true)} label="More" />
        </Animated.View>
      </Animated.View>
      {more ? <More onPick={pick} onClose={() => setMore(false)} /> : null}
    </View>
  );
}

/* The three glyphs, the one you are on in black and the others in grey.
   The clock is drawn here, a disc with white hands, since the set's filled
   clock has its hands in the disc's own colour. The pages arrive from their
   glyphs: the record's clock from this one, Settings from the gear. */
function Glyphs({ home }: { home: boolean }) {
  const activities = useDeparture({ id: 'bar:activities', to: '/activities' });
  const settings = useDeparture({ id: 'bar:settings', to: '/settings' });
  const item = (glyph: IconName | 'clock-drawn', label: string, on: boolean, j?: ReturnType<typeof useDeparture>) => (
    <Tap ref={j?.ref} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: on }} onPress={j?.onPress} scale={0.9} style={s.item}>
      {glyph === 'clock-drawn' ? (
        <View style={[s.disc, { backgroundColor: on ? colour.ink : colour.textTertiary }]}>
          <View style={s.handUp} />
          <View style={s.handRight} />
        </View>
      ) : (
        <Icon name={glyph} size={24} colour={on ? colour.ink : colour.textTertiary} />
      )}
    </Tap>
  );
  return (
    <View style={s.items}>
      {item('home-filled', 'Home', home)}
      {item('clock-drawn', 'Activities', false, activities)}
      {item('gear', 'Settings', false, settings)}
    </View>
  );
}

/* The ask bar a page carries: the mark, the words, and the camera, since
   you type or you point it at something. */
function AskField({ placeholder, onAsk, onScan }: { placeholder: string; onAsk: (q: string) => void; onScan: () => void }) {
  const [value, setValue] = useState('');
  const fire = () => {
    const v = value.trim();
    if (!v) return;
    setValue('');
    onAsk(v);
  };
  return (
    <View style={s.bar} testID="dock-bar">
      <Icon name="mark" size={32} colour={colour.accent} />
      <TextInput
        style={s.input}
        value={value}
        onChangeText={setValue}
        onSubmitEditing={fire}
        placeholder={placeholder}
        placeholderTextColor={colour.textTertiary}
        returnKeyType="send"
        accessibilityLabel="Ask Beetle"
      />
      <Tap accessibilityRole="button" accessibilityLabel="Scan something" onPress={onScan} scale={0.85}>
        <Icon name="camera" size={18} colour={colour.textSecondary} />
      </Tap>
    </View>
  );
}

const s = StyleSheet.create({
  surface: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: BAR_H,
    backgroundColor: colour.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 16,
  },
  back: { position: 'absolute', top: frame.dockPad + 6, width: 44, height: 44 },
  backHit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  box: { position: 'absolute' },
  items: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  item: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  disc: { width: 24, height: 24, borderRadius: 12 },
  handUp: { position: 'absolute', left: 11, top: 5, width: 2, height: 8, borderRadius: 1, backgroundColor: colour.surface },
  handRight: { position: 'absolute', left: 11, top: 11, width: 7, height: 2, borderRadius: 1, backgroundColor: colour.surface },
  bar: {
    flex: 1,
    height: frame.askBarHeight,
    borderRadius: 999,
    backgroundColor: colour.surface2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 8,
    paddingRight: 12,
  },
  /* minWidth 0 or the field refuses to give the camera its room */
  input: { flex: 1, minWidth: 0, fontSize: 16, color: colour.ink, padding: 0 },
  plus: { position: 'absolute', right: 16, top: frame.dockPad, width: 56, height: 56 },
});
