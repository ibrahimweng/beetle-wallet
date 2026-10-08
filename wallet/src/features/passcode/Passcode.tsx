/* The passcode before money moves, on a sheet over the chat as the frame
   draws it: the amount at the top, and under it the whole of what is about
   to happen, on a grey card — who (with their bank and account number, or
   their $tag), what they receive, the fee and what leaves which account, or
   what a bill, a bundle or a loan comes to — so it is read while the six
   digits go in. Then the six dots and the pad, as big as the screen has
   room for, and Cancel under it, plainly, since the sixth digit sends it.
   A wrong code shakes the dots and says how many tries are left; the third
   wrong one shuts the gate for half a minute and says so. The right one
   lands a tick where the dots were, the sheet goes, and the money moves. On
   a phone with a face enrolled the face is asked first, and the pad is the
   way past it; a face that did not take says so in red, with the face key
   there to try again. Cancel, a tap on what is behind, or a pull down on
   the sheet puts it away with nothing moved.

   Past a cap set on Spending limits, the face is not asked (a face can be
   held up to a phone), and once the six digits are right the three words are
   typed in full before it goes, as What happens at the line says (the
   analysis after Round 21: the caps were shown and never kept). */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Avatar, Button, Display, Head, Icon, Keypad, Label, Meta, PAD_CELLS, Pips, Pop, Row, Sheet, Swap, colour, font, padHeight, useStill } from '../../design';
import type { IconName } from '../../icons';
import { initialsOf } from '../../lib/format';
import { checkCode, checkFace, faceAvailable, lockedFor, refusal, waitWords } from './check';
import { WORDS, typedState } from '../settings/words';
import { useApp } from '../onboarding/store';
import { usePrefs } from '../settings/prefs';

/** The frame's words for a face that did not take. */
const MISSED = 'Face ID did not catch you. Tap the face to try again.';

/** A line of what is about to happen: a label at the left and its figure at the right; the strong one is what leaves. */
export type Breakdown = { label: string; value: string; strong?: boolean };

/** What the sheet takes up besides the pad, with a breakdown of so many lines: the head, the figure, the card, the ask, the dots, Cancel and the foot. */
const besides = (lines: number) => 32 + 40 + 12 + (lines ? 14 + 40 + 21 + lines * 26 + 12 : 52) + 20 + 24 + 4 + 20 + 14 + 14 + 14 + 12 + 48 + 24;

export function PasscodeSheet({
  amount,
  name,
  detail,
  verify,
  onDone,
  onCancel,
  faceMissed = false,
  glyph,
  rows = [],
  pastLimit,
}: {
  amount: string;
  /** who it is going to */
  name: string;
  /** their bank and account, or what it is for */
  detail?: string;
  /** the whole of it: what they receive, the fee, what leaves where */
  rows?: Breakdown[];
  /** the device's own check of six digits */
  verify: (code: string) => Promise<boolean>;
  onDone: () => void;
  onCancel: () => void;
  /** opened as if the face had just been missed: the lab's place for the frame */
  faceMissed?: boolean;
  /** a bill or a bundle rather than a person: the glyph on a 40 square in the avatar's place */
  glyph?: IconName;
  /** the cap this crosses, as the line says it: no face, and the three words after the six digits */
  pastLimit?: string | null;
}) {
  const still = useStill();
  const { height: H } = useWindowDimensions();
  /* the face only where Face ID is switched on in Lock and privacy (the analysis after Round 21: the switch was not kept) */
  const app = useApp();
  const { prefs, ready: prefsReady } = usePrefs(app.session?.account.accountNumber);
  /* the pad as big as there is room for under everything else on the sheet */
  const room = H * 0.92 - besides(rows.length);
  const cell = room >= padHeight(PAD_CELLS.big) ? PAD_CELLS.big : room >= padHeight(PAD_CELLS.snug) ? PAD_CELLS.snug : PAD_CELLS.small;
  const [digits, setDigits] = useState('');
  const [note, setNote] = useState<{ text: string; bad?: boolean } | null>(faceMissed ? { text: MISSED, bad: true } : null);
  const [face, setFace] = useState(!!faceMissed);
  const [state, setState] = useState<'typing' | 'checking' | 'right' | 'leaving'>('typing');
  const [shake, setShake] = useState(0);
  const done = useRef(false);
  /* past a cap: the six digits, then the words */
  const [stage, setStage] = useState<'code' | 'words'>('code');
  const [typed, setTyped] = useState('');
  const words = typedState(typed);

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
    }
  }, [through]);

  /* a phone with a face enrolled, and Face ID on, is asked for it first, once the sheet is there; never past a cap */
  useEffect(() => {
    let live = true;
    if (pastLimit || !prefsReady || !prefs.faceId) return;
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
  }, [tryFace, pastLimit, prefsReady, prefs.faceId]);

  const key = async (k: string) => {
    if (state !== 'typing') return;
    const shut = lockedFor();
    if (shut) {
      setNote({ text: `The gate is shut for ${waitWords(shut)} more.`, bad: true });
      return;
    }
    const d = k === 'del' ? digits.slice(0, -1) : (digits + k).slice(0, 6);
    setDigits(d);
    if (note?.bad) setNote(null);
    if (d.length < 6) return;
    setState('checking');
    const verdict = await checkCode(d, verify);
    if (verdict.ok) {
      if (pastLimit) {
        setStage('words');
        setState('typing');
        return;
      }
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

  const line = note?.text ?? (face ? 'Or tap the face. The sixth digit sends it.' : 'The sixth digit sends it.');
  /* Cancel, like a pull down or a tap behind: the sheet goes and nothing moves */
  const [cancelled, setCancelled] = useState(false);
  return (
    <Sheet leaving={state === 'leaving' || cancelled} onGone={cancelled ? onCancel : onDone} onDismiss={onCancel} testID="passcode">
      <View style={{ alignItems: 'center', gap: 12 }}>
        <Display accessibilityRole="header">{amount}</Display>
      </View>
      {/* the whole of it, on grey: who and where, then the money, the strongest line what leaves */}
      <View style={s.card} testID="passcode-breakdown">
        <View style={s.who}>
          {glyph ? (
            <View style={s.square} testID="passcode-glyph">
              <Icon name={glyph} size={20} colour={colour.ink} />
            </View>
          ) : (
            <Avatar initials={initialsOf(name)} size={40} />
          )}
          <View style={{ flex: 1, gap: 2 }}>
            <Row numberOfLines={1}>{name}</Row>
            {detail ? (
              <Meta tone="secondary" numberOfLines={1} testID="passcode-detail">
                {detail}
              </Meta>
            ) : null}
          </View>
        </View>
        {rows.length ? (
          <>
            <View style={s.rule} />
            {rows.map(r => (
              <View key={r.label} style={s.line} testID="passcode-line">
                <Meta tone={r.strong ? undefined : 'secondary'} style={r.strong ? { ...font('600') } : null}>
                  {r.label}
                </Meta>
                {r.strong ? <Label>{r.value}</Label> : <Meta>{r.value}</Meta>}
              </View>
            ))}
          </>
        ) : null}
      </View>
      {stage === 'words' ? (
        <View style={{ gap: 12, marginTop: 20 }} testID="past-limit">
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Head>Past your own limit</Head>
            <Meta tone="secondary" style={{ textAlign: 'center' }}>
              {`${pastLimit}. Your passcode is done; now type the three words in full.`}
            </Meta>
          </View>
          <TextInput
            accessibilityLabel="Type the three words"
            value={typed}
            onChangeText={setTyped}
            placeholder={WORDS}
            autoFocus
            autoCorrect={false}
            autoCapitalize="sentences"
            spellCheck={false}
            style={s.words}
            testID="past-limit-words"
          />
          <Meta tone={words.right ? 'secondary' : 'bad'} style={{ textAlign: 'center' }} accessibilityLiveRegion="polite">
            {words.line}
          </Meta>
          <Button label={`Confirm ${amount}`} size={48} disabled={!words.done || state !== 'typing'} onPress={through} />
          <Button label="Cancel" tone="grey" size={48} disabled={state !== 'typing'} onPress={() => setCancelled(true)} />
        </View>
      ) : (
        <>
          <View style={{ alignItems: 'center', gap: 4, marginTop: 20 }}>
            <Head>Enter your passcode</Head>
            <Swap value={line}>
              {shown => (
                <Meta tone={note?.bad ? 'bad' : 'secondary'} style={{ textAlign: 'center' }} accessibilityLiveRegion="polite" testID="note">
                  {shown}
                </Meta>
              )}
            </Swap>
          </View>
          <View style={{ height: 14, marginTop: 14, alignItems: 'center', justifyContent: 'center' }}>
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
          <View style={{ marginTop: 14 }}>
            <Keypad size={cell} onKey={k => void key(k)} onFace={face ? () => void tryFace() : undefined} />
          </View>
          {/* plainly, under the pad: the sixth digit sends it, so stopping is one tap away the whole time */}
          <View style={{ marginTop: 12 }}>
            <Button label="Cancel" tone="grey" size={48} disabled={state !== 'typing'} onPress={() => setCancelled(true)} />
          </View>
        </>
      )}
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
  card: { marginTop: 12, backgroundColor: colour.surface2, borderRadius: 20, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 40 },
  rule: { height: 1, backgroundColor: colour.rule, marginTop: 12, marginBottom: 8 },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, height: 26 },
  square: { width: 40, height: 40, borderRadius: 12, backgroundColor: colour.surface, alignItems: 'center', justifyContent: 'center' },
  words: { height: 52, borderRadius: 16, paddingHorizontal: 16, backgroundColor: colour.surface2, color: colour.ink, fontSize: 17, ...font('400') },
  tick: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colour.good,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
