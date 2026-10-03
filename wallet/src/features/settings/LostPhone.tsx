/* Not your phone, from its frame: the account being opened on a device it
   has never seen. The first line is the thing to do; the two under it are
   the strange device and your own; Beetle says why; the button freezes the
   money and leads to a new passcode. Keys and recovery in Settings opens
   it, since this is what recovery looks like. */
import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Aside, Button, Card, DeviceRow, PageHead, Say, Screen } from '../../design';
import { useFoot } from '../more/Foot';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { askHome } from '../more/More';
import { usePrefs } from './prefs';
import { s } from './Lock';

export function LostPhone() {
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
  const freeze = () => {
    set({ frozen: true });
    router.push('/newcode?from=frozen');
  };
  return (
    <Screen head={<PageHead title="Not your phone" sub="Signed in on a device I do not know" />}>
      <View style={{ gap: 16 }}>
        <Card style={s.group} testID="devices">
          <DeviceRow glyph="freeze" title={prefs.frozen ? 'The money is frozen' : 'Freeze the money'} where="Nothing can leave" tag={prefs.frozen ? 'Done' : 'Do this'} />
          <DeviceRow glyph="airtime" title="Infinix Hot 40" where="Ikeja · signing in now" />
          <DeviceRow glyph="airtime" title="iPhone 13" where="Lagos · seen 09:14" tag="Yours" odd />
        </Card>
        <Say testID="line">You are on a device this account has never seen. I will not open the money here until you prove it is you. Freezing costs nothing and lifts in a minute.</Say>
        {/* the button 28 under the line, as the frame sets it under the bubble */}
        <Button label={prefs.frozen ? 'Frozen. Now prove it is me' : 'Freeze it, then prove it is me'} full={false} style={{ alignSelf: 'center', marginTop: 12 }} onPress={freeze} />
        <Aside>Freezing stops money leaving. It does not stop money arriving, and it never touches what you already have.</Aside>
      </View>
    </Screen>
  );
}
