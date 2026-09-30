/* The three pages side by side, in the bar's order: Home, Activities,
   Settings. A sideways swipe moves them under the finger — a swipe to the
   left goes on to the next, a swipe to the right comes back — and they
   settle on the nearest page once it lets go, or on the next one past a
   third of the width or on a flick, never past Home or past Settings,
   where they give a little and spring back. A tap on a glyph in the bar
   turns them too. The bar is the foot's, drawn once over all three, so it
   never moves or redraws with them.

   The pages hold still while something is open over one of them (see
   `holdPages`): the chat on home, a sheet, a receipt, More. The Services
   card, which swipes sideways itself, has first say over a swipe that
   starts on it.

   On the web a page off to the side is taken out of the page while the
   pages rest, so what is read off the screen is the page showing. */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useIsFocused, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colour, swipes, useStill } from '../../design';
import { useSessionGuard } from '../onboarding/useGuard';
import { Home } from '../home/Home';
import { Activities } from '../activities/Activities';
import { Settings } from '../settings/Settings';
import { PageContext, SwipeContext } from './page';
import { TABS, isTab, settleOn, tabs, useHeld, useTab, type Tab } from './tabs';

/** How a page settles: quickly, and without running past it. */
const PAGE = { damping: 30, stiffness: 260, mass: 1, overshootClamping: true } as const;
/** How much a pull past Home or past Settings gives: a third of the finger's travel. */
const GIVE = 1 / 3;
const web = Platform.OS === 'web';

export function Pager() {
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ tab?: string }>();
  const { width: W } = useWindowDimensions();
  const still = useStill();
  const focused = useIsFocused();
  const held = useHeld();

  /* the page to open on: the one asked for, else Home — signing in again never opens on the page the last one left from */
  const [first] = useState<Tab>(() => (isTab(asked.tab) ? asked.tab : 'home'));
  const live = useTab();
  const [started, setStarted] = useState(false);
  useLayoutEffect(() => {
    tabs.go(first);
    setStarted(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const tab = started ? live : first;
  const index = TABS.indexOf(tab);

  /* where the pages are: page i is showing when x is i widths */
  const x = useSharedValue(index * W);
  const w = useSharedValue(W);
  const aimed = useRef(index);
  const [moving, setMoving] = useState(false);
  const rest = () => setMoving(false);

  /* a glyph tapped, or a link from somewhere: the pages glide to the one asked for */
  useEffect(() => {
    if (aimed.current === index) return;
    aimed.current = index;
    if (still) {
      x.value = index * W;
      return;
    }
    setMoving(true);
    x.value = withSpring(index * W, PAGE, done => {
      if (done) runOnJS(rest)();
    });
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps
  /* the window changed its width: the page showing stays showing */
  useEffect(() => {
    w.value = W;
    x.value = aimed.current * W;
  }, [W, w, x]);

  /* the clock and the battery: light over home's black card, dark over the white pages, changing halfway */
  const [light, setLight] = useState(tab === 'home');
  useAnimatedReaction(
    () => x.value < w.value / 2,
    (now, before) => {
      if (now !== before) runOnJS(setLight)(now);
    },
  );

  /* the swipe */
  const from = useSharedValue(0);
  const landed = (to: number) => {
    aimed.current = to;
    tabs.go(TABS[to]!);
  };
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!held)
        .activeOffsetX([-14, 14])
        .failOffsetY([-12, 12])
        .onStart(() => {
          cancelAnimation(x);
          from.value = x.value;
          runOnJS(setMoving)(true);
          runOnJS(swipes.start)();
        })
        .onUpdate(e => {
          const max = (TABS.length - 1) * w.value;
          const nx = from.value - e.translationX;
          x.value = nx < 0 ? nx * GIVE : nx > max ? max + (nx - max) * GIVE : nx;
        })
        .onEnd(e => {
          const start = Math.max(0, Math.min(TABS.length - 1, Math.round(from.value / w.value)));
          const to = settleOn(start, e.translationX, e.velocityX, w.value);
          x.value = withSpring(to * w.value, { ...PAGE, velocity: -e.velocityX }, done => {
            if (done) runOnJS(rest)();
          });
          runOnJS(landed)(to);
          runOnJS(swipes.end)();
        }),
    [held], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const row = useAnimatedStyle(() => ({ transform: [{ translateX: -x.value }] }));

  if (!ok) return null;
  return (
    <View style={s.root}>
      {/* only while these pages are the screen showing: a page pushed over them sets its own */}
      {focused ? <StatusBar style={light ? 'light' : 'dark'} /> : null}
      <SwipeContext.Provider value={pan}>
        <GestureDetector gesture={pan}>
          <View style={s.window} testID="pager">
            <Animated.View style={[StyleSheet.absoluteFill, row]}>
              {TABS.map((t, i) => (
                <Page key={t} tab={t} left={i * W} width={W} active={i === index} shown={i === index || moving} />
              ))}
            </Animated.View>
          </View>
        </GestureDetector>
      </SwipeContext.Provider>
    </View>
  );
}

/* One of the three, told whether it is the one showing. A page off to the
   side is hidden from the screen reader, and on the web from the page
   while the pages rest. */
function Page({ tab, left, width, active, shown }: { tab: Tab; left: number; width: number; active: boolean; shown: boolean }) {
  const info = useMemo(() => ({ tab, active }), [tab, active]);
  return (
    <View
      style={[s.page, { left, width }, web && !shown ? s.gone : null]}
      aria-hidden={!active}
      importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
      pointerEvents={active ? 'auto' : 'none'}
      testID={`page-${tab}`}
    >
      <PageContext.Provider value={info}>{tab === 'home' ? <Home /> : tab === 'activities' ? <Activities /> : <Settings />}</PageContext.Provider>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colour.surface },
  /* on the web the window itself clips the pages to the side, and a clipped box here would keep a receipt's veil from blurring the page under it */
  window: { flex: 1, overflow: web ? 'visible' : 'hidden' },
  page: { position: 'absolute', top: 0, bottom: 0, backgroundColor: colour.surface },
  gone: { display: 'none' },
});
