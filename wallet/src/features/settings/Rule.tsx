/* Set this up?, from its frame: what a standing instruction would be, as
   five facts, what Beetle says about it, the promise that it can be stopped,
   and the one button. Yes turns the instruction on and goes to the list;
   Not now goes back. A receipt's offer comes here. */
import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Facts, FootNote, PageHead, Row, Say, Screen, Tap, toast } from '../../design';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { usePrefs, type Prefs } from './prefs';

const OFFERS: Record<string, { rule: keyof Prefs['rules']; facts: { label: string; value: string; quiet?: boolean }[]; say: string }> = {
  ikeja: {
    rule: 'ikeja',
    facts: [
      { label: 'What', value: 'Top up Ikeja Electric' },
      { label: 'Meter', value: '4457 8891' },
      { label: 'When', value: 'The day units run low' },
      { label: 'Up to', value: '₦10,000' },
      { label: 'Stops if', value: 'Everyday is under ₦15,000', quiet: true },
    ],
    say: 'Over ₦10,000 and I stop and ask you, every time. I never raise this on my own.',
  },
  salary: {
    rule: 'payday',
    facts: [
      { label: 'What', value: 'Move ₦50,000 to Holiday' },
      { label: 'When', value: 'The day your salary lands' },
      { label: 'Up to', value: '₦50,000' },
      { label: 'Stops if', value: 'Everyday is under ₦15,000', quiet: true },
    ],
    say: 'Only on the day the salary lands, and only if there is room. I never move it on any other day.',
  },
  dollars: {
    rule: 'dollars',
    facts: [
      { label: 'What', value: 'Move ₦20,000 into Dollars' },
      { label: 'When', value: 'The day your salary lands' },
      { label: 'Rate', value: 'Whatever it is that day' },
      { label: 'Up to', value: '₦20,000' },
      { label: 'Stops if', value: 'Everyday is under ₦15,000', quiet: true },
    ],
    say: 'Only on payday, at the rate that day, and only if there is room. Turn it off and the dollars stay dollars.',
  },
  budget: {
    rule: 'budget',
    facts: [
      { label: 'What', value: 'Hold ₦5,000 back on payday' },
      { label: 'Where', value: 'Into the Holiday goal' },
      { label: 'When', value: 'The day your salary lands' },
      { label: 'Up to', value: '₦5,000' },
      { label: 'Stops if', value: 'Everyday is under ₦15,000', quiet: true },
    ],
    say: 'It is ₦5,000 you do not see, once a month. Your score would reach 76 by October if nothing else changed.',
  },
  remind: {
    rule: 'remind',
    facts: [
      { label: 'What', value: 'Nudge whoever I asked for money' },
      { label: 'When', value: 'The day it was due, if nothing came' },
      { label: 'How', value: 'On WhatsApp and SMS, in my words' },
      { label: 'Stops if', value: 'The money lands first', quiet: true },
    ],
    say: 'Only if nothing has come by then. If it lands the day before, I say nothing at all.',
  },
};

export function Rule() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ offer?: string }>();
  const account = app.session?.account;
  const { prefs, set } = usePrefs(account?.accountNumber);
  if (!ok || !account) return null;
  const offer = OFFERS[asked.offer ?? 'ikeja'] ?? OFFERS.ikeja!;
  const setUp = () => {
    set({ rules: { ...prefs.rules, [offer.rule]: true } });
    toast('Set up. It sits in Standing instructions with a switch beside it.');
    router.dismissTo('/rules');
  };
  return (
    <Screen head={<PageHead title="Set this up?" sub="Nothing is saved until you say yes" />}>
      <Card style={{ paddingTop: 8, paddingBottom: 4, paddingHorizontal: 16, gap: 0 }} testID="facts">
        <Facts rows={offer.facts} />
      </Card>
      {/* the frame sets the note 6 under the bubble, not a column gap */}
      <Say style={{ marginBottom: -16 }} testID="say">
        {offer.say}
      </Say>
      <FootNote title="You can stop it any time" sub="It sits in Standing instructions with a switch beside it. Or just tell me to stop and it stops." />
      <Button label="Set it up" full={false} style={{ alignSelf: 'center' }} onPress={setUp} />
      <Tap accessibilityRole="button" accessibilityLabel="Not now" onPress={() => router.back()} style={{ alignSelf: 'center', marginTop: 8 }}>
        <Row tone="secondary">Not now</Row>
      </Tap>
      <View />
    </Screen>
  );
}
