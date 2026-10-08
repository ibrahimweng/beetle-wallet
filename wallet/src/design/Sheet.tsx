/* A sheet over the screen, as the frames draw one: a white panel inset 10
   from each side and the bottom with all four corners round, a grabber at
   its top, and the screen behind it turned down and put out of focus so the
   sheet is the only thing to read. It rises from below on the lift spring
   and drops back the same way. A tap on the screen behind it, or a pull down
   on its head, sends it back; the screen that put it up can send it back
   too, once what it was for is done.

   Measured off the passcode frame: the panel 373 wide from 10, its grabber
   44 by 4 at 16, its content 20 in, 32 below the top and 24 above the foot. */
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { colour } from './tokens';
import { away, lift, motion, useStill } from './motion';
import { GrowingBlur } from './Veil';

const SIDE = 10;
const RADIUS = 28;
/** how far below its place the sheet starts from */
const RISE = 460;
/** a pull this far down, or this fast, lets it go */
const LET_GO = 80;
const FLICK = 700;

export function Sheet({
  children,
  leaving = false,
  onGone,
  onDismiss,
  testID = 'sheet',
  foot = 24,
}: {
  children: ReactNode;
  /** the screen sending it back; onGone once it has gone */
  leaving?: boolean;
  onGone?: () => void;
  /** the person sending it back, by the screen behind or a pull down */
  onDismiss: () => void;
  testID?: string;
  /** the room under the content: 24 on most sheets, 14 on the share sheet */
  foot?: number;
}) {
  const still = useStill();
  const { height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  /* as tall as it may be: 92 in a hundred of the screen, and never up under the status bar (Round 19: a receipt sheet
     reaches its most) */
  const most = Math.min(H * 0.92, H - insets.top - 12 - SIDE);
  const t = useSharedValue(still ? 1 : 0);
  const pull = useSharedValue(0);
  const [out, setOut] = useState(false);
  const gone = useRef(onGone);
  gone.current = onGone;
  const dismissed = useRef(onDismiss);
  dismissed.current = onDismiss;

  useEffect(() => {
    if (still) return;
    t.value = withSpring(1, lift);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* one way down, whoever asked: the screen's leaving, or the person's pull */
  const drop = (then: 'gone' | 'dismissed') => {
    const after = () => (then === 'gone' ? gone.current?.() : dismissed.current());
    if (still) {
      after();
      return;
    }
    t.value = withTiming(0, { duration: motion.leave, easing: away }, finished => {
      if (finished) runOnJS(after)();
    });
  };
  useEffect(() => {
    if (leaving && !out) {
      setOut(true);
      drop('gone');
    }
  }, [leaving]); // eslint-disable-line react-hooks/exhaustive-deps
  const dismiss = () => {
    if (out) return;
    setOut(true);
    drop('dismissed');
  };

  const pan = Gesture.Pan()
    .activeOffsetY([10, 10])
    .onUpdate(e => {
      pull.value = Math.max(0, e.translationY);
    })
    .onEnd(e => {
      if (e.translationY > LET_GO || e.velocityY > FLICK) runOnJS(dismiss)();
      else pull.value = withSpring(0, lift);
    });

  const rising = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value * 2),
    transform: [{ translateY: (1 - t.value) * RISE + pull.value }],
  }));
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={out ? 'none' : 'auto'}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={dismiss} style={StyleSheet.absoluteFill}>
        {/* the screen behind goes out of focus by its blur growing, not by a blur fading in */}
        <GrowingBlur t={t} intensity={52} wash="rgba(43,39,33,0.25)" />
      </Pressable>
      <Animated.View style={[s.panel, { paddingBottom: foot, maxHeight: most }, rising]} testID={testID}>
        <GestureDetector gesture={pan}>
          <View style={s.head} hitSlop={{ bottom: 20 }}>
            <View style={s.grabber} testID={`${testID}-grabber`} />
          </View>
        </GestureDetector>
        {/* it gives way when the sheet is as tall as it may be, so a part of it that scrolls (a receipt) keeps the rest in view */}
        <View style={s.content} testID={`${testID}-content`}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: SIDE,
    right: SIDE,
    bottom: SIDE,
    borderRadius: RADIUS,
    backgroundColor: colour.surface,
    paddingHorizontal: 20,
  },
  head: { height: 32, paddingTop: 16, alignItems: 'center' },
  grabber: { width: 44, height: 4, borderRadius: 2, backgroundColor: colour.ruleStrong },
  content: { flexShrink: 1 },
});
