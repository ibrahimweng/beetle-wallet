/* The first thing the app shows: the brand's clay coin turning, then the
   mark and the name coming out where it was (Round 26), and a line filling
   while what the device knows is read back. Then it goes where that says:
   the welcome for a new phone, the step somebody left off on, or home. It
   stays at least long enough for the reveal to be seen, so it never
   flickers; with motion reduced, the mark and the name are simply there. */
import React, { useEffect, useRef, useState } from 'react';
import { Animated as Plain, Easing as PlainEasing, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Coin, Display, Icon, Meta, Pane, colour, settle, useStill } from '../src/design';
import { useApp } from '../src/features/onboarding/store';

/** The coin's turn, then the reveal, then a breath on the name. */
const TURN = 1100;
const REVEAL = 520;
const HOLD = TURN + REVEAL + 300;

export default function Boot() {
  const { ready, session, progress } = useApp();
  const router = useRouter();
  const still = useStill();
  const [held, setHeld] = useState(false);
  const fill = useRef(new Plain.Value(0)).current;
  /* 0 the coin, 1 the mark and the name */
  const shown = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    Plain.timing(fill, {
      toValue: 1,
      duration: still ? 900 : HOLD,
      easing: PlainEasing.out(PlainEasing.cubic),
      useNativeDriver: false,
    }).start();
    if (!still) shown.value = withDelay(TURN, withTiming(1, { duration: REVEAL, easing: settle }));
    const t = setTimeout(() => setHeld(true), still ? 900 : HOLD);
    return () => clearTimeout(t);
  }, [fill, shown, still]);
  useEffect(() => {
    if (!ready || !held) return;
    /* a session goes home, unless the account was opened a moment ago and
       the ready screen has not been seen; everything else is the way in */
    router.replace(session && !progress.accountNumber ? '/home' : '/way-in');
  }, [ready, held, session, progress, router]);
  const coin = useAnimatedStyle(() => ({ opacity: 1 - shown.value, transform: [{ scale: 1 - 0.45 * shown.value }] }));
  const mark = useAnimatedStyle(() => ({ opacity: shown.value, transform: [{ scale: 0.7 + 0.3 * shown.value }] }));
  const name = useAnimatedStyle(() => {
    const k = Math.max(0, Math.min(1, (shown.value - 0.25) / 0.75));
    return { opacity: k, transform: [{ translateY: 10 * (1 - k) }] };
  });
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colour.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityLabel="Beetle is opening"
    >
      <Pane style={{ alignItems: 'center', gap: 16 }}>
        <View style={{ width: 56, height: 56 }}>
          <Animated.View style={[{ position: 'absolute', top: 0, left: 0 }, coin]}>
            <Coin size={56} reach={150} spin={still ? 'still' : 'once'} duration={TURN} />
          </Animated.View>
          <Animated.View style={mark}>
            <Icon name="mark" size={56} colour={colour.ink} />
          </Animated.View>
        </View>
        <Animated.View style={name}>
          <Display>Beetle</Display>
        </Animated.View>
        <View
          style={{
            width: 120,
            height: 3,
            borderRadius: 2,
            backgroundColor: colour.surface3,
            overflow: 'hidden',
            marginTop: 8,
          }}
        >
          <Plain.View
            style={{
              height: 3,
              backgroundColor: colour.accent,
              width: fill.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }}
          />
        </View>
        <Meta tone="tertiary">{ready ? 'Ready' : 'Opening'}</Meta>
      </Pane>
    </View>
  );
}
