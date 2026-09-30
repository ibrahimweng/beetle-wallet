/* A line's receipt, over the page it came from, in one step.

   The page stays where it is and goes soft under the veil — blurred, and
   white over it, see-through at the top and solid at the foot — and the
   receipt fills the screen over it: its amount travelling out of the
   line's own figure, the head and the slip coming up out of a blur around
   it. Back at the bottom left closes it, and so does the swipe an iPhone
   goes back with: from the left, the receipt following the finger off to
   the right with the page coming back under it. A swipe the other way
   goes nowhere. The foot is Back and the ask bar with the receipt's own
   question while it is up. */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Body, Head, Screen, Veil, keys, motion, settle, standard, swipes, useStill, type VeilTone } from '../../design';
import { useFoot } from '../more/Foot';
import { askHome } from '../more/More';
import { usePage } from '../tabs/page';
import { ReceiptBody, ReceiptHead, ReceiptShare, aboutOf, useReceipt } from './ReceiptScreen';

/** How long it takes to go. */
const AWAY = 200;

export function ReceiptOver({ id, tone = 'paper', onClose }: { id: string; tone?: VeilTone; onClose: () => void }) {
  const router = useRouter();
  const still = useStill();
  const { active } = usePage();
  const { width: W } = useWindowDimensions();
  const { ready, receipt } = useReceipt(id);
  const [sharing, setSharing] = useState(false);
  /* the receipt as drawn, for the picture the share sheet hands out */
  const slip = useRef<View>(null);

  /* 0 to 1 as it comes; the finger's pull to the right as it goes back */
  const t = useSharedValue(still ? 1 : 0);
  const pull = useSharedValue(0);
  const leaving = useRef(false);
  /* 1 once it is going by Back rather than by the finger */
  const going = useSharedValue(0);
  useEffect(() => {
    if (!still) t.value = withTiming(1, { duration: motion.enter, easing: standard });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const gone = useCallback(() => closeRef.current(), []);
  const close = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    if (still) return gone();
    going.value = 1;
    t.value = withTiming(0, { duration: AWAY, easing: settle }, done => {
      if (done) runOnJS(gone)();
    });
  }, [still, t, going, gone]);

  /* the phone's own back closes it too */
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sharing) setSharing(false);
      else close();
      return true;
    });
    return () => sub.remove();
  }, [close, sharing]);

  /* the foot: Back, which closes this, and the ask bar with the receipt's own question */
  useFoot(
    {
      kind: 'ask',
      placeholder: receipt?.ask ?? 'Ask about this',
      onAsk: q => {
        if (!receipt) return;
        close();
        askHome(router, q, aboutOf(receipt));
      },
      onScan: () => router.push('/scan'),
      onBack: close,
      veil: sharing ? 'away' : undefined,
    },
    active,
  );

  /* the back swipe: only ever to the right, and it takes the receipt with it */
  const back = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX(14)
        .failOffsetY([-12, 12])
        .onStart(() => {
          runOnJS(swipes.start)();
        })
        .onUpdate(e => {
          pull.value = Math.max(0, e.translationX);
        })
        .onEnd(e => {
          runOnJS(swipes.end)();
          if (e.translationX > W / 3 || e.velocityX > 500) {
            pull.value = withTiming(W, { duration: 220, easing: settle }, done => {
              if (done) runOnJS(gone)();
            });
          } else pull.value = withSpring(0, keys);
        }),
    [W, pull, gone],
  );

  const veil = useAnimatedStyle(() => ({ opacity: t.value * (1 - Math.min(1, pull.value / W)) }));
  const column = useAnimatedStyle(() => ({
    opacity: going.value ? t.value : 1 - Math.min(1, pull.value / W) * 0.4,
    transform: [{ translateX: pull.value }, { translateY: going.value ? (1 - t.value) * 16 : 0 }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} testID="receipt-over">
      <Animated.View style={[StyleSheet.absoluteFill, veil]} pointerEvents="none">
        <Veil tone={tone} testID="receipt-veil" />
      </Animated.View>
      <GestureDetector gesture={back}>
        <Animated.View style={[StyleSheet.absoluteFill, column]}>
          {!ready ? null : receipt ? (
            <Screen bare head={<ReceiptHead receipt={receipt} />}>
              <ReceiptBody id={id} receipt={receipt} slip={slip} onShare={() => setSharing(true)} white={sharing} />
            </Screen>
          ) : (
            <Screen bare>
              <Head>No receipt for that</Head>
              <Body tone="tertiary">The line it belonged to is not in this day.</Body>
            </Screen>
          )}
        </Animated.View>
      </GestureDetector>
      {sharing && receipt ? <ReceiptShare receipt={receipt} slip={slip} onDismiss={() => setSharing(false)} /> : null}
    </View>
  );
}
