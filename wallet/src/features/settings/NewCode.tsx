/* A new passcode, from its frame: the way in's own shape — the wash, the
   steps already done above the glyph, the title, the six dots, the lock
   line — with the keypad below. Six digits, then the same six once more, and
   the new one takes the old one's place on this phone. From Lock and privacy
   it goes back there; from Not your phone it lifts the freeze and goes
   home, and the three steps that got here stand above the title. */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Arrive, Aside, Icon, Keypad, Meta, Pips, Row, Title, Wash, colour, toast, washes } from '../../design';
import type { IconName } from '../../icons';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { PASSCODE_WORDS, passcodeProblem } from '../onboarding/validation';
import { usePrefs } from './prefs';

const STEPS: { icon: IconName; label: string }[] = [
  { icon: 'phone-filled', label: 'Frozen' },
  { icon: 'id-filled', label: 'Your number' },
  { icon: 'faceid-filled', label: 'Your face' },
];

export function NewCode() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ from?: string }>();
  const account = app.session?.account;
  const { set } = usePrefs(account?.accountNumber);
  const [first, setFirst] = useState<string | null>(null);
  const [digits, setDigits] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!ok || !account) return null;
  const frozen = asked.from === 'frozen';

  const key = (k: string) => {
    if (busy) return;
    const d = k === 'del' ? digits.slice(0, -1) : (digits + k).slice(0, 6);
    setDigits(d);
    setNote(null);
    if (d.length < 6) return;
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
        set({ frozen: false });
        toast('Your passcode is new, and the money is yours again. Sending waits twelve hours.');
        router.dismissTo('/home');
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
          <Arrive>
            <Title>{first ? 'Once more' : 'A new passcode'}</Title>
          </Arrive>
          <Meta tone="secondary">{first ? 'The same six, to be sure.' : 'Six digits. These are what send your money, so pick something nobody watching could guess.'}</Meta>
        </View>
        <View style={{ height: 14, justifyContent: 'center', marginTop: 8 }}>
          <Pips of={6} filled={digits.length} align="left" />
        </View>
        {/* the frame's row: 10 under the dots, and the line's 20 to the keypad */}
        <View style={{ height: 28, paddingTop: 10 }}>{note ? <Meta tone="bad">{note}</Meta> : <Aside>Not your year of birth, and not 123456.</Aside>}</View>
      </View>
      <View style={{ paddingTop: 12, paddingBottom: 20 }} testID="pad">
        <Keypad onKey={key} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  column: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20 },
});
