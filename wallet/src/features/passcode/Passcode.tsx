/* The passcode before money moves, on a sheet over the chat as the frame
   draws it: the amount and who it is going to at the top, the six dots and
   the big pad under them, and a line at the foot saying nothing moves until
   the last digit lands. A wrong code shakes the dots and says how many
   tries are left; the third wrong one shuts the gate for half a minute and
   says so. The right one lands a tick where the dots were, the sheet goes,
   and the money moves. On a phone with a face enrolled the face is asked
   first, and the pad is the way past it; a face that did not take says so
   in red, with the face key there to try again, and from then the foot
   says what three wrong tries cost. A tap on the chat behind, or a pull
   down on the sheet, puts it away with nothing moved. */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Avatar, Display, Head, Icon, Keypad, Meta, Pips, Pop, Row, Sheet, Swap, colour, useStill } from '../../design';
import type { IconName } from '../../icons';
import { initialsOf } from '../../lib/format';
import { checkCode, checkFace, faceAvailable, lockedFor, refusal } from './check';

/** The frame's words for a face that did not take. */
const MISSED = 'Face ID did not catch you. Tap the face to try again.';

export function PasscodeSheet({
  amount,
  name,
  detail,
  verify,
  onDone,
  onCancel,
  faceMissed = false,
  glyph,
}: {
  amount: string;
  /** who it is going to */
  name: string;
  /** their bank and account, or what it is for */
  detail?: string;
  /** the device's own check of six digits */
  verify: (code: string) => Promise<boolean>;
  onDone: () => void;
  onCancel: () => void;
  /** opened as if the face had just been missed: the lab's place for the frame */
  faceMissed?: boolean;
  /** a bill or a bundle rather than a person: the glyph on a 40 square in the avatar's place */
  glyph?: IconName;
}) {
  const still = useStill();
  const [digits, setDigits] = useState('');
  const [note, setNote] = useState<{ text: string; bad?: boolean } | null>(faceMissed ? { text: MISSED, bad: true } : null);
  const [face, setFace] = useState(!!faceMissed);
  /* a face missed or a code refused: the foot turns to the warning */
  const [warned, setWarned] = useState(!!faceMissed);
  const [state, setState] = useState<'typing' | 'checking' | 'right' | 'leaving'>('typing');
  const [shake, setShake] = useState(0);
  const done = useRef(false);

  /* the way through once the code is right: the tick lands, then the sheet goes */
  const through = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setState('right');
    setTimeout(() => setState('leaving'), still ? 0 : 420);
  }, [still]);

  const tryFace = useCallback(async () => {
    setNote({ text: 'Looking…' });
    const ok = await checkFace();
    if (ok) through();
    else {
      setNote({ text: MISSED, bad: true });
      setWarned(true);
    }
  }, [through]);

  /* a phone with a face enrolled is asked for it first, once the sheet is there */
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
    setWarned(true);
    setTimeout(
      () => {
        setDigits('');
        setState('typing');
      },
      still ? 0 : 260,
    );
  };

  const line = note?.text ?? (face ? 'Or tap the face to use Face ID.' : 'Six digits, the ones you chose.');
  return (
    <Sheet leaving={state === 'leaving'} onGone={onDone} onDismiss={onCancel} testID="passcode">
      {/* the frame's column: the amount, 12, the person with 4 between their
          name and their bank; 24 to the ask and 8 to the line under it; 24 to
          the dots, 24 to the pad, 24 to the foot */}
      <View style={{ alignItems: 'center', gap: 12 }}>
        <Display accessibilityRole="header">{amount}</Display>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {glyph ? (
            <View style={s.square} testID="passcode-glyph">
              <Icon name={glyph} size={20} colour={colour.ink} />
            </View>
          ) : (
            <Avatar initials={initialsOf(name)} size={40} />
          )}
          <View style={{ gap: 4 }}>
            <Row>{name}</Row>
            {detail ? <Meta tone="secondary">{detail}</Meta> : null}
          </View>
        </View>
      </View>
      <View style={{ alignItems: 'center', gap: 8, marginTop: 24 }}>
        <Head>Enter your passcode</Head>
        <Swap value={line}>
          {shown => (
            <Meta tone={note?.bad ? 'bad' : 'secondary'} style={{ textAlign: 'center' }} accessibilityLiveRegion="polite" testID="note">
              {shown}
            </Meta>
          )}
        </Swap>
      </View>
      <View style={{ height: 14, marginTop: 24, alignItems: 'center', justifyContent: 'center' }}>
        {state === 'right' || state === 'leaving' ? (
          <Pop delay={0}>
            <View style={s.tick} accessibilityLabel="Confirmed">
              <Icon name="check" size={14} colour={colour.textInverse} />
            </View>
          </Pop>
        ) : (
          <Shake n={shake}>
            <Pips filled={digits.length} />
          </Shake>
        )}
      </View>
      <View style={{ marginTop: 24 }}>
        <Keypad big onKey={k => void key(k)} onFace={face ? () => void tryFace() : undefined} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 8, marginTop: 24 }}>
        <View style={{ marginTop: 2 }}>
          <Icon name="lock" size={16} colour={colour.textTertiary} />
        </View>
        <Meta tone="secondary" style={{ flex: 1 }}>
          {warned ? 'Three wrong tries locks the passcode for half a minute.' : 'Nothing moves until the sixth digit lands.'}
        </Meta>
      </View>
    </Sheet>
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
  square: { width: 40, height: 40, borderRadius: 12, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  tick: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colour.good,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
