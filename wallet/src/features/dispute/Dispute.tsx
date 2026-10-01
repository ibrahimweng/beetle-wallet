/* Your dispute, from its frame: Beetle Dispute with the day it is on, the
   four steps with the ones done ticked, where the thing actually is in
   three lines, and the ways — seeing the exact wording that was filed, or
   adding something to it. The day it closes, the same page is The dispute
   is closed: the money back at a time, the amber word that it is already
   in the balance, the three steps, Beetle's word on how it went, and the
   closing letter offered. Reached from What went wrong?, from Asking for
   it back, and from the chat Beetle files when one is opened. */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Banner, BigStatus, Body, Card, Head, NoteCard, PageHead, Ring, Say, SayCard, Screen, StepRows, colour, toast } from '../../design';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { askHome } from '../more/More';
import { clock, useChats } from '../agent/chats';
import { turn } from '../agent/turns';
import { LAB } from '../../lab/enabled';
import { naira } from '../../lib/format';
import { DAYS, closedDemo, closingLetter, filedWords, stepsOf, whereLines, type Dispute as DisputeRecord } from './dispute';
import { ReasonPage } from './Reason';
import { useDisputes } from './store';

export function Dispute({ id }: { id: string }) {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ closed?: string }>();
  const account = app.session?.account;
  const { disputes, ready } = useDisputes(account?.accountNumber, !!account?.demo);
  const { file } = useChats(account?.accountNumber, !!account?.demo);
  const found = disputes.find(d => d.id === id) ?? null;
  const d: DisputeRecord | null = found && LAB && asked.closed === '1' ? closedDemo(found) : found;
  const [filed, setFiled] = useState(false);
  const [letter, setLetter] = useState(false);
  const about = d ? `${naira(d.amount)} to ${d.name}, ${d.status === 'closed' ? 'the dispute closed' : `dispute day ${d.day} of ${DAYS}`}` : undefined;
  useFoot({ kind: 'back' });
  if (!ok || !account) return null;
  if (!ready)
    return (
      <Screen still>
        <View />
      </Screen>
    );
  if (!d)
    return (
      <Screen>
        <Head>No such dispute</Head>
        <Body tone="tertiary">That one is not on this phone.</Body>
      </Screen>
    );
  if (d.status === 'closed') {
    const sendLetter = () => {
      setLetter(true);
      const at = clock();
      file({
        id: `letter-${d.id}`,
        startedBy: 'beetle',
        title: 'The closing letter',
        detail: `${naira(d.amount)} from ${d.name}, back in Everyday`,
        time: at,
        day: 'today',
        turns: [turn.say(closingLetter(d))],
        pending: null,
        unread: true,
      });
      toast('The letter is in your chats, and you can share it from there.');
    };
    return (
      <Screen head={<PageHead title="The dispute is closed" sub={`${d.bank} decided on ${d.decidedLong ?? d.decisionBy}`} />}>
        {/* the frame: the status 147 down, the banner 16 under it, the steps 16 under that, the bubble 16 under those, the offer 16 under the bubble's box */}
        <View style={{ marginTop: 2 }}>
          <BigStatus lead={<Ring />} amount={naira(d.amount)} line={`back in Everyday at ${d.returnedAt ?? ''}`} />
        </View>
        <View style={{ marginTop: -8 }}>
          <Banner glyph="warn-filled" ink={colour.good} text="It is already in your balance. Nothing to do." testID="banner" />
        </View>
        <Card style={[{ marginTop: -6 }, s.steps]} testID="steps">
          <StepRows gap={4} rows={stepsOf(d)} />
        </Card>
        <View style={s.tight}>
          <Say testID="say">{`Six days, and you did not chase it once. Most disputes that get this far end the same way.`}</Say>
        </View>
        <View style={{ marginTop: -14 }}>
          <SayCard testID="offer" action={letter ? 'It is in your chats' : 'Yes, tell me'} disabled={letter} onAction={sendLetter}>
            Want the closing letter for your records?
          </SayCard>
        </View>
      </Screen>
    );
  }
  const where = whereLines(d);
  return (
    <ReasonPage
      title={`Your dispute, day ${d.day} of ${DAYS}`}
      sub={`${naira(d.amount)} to ${d.name}, ${d.openedLong}`}
      panel={{ glyph: 'up', title: 'Beetle Dispute', status: `Day ${d.day}`, rows: stepsOf(d), testID: 'dispute-panel' }}
      card={{ title: 'Where this actually is', notes: where.notes, foot: where.foot, testID: 'where' }}
      ways={[
        { glyph: 'chat', title: 'See what was filed', sub: 'The wording, and what went with it', onPress: () => setFiled(v => !v) },
        { glyph: 'list', title: 'Add something to it', sub: 'A message or a screenshot from her', onPress: () => askHome(router, 'Add something to my dispute', about) },
      ]}
      after={
        filed ? (
          <View style={s.tight}>
            <NoteCard width="100%" title={`What was filed with ${d.bank}`} body={filedWords(d)} testID="filed" />
          </View>
        ) : null
      }
    />
  );
}

const s = StyleSheet.create({
  tight: { marginTop: -4 },
  steps: { paddingTop: 16, paddingBottom: 12, paddingHorizontal: 16, gap: 0 },
});
