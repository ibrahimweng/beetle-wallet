/* Not enough in Everyday, from its frame: what is short, the three figures,
   Beetle's word that none of the ways out costs anything, and the three —
   from the goal, what there is now with the rest on payday, or asking
   someone who owes you. Reached from Slide to send when the amount is past
   the balance, and from the keypad's question. */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { BigStatus, ChoiceList, Facts, PageHead, Say, Screen, colour, toast } from '../../design';
import type { Move } from '../../services';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { askHome } from '../more/More';
import { holdingsFor } from '../home/account';
import { balanceOf, rowFrom, useMoves } from '../home/moves';
import { usePrefs } from '../settings/prefs';
import { DEMO_SUMS, GOAL, NO_SUMS, putAside } from '../goal/goal';
import { requestDraft } from '../request/hand';
import { payerIn } from '../request/people';
import { clock } from '../../lib/clock';
import { LAB } from '../../lab/enabled';
import { naira } from '../../lib/format';
import { draft } from './hand';

/** Back to Send money: the page under this one, or a fresh one from the lab. */
export function useBackToSend() {
  const router = useRouter();
  const navigation = useNavigation();
  return () => {
    const routes = navigation.getState()?.routes ?? [];
    const under = routes[routes.length - 2]?.name ?? '';
    if (under.endsWith('send')) router.back();
    else router.push('/send');
  };
}

export function Short() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ asked?: string; have?: string }>();
  const account = app.session?.account;
  const { moves, add: addMove } = useMoves(account?.accountNumber);
  const { prefs } = usePrefs(account?.accountNumber);
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  /* what the goal holds: what its feeds put in, plus what was added by hand, less what was taken back */
  const added = moves.filter(r => r.kind === 'saving' && r.name === GOAL.name).reduce((a, r) => a - r.amount, 0);
  const holiday = account && (account.demo || prefs.goal) ? putAside(account.demo ? DEMO_SUMS : NO_SUMS, added) : 0;
  /* the lab opens it with the balance the frame draws */
  const have = LAB && asked.have ? Number(asked.have) : (h?.everyday ?? 0) + balanceOf(moves);
  const want = Number(asked.asked ?? 0) || 0;
  const short = Math.max(0, want - have);
  const toSend = useBackToSend();
  useFoot({ kind: 'ask', placeholder: 'Ask me about this', onAsk: q => askHome(router, q), onScan: () => router.push('/scan') });
  if (!ok || !account) return null;
  const sendNow = () => {
    draft.put({ amount: Math.floor(have), amountNote: 'What Everyday holds' });
    toSend();
  };
  /* the goal gives the shortfall back: a line in the day, and Everyday has it */
  const fromHoliday = () => {
    if (holiday < short) {
      toast(`${GOAL.name} holds ${naira(holiday)}, ${naira(short - holiday)} short of what you need.`);
      return;
    }
    const at = clock();
    const move: Move = { name: GOAL.name, detail: `Taken back · ${at}`, amount: short, icon: 'pot', kind: 'saving' };
    addMove(rowFrom(move, have, 17 + moves.length));
    draft.put({ amount: want, amountNote: `${naira(short)} came back from ${GOAL.name}` });
    toast(`${naira(short)} is back from ${GOAL.name}. Everyday has it now.`);
    toSend();
  };
  /* a request to whoever owes you, with the shortfall filled in */
  const askFor = () => {
    requestDraft.put({ who: account.demo ? payerIn('musa') : undefined, amount: short, note: account.demo ? 'the rent balance' : undefined, said: `ask for ${naira(short)}` });
    router.push('/request');
  };
  return (
    <Screen head={<PageHead title="Not enough in Everyday" sub="Nothing has been sent" />}>
      {/* the frame: the figures 7 under the status, the bubble 12 under them, the ways 3 under the bubble */}
      <View style={{ marginTop: -2 }}>
        <BigStatus glyph="warn-filled" tone={colour.good} amount={naira(short)} line={`short of the ${naira(want)} you asked for`} />
      </View>
      <View style={{ marginTop: -13 }}>
        <Facts
          inset={8}
          rows={[
            { label: 'You asked for', value: naira(want) },
            { label: 'In Everyday', value: naira(have) },
            { label: 'Short by', value: naira(short), tone: colour.warn },
          ]}
        />
      </View>
      <View style={{ marginTop: -8 }}>
        <Say testID="say">Three ways to close it. None of them costs you anything.</Say>
      </View>
      <View style={{ marginTop: -17 }}>
        <ChoiceList
          testID="ways"
          items={[
            { glyph: 'pot', title: `Move it from ${GOAL.name}`, sub: holiday ? `${naira(holiday)} is sitting there` : 'Nothing put aside yet', onPress: fromHoliday },
            { glyph: 'up', title: `Send ${naira(have)} now`, sub: 'The rest when your salary lands', onPress: sendNow },
            {
              glyph: 'down',
              title: `Ask ${account.demo ? 'Musa' : 'someone'} for ${naira(short)}`,
              sub: account.demo ? 'He owes you from the rent' : 'A request they answer in a tap',
              onPress: askFor,
            },
          ]}
        />
      </View>
    </Screen>
  );
}
