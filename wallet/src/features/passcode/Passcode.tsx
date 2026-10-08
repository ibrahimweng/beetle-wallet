/* The password before money moves, on a sheet over the chat as the frame
   draws it: the amount at the top, and under it the whole of what is about
   to happen, on a grey card — who (with their bank and account number, or
   their $tag), what they receive, the fee and what leaves which account, or
   what a bill, a bundle or a loan comes to — so it is read while the
   password goes in. Then the password, typed on the phone's own keyboard
   (Round 30, the owner's word: the six digits are gone, and a password
   takes their place everywhere), Confirm under it, which the keyboard's
   Done does as well, and Cancel under that, plainly. Whatever is typed into
   stays in view: the sheet rides up on the keyboard, and where the two do
   not both fit, the card scrolls under the amount while the box and Confirm
   hold their place (keyboard.ts).

   A wrong password shakes the box and says under it, in red, how many tries
   are left; the third wrong one shuts the gate for half a minute and says
   so. The right one lands a tick at the end of the box, the sheet goes, and
   the money moves. On a phone with a face enrolled, and Face ID on, the face
   is asked first and the password is the way past it; a face that did not
   take says so in red, with the face at the end of the box to try again.
   Cancel, a tap on what is behind, or a pull down on the sheet puts it away
   with nothing moved.

   Past a cap set on Spending limits, the face is not asked (a face can be
   held up to a phone), and once the password is right the three words are
   typed in full before it goes, as What happens at the line says (the
   analysis after Round 21: the caps were shown and never kept). */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Avatar, Button, Display, Head, Icon, Label, Meta, Pop, Row, Sheet, Swap, Tap, colour, font, useStill } from '../../design';
import { TextBox } from '../../design/TextBox';
import type { IconName } from '../../icons';
import { initialsOf } from '../../lib/format';
import { checkCode, checkFace, demoHint, faceAvailable, lockedFor, refusal, waitWords } from './check';
import { roomOver, useKeyboardRoom } from './keyboard';
import { WORDS, typedState } from '../settings/words';
import { useApp } from '../onboarding/store';
import { usePrefs } from '../settings/prefs';

/** The frame's words for a face that did not take. */
const MISSED = 'Face ID did not catch you. Tap the face to try again, or type your password.';

/** A line of what is about to happen: a label at the left and its figure at the right; the strong one is what leaves. */
export type Breakdown = { label: string; value: string; strong?: boolean };

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
  /** the device's own check of the password */
  verify: (code: string) => Promise<boolean>;
  onDone: () => void;
  onCancel: () => void;
  /** opened as if the face had just been missed: the lab's place for the frame */
  faceMissed?: boolean;
  /** a bill or a bundle rather than a person: the glyph on a 40 square in the avatar's place */
  glyph?: IconName;
  /** the cap this crosses, as the line says it: no face, and the three words after the password */
  pastLimit?: string | null;
}) {
  const still = useStill();
  const insets = useSafeAreaInsets();
  /* the face only where Face ID is switched on in Lock and privacy (the analysis after Round 21: the switch was not kept) */
  const app = useApp();
  const { prefs, ready: prefsReady } = usePrefs(app.session?.account.accountNumber);
  const box = useRef<TextInput>(null);
  const [password, setPassword] = useState('');
  /* what the face is doing, on the line under the ask */
  const [note, setNote] = useState<{ text: string; bad?: boolean } | null>(faceMissed ? { text: MISSED, bad: true } : null);
  /* what was wrong with the password, in red under the box */
  const [wrong, setWrong] = useState<string | null>(null);
  const [face, setFace] = useState(!!faceMissed);
  const [state, setState] = useState<'typing' | 'checking' | 'right' | 'leaving'>('typing');
  const [shake, setShake] = useState(0);
  const done = useRef(false);
  /* past a cap: the password, then the words */
  const [stage, setStage] = useState<'code' | 'words'>('code');
  const [typed, setTyped] = useState('');
  const words = typedState(typed);
  /* the keyboard: the sheet sits on it, and the card gives way above the box where the two do not both fit */
  const behind = useRef<View>(null);
  const kb = useKeyboardRoom(behind);
  const [under, setUnder] = useState(0);
  const cap = kb.top === null ? undefined : Math.max(0, roomOver(kb.top, insets.top) - under);

  /* the way through once the password is right: the tick lands, then the sheet goes */
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
      box.current?.focus();
    }
  }, [through]);

  /* a phone with a face enrolled, and Face ID on, is asked for it first, once the sheet is there; never past a cap.
     Anywhere else the box takes the keyboard at once */
  useEffect(() => {
    let live = true;
    if (pastLimit) {
      box.current?.focus();
      return;
    }
    if (!prefsReady) return;
    if (!prefs.faceId) {
      box.current?.focus();
      return;
    }
    faceAvailable().then(can => {
      if (!live) return;
      if (!can) {
        box.current?.focus();
        return;
      }
      setFace(true);
      setTimeout(() => {
        if (live) void tryFace();
      }, 400);
    });
    return () => {
      live = false;
    };
  }, [tryFace, pastLimit, prefsReady, prefs.faceId]);

  const type = (t: string) => {
    if (state !== 'typing') return;
    setPassword(t);
    if (wrong) setWrong(null);
    if (note?.bad) setNote(null);
  };

  const check = async () => {
    if (state !== 'typing' || !password) return;
    const shut = lockedFor();
    if (shut) {
      setWrong(`The gate is shut for ${waitWords(shut)} more.`);
      return;
    }
    setState('checking');
    const verdict = await checkCode(password, verify);
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
    setWrong(refusal(verdict));
    setPassword('');
    setState('typing');
    /* Done on the keyboard put it away; it comes back for the next try */
    box.current?.focus();
  };

  const line = note?.text ?? (face ? 'The one you open Beetle with, or your face.' : 'The one you open Beetle with.');
  const landed = state === 'right' || state === 'leaving';
  /* Cancel, like a pull down or a tap behind: the sheet goes and nothing moves */
  const [cancelled, setCancelled] = useState(false);
  return (
    /* the screen behind the sheet, lifted onto the keyboard where the window does not make room for it */
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
          {/* what is typed into, and what sends it: held in view over the keyboard */}
          <View style={{ paddingTop: 20 }} onLayout={e => setUnder(e.nativeEvent.layout.height)}>
            {stage === 'words' ? (
              <View style={{ gap: 12 }} testID="past-limit">
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Head>Past your own limit</Head>
                  <Meta tone="secondary" style={{ textAlign: 'center' }}>
                    {`${pastLimit}. Your password is done; now type the three words in full.`}
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
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Head>Enter your password</Head>
                  <Swap value={line}>
                    {shown => (
                      <Meta tone={note?.bad ? 'bad' : 'secondary'} style={{ textAlign: 'center' }} accessibilityLiveRegion="polite" testID="note">
                        {shown}
                      </Meta>
                    )}
                  </Swap>
                </View>
                <View style={{ marginTop: 16 }}>
                  <Shake n={shake}>
                    <TextBox
                      ref={box}
                      label="Password"
                      value={password}
                      onChangeText={type}
                      secret
                      note={wrong ?? demoHint(app.session?.account)}
                      bad={!!wrong}
                      returnKeyType="done"
                      onSubmitEditing={() => void check()}
                      textContentType="password"
                      autoComplete="current-password"
                      testID="password-field"
                      right={
                        landed ? (
                          <Pop delay={0}>
                            <View style={s.tick} accessibilityLabel="Confirmed">
                              <Icon name="check" size={12} colour={colour.textInverse} />
                            </View>
                          </Pop>
                        ) : face ? (
                          <Tap accessibilityRole="button" accessibilityLabel="Use Face ID" hitSlop={10} disabled={state !== 'typing'} onPress={() => void tryFace()}>
                            <Icon name="faceid" size={20} colour={colour.ink} />
                          </Tap>
                        ) : null
                      }
                    />
                  </Shake>
                </View>
                {/* Confirm, then Cancel plainly under it, so stopping is one tap away the whole time */}
                <View style={{ marginTop: 12, gap: 12 }}>
                  <Button label="Confirm" size={48} disabled={!password || state !== 'typing'} onPress={() => void check()} />
                  <Button label="Cancel" tone="grey" size={48} disabled={state !== 'typing'} onPress={() => setCancelled(true)} />
                </View>
              </>
            )}
          </View>
        </Sheet>
      </View>
    </View>
  );
}

/* The box shaking off a wrong password. */
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colour.good,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
