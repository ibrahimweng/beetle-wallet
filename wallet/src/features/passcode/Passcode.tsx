/* The passcode over the chat, before money moves. The chat recedes behind
   it; the amount and where it is going sit at the top, the six dots and the
   pad under them, the way out at the foot. A wrong code shakes the dots and
   says how many tries are left; the third wrong one shuts the gate for half
   a minute and says so. The right one lands a tick where the dots were, and
   the pane goes, and the money moves. On a phone with a face enrolled the
   face is asked first, and the pad is the way past it. */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Caption, Icon, Keypad, Label, Meta, Pane, Pips, Pop, Row, Swap, Tap, colour, dark, motion, useStill } from '../../design';
import { checkCode, checkFace, faceAvailable, lockedFor, refusal } from './check';

export function PasscodePane({
  amount,
  title,
  sub,
  verify,
  onDone,
  onCancel,
}: {
  amount: string;
  /** where it is going */
  title: string;
  /** the fee, or what the panel said */
  sub?: string;
  /** the device's own check of six digits */
  verify: (code: string) => Promise<boolean>;
  onDone: () => void;
  onCancel: () => void;
}) {
  const still = useStill();
  const [digits, setDigits] = useState('');
  const [note, setNote] = useState<{ text: string; bad?: boolean } | null>(null);
  const [face, setFace] = useState(false);
  const [state, setState] = useState<'typing' | 'checking' | 'right' | 'leaving'>('typing');
  const [shake, setShake] = useState(0);
  const done = useRef(false);

  /* the way through once the code is right: the tick lands, then the pane goes */
  const through = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setState('right');
    setTimeout(
      () => {
        setState('leaving');
        setTimeout(onDone, still ? 0 : motion.leave);
      },
      still ? 0 : 420,
    );
  }, [onDone, still]);

  const tryFace = useCallback(async () => {
    setNote({ text: 'Looking…' });
    const ok = await checkFace();
    if (ok) through();
    else setNote({ text: 'The face did not take. The passcode works too.' });
  }, [through]);

  /* a phone with a face enrolled is asked for it first, once the pane is there */
  useEffect(() => {
    let live = true;
    faceAvailable().then(can => {
      if (!live || !can) return;
      setFace(true);
      setTimeout(() => {
        if (live) void tryFace();
      }, 400);
    });
    return () => {
      live = false;
    };
  }, [tryFace]);

  const key = async (k: string) => {
    if (state !== 'typing') return;
    const shut = lockedFor();
    if (shut) {
      setNote({ text: `The gate is shut for ${shut} more seconds.`, bad: true });
      return;
    }
    const d = k === 'del' ? digits.slice(0, -1) : (digits + k).slice(0, 6);
    setDigits(d);
    if (note?.bad) setNote(null);
    if (d.length < 6) return;
    setState('checking');
    const verdict = await checkCode(d, verify);
    if (verdict.ok) {
      through();
      return;
    }
    setShake(n => n + 1);
    setNote({ text: refusal(verdict), bad: true });
    setTimeout(
      () => {
        setDigits('');
        setState('typing');
      },
      still ? 0 : 260,
    );
  };

  return (
    <Pane leaving={state === 'leaving'} style={StyleSheet.absoluteFill}>
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" bounces={false}>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Animated.Text style={s.amount} accessibilityRole="header">
            {amount}
          </Animated.Text>
          <Row style={{ color: dark.text, textAlign: 'center' }}>{title}</Row>
          {sub ? <Meta style={{ color: dark.label }}>{sub}</Meta> : null}
        </View>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Label style={{ color: '#ffffff' }}>Enter your passcode</Label>
          <View style={{ minHeight: 20 }}>
            <Swap value={note?.text ?? (face ? 'Or use your face.' : 'Nothing moves until the sixth digit lands.')}>
              {shown => (
                <Meta style={{ color: note?.bad ? colour.badBright : dark.textSoft, textAlign: 'center' }} accessibilityLiveRegion="polite">
                  {shown}
                </Meta>
              )}
            </Swap>
          </View>
        </View>
        <View style={{ height: 28, justifyContent: 'center' }}>
          {state === 'right' || state === 'leaving' ? (
            <Pop delay={0} style={{ alignSelf: 'center' }}>
              <View style={s.tick} accessibilityLabel="Confirmed">
                <Icon name="check" size={14} colour={colour.textInverse} />
              </View>
            </Pop>
          ) : (
            <Shake n={shake}>
              <Pips filled={digits.length} tone="dark" />
            </Shake>
          )}
        </View>
        <Keypad tone="dark" onKey={k => void key(k)} onFace={face ? () => void tryFace() : undefined} />
        <Tap accessibilityRole="button" accessibilityLabel="Not now" onPress={onCancel} style={{ alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 12 }}>
          <Caption style={{ color: dark.textSoft }}>Not now</Caption>
        </Tap>
      </ScrollView>
    </Pane>
  );
}

/* The dots shaking off a wrong code. */
function Shake({ n, children }: { n: number; children: React.ReactNode }) {
  const still = useStill();
  const x = useSharedValue(0);
  useEffect(() => {
    if (!n || still) return;
    x.value = withSequence(withTiming(-8, { duration: 50 }), withTiming(8, { duration: 50 }), withTiming(-5, { duration: 50 }), withTiming(0, { duration: 50 }));
  }, [n, still, x]);
  const shaking = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return <Animated.View style={shaking}>{children}</Animated.View>;
}

const s = StyleSheet.create({
  body: { flexGrow: 1, justifyContent: 'center', gap: 20, paddingVertical: 12 },
  amount: { color: '#ffffff', fontWeight: '700', fontSize: 32, lineHeight: 40, letterSpacing: -1.06 },
  tick: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colour.good,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
