/* Privacy and your data (Round 32, the owner's word: aligned with the
   Nigeria Data Protection Act 2023 and the CBN's rules). The rights the Act
   gives, where a person can use them themselves: a copy of what Beetle
   holds, the account closed, a consent taken back (offers, which are off
   until switched on; the face or fingerprint to open the app), and who to
   write to, or complain to, for the rest. Under it, who holds the account. */
import React, { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Aside, Button, Card, ConfirmSheet, FootNote, Head, PageHead, Screen, SettingRow, ToggleRow, colour, toast } from '../../design';
import { auth } from '../../services';
import { useFoot } from '../more/Foot';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { forgetHere, knownHere } from '../onboarding/devices';
import { useSetup } from '../setup/store';
import { PROVIDER_LINE } from '../legal/legal';
import { usePrefs } from './prefs';

export function Privacy() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const account = app.session?.account;
  const { prefs, ready, set } = usePrefs(account?.accountNumber);
  const { setup } = useSetup(account?.accountNumber, !!account?.demo);
  const [closing, setClosing] = useState(false);
  /* the foot: Back, out of the way while the question is up */
  useFoot({ kind: 'back', veil: closing ? 'away' : undefined });
  if (!ok || !account) return null;
  if (!ready)
    return (
      <Screen still>
        <View />
      </Screen>
    );

  /* a copy of what Beetle holds about the person, to keep or send on (the right of access, and to take it elsewhere) */
  const download = async () => {
    const copy = {
      madeAt: new Date().toISOString(),
      account: { ...account },
      settings: prefs,
      settingUp: setup,
      phones: await knownHere(),
    };
    try {
      await Share.share({ title: 'My Beetle data', message: JSON.stringify(copy, null, 2) });
    } catch {
      toast('Sharing is not on this device. On a phone this opens the share sheet with a copy of your data.');
    }
  };

  /* closed at the owner's asking (the right to have it deleted): what the law makes a bank keep stays as long as it says */
  const close = async () => {
    setClosing(false);
    try {
      await auth.closeAccount(account.accountNumber);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'The account could not be closed. Try again in a moment.');
      return;
    }
    await forgetHere(account.accountNumber);
    await app.signOut();
    toast('Your account is closed, and this phone has forgotten it.');
    router.replace('/way-in');
  };

  return (
    <>
      <Screen head={<PageHead lead title="Privacy and your data" sub="What Beetle keeps about you, and what you can do about it" />}>
        <View style={{ gap: 12 }}>
          <Head>Your choices</Head>
          <Card style={s.group} testID="choices">
            <ToggleRow glyph="bell-filled" ink={colour.warn} title="Offers and news" value={prefs.marketing} onChange={v => set({ marketing: v })} testID="marketing" />
            <ToggleRow glyph="faceid-filled" ink={colour.accent} title="Face or fingerprint to open Beetle" value={prefs.faceId} onChange={v => set({ faceId: v })} />
          </Card>
          <Aside glyph="eye">Offers stay off until you switch them on. Your face and fingerprint never leave your phone: Beetle only hears that they matched.</Aside>
        </View>
        <View style={{ gap: 12 }}>
          <Head>Your data</Head>
          <Card style={s.group} testID="your-data">
            <SettingRow glyph="receive-filled" ink={colour.good} title="Download my data" onPress={() => void download()} />
            <SettingRow glyph="list-filled" title="Read the privacy notice" to="/legal?doc=privacy" />
            <SettingRow glyph="list-filled" title="Read the terms" to="/legal?doc=terms" />
            <SettingRow glyph="chat-filled" title="Write to our data protection officer" onPress={() => toast('Write to [DPO email]. We answer within [time], as the law asks.')} />
            <SettingRow glyph="shield-filled" title="Complain to the regulator" onPress={() => toast('The Nigeria Data Protection Commission hears complaints at ndpc.gov.ng.')} />
          </Card>
        </View>
        <Button label="Close my account" tone="red" onPress={() => setClosing(true)} />
        <FootNote title="Who holds your account" sub={PROVIDER_LINE} />
      </Screen>
      {closing ? (
        <ConfirmSheet
          title="Close your account?"
          body="Move your money out first. What you have done with your money is kept for [five] years after, because the law requires it; everything else is deleted, and this phone forgets you."
          action="Close my account"
          onConfirm={() => void close()}
          onCancel={() => setClosing(false)}
          testID="confirm-close"
        />
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  /* the settings cards: 4 above the first row, none under the last, 16 in from the sides */
  group: { paddingTop: 4, paddingBottom: 0, paddingHorizontal: 16, gap: 0 },
});
