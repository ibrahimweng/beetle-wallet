/* A new passcode, from its frame: the way in's own shape — the wash, the
   steps already done above the glyph, the title, the six dots, the lock
   line — with the keypad below. First the passcode it is now (or the face,
   where it is switched on), so a phone left open cannot have its passcode
   changed under it (the analysis after Round 21); then six digits, then the
   same six once more, and the new one takes the old one's place on this
   phone. An account with no passcode kept here yet goes straight to the
   new one. From Lock and privacy it goes back there; from Not your phone it
   lifts the freeze and goes home, and the three steps that got here stand
   above the title. */
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Arrive, Aside, Icon, Keypad, Meta, Pips, Row, Title, Wash, colour, toast, washes } from '../../design';
import type { IconName } from '../../icons';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { PASSCODE_WORDS, passcodeProblem } from '../onboarding/validation';
import { usePrefs } from './prefs';
import { COOL_MS } from './gate';
import { openTab } from '../tabs/tabs';
import { checkCode, checkFace, faceAvailable, lockedFor, refusal, waitWords } from '../passcode/check';
import { LAB } from '../../lab/enabled';

const STEPS: { icon: IconName; label: string }[] = [
  { icon: 'phone-filled', label: 'Frozen' },
  { icon: 'id-filled', label: 'Your number' },
  { icon: 'faceid-filled', label: 'Your face' },
];

export function NewCode() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ from?: string; /** the lab: the passcode it is now taken as proved, as the frame draws the page after it */ proved?: string }>();
  const account = app.session?.account;
  const { prefs, ready, set } = usePrefs(account?.accountNumber);
  /* the passcode it is now, proved first; null until it is known whether there is one */
  const [proved, setProved] = useState<boolean | null>(null);
  const [face, setFace] = useState(false);
  const [first, setFirst] = useState<string | null>(null);
  const [digits, setDigits] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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
  /* the face, where it is switched on and the phone has one, proves it as well as the six digits */
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
  if (!ok || !account) return null;
  const frozen = asked.from === 'frozen';

  const byFace = async () => {
    if (busy || proved !== false) return;
    if (await checkFace()) {
      setProved(true);
      setNote(null);
    } else setNote('Face ID did not catch you. The six digits work as well.');
  };

  const key = (k: string) => {
    if (busy || proved === null) return;
    if (!proved) {
      const shut = lockedFor();
      if (shut) {
        setNote(`The gate is shut for ${waitWords(shut)} more.`);
        return;
      }
    }
    const d = k === 'del' ? digits.slice(0, -1) : (digits + k).slice(0, 6);
    setDigits(d);
    setNote(null);
    if (d.length < 6) return;
    if (!proved) {
      setBusy(true);
      void checkCode(d, app.checkPasscode).then(verdict => {
        setBusy(false);
        setDigits('');
        if (verdict.ok) setProved(true);
        else setNote(refusal(verdict));
      });
      return;
    }
    if (!first) {
      const problem = passcodeProblem(d);
      if (problem) {
        setNote(PASSCODE_WORDS[problem]);
        setDigits('');
        return;
      }
      setFirst(d);
      setDigits('');
      return;
    }
    if (d !== first) {
      setNote('Not the same six. Once more, from the start.');
      setFirst(null);
      setDigits('');
      return;
    }
    setBusy(true);
    void app.setPasscode(d).then(() => {
      if (frozen) {
        set({ frozen: false, sendAfter: Date.now() + COOL_MS });
        toast('Your passcode is new, and the money is yours again. Sending waits twelve hours.');
        openTab(router, 'home');
      } else {
        toast('Your passcode is new.');
        router.back();
      }
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colour.surface }}>
      <Wash tone={washes.newcode.tone} height={washes.newcode.height} />
      <View style={s.column}>
        {frozen ? (
          <View style={{ marginBottom: 4 }} testID="steps">
            {STEPS.map(st => (
              <View key={st.label} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, height: 40, paddingTop: 8 }}>
                <Icon name={st.icon} size={24} colour={colour.ink} />
                <Row>{st.label}</Row>
              </View>
            ))}
          </View>
        ) : null}
        <View style={{ gap: 8 }}>
          <Icon name="lock-filled" size={32} colour={washes.newcode.tone} />
          <Arrive key={proved ? 'new' : 'now'}>
            <Title>{!proved ? 'Your passcode now' : first ? 'Once more' : 'A new passcode'}</Title>
          </Arrive>
          <Meta tone="secondary">
            {!proved
              ? face
                ? 'The six you use now, or your face, before a new one takes its place.'
                : 'The six you use now, before a new one takes its place.'
              : first
                ? 'The same six, to be sure.'
                : 'Six digits. These are what send your money, so pick something nobody watching could guess.'}
          </Meta>
        </View>
        <View style={{ height: 14, justifyContent: 'center', marginTop: 8 }}>
          <Pips of={6} filled={digits.length} align="left" />
        </View>
        {/* the frame's row: 10 under the dots, and the line's 20 to the keypad */}
        <View style={{ height: 28, paddingTop: 10 }}>
          {note ? <Meta tone="bad">{note}</Meta> : proved ? <Aside>Not your year of birth, and not 123456.</Aside> : <Aside>Nobody can change it without it.</Aside>}
        </View>
      </View>
      <View style={{ paddingTop: 12, paddingBottom: 20 }} testID="pad">
        <Keypad onKey={key} onFace={!proved && face ? () => void byFace() : undefined} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  column: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20 },
});
