/* The foot of a page. Drawn once over every page, it stays where it is
   while the pages slide in and out above it and changes shape from one
   page's foot to the next: the bar's pill draws in to Back's circle and
   grows out again (Round 18, the owner's word; from Round 13 to Round 17
   each page carried its own foot and it slid with the page).

   On Home, Activities and Settings it is the bar: the three glyphs in a
   rounded pill of frosted white glass that hugs them, 12 of padding and no
   outline, and the black plus beside it. On any other page it is Back, in
   a frosted white circle, beside the page's one button, or beside Slide to
   send, or Back alone: Back is always at the bottom left, and no page but
   home carries an ask bar. There is no white under either: a soft blur
   (design/Glass.tsx) sits behind the foot instead, so what scrolls under it
   softens rather than being cut, and a white page stays white.

   Each page says what its foot holds (`useFoot`) to the scope the stack
   puts round every screen (`FootScope`, in app/(app)/_layout.tsx), and the
   foot drawn over the stack (`FootHost`) shows the screen in front; a page
   that says nothing has none. Home, Activities and Settings are three pages of
   one screen (see features/tabs): the bar is drawn once over all three,
   its glyphs turn the pages, and the page showing is the one whose foot is
   said. More, up out of the plus, lives here too, since the plus does. The
   numbers are the frames': on a page the row 56 with 24 above and below,
   20 in from either side, 12 between Back and the button; the slide is 60
   tall, as the Send money frame draws it. The bar keeps the owner's home
   frame (Round 14): 12 from the bottom and 24 in from either side, and on a
   phone with the home line just over the line instead (see barLift). */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Keyboard, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tabs, useHoldPages, useTab, type Tab } from '../tabs';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { SharedValue, runOnJS, useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { ActionButton, Body, Button, Icon, Row, Tap, colour, frame, keys, motion, settle, useStill, type ButtonSize, type ButtonTone } from '../../design';
import { AnimatedBlur, FROSTED, SoftBlur, blurMethod } from '../../design/Glass';
import { useSheet } from '../../design/sheetStack';
import type { IconName } from '../../icons';
import { More, moreTo, type MoreItem } from './More';

export const BAR_H = 56 + 2 * frame.dockPad;
/** The bar's row: the pill and the plus, 56 tall. */
export const BAR_ROW = 56;
/** The bar's row sits 12 from the bottom of the screen, as the owner's home
    frame has it. A phone with the home line keeps the bottom of the screen
    for it, and 12 would put the pill on the line, so there the row sits just
    over the line: 13 less than the phone's own allowance at the bottom,
    which is 21 on an iPhone with Face ID and leaves a little clear above the
    line (the owner's choice, Round 14). */
export const barLift = (bottomInset: number) => (bottomInset > 0 ? Math.max(BAR_FLOOR, Math.round(bottomInset) - 13) : BAR_FLOOR);
const BAR_FLOOR = 12;
/** The bar's sides, the owner's home frame; a page's foot keeps the page's 20. */
const BAR_SIDE = 24;
/** How far the bar's soft blur reaches over the page: its row, what is under the row, and 7 over it (the frame's 75). */
const BAR_FADE_OVER = 7;
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

type Scope = { id: number; spec: FootSpec; set: (s: FootSpec) => void; listeners: Set<() => void> };
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

/* ---- which screen's foot shows ---- */

/* Every screen's scope, whether its screen is the one in front, and when it
   came to the front: the foot shows the latest of those in front. */
type Entry = { focused: boolean; order: number };
const entries = new Map<Scope, Entry>();
let seq = 0;
let scopes = 0;
const hostListeners = new Set<() => void>();
const front = (): Scope | null => {
  let best: Scope | null = null;
  let order = -1;
  entries.forEach((e, sc) => {
    if (e.focused && e.order > order) {
      best = sc;
      order = e.order;
    }
  });
  return best;
};

/** What the stack hands a screen's layout, enough to know when it is in front. */
type Nav = { isFocused(): boolean; addListener(type: 'focus' | 'blur', cb: () => void): () => void };

/** One screen's foot: what it says. The stack puts one round every screen;
    the foot itself is drawn once, over every screen (FootHost), and shows
    the one in front, changing shape in place from one to the next (Round
    18, the owner's word: the three glyphs turn into Back, and back). */
export function FootScope({ children, navigation }: { children: ReactNode; navigation?: Nav }) {
  const scope = useMemo<Scope>(() => {
    const sc: Scope = {
      id: ++scopes,
      spec: NONE,
      listeners: new Set(),
      set(next) {
        sc.spec = next;
        sc.listeners.forEach(l => l());
      },
    };
    return sc;
  }, []);
  useEffect(() => {
    const entry: Entry = { focused: false, order: 0 };
    entries.set(scope, entry);
    const update = () => {
      const now = navigation ? navigation.isFocused() : true;
      if (now && !entry.focused) entry.order = ++seq;
      entry.focused = now;
      hostListeners.forEach(l => l());
    };
    update();
    const off = navigation ? [navigation.addListener('focus', update), navigation.addListener('blur', update)] : [];
    return () => {
      off.forEach(o => o());
      entries.delete(scope);
      hostListeners.forEach(l => l());
    };
  }, [scope, navigation]);
  /* on the web the stack would let a long page grow past the window for the
     browser to scroll; a page here scrolls inside itself, under its head and
     over its foot, so it is held to the window */
  const { height } = useWindowDimensions();
  /* a sheet stops under the status bar: the page is held to what is left */
  const sheet = useSheet();
  return (
    <ScopeContext.Provider value={scope}>
      <View style={Platform.OS === 'web' ? { height: height - (sheet ? sheet.top : 0), overflow: 'hidden' } : { flex: 1 }}>{children}</View>
    </ScopeContext.Provider>
  );
}

/** The foot, drawn once over every screen of the stack: what the screen in
    front says, changing shape when another comes to the front. */
export function FootHost() {
  const [scope, setScope] = useState<Scope | null>(() => front());
  useEffect(() => {
    const l = () => setScope(front());
    hostListeners.add(l);
    l();
    return () => {
      hostListeners.delete(l);
    };
  }, []);
  const [spec, setSpec] = useState<FootSpec>(scope?.spec ?? NONE);
  useEffect(() => {
    if (!scope) {
      setSpec(NONE);
      return undefined;
    }
    const l = () => setSpec(scope.spec);
    scope.listeners.add(l);
    l();
    return () => {
      scope.listeners.delete(l);
    };
  }, [scope]);
  return <Drawn spec={spec} who={scope ? scope.id : 0} />;
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

/** How long the bar takes to become Back, or Back the bar: about as long as the page that brings it takes to arrive. */
const MORPH_MS = 460;
/** How long the foot takes to come or go where a screen has none. */
const FADE_MS = 240;
/** How far through the change the plus has gone and the page's button starts to come. */
const HANDOFF = 0.4;

/** Held to 0 and 1. */
const unit = (v: number) => {
  'worklet';
  return v < 0 ? 0 : v > 1 ? 1 : v;
};

type PageSpec = Extract<FootSpec, { kind: 'back' | 'button' | 'slide' }>;
/** A page's foot with something beside Back. */
type Boxed = Extract<FootSpec, { kind: 'button' | 'slide' }>;
const boxedOf = (p: PageSpec | null): Boxed | null => (p && (p.kind === 'button' || p.kind === 'slide') ? p : null);
type Shown = Exclude<FootSpec, { kind: 'none' }>;

/* The foot, changing shape in place (Round 18, the owner's word). One
   frosted shape at the bottom left is the bar's pill on the three pages and
   Back's circle on any other: going to a page, the pill draws in to the
   circle where it sits while its three glyphs fade and the arrow comes in,
   the plus fades away and the page's button comes in beside Back; going
   back, the circle grows into the pill again. Between two pages Back stays
   where it is and the button hands over: the one going fades, then the
   next slides in. Where a screen has no foot it fades out. The change of
   shape is drawn against one number, `m`: 0 the bar, 1 a page's foot; the
   hand-over between two pages' buttons against another, `turn`. */
function Drawn({ spec, who }: { spec: FootSpec; who: number }) {
  const router = useRouter();
  const still = useStill();
  const { width: W } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [more, setMore] = useState(false);
  /* what was last shown, kept while the foot fades out where there is none */
  const [held, setHeld] = useState<Shown | null>(spec.kind === 'none' ? null : spec);
  /* the last page's foot, kept while the shape grows back into the bar, so its button goes rather than vanishes */
  const [page, setPage] = useState<PageSpec | null>(spec.kind === 'back' || spec.kind === 'button' || spec.kind === 'slide' ? spec : null);
  useEffect(() => {
    if (spec.kind !== 'none') setHeld(spec);
    if (spec.kind === 'back' || spec.kind === 'button' || spec.kind === 'slide') setPage(spec);
  }, [spec]);
  const shown = spec.kind === 'none' ? held : spec;
  const bar = spec.kind === 'bar';
  const isPage = spec.kind === 'back' || spec.kind === 'button' || spec.kind === 'slide';
  /* the bar's row, the lift from the bottom of the screen taken off the foot's height */
  const barTop = BAR_H - barLift(insets.bottom) - BAR_ROW;
  /* the pages stand still while More is up */
  useHoldPages('more', bar && more);
  useEffect(() => {
    if (!bar) {
      setMore(false);
      return undefined;
    }
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

  /* 0 the bar, 1 a page's foot; and whether there is a foot at all */
  const m = useSharedValue(isPage ? 1 : 0);
  const there = useSharedValue(spec.kind === 'none' ? 0 : 1);
  useEffect(() => {
    if (spec.kind === 'none') {
      there.value = still ? 0 : withTiming(0, { duration: FADE_MS, easing: settle });
      return;
    }
    const to = isPage ? 1 : 0;
    /* coming back from nothing, the shape is already the one wanted; only between the bar and a page does it change */
    if (there.value < 0.01) m.value = to;
    else m.value = still ? to : withTiming(to, { duration: MORPH_MS, easing: settle });
    there.value = still ? 1 : withTiming(1, { duration: FADE_MS, easing: settle });
  }, [spec.kind, isPage, still, m, there]);

  const open = shown?.kind === 'bar' ? shown.open : undefined;
  const veil = shown?.veil;
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

  /* both held to 0 and 1: the first frame of a change can fall a moment before the change began, and on a curve that
     leaves as quickly as these do the shape would step back past where it started for that frame */
  const k = useDerivedValue(() => unit(m.value));
  const gone = useDerivedValue(() => unit(hide.value));

  const whole = useAnimatedStyle(() => {
    const p = k.value;
    return {
      transform: [{ translateY: gone.value * AWAY + (1 - p) * kbOn.value * AWAY - p * kb.value }],
      /* dimmed, not blurred: a filter here would stop the glass in it from seeing the page behind */
      opacity: (1 - dim.value * 0.55) * there.value,
    };
  });
  /* the blur under the foot: the bar's short one and a page's taller one, each as far as the shape is that one; not
     under home's open card, which comes down over the bar's top, and not while the foot is down out of the way */
  const barSoft = useDerivedValue(() => {
    const opening = open ? Math.min(1, open.value * 2.5) : 0;
    return (1 - opening) * (1 - gone.value) * (1 - k.value) * there.value;
  }, [open]);
  const pageSoft = useDerivedValue(() => (1 - gone.value) * k.value * there.value);

  /* the frosted shape: the pill at the bar's place, Back's circle at a page's */
  const backTop = frame.dockPad + (ROW - BACK) / 2;
  const shape = useAnimatedStyle(() => {
    const p = k.value;
    const h = ROW + (BACK - ROW) * p;
    return {
      left: BAR_SIDE + (PAGE_PAD - BAR_SIDE) * p,
      top: barTop + (backTop - barTop) * p,
      width: PILL_W + (BACK - PILL_W) * p,
      height: h,
      borderRadius: h / 2,
    };
  }, [barTop, backTop]);
  const corner = useAnimatedStyle(() => ({ borderRadius: (ROW + (BACK - ROW) * k.value) / 2 }));
  /* the glyphs go in the first half, drawn in toward the circle; the arrow comes in the second */
  const glyphs = useAnimatedStyle(() => {
    const p = unit(k.value / 0.55);
    return { opacity: 1 - p, transform: [{ translateX: -18 * p }, { scale: 1 - 0.12 * p }] };
  });
  const arrow = useAnimatedStyle(() => {
    const p = unit((k.value - 0.4) / 0.6);
    return { opacity: p, transform: [{ scale: 0.7 + 0.3 * p }] };
  });
  /* the plus is gone before the page's button comes, so the two are never drawn over each other */
  const plus = useAnimatedStyle(() => {
    const p = unit(k.value / HANDOFF);
    return { opacity: 1 - p, transform: [{ scale: 1 - 0.25 * p }] };
  });
  /* the page's button comes in beside Back from a little to the right */
  /* between two pages Back stays where it is and only the button changes: the one going fades where it is and the
     new one comes in after it, as the plus hands over to a page's button from the bar. `turn` is that change, 0 to 1. */
  const boxNow = boxedOf(page);
  const [leaving, setLeaving] = useState<Boxed | null>(null);
  const turn = useSharedValue(1);
  const was = useRef({ who, box: boxNow });
  /* when the page's foot changes, not when the screen in front does: that comes a moment before its foot */
  useEffect(() => {
    const before = was.current;
    was.current = { who, box: boxNow };
    /* from the bar or back to it, the change of shape brings the button or takes it */
    if (still || m.value < 0.99) {
      setLeaving(null);
      return;
    }
    /* the same page's button saying something else is not a new button */
    if ((before.who === who && before.box && boxNow) || (!before.box && !boxNow)) return;
    setLeaving(before.box);
    turn.value = 0;
    turn.value = withTiming(1, { duration: MORPH_MS, easing: settle }, done => {
      if (done) runOnJS(setLeaving)(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);
  const box = useAnimatedStyle(() => {
    const p = unit((k.value - HANDOFF) / (1 - HANDOFF)) * unit((turn.value - HANDOFF) / (1 - HANDOFF));
    return { opacity: p, transform: [{ translateX: 28 * (1 - p) }] };
  });
  const going = useAnimatedStyle(() => ({ opacity: unit((k.value - HANDOFF) / (1 - HANDOFF)) * (1 - unit(turn.value / HANDOFF)) }));

  const live = !veil;
  const pick = (item: MoreItem) => {
    setMore(false);
    if (shown?.kind === 'bar' && shown.onPick) shown.onPick(item);
    else moreTo(router, item);
  };
  const onBack = page ? page.onBack : undefined;
  /* a page's button: beside Back, as far as the page's side, on the row's middle */
  const boxLeft = PAGE_PAD + BACK + BACK_GAP;
  const place = (p: Boxed) => {
    const h = p.kind === 'slide' ? 60 : ROW;
    return { left: boxLeft, width: W - boxLeft - PAGE_PAD, height: h, top: frame.dockPad + (ROW - h) / 2 };
  };
  const drawn = (p: Boxed) =>
    p.kind === 'button' ? (
      <Button label={p.label} disabled={p.disabled} onPress={p.onPress} tone={p.tone} leading={p.leading} size={p.size} />
    ) : (
      <Slide label={p.label} amount={p.amount} disabled={!!p.disabled} onSlide={p.onSlide} />
    );
  const Blur = AnimatedBlur;
  if (!shown) return null;

  return (
    <>
      {/* clipped at the window's edge: a foot gone down out of the way must not lengthen the page under it */}
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="box-none">
        <SoftBlur side="bottom" height={BAR_H - barTop + BAR_FADE_OVER} k={barSoft} testID={bar ? 'foot-fade' : undefined} />
        <SoftBlur side="bottom" height={BAR_H + FADE} k={pageSoft} testID={bar ? undefined : 'foot-fade'} />
        <Animated.View style={[s.surface, whole]} pointerEvents={live && spec.kind !== 'none' ? 'box-none' : 'none'} testID={bar ? 'bar' : 'foot'}>
          {/* the one frosted shape, pill or circle */}
          <Animated.View style={[s.shape, shape]} pointerEvents="none" testID={bar ? 'bar-pill' : 'back-glass'}>
            {Blur ? <Blur intensity={40} tint="light" experimentalBlurMethod={blurMethod} style={[StyleSheet.absoluteFill, corner]} /> : null}
            <Animated.View style={[StyleSheet.absoluteFill, corner, { backgroundColor: Blur ? FROSTED : 'rgba(255, 255, 255, 0.92)' }]} />
          </Animated.View>
          {/* the three glyphs, where the pill is */}
          <Animated.View style={[s.glyphs, { top: barTop }, glyphs]} pointerEvents={bar && live ? 'box-none' : 'none'}>
            <Glyphs />
          </Animated.View>
          {/* Back's arrow, where the circle is */}
          <Animated.View style={[s.back, arrow]} pointerEvents={isPage && live ? 'auto' : 'none'}>
            <Tap accessibilityRole="button" accessibilityLabel="Back" aria-hidden={!isPage} onPress={() => (onBack ? onBack() : router.back())} scale={0.92} style={s.backHit}>
              <Icon name="back" size={22} />
            </Tap>
          </Animated.View>
          <Animated.View style={[s.plus, { top: barTop }, plus]} pointerEvents={bar && live ? 'auto' : 'none'}>
            <ActionButton onPress={() => setMore(true)} label="More" />
          </Animated.View>
          {/* the last page's button, going, under the next one's */}
          {leaving ? (
            <Animated.View key={`leaving|${shapeOf(leaving)}`} style={[s.box, place(leaving), going]} pointerEvents="none" aria-hidden>
              {drawn(leaving)}
            </Animated.View>
          ) : null}
          {boxNow ? (
            <Animated.View key={shapeOf(boxNow)} style={[s.box, place(boxNow), box]} pointerEvents={isPage && live ? 'box-none' : 'none'}>
              {drawn(boxNow)}
            </Animated.View>
          ) : null}
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
  const go = (t: Tab) => {
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
  /* the one frosted shape, pill or circle, and where it is */
  shape: { position: 'absolute', overflow: 'hidden' },
  /* the glyphs where the pill is: 24 in; how high is barLift's */
  glyphs: { position: 'absolute', left: BAR_SIDE, width: PILL_W, height: ROW },
  items: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: PILL_PAD },
  item: { width: GLYPH_BOX, height: GLYPH_BOX, alignItems: 'center', justifyContent: 'center' },
  plus: { position: 'absolute', right: BAR_SIDE, width: ROW, height: ROW },
  /* Back: the frames' 44, on the middle of the row, where the circle is */
  back: { position: 'absolute', left: PAGE_PAD, top: frame.dockPad + (ROW - BACK) / 2, width: BACK, height: BACK },
  backHit: { width: BACK, height: BACK, alignItems: 'center', justifyContent: 'center' },
  box: { position: 'absolute' },
  slide: { flex: 1, height: 60, borderRadius: 30, backgroundColor: colour.ink, justifyContent: 'center' },
  slideOff: { backgroundColor: colour.surface2 },
  /* the words start 12 past the knob's resting place */
  slideWords: { position: 'absolute', left: 4 + KNOB + 12, right: 16 },
  knob: { position: 'absolute', left: 4, top: 5, width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: colour.surface, alignItems: 'center', justifyContent: 'center' },
});
