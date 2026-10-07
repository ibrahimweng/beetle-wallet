/* Not enough in Everyday, from its frame: what is short, the three figures,
   Beetle's word that none of the ways out costs anything, and the three —
   from a goal (the first that holds enough), what there is now with the
   rest on payday, or asking someone who owes you. Reached from Slide to
   send when the amount is past the balance, and from the keypad's question;
   and from paying a bill, buying data or airtime, and converting, where the
   ways are the goal and asking someone, and the goal's money goes back to
   that payment rather than to Send money.

   What is short counts the fee the transfer carries, so moving it from a
   goal is enough to send; moving it out of a goal goes through the passcode,
   as Take out on the goal does; and nothing moves when nothing is short
   (the analysis after Round 21). */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { BigStatus, ChoiceList, Facts, PageHead, Say, Screen, colour, toast } from '../../design';
import { feeFor, type Move } from '../../services';
import { PasscodeSheet, lockedFor, waitWords } from '../passcode';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { askHome } from '../more/More';
import { holdingsFor } from '../home/account';
import { balanceOf, rowFrom, useMoves } from '../home/moves';
import { usePrefs } from '../settings/prefs';
import { standingOf, useGoals } from '../goal';
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
  const asked = useLocalSearchParams<{ asked?: string; have?: string; fee?: string; for?: string }>();
  const account = app.session?.account;
  const { moves, add: addMove } = useMoves(account?.accountNumber);
  const { prefs } = usePrefs(account?.accountNumber);
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  /* the goal it comes from: the first that holds enough, or else the first; what it holds is what its feeds put in, plus what was added by hand, less what was taken back */
  const { goals } = useGoals(account?.accountNumber, { demo: !!account?.demo, started: prefs.goal });
  /* the lab opens it with the balance the frame draws */
  const have = LAB && asked.have ? Number(asked.have) : (h?.everyday ?? 0) + balanceOf(moves);
  const want = Number(asked.asked ?? 0) || 0;
  /* a transfer's fee leaves with it, so it is short by that too */
  const fee = Number(asked.fee ?? 0) || 0;
  const short = Math.max(0, Math.round((want + fee - have) * 100) / 100);
  /* paying a bill, data, airtime or converting: the goal's money goes back to that, and there is no sending now */
  const sending = !asked.for || asked.for === 'send';
  const [guard, setGuard] = useState(false);
  const list = goals.map(g => standingOf(g, { goals, demo: !!account?.demo, tight: prefs.tight, moves }));
  const from = list.find(s => s.aside >= short) ?? list[0];
  const holiday = from?.aside ?? 0;
  const name = from?.goal.name ?? 'savings';
  /* what can go now: what Everyday holds, less the transfer's own fee, which is where Send money stops too */
  const can = Math.max(0, Math.floor(have - feeFor(have)));
  const toSend = useBackToSend();
  useFoot({ kind: 'back' });
  if (!ok || !account) return null;
  const sendNow = () => {
    draft.put({ amount: can, amountNote: 'What Everyday holds, less the fee' });
    toSend();
  };
  /* back to what was being paid: Send money with the amount as asked, or the page underneath as it was left */
  const onward = (note?: string) => {
    if (sending) {
      draft.put({ amount: want, amountNote: note });
      toSend();
    } else router.back();
  };
  /* the goal gives the shortfall back, through the passcode: a line in the day, and Everyday has it */
  const fromHoliday = () => {
    if (!short) {
      toast('Everyday has enough for it now.');
      onward();
      return;
    }
    if (!from) {
      toast('Nothing is put aside yet. Start a goal from Savings on home.');
      return;
    }
    if (holiday < short) {
      toast(`${name} holds ${naira(holiday)}, ${naira(short - holiday)} short of what you need.`);
      return;
    }
    const shut = lockedFor();
    if (shut) {
      toast(`That was three wrong tries. Give it ${waitWords(shut)} and try again.`);
      return;
    }
    setGuard(true);
  };
  const movedBack = () => {
    setGuard(false);
    if (!from) return;
    const at = clock();
    const move: Move = { name, detail: `Taken back · ${at}`, amount: short, icon: 'pot', kind: 'saving', goal: from.goal.id };
    addMove(rowFrom(move, have, 17 + moves.length));
    toast(`${naira(short)} is back from ${name}. Everyday has it now.`);
    onward(`${naira(short)} came back from ${name}`);
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
        <Say testID="line">{sending ? 'Three ways to close it.' : 'Two ways to close it.'} None of them costs you anything.</Say>
      </View>
      <View style={{ marginTop: -8 }}>
        <ChoiceList
          testID="ways"
          items={[
            { glyph: 'pot', title: `Move it from ${name}`, sub: holiday ? `${naira(holiday)} is sitting there` : 'Nothing put aside yet', onPress: fromHoliday },
            ...(sending ? [{ glyph: 'up' as const, title: `Send ${naira(can)} now`, sub: 'The rest when your salary lands', onPress: sendNow }] : []),
            {
              glyph: 'down',
              title: `Ask ${account.demo ? 'Musa' : 'someone'} for ${naira(short)}`,
              sub: account.demo ? 'He owes you from the rent' : 'A request they answer in a tap',
              onPress: askFor,
            },
          ]}
        />
      </View>
      {guard && from ? (
        <PasscodeSheet
          amount={naira(short)}
          name={name}
          detail="Taken out, into Everyday"
          glyph="pot"
          rows={[
            { label: 'From', value: name },
            { label: 'Fee', value: 'Free' },
            { label: 'Into Everyday', value: naira(short), strong: true },
          ]}
          verify={app.checkPasscode}
          onDone={movedBack}
          onCancel={() => setGuard(false)}
        />
      ) : null}
    </Screen>
  );
}
