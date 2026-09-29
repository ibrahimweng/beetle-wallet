/* The lab: every feature on its own. It lists the features, and inside each
   the places worth opening, and puts the app in the state a place needs
   before going there — so the passcode step is one tap away, not six. It is
   the first screen of every build but the production one (see enabled.ts),
   and the small tab on the right edge of every other screen comes back here. */
import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Caption, Card, Display, Divider, Head, Icon, Label, Meta, More, Row, Screen, Tap, colour, space } from '../design';
import { useApp } from '../features/onboarding/store';
import { FEATURES, type Place } from './catalogue';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const when = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/* Which build this is, in words a tester can read back: the web export, Expo
   Go, or an installed build and the update it is running. */
const CAN_UPDATE = Platform.OS !== 'web' && Updates.isEnabled && !__DEV__;
function describeBuild(): string {
  const version = Constants.expoConfig?.version ?? '';
  if (Platform.OS === 'web') return `The web export, ${version}`;
  if (!CAN_UPDATE) return `Expo Go or a development build, ${version}`;
  if (Updates.isEmbeddedLaunch || !Updates.createdAt) return `Version ${version}, as installed`;
  return `Update ${(Updates.updateId ?? '').slice(0, 8)} from ${when(Updates.createdAt)}`;
}

export function Lab() {
  const app = useApp();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [update, setUpdate] = useState<string | null>(null);

  const open = async (p: Place) => {
    if (busy) return;
    setBusy(p.id);
    try {
      await app.seed(p.seed.progress, p.seed.session);
      router.push(p.href);
    } finally {
      setBusy(null);
    }
  };

  /* the phone checks for a new update when it opens and runs it the time
     after; this fetches it now and opens it straight away */
  const latest = async () => {
    setUpdate('Checking…');
    try {
      const r = await Updates.checkForUpdateAsync();
      if (!r.isAvailable) {
        setUpdate('This is the latest.');
        return;
      }
      setUpdate('Getting the new one…');
      await Updates.fetchUpdateAsync();
      setUpdate('Opening it…');
      await Updates.reloadAsync();
    } catch (e) {
      setUpdate(`Could not check: ${(e as Error).message}`);
    }
  };

  return (
    <Screen>
      <View style={{ gap: space.s3 }}>
        <Icon name="mark" size={32} colour={colour.accent} />
        <Display>Beetle Lab</Display>
        <Meta tone="secondary">Every feature on its own. Pick a place and the app opens there, with everything before it already done. The small tab on the right edge brings you back here.</Meta>
      </View>

      {FEATURES.map(f => (
        <View key={f.id} style={{ gap: space.s3 }}>
          <View style={{ gap: 2 }}>
            <Head>{f.title}</Head>
            <Meta tone="secondary">{f.sub}</Meta>
            <Caption tone="tertiary">{f.folder}</Caption>
          </View>
          <Card style={{ paddingVertical: 4, gap: 0 }}>
            {f.places.map((p, i) => (
              <React.Fragment key={p.id}>
                {i ? <Divider /> : null}
                <Tap
                  accessibilityRole="button"
                  accessibilityLabel={p.title}
                  onPress={() => open(p)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3, paddingVertical: space.s3, opacity: busy && busy !== p.id ? 0.5 : 1 }}
                >
                  <Icon name={p.icon} size={22} colour={colour.ink} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Row>{p.title}</Row>
                    <Meta tone="secondary">{p.sub}</Meta>
                  </View>
                  <Icon name="chevron" size={16} colour={colour.textTertiary} />
                </Tap>
              </React.Fragment>
            ))}
          </Card>
        </View>
      ))}

      <View style={{ gap: space.s3 }}>
        <Head>This build</Head>
        <Card style={{ gap: space.s3 }}>
          <View style={{ gap: 2 }}>
            <Label>{describeBuild()}</Label>
            <Meta tone="secondary">{CAN_UPDATE ? 'Every change pushed to the app reaches this phone on its own the next time it opens.' : 'On the web and in Expo Go, reload for the latest.'}</Meta>
          </View>
          {CAN_UPDATE ? (
            <>
              <More label="Get the latest now" onPress={latest} />
              {update ? <Meta tone="secondary">{update}</Meta> : null}
            </>
          ) : null}
          <Divider />
          <More label="Forget everything on this phone" onPress={() => app.seed({}, null).then(() => setUpdate('Forgotten. Every place starts fresh.'))} />
        </Card>
      </View>
    </Screen>
  );
}
