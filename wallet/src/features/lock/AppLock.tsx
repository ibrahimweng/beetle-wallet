/* The app locked (the analysis after Round 21: Lock and privacy said the
   app asked again after a while, and nothing ever asked). Opened with an
   account already signed in, and back from the background after the wait
   Ask again after sets ("Straight away" is the moment it comes back), the
   app is covered by this: the mark, whose account it is, the password box
   with Unlock under it, and the face where Face ID is switched on and the
   phone has one, which is asked for at once; where it is not, the box takes
   the keyboard at once (Round 30, the owner's word: Face ID first, then the
   password, and the six digits gone). The same gate as before money moves
   counts the wrong tries and shuts after three (passcode/check). Whatever
   is typed into stays in view: the page rides up over the keyboard, and
   scrolls where a small phone has no room for it all. Not you? signs out,
   and the way in starts again.

   Nothing is covered while nobody is signed in, or for an account with no
   password kept on this phone (there is nothing to check it against). The
   lab can leave it off for the checks that walk the app (`__BEETLE_NO_LOCK__`
   set before the page loads); no other build can. */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Drawing, Icon, Meta, More, Tap, Title, colour } from '../../design';
import { TextBox } from '../../design/TextBox';
import { useApp } from '../onboarding/store';
import { askAfterMs, readPrefs } from '../settings/prefs';
import { checkCode, checkFace, demoHint, faceAvailable, loadGate, lockedFor, refusal, waitWords } from '../passcode/check';
import { LAB } from '../../lab/enabled';

/** The checks that walk the app in the lab leave the lock off. */
const leftOff = () => LAB && (globalThis as { __BEETLE_NO_LOCK__?: boolean }).__BEETLE_NO_LOCK__ === true;

export function AppLock() {
  const app = useApp();
  const router = useRouter();
  const [locked, setLocked] = useState(false);
  const started = useRef(false);
  const away = useRef<number | null>(null);
  const appRef = useRef(app);
  appRef.current = app;

  /* lock, if there is something to lock and a password to open it with */
  const lock = useCallback(async () => {
    const a = appRef.current;
    if (!a.session || leftOff()) return;
    if (!a.session.account.demo && !(await a.hasPasscode())) return;
    setLocked(true);
  }, []);

  /* the gate as the phone kept it, read before the first try */
  useEffect(() => {
    void loadGate();
  }, []);
  /* opened with an account signed in */
  useEffect(() => {
    if (!app.ready || started.current) return;
    started.current = true;
    void lock();
  }, [app.ready, lock]);
  /* signed out: nothing to guard */
  useEffect(() => {
    if (!app.session) setLocked(false);
  }, [app.session]);
  /* away and back: past the wait, locked again. Only the background counts:
     a face being asked for, or the control centre, makes the app inactive
     for a moment, and that is not leaving it */
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'background') {
        away.current ??= Date.now();
        return;
      }
      if (state !== 'active' || away.current === null) return;
      const since = away.current;
      away.current = null;
      const account = appRef.current.session?.account.accountNumber;
      if (!account) return;
      void readPrefs(account).then(p => {
        if (Date.now() - since >= askAfterMs(p.askAfter)) void lock();
      });
    });
    return () => sub.remove();
  }, [lock]);

  const account = app.session?.account;
  if (!locked || !account) return null;
  return (
    <LockScreen
      name={account.firstName}
      account={account.accountNumber}
      demo={!!account.demo}
      verify={app.checkPasscode}
      onOpen={() => setLocked(false)}
      onSignOut={() => {
        setLocked(false);
        void app.signOut().then(() => router.replace('/way-in'));
      }}
    />
  );
}

function LockScreen({
  name,
  account,
  demo,
  verify,
  onOpen,
  onSignOut,
}: {
  name: string;
  account: string;
  demo: boolean;
  verify: (code: string) => Promise<boolean>;
  onOpen: () => void;
  onSignOut: () => void;
}) {
  const box = useRef<TextInput>(null);
  const [password, setPassword] = useState('');
  /* what the face is doing, on the line under the welcome */
  const [note, setNote] = useState<{ text: string; bad?: boolean } | null>(null);
  /* what was wrong with the password, in red under the box */
  const [wrong, setWrong] = useState<string | null>(null);
  const [face, setFace] = useState(false);
  const [busy, setBusy] = useState(false);
  const tryFace = useCallback(async () => {
    setNote({ text: 'Looking…' });
    if (await checkFace()) onOpen();
    else {
      setNote({ text: 'Face ID did not catch you. Your password works as well.', bad: true });
      box.current?.focus();
    }
  }, [onOpen]);
  /* the face, where it is switched on and the phone has one, asked for at once; the box, where it is not */
  useEffect(() => {
    let live = true;
    void readPrefs(account).then(async p => {
      const can = p.faceId && (await faceAvailable());
      if (!live) return;
      if (!can) {
        box.current?.focus();
        return;
      }
      setFace(true);
      setTimeout(() => {
        if (live) void tryFace();
      }, 300);
    });
    return () => {
      live = false;
    };
  }, [account, tryFace]);
  /* the phone's back does not go round it */
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);
  const type = (t: string) => {
    if (busy) return;
    setPassword(t);
    if (wrong) setWrong(null);
    if (note?.bad) setNote(null);
  };
  const unlock = () => {
    if (busy || !password) return;
    const shut = lockedFor();
    if (shut) {
      setWrong(`The gate is shut for ${waitWords(shut)} more.`);
      return;
    }
    setBusy(true);
    void checkCode(password, verify).then(verdict => {
      setBusy(false);
      setPassword('');
      if (verdict.ok) onOpen();
      else {
        setWrong(refusal(verdict));
        /* Done on the keyboard put it away; it comes back for the next try */
        box.current?.focus();
      }
    });
  };
  return (
    <View style={s.cover} accessibilityViewIsModal testID="app-lock">
      {/* a wing's veins across the top corner, the brand's touch, behind it all (Round 26) */}
      <Drawing name="wing" width={230} opacity={0.36} turn={-8} style={{ top: -20, right: -60 }} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* the page rides up over the keyboard where the window does not make room for it */}
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.column} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
            <View>
              <View style={s.top}>
                <Icon name="mark" size={40} colour={colour.ink} />
                <Title accessibilityRole="header" style={{ textAlign: 'center' }}>{`Welcome back, ${name}`}</Title>
                <Meta tone={note?.bad ? 'bad' : 'secondary'} style={{ textAlign: 'center' }} accessibilityLiveRegion="polite" testID="app-lock-note">
                  {note?.text ?? (face ? 'Your face or your password opens Beetle.' : 'Your password opens Beetle.')}
                </Meta>
              </View>
              {/* the box and Unlock together, so both stay in view over the keyboard */}
              <View style={s.form}>
                <TextBox
                  ref={box}
                  label="Password"
                  value={password}
                  onChangeText={type}
                  secret
                  note={wrong ?? demoHint({ demo })}
                  bad={!!wrong}
                  returnKeyType="done"
                  onSubmitEditing={unlock}
                  textContentType="password"
                  autoComplete="current-password"
                  testID="password-field"
                  right={
                    face ? (
                      <Tap accessibilityRole="button" accessibilityLabel="Use Face ID" hitSlop={10} disabled={busy} onPress={() => void tryFace()}>
                        <Icon name="faceid" size={20} colour={colour.ink} />
                      </Tap>
                    ) : null
                  }
                />
                <Button label="Unlock" disabled={busy || !password} onPress={unlock} />
              </View>
            </View>
            <View style={{ alignSelf: 'center', marginTop: 24 }}>
              <More label="Not you? Sign out" onPress={onSignOut} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  cover: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colour.surface, zIndex: 1000 },
  column: { flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  top: { alignItems: 'center', gap: 12, paddingTop: 72 },
  form: { gap: 12, marginTop: 28 },
});
