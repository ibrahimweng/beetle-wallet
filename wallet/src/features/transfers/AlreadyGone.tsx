/* I sent it wrong, from its frame: money that went to the wrong account
   because Beetle read a digit wrong. The red mark, the green word that
   this one is Beetle's, its own account of the error, the cover to take
   today or the bank asked to recall it, and the offer to say how it stops
   this. Taking the cover puts the money back in the day as money in, with
   its receipt. */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Banner, BigStatus, Body, ChoiceList, Head, PageHead, Say, SayCard, Screen, colour, toast } from '../../design';
import { useFoot } from '../more/Foot';
import { askHome } from '../more/More';
import { rowFrom } from '../home/moves';
import { clock } from '../agent/chats';
import { naira } from '../../lib/format';
import { bankOf } from './states';
import { useLine } from './use';

export function AlreadyGone({ id }: { id: string }) {
  const router = useRouter();
  const { ok, ready, row, balance, moves, add } = useLine(id);
  const [asked, setAsked] = useState(false);
  const about = row ? `${naira(row.amount)} sent to the wrong account, covered by Beetle` : undefined;
  useFoot({ kind: 'back' });
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
  const amount = Math.abs(row.amount);
  /* the cover: money in from Beetle, in the day and on its receipt */
  const takeBack = () => {
    const at = clock();
    const back = rowFrom({ name: 'Beetle', detail: `Cover · received · ${at}`, amount, icon: 'bank', kind: 'in', reference: 'Cover for a number read wrong' }, balance, 17 + moves.length);
    add(back);
    toast(`${naira(amount)} is back in Everyday.`);
    router.replace(`/receipt/${back.id}`);
  };
  return (
    <Screen head={<PageHead title="I sent it wrong" sub={`${naira(amount)} left at ${row.time}`} />}>
      {/* the frame: the status 143 down, the banner 7 under its line, the bubble 12 under that, the ways and the offer 12 apart */}
      <View style={{ marginTop: -2 }}>
        <BigStatus glyph="warn-filled" tone={colour.alert} amount={naira(amount)} line="went to the wrong account" />
      </View>
      <View style={{ marginTop: -13 }}>
        <Banner tight tone={colour.good} text="This one is mine. You are covered." testID="banner" />
      </View>
      <View style={{ marginTop: -8 }}>
        <Say testID="line">I read the last digit wrong and sent it to a stranger. That is my error, so you get it back today, whether or not they return it.</Say>
      </View>
      <View style={{ marginTop: -8 }}>
        <ChoiceList
          testID="ways"
          items={[
            { glyph: 'up', title: `Take ${naira(amount)} back`, sub: 'Paid by us today, not in days', onPress: takeBack },
            { glyph: 'bank', title: `Ask ${bank} to recall it`, sub: 'We do this to recover our side', to: `/recall/${row.id}` },
          ]}
        />
      </View>
      <View style={{ marginTop: -8 }}>
        <SayCard
          testID="offer"
          action={asked ? 'Told you' : 'Do that'}
          disabled={asked}
          onAction={() => {
            setAsked(true);
            toast('When a digit is soft in a photo I stop and show you both readings before anything moves.');
          }}
        >
          Want to know how I stop this?
        </SayCard>
      </View>
    </Screen>
  );
}
