/* A transfer that is not done, on its own page from its frame, by the state
   the line is in. Still on its way: the ring turning, the warning not to
   send it again, the three steps with the last one waiting, Beetle's word
   on when it comes back on its own, and a message offered for the moment
   it lands. It did not go: the red mark, the green word that the balance
   is whole, Beetle on whose afternoon it is, try again or another way, and
   the offer to keep trying. It came back: the black mark, when it left and
   came back and why, with the reference, Beetle's word, and the account
   number to check or the same again. Reached from the line in Activities. */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Banner, BigStatus, Body, ChoiceList, Facts, Head, PageHead, Ring, Say, SayCard, Screen, StepRows, colour, toast, Card } from '../../design';
import { useFoot } from '../more/Foot';
import { askHome } from '../more/More';
import { naira } from '../../lib/format';
import { draft } from '../send/hand';
import { bankOf, firstOf, personOf, returnReference, shifted } from './states';
import { useLine } from './use';

export function Transfer({ id }: { id: string }) {
  const router = useRouter();
  const { ok, ready, row } = useLine(id);
  const ask = row?.status === 'failed' ? 'Ask why this failed' : row?.status === 'pending' ? 'Ask about this transfer' : 'Ask about this';
  const about = row ? `${naira(row.amount)} to ${row.name}, ${row.detail.toLowerCase()} at ${row.time}` : undefined;
  useFoot({ kind: 'back' });
  if (!ok) return null;
  if (!ready)
    return (
      <Screen still>
        <View />
      </Screen>
    );
  if (!row || row.status === 'done')
    return (
      <Screen>
        <Head>Nothing to see here</Head>
        <Body tone="tertiary">{row ? 'This one went through; its receipt has the rest.' : 'That line is not in this day.'}</Body>
      </Screen>
    );
  if (row.status === 'pending') return <Pending id={id} />;
  if (row.status === 'failed') return <Failed id={id} />;
  return <Reversed id={id} />;
}

function Pending({ id }: { id: string }) {
  const { row } = useLine(id);
  const [told, setTold] = useState(false);
  if (!row) return null;
  const bank = bankOf(row);
  const first = firstOf(row.name);
  const back = shifted(row.time, 120);
  return (
    <Screen head={<PageHead title="Still on its way" sub={`Sent at ${row.time}, not confirmed yet`} />}>
      {/* the frame: the status 147 down, the banner 11 under it, the steps 17 under the banner, the bubble 16 under those, the offer 5 under the bubble */}
      <View style={{ marginTop: 2 }}>
        <BigStatus lead={<Ring />} amount={naira(row.amount)} line={`to ${row.name} · ${bank}`} />
      </View>
      <View style={{ marginTop: -9 }}>
        <Banner glyph="warn-filled" ink={colour.good} text="Do not send it again. This one is still live." testID="banner" />
      </View>
      <Card style={{ marginTop: -3, paddingTop: 16, paddingBottom: 12, paddingHorizontal: 16, gap: 0 }} testID="steps">
        <StepRows
          gap={4}
          rows={[
            { label: 'Left your account', value: row.time, done: true },
            { label: `${bank} has it`, value: row.time, done: true },
            { label: `Reaching ${first}`, value: 'Waiting', done: false },
          ]}
        />
      </Card>
      <View style={{ marginTop: -4 }}>
        <Say testID="say">{`Slow, not lost. If ${bank} has not confirmed by ${back} it comes back on its own, and I will tell you either way.`}</Say>
      </View>
      <View style={{ marginTop: -15 }}>
        <SayCard
          testID="offer"
          action={told ? 'I will tell you' : 'Yes, tell me'}
          disabled={told}
          onAction={() => {
            setTold(true);
            toast(`The moment ${bank} confirms it, you get a message.`);
          }}
        >
          Want a message the moment it lands?
        </SayCard>
      </View>
    </Screen>
  );
}

function Failed({ id }: { id: string }) {
  const router = useRouter();
  const { row } = useLine(id);
  const [trying, setTrying] = useState(false);
  if (!row) return null;
  const bank = bankOf(row);
  const since = shifted(row.time, -42);
  const again = () => {
    draft.put({ who: personOf(row), amount: Math.abs(row.amount), amountNote: 'The same as before' });
    router.push('/send');
  };
  return (
    <Screen head={<PageHead title="It did not go" sub={`${bank} turned it down at ${row.time}`} />}>
      {/* the frame: the status 143 down, the banner 7 under its line, the bubble 12 under that, the ways 1 under the bubble, the offer 12 under them */}
      <View style={{ marginTop: -2 }}>
        <BigStatus glyph="warn-filled" tone={colour.alert} amount={naira(row.amount)} line="still in your account" />
      </View>
      <View style={{ marginTop: -13 }}>
        <Banner tight tone={colour.good} text="Your balance is exactly what it was." testID="banner" />
      </View>
      <View style={{ marginTop: -8 }}>
        <Say testID="say">{`Nothing was taken and nothing was charged. ${bank} has been failing since ${since}, so this is their afternoon, not your account.`}</Say>
      </View>
      <View style={{ marginTop: -19 }}>
        <ChoiceList
          testID="ways"
          items={[
            { glyph: 'up', title: 'Try again now', sub: 'It may have cleared already', onPress: again },
            { glyph: 'bank', title: 'Send it another way', sub: 'Through your Zenith account', onPress: () => toast('Paying from your Zenith account is not in the frames yet.') },
          ]}
        />
      </View>
      <View style={{ marginTop: -8 }}>
        <SayCard
          testID="offer"
          action={trying ? 'Trying' : 'Do that'}
          disabled={trying}
          onAction={() => {
            setTrying(true);
            toast(`I will try every ten minutes until ${bank} is back, and tell you when it lands.`);
          }}
        >
          {`Keep trying until ${bank} is back?`}
        </SayCard>
      </View>
    </Screen>
  );
}

function Reversed({ id }: { id: string }) {
  const router = useRouter();
  const { row } = useLine(id);
  if (!row) return null;
  const bank = bankOf(row);
  const first = firstOf(row.name);
  const left = shifted(row.time, -120);
  const again = (typing: boolean) => () => {
    draft.put({ who: personOf(row), amount: Math.abs(row.amount), amountNote: 'The same as before', typing });
    router.push('/send');
  };
  return (
    <Screen head={<PageHead title="It came back" sub={`Returned at ${row.time}`} />}>
      {/* the frame: the status 147 down, the facts 11 under its line, the bubble 16 under them, the ways 5 under the bubble */}
      <View style={{ marginTop: 2 }}>
        <BigStatus glyph="undo-filled" tone={colour.ink} amount={naira(row.amount)} line="back in Everyday" />
      </View>
      <View style={{ marginTop: -9 }}>
        <Facts
          inset={8}
          rows={[
            { label: 'Left', value: left },
            { label: 'Came back', value: row.time },
            { label: 'Why', value: 'Account could not be credited', quiet: true },
            { label: 'Reference', value: returnReference(row.id) },
          ]}
        />
      </View>
      <View style={{ marginTop: -4 }}>
        <Say testID="say">{`${first} never got it, so ${bank} sent it back and I put it where it came from. Nothing was charged, and your balance is whole.`}</Say>
      </View>
      <View style={{ marginTop: -15 }}>
        <ChoiceList
          testID="ways"
          items={[
            { glyph: 'search', title: 'Check the account number', sub: 'One digit is usually all it is', onPress: again(true) },
            { glyph: 'up', title: `Try ${first} again`, sub: 'Same amount, same account', onPress: again(false) },
          ]}
        />
      </View>
    </Screen>
  );
}
