/* Asking for it back, from its frame: Beetle Recall at work on a light
   panel — reported, sent to the bank, the person asked to approve, and
   their answer still to come — what this is and is not, and the two ways
   on: a message to them, or a dispute. Reached from What went wrong?, and
   from I sent it wrong. */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Card, ChoiceList, Head, LightPanel, Meta, NoteRow, PageHead, Screen, toast } from '../../design';
import { useFoot } from '../more/Foot';
import { askHome } from '../more/More';
import { naira } from '../../lib/format';
import { bankOf, firstOf, shifted } from './states';
import { useOpenDispute } from '../dispute';
import { clock, useChats } from '../agent/chats';
import { turn } from '../agent/turns';
import { useLine } from './use';

export function Recall({ id }: { id: string }) {
  const router = useRouter();
  const { ok, ready, row, account } = useLine(id);
  const open = useOpenDispute(account?.accountNumber, !!account?.demo);
  const { file } = useChats(account?.accountNumber, !!account?.demo);
  const [messaged, setMessaged] = useState(false);
  /* the moment it was reported: now, and kept while the page is up */
  const [at] = useState(() => clock());
  const about = row ? `${naira(row.amount)} to ${row.name}, being asked back` : undefined;
  useFoot({ kind: 'ask', placeholder: 'Ask what happens next', onAsk: q => askHome(router, q, about), onScan: () => router.push('/scan') });
  if (!ok) return null;
  if (!ready)
    return (
      <Screen still>
        <View />
      </Screen>
    );
  if (!row)
    return (
      <Screen>
        <Head>No such payment</Head>
        <Body tone="tertiary">That line is not in this day.</Body>
      </Screen>
    );
  const bank = bankOf(row);
  const first = firstOf(row.name);
  return (
    <Screen head={<PageHead title="Asking for it back" sub={`${naira(row.amount)}, sent at ${row.time}`} />}>
      <LightPanel
        glyph="up"
        title="Beetle Recall"
        status="Running"
        testID="recall"
        rows={[
          { label: 'You reported it', value: at, done: true },
          { label: `Sent to ${bank}`, value: at, done: true },
          { label: `${first} asked to approve`, value: shifted(at, 1), done: true },
          { label: `${first}'s answer`, value: 'Up to 5 working days', done: false },
        ]}
      />
      {/* the frame's card: the title 18 down, 12 to the notes, 8 between them, 12 to the line under, 20 under that */}
      <Card outline style={s.what} testID="what">
        <Body tone="secondary" style={{ lineHeight: 16 }}>
          What this is and is not
        </Body>
        <View style={{ gap: 4 }}>
          <NoteRow glyph="check">{`I have asked ${bank}. That part is done.`}</NoteRow>
          <NoteRow glyph="lock">I cannot take it back. It is their money until they agree.</NoteRow>
          <NoteRow glyph="lock">If they say no, no bank can force them.</NoteRow>
        </View>
        <Meta tone="secondary">After that it is a formal dispute, then a police report. I walk you through either.</Meta>
      </Card>
      <View style={{ marginTop: -4 }}>
        <ChoiceList
          testID="ways"
          items={[
            {
              glyph: 'chat',
              title: messaged ? `${first} has the message` : `Message ${first}`,
              sub: messaged ? 'I tell you the moment she answers' : 'Most of these end here, in an hour',
              onPress: () => {
                if (messaged) return;
                setMessaged(true);
                const at = clock();
                file({
                  id: `recall-${row.id}`,
                  startedBy: 'beetle',
                  title: `A message to ${first}`,
                  detail: `Through ${bank} · ${naira(row.amount)}`,
                  time: at,
                  day: 'today',
                  turns: [
                    turn.say(
                      `Sent through ${bank} at ${at}: "${first}, the ${naira(row.amount)} that reached you at ${row.time} was sent in error. Please approve its return; nothing else is needed from you." I tell you the moment there is an answer.`,
                    ),
                  ],
                  pending: null,
                  unread: true,
                });
                toast(`Sent through ${bank}. I tell you the moment ${first} answers.`);
              },
            },
            { glyph: 'list', title: 'Open a dispute', sub: `If ${first} has not answered by Friday`, onPress: () => open(row, 'recall') },
          ]}
        />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  what: { marginTop: -4, paddingTop: 18, paddingBottom: 20, paddingHorizontal: 16, gap: 12 },
});
