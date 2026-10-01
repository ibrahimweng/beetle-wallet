/* Lock and privacy, from its frame: what it takes to open the app, and what
   shows once it is open, each on a grey card of 64 rows; the switches are
   kept on this phone. Passcode leads to a new one; Ask again after cycles
   through the four waits. */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Aside, Card, FootNote, Head, PageHead, Screen, SettingRow, ToggleRow, colour } from '../../design';
import { useFoot } from '../more/Foot';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { askHome } from '../more/More';
import { ASK_AGAIN, usePrefs } from './prefs';

export function Lock() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const account = app.session?.account;
  const { prefs, ready, set } = usePrefs(account?.accountNumber);
  /* the foot: Back */
  useFoot({ kind: 'back' });
  if (!ok || !account) return null;
  if (!ready)
    return (
      <Screen still>
        <View />
      </Screen>
    );
  const nextWait = () => set({ askAfter: ASK_AGAIN[(ASK_AGAIN.indexOf(prefs.askAfter) + 1) % ASK_AGAIN.length] ?? ASK_AGAIN[0]! });
  return (
    <Screen head={<PageHead lead title="Lock and privacy" sub="What it takes to open this, and what shows once it is open" />}>
      <Card style={s.group} testID="open-with">
        <ToggleRow glyph="faceid-filled" ink={colour.accent} title="Face ID" value={prefs.faceId} onChange={v => set({ faceId: v })} />
        <SettingRow glyph="key-filled" title="Passcode" value="6 digits" to="/newcode" />
        <SettingRow glyph="clock-filled" title="Ask again after" value={prefs.askAfter} onPress={nextWait} />
      </Card>
      {/* the frame puts 16 under the first card, not the column's 20 */}
      <View style={{ gap: 12, marginTop: -4 }}>
        <Head>What other people can see</Head>
        <Card style={s.group} testID="others-see">
          <ToggleRow glyph="eye-filled" title="Hide my balance" value={prefs.hideBalance} onChange={v => set({ hideBalance: v })} />
          <ToggleRow glyph="camera-filled" ink={colour.violet} title="Hide it in screenshots" value={prefs.hideShots} onChange={v => set({ hideShots: v })} />
          <ToggleRow glyph="bell-filled" ink={colour.warn} title="Amounts in notifications" value={prefs.amountsInNotes} onChange={v => set({ amountsInNotes: v })} />
        </Card>
      </View>
      <Aside glyph="eye">With this on, your balance is dots until you look at the phone. Nobody standing behind you in a queue reads it over your shoulder.</Aside>
      {/* the frame sets the note 10 under the line, not a column gap */}
      <FootNote
        style={{ marginTop: -8 }}
        title="Your passcode is not on our servers"
        sub="It opens this phone and nothing else. If you lose it, recovery gives you a new one. Nobody, here or anywhere, can read the old one."
      />
    </Screen>
  );
}

export const s = StyleSheet.create({
  /* the frame's cards: 4 above the first row, none under the last, 16 in from the sides */
  group: { paddingTop: 4, paddingBottom: 0, paddingHorizontal: 16, gap: 0 },
});
