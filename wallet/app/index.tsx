/* The first thing the app shows, on the way in's very dark brown (Round 28,
   the owner's word): the real logo and its name, in the middle, coming out
   of a blur that passes across them; then, on a new phone, the logo rises
   to its place at the top of the welcome, where the welcome takes over from
   it without a seam. Going home, or back to a step somebody left off on, it
   fades instead. It stays at least long enough for the reveal to be seen;
   with motion reduced, the logo is simply there. */
import React, { useEffect, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { LOCKUP_H, LOCKUP_W, LogoReveal, Scheme, away, blurred, night, settle, useStill } from '../src/design';
import { revealBox } from '../src/design/revealPieces';
import { useApp } from '../src/features/onboarding/store';
import { initialStage } from '../src/features/onboarding/stages';
import { logoTop } from '../src/features/onboarding/tops';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** the logo's width in the middle, and at the top of the welcome */
const WIDE = 140;
/** a beat of the dark, the blur passing across, a breath on the logo; then it rises, or fades */
const WAIT = 200;
const REVEAL = 1100;
const HOLD = 260;
const RISE = 700;
const FADE = 320;

export default function Boot() {
  const { ready, session, progress } = useApp();
  const router = useRouter();
  const still = useStill();
  const { width, height } = useWindowDimensions();
  /* where the welcome has it: the owner's frame, 56 from the top, lower on a phone whose top reaches further */
  const top = logoTop(useSafeAreaInsets().top);
  const [shown, setShown] = useState(false);
  const went = useRef(false);
  const t = useSharedValue(still ? 1 : 0);
  const rise = useSharedValue(0);
  const out = useSharedValue(0);
  useEffect(() => {
    if (!still) t.value = withDelay(WAIT, withTiming(1, { duration: REVEAL, easing: Easing.linear }));
    const timer = setTimeout(() => setShown(true), still ? 900 : WAIT + REVEAL + HOLD);
    return () => clearTimeout(timer);
  }, [t, still]);
  useEffect(() => {
    if (!ready || !shown || went.current) return;
    went.current = true;
    /* a session goes home, unless the account was opened a moment ago and the ready screen has not been seen;
       everything else is the way in, which takes over from here without sliding in */
    const home = !!session && !progress.accountNumber;
    const welcome = !home && initialStage(progress, session) === 'welcome';
    const go = () => router.replace(home ? '/home' : '/way-in?from=boot');
    if (still) go();
    else if (welcome) rise.value = withTiming(1, { duration: RISE, easing: settle }, done => done && runOnJS(go)());
    else out.value = withTiming(1, { duration: FADE, easing: away }, done => done && runOnJS(go)());
  }, [ready, shown, session, progress, router, still, rise, out]);
  const box = revealBox(WIDE);
  /* the middle of the logo, from the middle of the screen to the middle of where the welcome has it, and its width from WIDE to the welcome's */
  const toY = top + LOCKUP_H / 2 - height / 2;
  const toScale = LOCKUP_W / WIDE;
  const moving = useAnimatedStyle(() => ({
    opacity: 1 - out.value,
    transform: [{ translateY: toY * rise.value }, { scale: 1 + (toScale - 1) * rise.value - 0.04 * out.value }],
    ...blurred(out.value * 8),
  }));
  return (
    <Scheme value="dark">
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: night.ground }} accessibilityLabel="Beetle is opening" testID="boot">
        <Animated.View style={[{ position: 'absolute', left: (width - box.width) / 2, top: (height - box.height) / 2 }, moving]}>
          <LogoReveal width={WIDE} t={t} colour={night.lockup} />
        </Animated.View>
      </View>
    </Scheme>
  );
}
