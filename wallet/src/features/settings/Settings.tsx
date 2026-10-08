/* Settings, the third of the three pages, from its frame: the title, the
   Plus card, and three groups of rows — what keeps the money yours, your
   account, about — with what each is set to at its end, and the version at
   the foot. Every row leads somewhere: its own page, Your details on its
   sheet, or the chat for what Beetle answers itself. The foot is the bar,
   as on home and Activities. A long press on the version line opens the
   lab, in a build that has one. */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Card, ConfirmSheet, HeadTitle, Icon, Meta, Row, Screen, SectionLabel, SettingRow, Tap, colour, toast } from '../../design';
import { useFoot } from '../more/Foot';
import { useApp } from '../onboarding/store';
import { askHome } from '../more/More';
import { useHoldPages, usePage } from '../tabs';
import { Details } from './Details';
import { rulesRunning, usePrefs } from './prefs';
import { capital, useBiometricName } from '../passcode/biometric';
import { LAB } from '../../lab/enabled';

export function Settings() {
  const app = useApp();
  const router = useRouter();
  const { active } = usePage();
  const asked = useLocalSearchParams<{ details?: string }>();
  const [details, setDetails] = useState(asked.details === '1');
  /* Your details asked for again, from a link, once the pages are up */
  useEffect(() => {
    if (asked.details === '1') setDetails(true);
  }, [asked.details]);
  const account = app.session?.account;
  const { prefs, set } = usePrefs(account?.accountNumber);
  /* what the phone checks, by its own name: Lock and privacy says it */
  const bio = useBiometricName();
  /** Sign out, asked about first */
  const [leaving, setLeaving] = useState(false);
  /* the foot: the bar, going out of the way under Your details or the question */
  useFoot({ kind: 'bar', veil: details || leaving ? 'away' : undefined }, active);
  /* the pages stand still while Your details, or the question, is up */
  useHoldPages('details', details || leaving);
  if (!app.ready || !account) return null;

  const ask = (q: string) => () => askHome(router, q);
  const signOut = () => void app.signOut().then(() => router.replace('/way-in'));
  const section = (label: string, rows: React.ReactNode) => (
    <View style={{ gap: 8 }}>
      <SectionLabel>{label}</SectionLabel>
      <View>{rows}</View>
    </View>
  );

  return (
    <>
      <Screen head={<HeadTitle style={{ marginBottom: 4 }}>Settings</HeadTitle>}>
        {/* the day after a recovery (Round 30): what is held, and This wasn't me, the same as on the alerts sent to the
            old email and the phone, which freezes everything */}
        {prefs.hold && prefs.hold.until > Date.now() ? (
          <Card outline style={s.hold} testID="hold-notice">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="shield-filled" size={24} colour={colour.warn} />
              <Row style={{ flex: 1 }}>{prefs.hold.why === 'email' ? 'Your email was changed today' : 'Your password was changed today'}</Row>
            </View>
            <Meta tone="secondary">{`Until ${holdEnds(prefs.hold.until)}, no more than ₦20,000 can leave and nobody new is paid.`}</Meta>
            <Tap
              accessibilityRole="button"
              accessibilityLabel="This wasn’t me"
              onPress={() => {
                set({ frozen: true, hold: undefined });
                toast('Frozen. Nothing leaves until you prove it is you with a new passcode.');
                router.push('/newcode?from=frozen');
              }}
            >
              <Row style={{ color: colour.bad }}>This wasn’t me</Row>
            </Tap>
          </Card>
        ) : null}
        <Tap accessibilityRole="button" accessibilityLabel="Get Beetle Plus" onPress={ask('What does Beetle Plus give me?')} testID="plus">
          <Card outline style={s.plus}>
            <View style={s.plusMark}>
              <Icon name="star-filled" size={20} colour={colour.textInverse} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Row>Get Beetle Plus</Row>
              <Meta tone="secondary">Higher daily limits and a human when you need one</Meta>
            </View>
            <View style={s.go}>
              <Icon name="chevron" size={16} colour={colour.textInverse} />
            </View>
          </Card>
        </Tap>
        {/* the frame puts 16 between the groups and 8 between a group's name and its rows */}
        <View style={{ gap: 16 }}>
          {section(
            'What keeps the money yours',
            <>
              <SettingRow glyph="faceid-filled" ink={colour.accent} title="Lock and privacy" value={prefs.faceId ? capital(bio) : 'Passcode'} to="/lock" />
              <SettingRow glyph="shield-filled" ink={colour.good} title="Spending limits" value="₦100,000 a day" to="/limits" />
              <SettingRow glyph="list-filled" ink={colour.violet} title="Standing instructions" value={`${rulesRunning(prefs)} running`} to="/rules" />
              <SettingRow glyph="laptop-filled" title="Devices" value={prefs.othersSignedOut ? '1 signed in' : '3 signed in'} to="/devices" />
              <SettingRow glyph="key-filled" title="Keys and recovery" value="Set up" to="/lostphone" />
            </>,
          )}
          {section(
            'Your account',
            <>
              <SettingRow glyph="person-filled" ink={colour.accent} title="Your details" onPress={() => setDetails(true)} />
              <SettingRow glyph="bell-filled" ink={colour.warn} title="Notifications" onPress={() => toast('What notifications show is set under Lock and privacy.')} />
              <SettingRow glyph="gift-filled" title="Saved people" onPress={() => toast('Saved people are on Send money, behind the person card.')} />
              <SettingRow glyph="card-filled" title="Cards" value="1 virtual" to="/card" />
              <SettingRow glyph="shield-filled" ink={colour.good} title="Privacy and your data" to="/privacy" />
            </>,
          )}
          {section(
            'About',
            <>
              <SettingRow glyph="chat-filled" title="Contact support" onPress={ask('I need a human to look at something')} />
              <SettingRow glyph="star-filled" title="Give feedback" onPress={ask('I have some feedback about the app')} />
              <SettingRow glyph="lock-filled" title="Sign out" onPress={() => setLeaving(true)} />
            </>,
          )}
        </View>
        <Pressable
          accessibilityRole="text"
          accessibilityLabel="Version"
          onLongPress={LAB ? () => router.push('/lab') : undefined}
          delayLongPress={600}
          style={{ marginTop: 4, alignSelf: 'center', paddingHorizontal: 16 }}
          testID="version"
        >
          <Meta tone="tertiary" style={{ textAlign: 'center' }}>
            Version {Constants.expoConfig?.version ?? '1.0.0'}
          </Meta>
        </Pressable>
      </Screen>
      {details ? <Details account={account} onDismiss={() => setDetails(false)} /> : null}
      {leaving ? (
        <ConfirmSheet
          title="Sign out of Beetle?"
          body="You come back in with your phone number and your password. Nothing in your account changes, and nothing moves while you are out."
          action="Sign out"
          onConfirm={signOut}
          onCancel={() => setLeaving(false)}
          testID="confirm-sign-out"
        />
      ) : null}
    </>
  );
}

/** When the day's hold ends, as the clock says it. */
const holdEnds = (until: number) => {
  const d = new Date(until);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}${d.toDateString() === new Date().toDateString() ? '' : ' tomorrow'}`;
};

const s = StyleSheet.create({
  hold: { gap: 10, padding: 16, borderRadius: 16 },
  /* the frame's card is 88 tall with the words 13 in and the mark centred; 12
     above the words and 6 under them puts each where the frame has it */
  plus: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, paddingBottom: 6, paddingHorizontal: 16 },
  plusMark: { width: 40, height: 40, borderRadius: 12, backgroundColor: colour.ink, alignItems: 'center', justifyContent: 'center' },
  go: { width: 32, height: 32, borderRadius: 16, backgroundColor: colour.ink, alignItems: 'center', justifyContent: 'center' },
});
