/* Check this number, from its frame: a last digit the reader was not sure
   of. The number as read, where it came from, the other reading in amber,
   Beetle's word that it will not choose on its own, and the three ways —
   the one, the other, or typing it. Reached from a photo on the Send money
   page whose reading came back soft; the lab opens it on the slip the
   stand-in is not sure of. */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BigStatus, Body, ChoiceList, Facts, Head, PageHead, Say, Screen, colour } from '../../design';
import { DEMO_SAVED, PEOPLE, SOFT_READING, beneficiariesOf, ownLine, whose, type Person, type Reading } from '../../services';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { askHome } from '../more/More';
import { holdingsFor } from '../home/account';
import { useMoves } from '../home/moves';
import { LAB } from '../../lab/enabled';
import { groupAccount } from '../../lib/format';
import { draft, shortName, softReading } from './hand';
import { useBackToSend } from './Short';

export function Misread() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ demo?: string }>();
  const account = app.session?.account;
  const { moves } = useMoves(account?.accountNumber);
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  const saved = useMemo(
    () => beneficiariesOf([...moves, ...(h?.ledger ?? [])], account?.demo ? DEMO_SAVED : { lines: [], meters: [] }, PEOPLE, account ? ownLine(account.phone) : null),
    [moves, h, account],
  );
  const [reading] = useState<Reading | null>(() => softReading.take() ?? (LAB && asked.demo === '1' ? SOFT_READING : null));
  const toSend = useBackToSend();
  useFoot({ kind: 'back' });
  if (!ok || !account) return null;
  if (!reading?.soft)
    return (
      <Screen>
        <Head>Nothing to check</Head>
        <Body tone="tertiary">The last photo read cleanly.</Body>
      </Screen>
    );
  const a = whose(reading.soft.number, reading);
  const b = whose(reading.soft.maybe, reading);
  const before = (p: Person) => saved.people.find(x => x.number === p.number);
  const sub = (p: Person) => {
    const known = before(p);
    return known ? `${known.name}, who you have paid before` : 'Someone you have never paid';
  };
  const choose = (p: Person) => () => {
    const known = before(p);
    draft.put({ who: known ? { name: known.name, bank: known.bank, number: p.number } : p, whoNote: 'Read off the photo, the last digit checked by you', read: 'photo' });
    toSend();
  };
  return (
    <Screen head={<PageHead title="Check this number" sub="Nothing has been sent" />}>
      {/* the frame: the figures 7 under the status, the bubble 12 under them, the ways 12 under the bubble */}
      <View style={{ marginTop: -2 }}>
        <BigStatus glyph="warn-filled" tone={colour.good} amount={groupAccount(a.number)} line="and I am not sure of the last digit" />
      </View>
      <View style={{ marginTop: -13 }}>
        <Facts
          inset={8}
          rows={[
            { label: 'From the photo', value: `${shortName(a.name)} · ${a.bank}` },
            { label: 'I read', value: groupAccount(a.number) },
            { label: 'Or maybe', value: groupAccount(b.number), tone: colour.warn },
          ]}
        />
      </View>
      <View style={{ marginTop: -8 }}>
        <Say testID="say">The last digit is soft in the photo. I will not choose between these two on my own.</Say>
      </View>
      <View style={{ marginTop: -8 }}>
        <ChoiceList
          testID="ways"
          items={[
            { glyph: 'lock', title: `It is ${groupAccount(a.number)}`, sub: sub(a), onPress: choose(a) },
            { glyph: 'up', title: `It is ${groupAccount(b.number)}`, sub: sub(b), onPress: choose(b) },
            {
              glyph: 'down',
              title: 'Let me type it',
              sub: 'Neither one is right',
              onPress: () => {
                draft.put({ typing: true });
                toSend();
              },
            },
          ]}
        />
      </View>
    </Screen>
  );
}
