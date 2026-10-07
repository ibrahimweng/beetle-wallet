/* The app locked (the analysis after Round 21: Lock and privacy said the
   app asked again after a while, and nothing ever asked). Opened with an
   account already signed in, and back from the background after the wait
   Ask again after sets ("Straight away" is the moment it comes back), the
   app is covered by this: the mark, whose account it is, the six dots and
   the pad, and the face key where Face ID is switched on and the phone has
   one, which is asked for at once. The same gate as before money moves
   counts the wrong tries and shuts after three (passcode/check). Not you?
   signs out, and the way in starts again.

   Nothing is covered while nobody is signed in, or for an account with no
   passcode kept on this phone (there is nothing to check it against). The
   lab can leave it off for the checks that walk the app (`__BEETLE_NO_LOCK__`
   set before the page loads); no other build can. */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, Keypad, Meta, More, Pips, Title, colour } from '../../design';
import { useApp } from '../onboarding/store';
import { askAfterMs, readPrefs } from '../settings/prefs';
import { checkCode, checkFace, faceAvailable, loadGate, lockedFor, refusal, waitWords } from '../passcode/check';
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

  /* lock, if there is something to lock and a passcode to open it with */
  const lock = useCallback(async () => {
    const a = appRef.current;
    if (!a.session || leftOff()) return;
    if (!a.session.account.demo && !(await a.hasPasscode())) return;
    setLocked(true);
  }, []);

  /* the gate as the phone kept it, read before the first digit */
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
      verify={app.checkPasscode}
      onOpen={() => setLocked(false)}
      onSignOut={() => {
        setLocked(false);
        void app.signOut().then(() => router.replace('/way-in'));
      }}
    />
  );
}

function LockScreen({ name, account, verify, onOpen, onSignOut }: { name: string; account: string; verify: (code: string) => Promise<boolean>; onOpen: () => void; onSignOut: () => void }) {
  const [digits, setDigits] = useState('');
  const [note, setNote] = useState<{ text: string; bad?: boolean } | null>(null);
  const [face, setFace] = useState(false);
  const [busy, setBusy] = useState(false);
  const tryFace = useCallback(async () => {
    setNote({ text: 'Looking…' });
    if (await checkFace()) onOpen();
    else setNote({ text: 'Face ID did not catch you. The six digits work as well.', bad: true });
  }, [onOpen]);
  /* the face, where it is switched on and the phone has one, asked for at once */
  useEffect(() => {
    let live = true;
    void readPrefs(account).then(async p => {
      if (!p.faceId || !(await faceAvailable()) || !live) return;
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
  const key = (k: string) => {
    if (busy) return;
    const shut = lockedFor();
    if (shut) {
      setNote({ text: `The gate is shut for ${waitWords(shut)} more.`, bad: true });
      return;
    }
    const d = k === 'del' ? digits.slice(0, -1) : (digits + k).slice(0, 6);
    setDigits(d);
    if (note?.bad) setNote(null);
    if (d.length < 6) return;
    setBusy(true);
    void checkCode(d, verify).then(verdict => {
      setBusy(false);
      setDigits('');
      if (verdict.ok) onOpen();
      else setNote({ text: refusal(verdict), bad: true });
    });
  };
  return (
    <View style={s.cover} accessibilityViewIsModal testID="app-lock">
      <SafeAreaView style={s.column}>
        <View style={s.top}>
          <Icon name="mark" size={40} colour={colour.accent} />
          <Title accessibilityRole="header" style={{ textAlign: 'center' }}>{`Welcome back, ${name}`}</Title>
          <Meta tone={note?.bad ? 'bad' : 'secondary'} style={{ textAlign: 'center' }} accessibilityLiveRegion="polite" testID="app-lock-note">
            {note?.text ?? (face ? 'Your face or your passcode opens Beetle.' : 'Your passcode opens Beetle.')}
          </Meta>
          <View style={{ height: 14, marginTop: 16, justifyContent: 'center' }}>
            <Pips filled={digits.length} />
          </View>
        </View>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Keypad big onKey={key} onFace={face ? () => void tryFace() : undefined} />
          <View style={{ alignSelf: 'center' }}>
            <More label="Not you? Sign out" onPress={onSignOut} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  cover: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colour.surface, zIndex: 1000 },
  column: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  top: { alignItems: 'center', gap: 12, paddingTop: 72 },
});
