/* Devices, from its frame: everywhere the account is open, the one that
   does not belong marked out, what Beetle makes of it, and the one button.
   Signing the others out is kept on this phone: the list shrinks to this
   one, and the button goes with the others. This page runs 16 between its
   blocks. */
import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Aside, Button, Card, DeviceRow, Dock, PageHead, Say, Screen, toast } from '../../design';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { askHome } from '../more/More';
import { usePrefs } from './prefs';
import { s } from './Lock';

export function Devices() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const account = app.session?.account;
  const { prefs, ready, set } = usePrefs(account?.accountNumber);
  if (!ok || !account) return null;
  const dock = <Dock placeholder="Ask about a device" onBack={() => router.back()} onAsk={q => askHome(router, q)} onScan={() => router.push('/scan')} />;
  if (!ready)
    return (
      <Screen dock={dock} still>
        <View />
      </Screen>
    );
  const only = prefs.othersSignedOut;
  return (
    <Screen dock={dock} head={<PageHead lead title="Devices" sub="Everywhere this account is open" />}>
      <View style={{ gap: 16 }}>
        <Card style={s.group} testID="devices">
          <DeviceRow glyph="airtime" title="iPhone 13" where="Lagos · open now" tag="This one" />
          {only ? null : <DeviceRow glyph="airtime" title="Tecno Spark 10" where="Lagos · 3 days ago" />}
          {only ? null : <DeviceRow glyph="laptop" title="Chrome on Windows" where="Abuja · 12 August" tag="Odd one" odd />}
        </Card>
        <Say testID="say">
          {only
            ? 'Only this phone is signed in now. The other two have to ask for your passcode before they see anything.'
            : 'The Windows one signed in from Abuja on 12 August and has not been back. If that was not you, sign it out and change your passcode. I will not do either without you.'}
        </Say>
        {only ? null : (
          <Button
            label="Sign out everywhere else"
            full={false}
            style={{ alignSelf: 'center', marginTop: -12 }}
            onPress={() => {
              set({ othersSignedOut: true });
              toast('Done. The other two are signed out.');
            }}
          />
        )}
        <Aside>Signing a device out never touches your money. It only means that device has to ask for your passcode again.</Aside>
      </View>
    </Screen>
  );
}
