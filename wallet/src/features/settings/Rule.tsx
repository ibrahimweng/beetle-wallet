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
import { useLine } from '../transfers/use';
import { naira } from '../../lib/format';
import { whenAgain } from './again';
import { usePrefs, type Prefs } from './prefs';
import { fedWords, useFedName } from '../goal/store';

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

function againOffer(name: string, amount: number, reference?: string): (typeof OFFERS)[string] {
  return {
    rule: 'again',
    facts: [
      { label: 'What', value: `Send ${naira(amount)} to ${name}` },
      { label: 'When', value: whenAgain(reference) },
      { label: 'Up to', value: naira(amount) },
      { label: 'Stops if', value: 'Everyday is under ₦15,000', quiet: true },
    ],
    say: 'Only on that day, and only if there is room. Nothing moves on any other day, and one switch stops it.',
  };
}

export function Rule() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ offer?: string; row?: string }>();
  const { row } = useLine(asked.row ?? '');
  const account = app.session?.account;
  const { prefs, set } = usePrefs(account?.accountNumber);
  /* what goes into a goal goes to the first, by its name */
  const fed = useFedName(account, prefs.goal);
  if (!ok || !account) return null;
  /* a transfer's receipt offers the same again: the facts come from its line */
  /* the line's reference says when: the rent on the first, the grocer on Fridays; a line with none is read from its words */
  const again = asked.offer === 'again' && row ? againOffer(row.name, Math.abs(row.amount), row.reference ?? row.detail) : null;
  const offer = again ?? OFFERS[asked.offer ?? 'ikeja'] ?? OFFERS.ikeja!;
  const setUp = () => {
    set({ rules: { ...prefs.rules, [offer.rule]: true }, ...(again && row ? { again: { rowId: row.id, title: again.facts[0]!.value, when: again.facts[1]!.value } } : {}) });
    toast('Set up. It sits in Standing instructions with a switch beside it.');
    router.dismissTo('/rules');
  };
  return (
    <Screen head={<PageHead title="Set this up?" sub="Nothing is saved until you say yes" />}>
      <Card style={{ paddingTop: 8, paddingBottom: 4, paddingHorizontal: 16, gap: 0 }} testID="facts">
        <Facts rows={offer.facts.map(f => ({ ...f, value: fedWords(f.value, fed) }))} />
      </Card>
      <Say testID="line">{offer.say}</Say>
      <FootNote title="You can stop it any time" sub="It sits in Standing instructions with a switch beside it. Or just tell me to stop and it stops." />
      <Button label="Set it up" full={false} style={{ alignSelf: 'center' }} onPress={setUp} />
      <Tap accessibilityRole="button" accessibilityLabel="Not now" onPress={() => router.back()} style={{ alignSelf: 'center', marginTop: 8 }}>
        <Row tone="secondary">Not now</Row>
      </Tap>
      <View />
    </Screen>
  );
}
