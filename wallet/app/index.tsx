/* The first thing the app shows: the mark, the name, and a line filling
   while what the device knows is read back. Then it goes where that says: the
   welcome for a new phone, the step somebody left off on, or home. It stays
   at least long enough to be seen, so it never flickers. */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Display, Icon, Meta, Pane, colour } from '../src/design';
import { useApp } from '../src/features/onboarding/store';
import { landing, nextStep, routeOf } from '../src/features/onboarding/machine';

const HOLD = 900;

export default function Boot() {
  const { ready, session, progress } = useApp();
  const router = useRouter();
  const [held, setHeld] = useState(false);
  const fill = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fill, {
      toValue: 1,
      duration: HOLD,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    const t = setTimeout(() => setHeld(true), HOLD);
    return () => clearTimeout(t);
  }, [fill]);
  useEffect(() => {
    if (!ready || !held) return;
    router.replace(routeOf[session ? landing(progress) : nextStep(progress)]);
  }, [ready, held, session, progress, router]);
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
        <Icon name="mark" size={56} colour={colour.accent} />
        <Display>Beetle</Display>
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
          <Animated.View
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
