/* A new password (Round 30, the owner's word: a text password in place of
   the six digits, everywhere), from Password in Lock and privacy. One page:
   first the password it is now (or the face, where Face ID is switched on
   and the phone has one), so a phone left open cannot have its password
   changed under it (the analysis after Round 21); then the new one, with
   what it has to be under it, each rule ticking as it is met; then Change
   password at the foot, beside Back, which the keyboard's Done does as
   well. The one it is now goes through the same gate as money does, so
   wrong tries count and shut it the same way, and the new one takes the old
   one's place on this phone, stretched, never as typed. An account with no
   password kept here yet goes straight to the new one. Whatever is typed
   into stays in view: the page rides up over the keyboard, and the foot
   rides on it.

   From Lock and privacy it goes back there; from Not your phone it lifts the
   freeze and goes home, and the three steps that got here stand above the
   boxes. */
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Aside, Icon, Meta, PageHead, Screen, Tap, Tick, colour, toast, washes } from '../../design';
import { TextBox } from '../../design/TextBox';
import type { IconName } from '../../icons';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { PASSWORD_RULES, PASSWORD_WORDS, passwordProblem } from '../onboarding/validation';
import { useFoot } from '../more/Foot';
import { usePrefs } from './prefs';
import { COOL_MS } from './gate';
import { openTab } from '../tabs/tabs';
import { checkCode, checkFace, demoHint, faceAvailable, lockedFor, refusal, waitWords } from '../passcode/check';
import { LAB } from '../../lab/enabled';

const STEPS: { icon: IconName; label: string }[] = [
  { icon: 'phone-filled', label: 'Frozen' },
  { icon: 'id-filled', label: 'Your number' },
  { icon: 'faceid-filled', label: 'Your face' },
];

/** Each rule on its own, so the list ticks them in whatever order they are met (passwordProblem says only the first
    one missing). */
const MEETS: Record<(typeof PASSWORD_RULES)[number]['problem'], (pw: string) => boolean> = {
  short: pw => pw.length >= 8,
  letters: pw => /[A-Za-z]/.test(pw),
  digits: pw => /\d/.test(pw),
};

export function NewCode() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ from?: string; /** the lab: the password it is now taken as proved, as the frame draws the page after it */ proved?: string }>();
  const account = app.session?.account;
  const { prefs, ready, set } = usePrefs(account?.accountNumber);
  /* the password it is now, proved first; null until it is known whether there is one */
  const [proved, setProved] = useState<boolean | null>(null);
  const [byFace, setByFace] = useState(false);
  const [face, setFace] = useState(false);
  const [now, setNow] = useState('');
  const [fresh, setFresh] = useState('');
  /* what was wrong with the one it is now, in red under its box */
  const [wrong, setWrong] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nowBox = useRef<TextInput>(null);
  const freshBox = useRef<TextInput>(null);
  useEffect(() => {
    let live = true;
    if (LAB && asked.proved === '1') {
      setProved(true);
      return;
    }
    void app.hasPasscode().then(has => {
      if (live) setProved(!has && !account?.demo);
    });
    return () => {
      live = false;
    };
  }, [app, account?.demo, asked.proved]);
  /* the face, where it is switched on and the phone has one, proves it as well as the password */
  useEffect(() => {
    if (proved !== false || !ready || !prefs.faceId) return;
    let live = true;
    void faceAvailable().then(can => {
      if (live) setFace(can);
    });
    return () => {
      live = false;
    };
  }, [proved, ready, prefs.faceId]);
  /* the first box there is takes the keyboard, once the page is there to hold it */
  const shown = ok && !!account;
  useEffect(() => {
    if (proved === null || !shown) return;
    (proved ? freshBox : nowBox).current?.focus();
  }, [proved, shown]);

  const frozen = asked.from === 'frozen';
  const names = [account?.firstName, account?.lastName, account?.username].filter((n): n is string => !!n);
  const problem = passwordProblem(fresh, { names });
  const same = !proved && !!now && fresh === now;
  /* what the rules do not show: a name in it, one of the commonest, the one it is now */
  const refused = !fresh ? null : same ? 'That is the one it is now.' : problem === 'name' || problem === 'common' ? PASSWORD_WORDS[problem] : null;
  const canGo = proved !== null && !busy && !problem && !same && (proved || !!now);

  const change = async () => {
    if (!canGo) return;
    if (!proved) {
      const shut = lockedFor();
      if (shut) {
        setWrong(`The gate is shut for ${waitWords(shut)} more.`);
        return;
      }
      setBusy(true);
      const verdict = await checkCode(now, app.checkPasscode);
      if (!verdict.ok) {
        setBusy(false);
        setWrong(refusal(verdict));
        setNow('');
        nowBox.current?.focus();
        return;
      }
    }
    setBusy(true);
    await app.setPasscode(fresh);
    Keyboard.dismiss();
    if (frozen) {
      set({ frozen: false, sendAfter: Date.now() + COOL_MS });
      toast('Your password is new, and the money is yours again. Sending waits twelve hours.');
      openTab(router, 'home');
    } else {
      toast('Your password is new.');
      router.back();
    }
  };

  const byTheFace = async () => {
    if (busy || proved !== false) return;
    if (await checkFace()) {
      setProved(true);
      setByFace(true);
      setWrong(null);
    } else setWrong('Face ID did not catch you. Your password works as well.');
  };

  /* the foot: Back beside the one button, which waits for a new password that keeps every rule */
  useFoot({ kind: 'button', label: 'Change password', disabled: !canGo, onPress: () => void change() });
  if (!ok || !account) return null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen wash={washes.newcode} head={<PageHead lead title="Change password" sub="What opens Beetle and sends your money" />}>
        {frozen ? (
          <View style={s.steps} testID="steps">
            {STEPS.map(st => (
              <View key={st.label} style={s.step}>
                <Icon name={st.icon} size={16} colour={colour.ink} />
                <Meta>{st.label}</Meta>
              </View>
            ))}
          </View>
        ) : null}
        {proved === false ? (
          <TextBox
            ref={nowBox}
            label="Current password"
            value={now}
            onChangeText={t => {
              setNow(t);
              if (wrong) setWrong(null);
            }}
            secret
            note={wrong ?? (face ? 'Or your face: tap it at the end of the box.' : demoHint(account))}
            bad={!!wrong}
            returnKeyType="next"
            onSubmitEditing={() => freshBox.current?.focus()}
            textContentType="password"
            autoComplete="current-password"
            testID="current-password"
            right={
              face ? (
                <Tap accessibilityRole="button" accessibilityLabel="Use Face ID" hitSlop={10} disabled={busy} onPress={() => void byTheFace()}>
                  <Icon name="faceid" size={20} colour={colour.ink} />
                </Tap>
              ) : null
            }
          />
        ) : byFace ? (
          <View style={s.rule}>
            <Tick on size={16} delay={0} />
            <Meta>Face ID said it is you.</Meta>
          </View>
        ) : null}
        <View style={{ gap: 12 }}>
          <TextBox
            ref={freshBox}
            label="New password"
            value={fresh}
            onChangeText={setFresh}
            secret
            note={refused ?? undefined}
            bad={!!refused}
            returnKeyType="done"
            onSubmitEditing={() => void change()}
            textContentType="newPassword"
            autoComplete="new-password"
            testID="new-password"
          />
          {/* what it has to be, each ticking as it is met */}
          <View style={{ gap: 6, paddingHorizontal: 4 }} testID="password-rules">
            {PASSWORD_RULES.map(r => {
              const met = MEETS[r.problem](fresh);
              return (
                <View key={r.problem} style={s.rule} accessible accessibilityLabel={met ? `${r.words}: done` : r.words}>
                  {/* a tick that lands as the rule is met, and a ring again if it is undone */}
                  <Tick key={met ? 'met' : 'not'} on={met} size={16} delay={met ? 0 : undefined} />
                  <Meta tone={met ? 'ink' : 'secondary'}>{r.words}</Meta>
                </View>
              );
            })}
          </View>
        </View>
        <Aside>{proved === false ? 'Kept on this phone, never as you typed it. Nobody can change it without the one it is now.' : 'Kept on this phone, never as you typed it.'}</Aside>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  /* the three steps that got here from Not your phone, done, on one line */
  steps: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
