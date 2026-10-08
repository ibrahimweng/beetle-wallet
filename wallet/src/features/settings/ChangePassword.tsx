/* Change password, from Password in Lock and privacy (Round 30's page,
   kept in Round 32 when the six digits came back: the password is what
   logs in on a new phone, and the passcode what opens the app and sends
   money). One page: first the password it is now, so a phone left open
   cannot have its password changed under it (the analysis after Round 21);
   then the new one, with what it has to be under it, each rule ticking as
   it is met; then Change password at the foot, beside Back, which the
   keyboard's Done does as well. The one it is now goes through the same
   gate as money does, so wrong tries count and shut it the same way, and
   the new one takes the old one's place, stretched, never as typed.
   Whatever is typed into stays in view: the page rides up over the
   keyboard, and the foot rides on it. An account that logs in with Google
   or Apple has no password, and Lock and privacy has no row for it. */
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Aside, Meta, PageHead, Screen, Tick, toast, washes } from '../../design';
import { TextBox } from '../../design/TextBox';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { PASSWORD_RULES, PASSWORD_WORDS, passwordProblem } from '../onboarding/validation';
import { useFoot } from '../more/Foot';
import { checkCode, demoHint, lockedFor, refusal, waitWords } from '../passcode/check';
import { LAB } from '../../lab/enabled';

/** Each rule on its own, so the list ticks them in whatever order they are met (passwordProblem says only the first
    one missing). */
const MEETS: Record<(typeof PASSWORD_RULES)[number]['problem'], (pw: string) => boolean> = {
  short: pw => pw.length >= 8,
  letters: pw => /[A-Za-z]/.test(pw),
  digits: pw => /\d/.test(pw),
};

export function ChangePassword() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ /** the lab: the password it is now taken as proved, to look at the new one */ proved?: string }>();
  const account = app.session?.account;
  /* the password it is now, proved first */
  const proved = LAB && asked.proved === '1';
  const [now, setNow] = useState('');
  const [fresh, setFresh] = useState('');
  /* what was wrong with the one it is now, in red under its box */
  const [wrong, setWrong] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nowBox = useRef<TextInput>(null);
  const freshBox = useRef<TextInput>(null);

  /* the first box there is takes the keyboard, once the page is there to hold it */
  const shown = ok && !!account;
  useEffect(() => {
    if (!shown) return;
    (proved ? freshBox : nowBox).current?.focus();
  }, [proved, shown]);

  const names = [account?.firstName, account?.lastName, account?.username].filter((n): n is string => !!n);
  const problem = passwordProblem(fresh, { names });
  const same = !proved && !!now && fresh === now;
  /* what the rules do not show: a name in it, one of the commonest, the one it is now */
  const refused = !fresh ? null : same ? 'That is the one it is now.' : problem === 'name' || problem === 'common' ? PASSWORD_WORDS[problem] : null;
  const canGo = !busy && !problem && !same && (proved || !!now);

  const change = async () => {
    if (!canGo || !account) return;
    if (!proved) {
      const shut = lockedFor();
      if (shut) {
        setWrong(`The gate is shut for ${waitWords(shut)} more.`);
        return;
      }
      setBusy(true);
      const verdict = await checkCode(now, pw => app.passwordOpens(account, pw));
      if (!verdict.ok) {
        setBusy(false);
        setWrong(refusal(verdict));
        setNow('');
        nowBox.current?.focus();
        return;
      }
    }
    setBusy(true);
    await app.resetPassword(account, fresh);
    Keyboard.dismiss();
    toast('Your password is new.');
    router.back();
  };

  /* the foot: Back beside the one button, which waits for a new password that keeps every rule */
  useFoot({ kind: 'button', label: 'Change password', disabled: !canGo, onPress: () => void change() });
  if (!ok || !account) return null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen wash={washes.newcode} head={<PageHead lead title="Change password" sub="What logs you in on a new phone" />}>
        {proved ? null : (
          <TextBox
            ref={nowBox}
            label="Current password"
            value={now}
            onChangeText={t => {
              setNow(t);
              if (wrong) setWrong(null);
            }}
            secret
            note={wrong ?? demoHint(account, 'password')}
            bad={!!wrong}
            returnKeyType="next"
            onSubmitEditing={() => freshBox.current?.focus()}
            textContentType="password"
            autoComplete="current-password"
            testID="current-password"
          />
        )}
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
        <Aside>{proved ? 'Never kept as you typed it.' : 'Never kept as you typed it. Nobody can change it without the one it is now.'}</Aside>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
