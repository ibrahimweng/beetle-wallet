/* The foot of a page, drawn inside the page so it slides in and out with it
   (Round 13: every page comes and goes with the phone's own sliding
   movement, and the foot is part of the page, following the finger on the
   swipe back, where it used to stay put and change shape).

   On Home, Activities and Settings it is the bar: the three glyphs in a
   rounded pill of frosted white glass that hugs them, 12 of padding and no
   outline, and the black plus beside it. On any other page it is Back, in
   a frosted white circle, beside the page's one button, or beside Slide to
   send, or Back alone: Back is always at the bottom left, and no page but
   home carries an ask bar. There is no white under either: a soft blur
   (design/Glass.tsx) sits behind the foot instead, so what scrolls under it
   softens rather than being cut, and a white page stays white.

   Each page says what its foot holds (`useFoot`) and the stack draws it
   (`FootScope`, around every screen in app/(app)/_layout.tsx); a page that
   says nothing has none. Home, Activities and Settings are three pages of
   one screen (see features/tabs): the bar is drawn once over all three,
   its glyphs turn the pages, and the page showing is the one whose foot is
   said. More, up out of the plus, lives here too, since the plus does. The
   numbers are the frames': the row 56 with 24 above and below, 20 in from
   either side, 12 between Back and the button; the slide is 60 tall, as
   the Send money frame draws it. */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Keyboard, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useIsFocused, useRouter } from 'expo-router';
import { tabs, useHoldPages, useTab, type Tab } from '../tabs';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { SharedValue, runOnJS, useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { ActionButton, Body, Button, Icon, Row, Tap, colour, frame, keys, motion, settle, useStill, type ButtonSize, type ButtonTone } from '../../design';
import { Glass, SoftBlur } from '../../design/Glass';
import type { IconName } from '../../icons';
import { More, moreTo, type MoreItem } from './More';

export const BAR_H = 56 + 2 * frame.dockPad;
/** How far the soft blur reaches up over the page, past the foot's own row. */
const FADE = 40;

/** What a screen's own overlay does to the foot: under a peek's blur it
    recedes with the rest; under a sheet from the bottom it goes out of the way. */
export type Veil = 'recede' | 'away';

export type FootSpec =
  /** the three pages: the bar. `open` is home's card: the blur under the bar goes as the card opens, so the chat can come down to just over the glyphs */
  | { kind: 'bar'; open?: SharedValue<number>; onPick?: (item: MoreItem) => void; veil?: Veil }
  /** a page with nothing of its own to do at its foot: Back alone */
  | { kind: 'back'; veil?: Veil; onBack?: () => void }
  /** a page with one thing to do: Back beside its button */
  | {
      kind: 'button';
      label: string;
      onPress: () => void;
      disabled?: boolean;
      veil?: Veil;
      /** grey where a frame draws it so, with a glyph before the word */ tone?: ButtonTone;
      leading?: IconName;
      size?: ButtonSize;
      onBack?: () => void;
    }
  /** money about to move: Back beside Slide to send, with the figure under the words */
  | { kind: 'slide'; label: string; amount: string; onSlide: () => void; disabled?: boolean; veil?: Veil; onBack?: () => void }
  | { kind: 'none' };

const NONE: FootSpec = { kind: 'none' };

/* ---- what each page says ---- */

type Scope = { spec: FootSpec; set: (s: FootSpec) => void; listeners: Set<() => void> };
const ScopeContext = createContext<Scope | null>(null);

let moreWanted = false;
const moreListeners = new Set<() => void>();

export const foot = {
  /** More, from outside the foot: the lab opens home with it up */
  openMore() {
    moreWanted = true;
    moreListeners.forEach(l => l());
  },
};

/** One screen's foot: what it says, drawn over the screen, inside it. The
    stack puts one round every screen. */
export function FootScope({ children }: { children: ReactNode }) {
  const scope = useMemo<Scope>(() => {
    const sc: Scope = {
      spec: NONE,
      listeners: new Set(),
      set(next) {
        sc.spec = next;
        sc.listeners.forEach(l => l());
      },
    };
    return sc;
  }, []);
  /* on the web the stack would let a long page grow past the window for the
     browser to scroll; a page here scrolls inside itself, under its head and
     over its foot, so it is held to the window */
  const { height } = useWindowDimensions();
  return (
    <ScopeContext.Provider value={scope}>
      <View style={Platform.OS === 'web' ? { height, overflow: 'hidden' } : { flex: 1 }}>
        {children}
        <FootView scope={scope} />
      </View>
    </ScopeContext.Provider>
  );
}

/** The shape of a spec, without what it does: a change of it is worth drawing again. */
const shapeOf = (s: FootSpec) => {
  switch (s.kind) {
    case 'bar':
      return `bar|${s.open ? 1 : 0}|${s.veil ?? ''}`;
    case 'back':
      return `back|${s.veil ?? ''}`;
    case 'button':
      return `button|${s.label}|${s.disabled ? 1 : 0}|${s.veil ?? ''}|${s.tone ?? ''}|${s.leading ?? ''}|${s.size ?? ''}`;
    case 'slide':
      return `slide|${s.label}|${s.amount}|${s.disabled ? 1 : 0}|${s.veil ?? ''}`;
    default:
      return 'none';
  }
};

/** What a screen's foot holds. Callbacks are read at press time, so the spec
    may be written inline. A page of the three says it only while it is the
    one showing (`enabled`). */
export function useFoot(spec: FootSpec, enabled = true) {
  const scope = useContext(ScopeContext);
  const latest = useRef(spec);
  latest.current = spec;
  const shape = shapeOf(spec);
  const push = useCallback(() => {
    if (!scope) return;
    const s = latest.current;
    let wrapped: FootSpec = s;
    /* Back that closes something on the screen rather than leaving it: read at press time too */
    const back =
      s.kind !== 'bar' && s.kind !== 'none' && s.onBack
        ? () => {
            const n = latest.current;
            if (n.kind !== 'bar' && n.kind !== 'none') n.onBack?.();
          }
        : undefined;
    if (s.kind === 'back') {
      wrapped = { ...s, onBack: back };
    } else if (s.kind === 'button') {
      wrapped = {
        ...s,
        onPress: () => {
          const n = latest.current;
          if (n.kind === 'button') n.onPress();
        },
        onBack: back,
      };
    } else if (s.kind === 'slide') {
      wrapped = {
        ...s,
        onSlide: () => {
          const n = latest.current;
          if (n.kind === 'slide') n.onSlide();
        },
        onBack: back,
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
    scope.set(wrapped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, shape]);
  useEffect(() => {
    if (enabled) push();
  }, [push, enabled]);
}

/* ---- the foot itself ---- */

/** How far the foot goes down to be out of the way. */
const AWAY = BAR_H + FADE;
/** The glyphs' pill: three 32 boxes 12 apart, 12 of padding all round, so 56 tall like the plus. */
const PILL_PAD = 12;
const GLYPH_BOX = 32;
const PILL_W = GLYPH_BOX * 3 + 12 * 2 + PILL_PAD * 2;
const ROW = 56;
/** A page's foot: 20 in from either side, Back a 44 circle on the row's middle (the frames' Back), and 12 clear between Back and the button, so each is its own tap. */
const PAGE_PAD = frame.sidePad;
const BACK = 44;
const BACK_GAP = 12;

function FootView({ scope }: { scope: Scope }) {
  const [spec, setSpec] = useState<FootSpec>(scope.spec);
  useEffect(() => {
    const l = () => setSpec(scope.spec);
    scope.listeners.add(l);
    l();
    return () => {
      scope.listeners.delete(l);
    };
  }, [scope]);
  if (spec.kind === 'none') return null;
  return <Drawn spec={spec} />;
}

function Drawn({ spec }: { spec: Exclude<FootSpec, { kind: 'none' }> }) {
  const router = useRouter();
  const still = useStill();
  const { width: W } = useWindowDimensions();
  const [more, setMore] = useState(false);
  const bar = spec.kind === 'bar';
  /* the pages stand still while More is up */
  useHoldPages('more', bar && more);
  useEffect(() => {
    if (!bar) return undefined;
    const l = () => {
      if (moreWanted) {
        moreWanted = false;
        setMore(true);
      }
    };
    moreListeners.add(l);
    l();
    return () => {
      moreListeners.delete(l);
    };
  }, [bar]);

  const open = spec.kind === 'bar' ? spec.open : undefined;
  const veil = spec.veil;
  const away = veil === 'away';
  const hide = useSharedValue(away ? 1 : 0);
  const dim = useSharedValue(veil === 'recede' ? 1 : 0);
  useEffect(() => {
    hide.value = still ? (away ? 1 : 0) : withTiming(away ? 1 : 0, { duration: motion.screen, easing: settle });
  }, [away, still, hide]);
  /* under a peek's blur the foot recedes with the rest, and comes forward again after */
  useEffect(() => {
    const v = veil === 'recede' ? 1 : 0;
    dim.value = still ? v : withTiming(v, { duration: v ? motion.leave : motion.enter, easing: settle });
  }, [veil, still, dim]);

  /* the keyboard: on iOS, where the window does not shrink for it, a page's
     foot rides up on it; the bar, whose keyboard is always the chat's, goes
     down under it on either phone rather than ride up over the chat */
  const kb = useSharedValue(0);
  const kbOn = useSharedValue(0);
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const sh = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', e => {
      if (ios) kb.value = withTiming(e.endCoordinates.height, { duration: 220, easing: settle });
      kbOn.value = withTiming(1, { duration: ios ? 220 : 120, easing: settle });
    });
    const hd = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      if (ios) kb.value = withTiming(0, { duration: 220, easing: settle });
      kbOn.value = withTiming(0, { duration: 220, easing: settle });
    });
    return () => {
      sh.remove();
      hd.remove();
    };
  }, [kb, kbOn]);

  const whole = useAnimatedStyle(() => ({
    transform: [{ translateY: hide.value * AWAY + (bar ? kbOn.value * AWAY : -kb.value) }],
    /* dimmed, not blurred: a filter here would stop the glass in it from seeing the page behind */
    opacity: 1 - dim.value * 0.55,
  }));
  /* the blur under the foot: not under home's open card, which comes down over the bar's top, and not while the foot is down out of the way */
  const softK = useDerivedValue(() => {
    const opening = open ? Math.min(1, open.value * 2.5) : 0;
    return (1 - opening) * (1 - hide.value);
  }, [open]);

  const live = !veil;
  const pick = (item: MoreItem) => {
    setMore(false);
    if (spec.kind === 'bar' && spec.onPick) spec.onPick(item);
    else moreTo(router, item);
  };
  const slide = spec.kind === 'slide';
  const onBack = spec.kind !== 'bar' ? spec.onBack : undefined;
  const boxH = slide ? 60 : ROW;
  const boxLeft = PAGE_PAD + BACK + BACK_GAP;

  return (
    <>
      {/* clipped at the window's edge: a foot gone down out of the way must not lengthen the page under it */}
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="box-none">
        <SoftBlur side="bottom" height={BAR_H + FADE} k={softK} testID="foot-fade" />
        <Animated.View style={[s.surface, whole]} pointerEvents={live ? 'box-none' : 'none'} testID={bar ? 'bar' : 'foot'}>
          {bar ? (
            <>
              <Glass style={s.pill} testID="bar-pill">
                <Glyphs />
              </Glass>
              <View style={s.plus} pointerEvents={live ? 'auto' : 'none'}>
                <ActionButton onPress={() => setMore(true)} label="More" />
              </View>
            </>
          ) : (
            <>
              <Glass style={s.back}>
                <Tap accessibilityRole="button" accessibilityLabel="Back" onPress={() => (onBack ? onBack() : router.back())} scale={0.92} style={s.backHit}>
                  <Icon name="back" size={22} />
                </Tap>
              </Glass>
              {spec.kind === 'button' ? (
                <View style={[s.box, { left: boxLeft, width: W - boxLeft - PAGE_PAD, height: boxH, top: frame.dockPad + (ROW - boxH) / 2 }]}>
                  <Button label={spec.label} disabled={spec.disabled} onPress={spec.onPress} tone={spec.tone} leading={spec.leading} size={spec.size} />
                </View>
              ) : null}
              {slide ? (
                <View style={[s.box, { left: boxLeft, width: W - boxLeft - PAGE_PAD, height: boxH, top: frame.dockPad + (ROW - boxH) / 2 }]}>
                  <Slide label={spec.label} amount={spec.amount} disabled={!!spec.disabled} onSlide={spec.onSlide} />
                </View>
              ) : null}
            </>
          )}
        </Animated.View>
      </View>
      {/* More sits outside the clip: a browser will not blur through a clipped box to the page behind it */}
      {bar && more ? <More onPick={pick} onClose={() => setMore(false)} /> : null}
    </>
  );
}

/* The three glyphs, the page showing in black and the others in grey, each
   one solid. They are sized to what they draw rather than to their boxes:
   the house and the clock each fill 19 of their 24, the gear nearly all of
   it, so the gear is drawn smaller for the three to look one size. A tap
   turns the pages to its own. The glyph of the page already showing is
   heard too (see `tabs.again`): Home tapped with the chat open closes it.
   Each box is 32 in the pill, and takes a touch 6 past it all round. */
function Glyphs() {
  const tab = useTab();
  const focused = useIsFocused();
  const go = (t: Tab) => {
    if (!focused) return;
    if (t === tabs.get()) tabs.again(t);
    else tabs.go(t);
  };
  const item = (glyph: IconName, size: number, label: string, t: Tab) => (
    <Tap accessibilityRole="button" accessibilityLabel={label} aria-selected={tab === t} onPress={() => go(t)} scale={0.9} style={s.item} hitSlop={6} testID={`glyph-${t}`}>
      <Icon name={glyph} size={size} colour={tab === t ? colour.ink : colour.textTertiary} />
    </Tap>
  );
  return (
    <View style={s.items}>
      {item('home-filled', 24, 'Home', 'home')}
      {item('clock-filled', 24, 'Activities', 'activities')}
      {item('gear-filled', 21, 'Settings', 'settings')}
    </View>
  );
}

/* Slide to send, as the Send money frame draws it: a black pill 60 tall
   with a white 50 knob at its left end and the words beside it, the figure
   under them. The knob follows the finger; let go past four fifths of the
   way and it lands at the end and the money goes to the passcode, let go
   before that and it springs back. Until there is someone and an amount
   the pill is the pale grey and the knob stays put. */
const KNOB = 50;

function Slide({ label, amount, disabled, onSlide }: { label: string; amount: string; disabled: boolean; onSlide: () => void }) {
  const still = useStill();
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);
  /* how far the knob can go: the pill's width less the knob and 4 either side */
  const max = Math.max(1, width - KNOB - 8);
  const fire = () => onSlide();
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled)
        .activeOffsetX([6, 6])
        .failOffsetY([-24, 24])
        .onUpdate(e => {
          x.value = Math.min(max, Math.max(0, e.translationX));
        })
        .onEnd(() => {
          if (x.value >= max * 0.8) {
            x.value = withTiming(max, { duration: 120, easing: settle });
            runOnJS(fire)();
            /* the passcode takes the foot away; the knob is home again by the time it is back */
            x.value = withDelay(600, withSpring(0, keys));
          } else x.value = withSpring(0, keys);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled, max, still],
  );
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const words = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, (x.value / max) * 1.6) }));
  return (
    <View
      style={[s.slide, disabled ? s.slideOff : null]}
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
      testID="slide"
      accessibilityRole="adjustable"
      accessibilityLabel={`${label} ${amount}`}
      accessibilityState={{ disabled }}
    >
      <Animated.View style={[s.slideWords, words]} pointerEvents="none">
        <Row tone={disabled ? 'tertiary' : 'inverse'}>{label}</Row>
        {amount ? <Body tone={disabled ? 'tertiary' : 'inverse'}>{amount}</Body> : null}
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[s.knob, knob]} testID="slide-knob">
          <Icon name="slide-arrow" size={20} colour={disabled ? colour.textTertiary : colour.ink} />
        </Animated.View>
      </GestureDetector>
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
  },
  /* the glyphs' pill: frosted white, round at the ends, 20 in, the row's 24 above the foot */
  pill: { position: 'absolute', left: frame.sidePad, top: frame.dockPad, width: PILL_W, height: ROW, borderRadius: ROW / 2 },
  items: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: PILL_PAD },
  item: { width: GLYPH_BOX, height: GLYPH_BOX, alignItems: 'center', justifyContent: 'center' },
  plus: { position: 'absolute', right: frame.sidePad, top: frame.dockPad, width: ROW, height: ROW },
  /* Back: a frosted white circle, the frames' 44, on the middle of the row */
  back: { position: 'absolute', left: PAGE_PAD, top: frame.dockPad + (ROW - BACK) / 2, width: BACK, height: BACK, borderRadius: BACK / 2 },
  backHit: { width: BACK, height: BACK, alignItems: 'center', justifyContent: 'center' },
  box: { position: 'absolute' },
  slide: { flex: 1, height: 60, borderRadius: 30, backgroundColor: colour.ink, justifyContent: 'center' },
  slideOff: { backgroundColor: colour.surface2 },
  /* the words start 12 past the knob's resting place */
  slideWords: { position: 'absolute', left: 4 + KNOB + 12, right: 16 },
  knob: { position: 'absolute', left: 4, top: 5, width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: colour.surface, alignItems: 'center', justifyContent: 'center' },
});
