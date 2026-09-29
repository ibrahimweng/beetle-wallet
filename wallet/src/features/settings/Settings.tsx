/* Settings, from its frame: the title, the Plus card, and three groups of
   rows — what keeps the money yours, your account, about — with what each
   is set to at its end, and the version at the foot. Your details and Sign
   out work here; the rest say which round they come with. The dock is the
   way back, the ask bar, and the camera. */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Card, Dock, Icon, Meta, Row, Screen, SectionLabel, SettingRow, Tap, Title, colour, toast } from '../../design';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { Details } from './Details';

export function Settings() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ details?: string }>();
  const [details, setDetails] = useState(asked.details === '1');
  const account = app.session?.account;
  if (!ok || !account) return null;

  const later = (what: string, round: number) => () => toast(`${what} comes with round ${round}.`);
  const signOut = () => void app.signOut().then(() => router.replace('/way-in'));
  const section = (label: string, rows: React.ReactNode) => (
    <View style={{ gap: 8 }}>
      <SectionLabel>{label}</SectionLabel>
      <View>{rows}</View>
    </View>
  );

  return (
    <>
      <Screen
        dock={<Dock placeholder="Ask me to change something" onBack={() => router.back()} onAsk={q => router.push({ pathname: '/home', params: { say: q } })} onScan={() => router.push('/scan')} />}
      >
        <Title style={{ marginBottom: 4 }}>Settings</Title>
        <Tap accessibilityRole="button" accessibilityLabel="Get Beetle Plus" onPress={() => toast('Beetle Plus comes after the app is built.')} testID="plus">
          <Card outline style={s.plus}>
            <View style={s.plusMark}>
              <Icon name="star-filled" size={20} colour="#ffffff" />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Row>Get Beetle Plus</Row>
              <Meta tone="secondary">Higher daily limits and a human when you need one</Meta>
            </View>
            <View style={s.go}>
              <Icon name="chevron" size={16} colour="#ffffff" />
            </View>
          </Card>
        </Tap>
        {/* the frame puts 16 between the groups and 8 between a group's name and its rows */}
        <View style={{ gap: 16 }}>
          {section(
            'What keeps the money yours',
            <>
              <SettingRow glyph="faceid-filled" ink={colour.accent} title="Lock and privacy" value="Face ID" onPress={later('Lock and privacy', 2)} />
              <SettingRow glyph="shield-filled" ink={colour.good} title="Spending limits" value="₦100,000 a day" onPress={later('Spending limits', 2)} />
              <SettingRow glyph="list-filled" ink={colour.violet} title="Standing instructions" value="3 running" onPress={later('Standing instructions', 7)} />
              <SettingRow glyph="laptop-filled" title="Devices" value="3 signed in" onPress={later('Devices', 2)} />
              <SettingRow glyph="key-filled" title="Keys and recovery" value="Set up" onPress={later('Keys and recovery', 2)} />
            </>,
          )}
          {section(
            'Your account',
            <>
              <SettingRow glyph="person-filled" ink={colour.accent} title="Your details" onPress={() => setDetails(true)} />
              <SettingRow glyph="bell-filled" ink={colour.warn} title="Notifications" onPress={later('Notifications', 2)} />
              <SettingRow glyph="gift-filled" title="Saved people" onPress={later('Saved people', 3)} />
              <SettingRow glyph="card-filled" title="Cards" value="1 virtual" onPress={later('Cards', 2)} />
            </>,
          )}
          {section(
            'About',
            <>
              <SettingRow glyph="chat-filled" title="Contact support" onPress={later('Support', 7)} />
              <SettingRow glyph="star-filled" title="Give feedback" onPress={later('Feedback', 7)} />
              <SettingRow glyph="lock-filled" title="Sign out" onPress={signOut} />
            </>,
          )}
        </View>
        <Meta tone="tertiary" style={{ textAlign: 'center', marginTop: 4 }}>
          Version {Constants.expoConfig?.version ?? '1.0.0'}
        </Meta>
      </Screen>
      {details ? <Details account={account} onDismiss={() => setDetails(false)} /> : null}
    </>
  );
}

const s = StyleSheet.create({
  /* the frame's card is 88 tall with the words 13 in and the mark centred; 12
     above the words and 6 under them puts each where the frame has it */
  plus: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, paddingBottom: 6, paddingHorizontal: 16 },
  plusMark: { width: 40, height: 40, borderRadius: 12, backgroundColor: colour.ink, alignItems: 'center', justifyContent: 'center' },
  go: { width: 32, height: 32, borderRadius: 16, backgroundColor: colour.ink, alignItems: 'center', justifyContent: 'center' },
});
