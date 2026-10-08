/* The first thing the app shows, on the way in's very dark brown (Round 27):
   the brand's punch-holed coin turning, then the logo and its name coming
   out where it was, and a line filling while what the device knows is read
   back. Then it goes where that says: the welcome for a new phone, the step
   somebody left off on, or home. It stays at least long enough for the
   reveal to be seen, so it never flickers; with motion reduced, the logo and
   the name are simply there. */
import React, { useEffect, useRef, useState } from 'react';
import { Animated as Plain, Easing as PlainEasing, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { CoinLoop, Lockup, Meta, Pane, Scheme, colour, night, settle, useStill } from '../src/design';
import { useApp } from '../src/features/onboarding/store';

/** The coin's time on its own, then the reveal, then a breath on the name. */
const TURN = 1400;
const REVEAL = 520;
const HOLD = TURN + REVEAL + 300;
/** the coin's picture; the coin fills four fifths of it */
const COIN = 220;

export default function Boot() {
  const { ready, session, progress } = useApp();
  const router = useRouter();
  const still = useStill();
  const [held, setHeld] = useState(false);
  const fill = useRef(new Plain.Value(0)).current;
  /* 0 the coin, 1 the logo and its name */
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
  const coin = useAnimatedStyle(() => ({ opacity: 1 - shown.value, transform: [{ scale: 1 - 0.35 * shown.value }] }));
  const lockup = useAnimatedStyle(() => ({ opacity: shown.value, transform: [{ scale: 0.86 + 0.14 * shown.value }] }));
  /* the line and its word come with the logo: the coin turns where they will be */
  const under = useAnimatedStyle(() => ({ opacity: shown.value }));
  return (
    <Scheme value="dark">
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: night.ground, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Beetle is opening" testID="boot">
        <Pane style={{ alignItems: 'center', gap: 16 }}>
          {/* the coin and the logo share one place: the logo's, 140 across */}
          <View style={{ width: 140, height: 28, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[{ position: 'absolute', width: COIN, height: COIN, left: 70 - COIN / 2, top: 14 - COIN / 2 }, coin]}>
              <CoinLoop size={COIN} />
            </Animated.View>
            <Animated.View style={lockup}>
              <Lockup width={140} />
            </Animated.View>
          </View>
          <Animated.View style={[{ alignItems: 'center', gap: 16 }, under]}>
            <View
              style={{
                width: 120,
                height: 3,
                borderRadius: 2,
                backgroundColor: night.panel2,
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
          </Animated.View>
        </Pane>
      </View>
    </Scheme>
  );
}
