/* Standing instructions, from its frame: the one switch that pauses the
   saving, the three instructions with a switch and a log each, what Beetle
   always asks first about, and the way to add one. The switches are kept on
   this phone; See log opens the record. This page runs 12 between its
   blocks where the others run 20. */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Caption, Card, Head, Label, Meta, NoteRow, PageHead, PillRow, Row, Screen, Tap, Toggle } from '../../design';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { askHome } from '../more/More';
import { useFoot } from '../more/Foot';
import { usePrefs, type Prefs } from './prefs';
import { openTab } from '../tabs/tabs';

export const INSTRUCTIONS: { id: keyof Prefs['rules']; title: string; when: string; log: string; /** only listed once it is on */ offered?: boolean }[] = [
  { id: 'payday', title: 'Move ₦20,000 to Holiday on payday', when: 'The day your salary lands.', log: 'Moved 4 times · ₦80,000 put aside' },
  { id: 'ikeja', title: 'Top up Ikeja Electric', when: 'When it lands, up to ₦10,000', log: 'Paid 3 times · ₦22,400' },
  { id: 'data', title: 'Buy 5GB when my data runs out', when: 'Once a month at most.', log: 'Bought twice · ₦5,000' },
  { id: 'remind', title: 'Nudge whoever I asked for money', when: 'The day it was due, if nothing came.', log: 'Nothing due yet', offered: true },
  { id: 'dollars', title: 'Move ₦20,000 into Dollars on payday', when: 'The day your salary lands, at the rate that day.', log: 'Nothing moved yet', offered: true },
  { id: 'budget', title: 'Hold ₦5,000 back on payday', when: 'Into the Holiday goal, the day your salary lands.', log: 'Nothing held yet', offered: true },
];

export function Rules() {
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
  return (
    <View style={{ flex: 1 }}>
      <Screen head={<PageHead lead title="Standing instructions" sub="What I can do without asking you first" />}>
        <View style={{ gap: 12 }}>
          <Card style={s.tight} testID="tight">
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View style={{ flex: 1, gap: 8 }}>
                <Row>Money is tight this month</Row>
                <Meta tone="secondary">Turn this on and I stop moving money into savings, and I stop asking you to. Your goals wait where they are. Nothing is lost and nothing is charged.</Meta>
              </View>
              <Toggle value={prefs.tight} onChange={v => set({ tight: v })} label="Money is tight this month" />
            </View>
            <Caption tone="secondary" style={{ marginTop: 14 }}>
              You can also just tell me, any time.
            </Caption>
          </Card>
          <View style={{ gap: 8 }}>
            {[...INSTRUCTIONS, ...(prefs.again ? [{ id: 'again' as const, title: prefs.again.title, when: `${prefs.again.when}.`, log: 'Not run yet', offered: true }] : [])]
              .filter(i => !i.offered || prefs.rules[i.id])
              .map(i => (
                <Card key={i.id} style={s.rule} testID="rule">
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <View style={{ flex: 1, gap: 8 }}>
                      <Row>{i.title}</Row>
                      <Meta tone="secondary">{i.when}</Meta>
                    </View>
                    <Toggle value={prefs.rules[i.id]} onChange={v => set({ rules: { ...prefs.rules, [i.id]: v } })} label={i.title} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
                    <Meta tone="secondary" style={{ flex: 1 }}>
                      {i.log}
                    </Meta>
                    <Tap accessibilityRole="button" accessibilityLabel={`See log: ${i.title}`} onPress={() => openTab(router, 'activities')}>
                      <Label tone="accent">See log</Label>
                    </Tap>
                  </View>
                </Card>
              ))}
          </View>
          <View style={{ gap: 12 }}>
            <Head>I will always ask first</Head>
            <NoteRow glyph="lock" centre>
              Paying anyone you have not paid before
            </NoteRow>
            <NoteRow glyph="lock" centre>
              Anything over ₦20,000
            </NoteRow>
            <NoteRow glyph="lock" centre>
              Taking a loan on your behalf
            </NoteRow>
          </View>
          <PillRow glyph="plus" label="Add an instruction" to="/rule" />
        </View>
      </Screen>
    </View>
  );
}

const s = StyleSheet.create({
  tight: { paddingTop: 16, paddingBottom: 20, paddingHorizontal: 16, gap: 0 },
  /* the frame's own 18 under the log line */
  rule: { paddingTop: 16, paddingBottom: 18, paddingHorizontal: 16, gap: 0 },
});
