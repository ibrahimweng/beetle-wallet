/* I sent it wrong, from its frame: money that went to the wrong account
   because Beetle read a digit wrong. The red mark, the green word that
   this one is Beetle's, its own account of the error, the cover to take
   today or the bank asked to recall it, and the offer to say how it stops
   this. Taking the cover puts the money back in the day as money in, with
   its receipt. */
import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Banner, BigStatus, Body, ChoiceList, Head, PageHead, Say, SayCard, Screen, colour, logoOf, toast } from '../../design';
import { useFoot } from '../more/Foot';
import { askHome } from '../more/More';
import { rowFrom } from '../home/moves';
import { clock } from '../agent/chats';
import { naira } from '../../lib/format';
import { bankOf } from './states';
import { useLine } from './use';

export function AlreadyGone({ id }: { id: string }) {
  const router = useRouter();
  const { ok, ready, row: line, balance, moves, add, account } = useLine(id);
  /* Beetle covers only what it sent wrong itself: a transfer that left, settled, to a number read off a photo (the frame's
     own line on the demo account aside). Any other line is no such payment (the analysis after Round 34: any line's
     id, the test money's or a cover's own, paid out again and again) */
  const row = line && line.kind === 'transfer' && line.amount < 0 && line.status === 'done' && (line.read === 'photo' || (!!account?.demo && line.id === 'l08')) ? line : null;
  const [asked, setAsked] = useState(false);
  const taking = useRef(false);
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
  /* the cover already taken for this line, if it was: it is paid once (the analysis after Round 21) */
  const cover = moves.find(m => m.covers === row.id);
  /* the cover: money in from Beetle, in the day and on its receipt; a second tap, or a tap once it is paid, opens what was paid */
  const takeBack = () => {
    if (cover) {
      router.replace(`/receipt/${cover.id}`);
      return;
    }
    if (taking.current) return;
    taking.current = true;
    const at = clock();
    const back = rowFrom(
      { name: 'Beetle', detail: `Cover · received · ${at}`, amount, icon: 'bank', kind: 'in', reference: 'Cover for a number read wrong', covers: row.id },
      balance,
      17 + moves.length,
    );
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
            cover
              ? { glyph: 'up', title: `${naira(amount)} is back`, sub: `Paid by us at ${cover.time}`, onPress: takeBack }
              : { glyph: 'up', title: `Take ${naira(amount)} back`, sub: 'Paid by us today, not in days', onPress: takeBack },
            { glyph: 'bank', logo: logoOf(bank), title: `Ask ${bank} to recall it`, sub: 'We do this to recover our side', to: `/recall/${row.id}` },
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
