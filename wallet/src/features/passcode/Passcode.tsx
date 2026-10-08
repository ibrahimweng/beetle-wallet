/* The passcode before money moves, on a sheet over the chat as the frame
   draws it: the amount at the top, and under it the whole of what is about
   to happen, on a grey card — who (with their bank and account number, or
   their $tag), what they receive, the fee and what leaves which account, or
   what a bill, a bundle or a loan comes to — so it is read while the six
   digits go in. Then the six dots and the pad, as big as the screen has
   room for, and Cancel under it, plainly, since the sixth digit sends it.
   A wrong code shakes the dots and says how many tries are left; the third
   wrong one shuts the gate for half a minute and says so. The right one
   lands a tick where the dots were, the sheet goes, and the money moves.

   The face or the finger first (Round 32, the owner's word): where it is
   switched on in Lock and privacy and the phone has one set up, the phone
   asks at once, as the sheet comes up, and a yes moves the money. A no, or
   Use passcode on the phone's own sheet, leaves the pad where it is, with a
   line in red saying so and the key at the pad's bottom left to try again.
   Where the phone cannot be asked (the web, Expo Go on an iPhone, nothing
   set up) the pad is simply there, with nothing said (biometric.ts). Cancel,
   a tap on what is behind, or a pull down on the sheet puts it away with
   nothing moved.

   Past a cap set on Spending limits, the face is not asked (a face can be
   held up to a phone), and once the six digits are right the three words are
   typed in full before it goes, as What happens at the line says (the
   analysis after Round 21: the caps were shown and never kept). Those are
   typed on the phone's own keyboard, and stay in view over it: the sheet
   rides up on the keyboard, and where the two do not both fit, the card
   scrolls under the amount while the words and Confirm hold their place
   (keyboard.ts, Round 30). */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Avatar, Button, Display, Head, Icon, Keypad, Label, Meta, PAD_CELLS, Pips, Pop, Row, Sheet, Swap, colour, font, padHeight, useStill } from '../../design';
import type { IconName } from '../../icons';
import { initialsOf } from '../../lib/format';
import { checkCode, demoHint, lockedFor, refusal, waitWords } from './check';
import { askBiometric, askingLine, biometricAvailable, capital, isFace, useBiometricName } from './biometric';
import { roomOver, useKeyboardRoom } from './keyboard';
import { WORDS, typedState } from '../settings/words';
import { useApp } from '../onboarding/store';
import { usePrefs } from '../settings/prefs';

/** The frame's words for a face that did not take, and the same for a finger. */
const missedLine = (name: string) => `${capital(name)} did not catch you. ${isFace(name) ? 'Tap the face' : 'Tap the key at the bottom left'} to try again.`;

/** A line of what is about to happen: a label at the left and its figure at the right; the strong one is what leaves. */
export type Breakdown = { label: string; value: string; strong?: boolean };

/** What the sheet takes up besides the pad, with a breakdown of so many lines and so many lines of words under the
    ask: the head, the figure, the card, the ask, the dots, Cancel and the foot. */
const besides = (lines: number, said = 1) => 32 + 40 + 12 + (lines ? 14 + 40 + 21 + lines * 26 + 12 : 52) + 20 + 24 + 4 + 20 * said + 14 + 14 + 14 + 12 + 48 + 24;

/** What the line under the ask says: words of the sheet's own, the phone asking, or the face missed. */
type Note = { text: string; bad?: boolean } | 'asking' | 'missed';

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
  const insets = useSafeAreaInsets();
  /* the face only where Face ID is switched on in Lock and privacy (the analysis after Round 21: the switch was not kept) */
  const app = useApp();
  const { prefs, ready: prefsReady } = usePrefs(app.session?.account.accountNumber);
  /* what the phone checks, by its own name: Face ID, Touch ID, fingerprint */
  const bio = useBiometricName();
  /* the build's own six digits, said where they open it (the lab, the demo account) */
  const hint = demoHint(app.session?.account);
  /* the pad as big as there is room for under everything else on the sheet, which is as tall as a sheet may be */
  const room = Math.min(H * 0.92, H - insets.top - 22) - besides(rows.length, hint ? 2 : 1);
  const cell = room >= padHeight(PAD_CELLS.big) ? PAD_CELLS.big : room >= padHeight(PAD_CELLS.snug) ? PAD_CELLS.snug : PAD_CELLS.small;
  const [digits, setDigits] = useState('');
  const [note, setNote] = useState<Note | null>(faceMissed ? 'missed' : null);
  /* the face key on the pad: there once the phone can be asked, or as the frame draws it missed */
  const [face, setFace] = useState(!!faceMissed);
  const [state, setState] = useState<'typing' | 'checking' | 'right' | 'leaving'>('typing');
  const [shake, setShake] = useState(0);
  const done = useRef(false);
  const asked = useRef(false);
  /* past a cap: the six digits, then the words */
  const [stage, setStage] = useState<'code' | 'words'>('code');
  const [typed, setTyped] = useState('');
  const words = typedState(typed);
  /* the keyboard, for the words: the sheet sits on it, and the card gives way above them where the two do not both fit */
  const behind = useRef<View>(null);
  const kb = useKeyboardRoom(behind);
  const [under, setUnder] = useState(0);
  const cap = kb.top === null ? undefined : Math.max(0, roomOver(kb.top, insets.top) - under);

  /* the pad is the sheet's keyboard: the phone's own goes, wherever it was up from */
  useEffect(() => {
    Keyboard.dismiss();
  }, []);

  /* the way through once the code is right: the tick lands, then the sheet goes */
  const through = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setState('right');
    setTimeout(() => setState('leaving'), still ? 0 : 420);
  }, [still]);

  const tryFace = useCallback(async () => {
    setNote('asking');
    const answer = await askBiometric(`Confirm ${amount} to ${name}`);
    if (answer === 'ok') through();
    else if (answer === 'failed') setNote('missed');
    else {
      /* it cannot be asked after all: the pad alone, and nothing said */
      setFace(false);
      setNote(null);
    }
  }, [through, amount, name]);

  /* a phone with a face or a finger set up, and it switched on, is asked at once, once the sheet is there; never past a
     cap, and only the once (the key on the pad asks again) */
  useEffect(() => {
    if (pastLimit || faceMissed || !prefsReady || !prefs.faceId || asked.current) return;
    let live = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    void biometricAvailable().then(can => {
      if (!live || !can) return;
      setFace(true);
      timer = setTimeout(() => {
        if (!live || asked.current) return;
        asked.current = true;
        void tryFace();
      }, 400);
    });
    return () => {
      live = false;
      if (timer) clearTimeout(timer);
    };
  }, [tryFace, pastLimit, faceMissed, prefsReady, prefs.faceId]);

  const bad = note === 'missed' || (typeof note === 'object' && !!note?.bad);
  const key = async (k: string) => {
    if (state !== 'typing') return;
    const shut = lockedFor();
    if (shut) {
      setNote({ text: `The gate is shut for ${waitWords(shut)} more.`, bad: true });
      return;
    }
    const d = k === 'del' ? digits.slice(0, -1) : (digits + k).slice(0, 6);
    setDigits(d);
    if (bad) setNote(null);
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

  const idle = face ? `${isFace(bio) ? 'Or tap the face' : `Or ${bio}, at the bottom left`}. The sixth digit sends it.` : 'The sixth digit sends it.';
  const line = note === 'missed' ? missedLine(bio) : note === 'asking' ? askingLine(bio) : (note?.text ?? (hint ? `${idle} ${hint}` : idle));
  /* Cancel, like a pull down or a tap behind: the sheet goes and nothing moves */
  const [cancelled, setCancelled] = useState(false);
  return (
    /* the screen behind the sheet, lifted onto the keyboard where the window does not make room for it (the words) */
    <View ref={behind} style={[StyleSheet.absoluteFill, { paddingBottom: kb.lift }]} pointerEvents="box-none">
      <View style={{ flex: 1 }} pointerEvents="box-none">
        <Sheet leaving={state === 'leaving' || cancelled} onGone={cancelled ? onCancel : onDone} onDismiss={onCancel} testID="passcode">
          {/* the amount and the whole of it: the part that gives way, scrolling, when the keyboard leaves too little room */}
          <ScrollView style={[s.above, cap === undefined ? null : { maxHeight: cap }]} bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
          </ScrollView>
          {stage === 'words' ? (
            /* what is typed into, and what sends it: held in view over the keyboard */
            <View style={{ gap: 12, paddingTop: 20 }} onLayout={e => setUnder(e.nativeEvent.layout.height)} testID="past-limit">
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
                {/* two lines held where the build's digits are said, so the pad does not jump as the line changes */}
                <View style={{ minHeight: hint ? 40 : 20 }}>
                  <Swap value={line}>
                    {shown => (
                      <Meta tone={bad ? 'bad' : 'secondary'} style={{ textAlign: 'center' }} accessibilityLiveRegion="polite" testID="note">
                        {shown}
                      </Meta>
                    )}
                  </Swap>
                </View>
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
                {/* the face or the finger again, at the pad's bottom left */}
                <Keypad size={cell} onKey={k => void key(k)} onFace={face ? () => void tryFace() : undefined} faceLabel={`Use ${bio}`} />
              </View>
              {/* plainly, under the pad: the sixth digit sends it, so stopping is one tap away the whole time */}
              <View style={{ marginTop: 12 }}>
                <Button label="Cancel" tone="grey" size={48} disabled={state !== 'typing'} onPress={() => setCancelled(true)} />
              </View>
            </>
          )}
        </Sheet>
      </View>
    </View>
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
  /* as tall as what it holds, and no taller */
  above: { flexGrow: 0 },
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
