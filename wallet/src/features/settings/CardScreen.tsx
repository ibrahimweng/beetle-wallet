/* Virtual card, from its frame: the card's face, the four things you can do
   to it, what Beetle has seen it pay, how much of its ceiling has gone, and
   the way to another. Reveal shows the whole number for ten seconds; Freeze
   is kept on this phone and greys the face; Rules opens the standing
   instructions. Funding it and a second card come with their rounds. This
   page runs 12 between its blocks. */
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ActionButton, Banner, Card, CardFace, Dock, Label, Meta, Meter, PageHead, PillRow, SayCard, Screen, Tools, colour, toast } from '../../design';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { askHome, useMore } from '../more/More';
import { naira } from '../../lib/format';
import { usePrefs } from './prefs';

const CARD = { only: 'NETFLIX ONLY', hidden: '5399 •••• •••• 4471', full: '5399 8123 4567 4471', expiry: '09/28', spent: 21000, ceiling: 50000 };

export function CardScreen() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const account = app.session?.account;
  const { prefs, ready, set } = usePrefs(account?.accountNumber);
  const { sheet, openMore } = useMore(router);
  const [shown, setShown] = useState(false);
  const hide = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (hide.current) clearTimeout(hide.current);
    },
    [],
  );
  if (!ok || !account) return null;
  const dock = (
    <Dock
      placeholder="Ask about this card"
      onBack={() => router.back()}
      onAsk={q => askHome(router, q)}
      onScan={() => router.push('/scan')}
      action={<ActionButton onPress={openMore} label="More" />}
    />
  );
  if (!ready)
    return (
      <Screen dock={dock} still>
        <View />
      </Screen>
    );
  const reveal = () => {
    if (hide.current) clearTimeout(hide.current);
    if (shown) return setShown(false);
    setShown(true);
    hide.current = setTimeout(() => setShown(false), 10000);
  };
  const freeze = () => {
    const now = !prefs.cardFrozen;
    set({ cardFrozen: now });
    toast(now ? 'Frozen. Nothing can be charged to it.' : 'The card is live again.');
  };
  const later = (what: string, round: number) => () => toast(`${what} comes with round ${round}.`);
  const left = CARD.ceiling - CARD.spent;
  return (
    <View style={{ flex: 1 }}>
      <Screen dock={dock}>
        <PageHead lead title="Virtual card" sub="Made for one merchant, with its own limit" />
        <View style={{ gap: 12 }}>
          <CardFace only={CARD.only} number={shown ? CARD.full : CARD.hidden} name={`${account.firstName} ${account.lastName}`.toUpperCase()} expiry={CARD.expiry} frozen={prefs.cardFrozen} />
          <Tools
            items={[
              { glyph: 'search', label: shown ? 'Hide' : 'Reveal', onPress: reveal },
              { glyph: 'freeze', label: prefs.cardFrozen ? 'Unfreeze' : 'Freeze', tone: colour.cyan, onPress: freeze },
              { glyph: 'plus', label: 'Fund', tone: colour.good, onPress: later('Funding the card', 6) },
              { glyph: 'list', label: 'Rules', onPress: () => router.push('/rules') },
            ]}
          />
          {prefs.cardFrozen ? <Banner glyph="freeze" tone={colour.cyan} text="This card is frozen. Nothing can be charged to it." /> : null}
          <SayCard testID="say">This card has paid Netflix four times, ₦21,000 in all.</SayCard>
          <Card style={{ paddingVertical: 14, paddingHorizontal: 16, gap: 12 }} testID="spent">
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Meta tone="secondary">Spent this month</Meta>
              <Label>
                {naira(CARD.spent)} of {naira(CARD.ceiling)}
              </Label>
            </View>
            <Meter pct={(CARD.spent / CARD.ceiling) * 100} height={7} />
            <Meta tone="secondary">{naira(left)} left before it stops working</Meta>
          </Card>
          <PillRow glyph="plus" label="Make another card" onPress={later('A second card', 5)} />
        </View>
      </Screen>
      {sheet}
    </View>
  );
}
