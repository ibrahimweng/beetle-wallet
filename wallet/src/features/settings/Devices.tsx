/* Devices, from its frame: everywhere the account is open, the one that
   does not belong marked out, what Beetle makes of it, and the one button.
   Signing the others out is kept on this phone: the list shrinks to this
   one, and the button goes with the others. This page runs 16 between its
   blocks. */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Aside, Button, Card, ConfirmSheet, DeviceRow, PageHead, Say, Screen, toast } from '../../design';
import { useFoot } from '../more/Foot';
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
  /** Sign out everywhere else, asked about first */
  const [asking, setAsking] = useState(false);
  /* the foot: Back, out of the way under the question */
  useFoot({ kind: 'back', veil: asking ? 'away' : undefined });
  if (!ok || !account) return null;
  if (!ready)
    return (
      <Screen still>
        <View />
      </Screen>
    );
  const only = prefs.othersSignedOut;
  return (
    <>
      <Screen head={<PageHead lead title="Devices" sub="Everywhere this account is open" />}>
        <View style={{ gap: 16 }}>
          <Card style={s.group} testID="devices">
            <DeviceRow glyph="airtime" title="iPhone 13" where="Lagos · open now" tag="This one" />
            {only ? null : <DeviceRow glyph="airtime" title="Tecno Spark 10" where="Lagos · 3 days ago" />}
            {only ? null : <DeviceRow glyph="laptop" title="Chrome on Windows" where="Abuja · 12 August" tag="Odd one" odd />}
          </Card>
          <Say testID="line">
            {only
              ? 'Only this phone is signed in now. The other two have to ask for your password before they see anything.'
              : 'The Windows one signed in from Abuja on 12 August and has not been back. If that was not you, sign it out and change your password. I will not do either without you.'}
          </Say>
          {only ? null : <Button label="Sign out everywhere else" full={false} style={{ alignSelf: 'center' }} onPress={() => setAsking(true)} />}
          <Aside>Signing a device out never touches your money. It only means that device has to ask for your password again.</Aside>
        </View>
      </Screen>
      {asking ? (
        <ConfirmSheet
          title="Sign out every other device?"
          body="The Tecno and the Windows computer are signed out at once and have to ask for your password again. This phone stays in, and your money is not touched."
          action="Sign them out"
          onConfirm={() => {
            setAsking(false);
            set({ othersSignedOut: true });
            toast('Done. The other two are signed out.');
          }}
          onCancel={() => setAsking(false)}
          testID="confirm-devices"
        />
      ) : null}
    </>
  );
}
