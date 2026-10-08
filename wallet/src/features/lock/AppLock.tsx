/* The app locked (the analysis after Round 21: Lock and privacy said the
   app asked again after a while, and nothing ever asked). Opened with an
   account already signed in, and back from the background after the wait
   Ask again after sets ("Straight away" is the moment it comes back), the
   app is covered by this: the mark, whose account it is, the six dots and
   the pad. The face or the finger comes first (Round 32, the owner's word:
   somebody signed in coming back just looks at the phone or touches it):
   where it is switched on and the phone has one set up, it is asked for at
   once, as the lock shows, and a yes opens the app; a no, or Use passcode
   on the phone's own sheet, leaves the six digits, with the key at the
   pad's bottom left to try again. Where the phone cannot be asked (the
   web, Expo Go on an iPhone) the pad is simply there. The same gate as
   before money moves counts the wrong tries and shuts after three
   (passcode/check). Forgot passcode? signs out with a word on what comes
   next: logging in again, which sets a new one at its end. Not you? signs
   out, and the way in starts again.

   Nothing is covered while nobody is signed in, or for an account with no
   passcode kept on this phone (there is nothing to check it against). The
   lab can leave it off for the checks that walk the app (`__BEETLE_NO_LOCK__`
   set before the page loads); no other build can. */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Drawing, Icon, Keypad, Meta, More, PAD_CELLS, Pips, Title, colour, padHeight, toast } from '../../design';
import { useApp } from '../onboarding/store';
import { askAfterMs, readPrefs } from '../settings/prefs';
import { checkCode, demoHint, loadGate, lockedFor, refusal, waitWords } from '../passcode/check';
import { askBiometric, askingLine, biometricAvailable, capital, useBiometricName, yourBiometric } from '../passcode/biometric';
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
  const [digits, setDigits] = useState('');
  /* what the face is doing, or what was wrong with the six digits, on the line under the welcome */
  const [note, setNote] = useState<{ text: string; bad?: boolean } | 'asking' | 'missed' | null>(null);
  /* the face key on the pad: there once the phone can be asked */
  const [face, setFace] = useState(false);
  const [busy, setBusy] = useState(false);
  /* the pad as big as there is room for under the welcome, with the two ways out under it: the frame's big keys where
     they fit, smaller on a short phone (an iPhone SE has the room for the snug ones) */
  const insets = useSafeAreaInsets();
  const [columnH, setColumnH] = useState(0);
  const [topH, setTopH] = useState(0);
  /* the column less the phone's own edges and its foot, the welcome, 16 clear under it, and the ways out under the pad */
  const room = columnH - insets.top - insets.bottom - 12 - topH - 16 - 12 - 20;
  const cell = !columnH || !topH || room >= padHeight(PAD_CELLS.big) ? PAD_CELLS.big : room >= padHeight(PAD_CELLS.snug) ? PAD_CELLS.snug : PAD_CELLS.small;
  /* what the phone checks, by its own name */
  const bio = useBiometricName();
  /* the lock is drawn again whenever the app's state is, with a new onOpen each time: the face is asked the once */
  const opens = useRef(onOpen);
  opens.current = onOpen;
  const asked = useRef(false);
  const tryFace = useCallback(async () => {
    setNote('asking');
    const answer = await askBiometric('Open Beetle');
    if (answer === 'ok') opens.current();
    else if (answer === 'failed') setNote('missed');
    else {
      /* it cannot be asked after all: the six digits alone, and nothing said */
      setFace(false);
      setNote(null);
    }
  }, []);
  /* the face or the finger, where it is switched on and the phone has one, asked for at once */
  useEffect(() => {
    let live = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    void readPrefs(account).then(async p => {
      if (!p.faceId || !(await biometricAvailable()) || !live) return;
      setFace(true);
      timer = setTimeout(() => {
        if (!live || asked.current) return;
        asked.current = true;
        void tryFace();
      }, 300);
    });
    return () => {
      live = false;
      if (timer) clearTimeout(timer);
    };
  }, [account, tryFace]);
  /* the phone's back does not go round it */
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);
  const bad = note === 'missed' || (typeof note === 'object' && !!note?.bad);
  const key = (k: string) => {
    if (busy) return;
    const shut = lockedFor();
    if (shut) {
      setNote({ text: `The gate is shut for ${waitWords(shut)} more.`, bad: true });
      return;
    }
    const d = k === 'del' ? digits.slice(0, -1) : (digits + k).slice(0, 6);
    setDigits(d);
    if (bad) setNote(null);
    if (d.length < 6) return;
    setBusy(true);
    void checkCode(d, verify).then(verdict => {
      setBusy(false);
      setDigits('');
      if (verdict.ok) onOpen();
      else setNote({ text: refusal(verdict), bad: true });
    });
  };
  /* the six digits forgotten: logging in again sets new ones at its end (onboarding), so this is the way out to it */
  const forgot = () => {
    toast('Log in again, and set a new passcode at the end.');
    onSignOut();
  };
  const hint = demoHint({ demo });
  const idle = face ? `${capital(yourBiometric(bio))} or your passcode opens Beetle.` : 'Your passcode opens Beetle.';
  const line = note === 'missed' ? `${capital(bio)} did not catch you. The six digits work as well.` : note === 'asking' ? askingLine(bio) : (note?.text ?? (hint ? `${idle} ${hint}` : idle));
  return (
    <View style={s.cover} accessibilityViewIsModal testID="app-lock">
      {/* a wing's veins across the top corner, the brand's touch, behind it all (Round 26) */}
      <Drawing name="wing" width={230} opacity={0.36} turn={-8} style={{ top: -20, right: -60 }} />
      <SafeAreaView style={s.column} onLayout={e => setColumnH(e.nativeEvent.layout.height)}>
        <View style={s.top} onLayout={e => setTopH(e.nativeEvent.layout.height)}>
          <Icon name="mark" size={40} colour={colour.ink} />
          <Title accessibilityRole="header" style={{ textAlign: 'center' }}>{`Welcome back, ${name}`}</Title>
          {/* two lines held, so the dots and the pad stay where they are as the line changes */}
          <Meta tone={bad ? 'bad' : 'secondary'} style={{ textAlign: 'center', minHeight: 40 }} accessibilityLiveRegion="polite" testID="app-lock-note">
            {line}
          </Meta>
          <View style={{ height: 14, marginTop: 16, justifyContent: 'center' }}>
            <Pips filled={digits.length} />
          </View>
        </View>
        <View style={{ alignItems: 'center', gap: 12 }}>
          {/* the face or the finger again, at the pad's bottom left */}
          <Keypad size={cell} onKey={key} onFace={face ? () => void tryFace() : undefined} faceLabel={`Use ${bio}`} />
          {/* the two ways out, side by side under the pad */}
          <View style={s.ways}>
            <More label="Forgot passcode?" onPress={forgot} />
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
  ways: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', columnGap: 24, rowGap: 8 },
});
