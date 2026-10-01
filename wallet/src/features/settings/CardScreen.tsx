/* Virtual card, from its frame: the card's face, the four things you can do
   to it, what Beetle has seen it pay, how much of its ceiling has gone, and
   the way to another. Reveal shows the whole number for ten seconds; Freeze
   is kept on this phone and greys the face; Rules opens the standing
   instructions. Load card, beside Back at the foot (and Load among the
   four), puts the amount picker up over the page — stopping hard at what
   Everyday holds — then the passcode, the line in the day and its receipt;
   what is loaded is the card's to spend on top of what its month allows.
   A second card comes with its round. This page runs 12 between its
   blocks. */
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { AmountSheet, Banner, Card, CardFace, Label, Meta, Meter, PageHead, PillRow, SayCard, Screen, Tools, colour, toast } from '../../design';
import { holdingsFor } from '../home/account';
import { balanceOf, rowFrom, useMoves } from '../home/moves';
import { PasscodeSheet, lockedFor } from '../passcode';
import { clock } from '../../lib/clock';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { askHome } from '../more/More';
import { useFoot } from '../more/Foot';
import { naira } from '../../lib/format';
import { usePrefs } from './prefs';
import { CARD, lastFour } from './card';

export function CardScreen() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const account = app.session?.account;
  const { prefs, ready, set } = usePrefs(account?.accountNumber);
  const [shown, setShown] = useState(false);
  const { moves, add: addMove } = useMoves(account?.accountNumber);
  const balance = (account ? holdingsFor(account).everyday : 0) + balanceOf(moves);
  /** loading it: the picker over the page, then the passcode */
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(0);
  const [guard, setGuard] = useState(false);
  const picked = (v: number) => {
    setLoading(false);
    const shut = lockedFor();
    if (shut) {
      toast(`That was three wrong tries. Give it ${shut} seconds and try again.`);
      return;
    }
    setAmount(v);
    setGuard(true);
  };
  /* the passcode landed: the line goes into the day, the card has it to spend, and its receipt opens */
  const done = () => {
    const at = clock();
    const row = rowFrom({ name: 'Virtual card', detail: `Loaded · •••• ${lastFour()} · ${at}`, amount: -amount, icon: 'card', kind: 'card' }, balance, 17 + moves.length);
    addMove(row);
    set({ cardLoaded: (prefs.cardLoaded ?? 0) + amount });
    setGuard(false);
    router.push(`/receipt/${row.id}` as never);
  };
  const hide = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (hide.current) clearTimeout(hide.current);
    },
    [],
  );
  /* the foot: Back, and Load card beside it */
  useFoot({ kind: 'button', label: 'Load card', leading: 'plus', disabled: prefs.cardFrozen, onPress: () => setLoading(true), veil: loading || guard ? 'away' : undefined });
  if (!ok || !account) return null;
  if (!ready)
    return (
      <Screen still>
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
  const left = CARD.ceiling - CARD.spent + (prefs.cardLoaded ?? 0);
  return (
    <View style={{ flex: 1 }}>
      <Screen head={<PageHead lead title="Virtual card" sub="Made for one merchant, with its own limit" />}>
        <View style={{ gap: 12 }}>
          <CardFace only={CARD.only} number={shown ? CARD.full : CARD.hidden} name={`${account.firstName} ${account.lastName}`.toUpperCase()} expiry={CARD.expiry} frozen={prefs.cardFrozen} />
          <Tools
            items={[
              { glyph: 'search', label: shown ? 'Hide' : 'Reveal', onPress: reveal },
              { glyph: 'freeze', label: prefs.cardFrozen ? 'Unfreeze' : 'Freeze', tone: colour.cyan, onPress: freeze },
              { glyph: 'plus', label: 'Load', tone: colour.good, onPress: () => (prefs.cardFrozen ? toast('Unfreeze it first, then load it.') : setLoading(true)) },
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
          <PillRow glyph="plus" label="Make another card" onPress={() => toast('A second card is not in the frames yet.')} />
        </View>
      </Screen>
      {loading ? (
        <AmountSheet
          title="Load the card"
          sub={`From Everyday onto •••• ${lastFour()}. It can spend what you load, on top of what its month allows.`}
          start={Math.min(5_000, Math.floor(balance))}
          max={Math.max(0, Math.floor(balance))}
          note={`Everyday has ${naira(balance)}`}
          chips={[5_000, 10_000, 20_000]}
          action={v => (v ? `Load ${naira(v)}` : 'Pick an amount')}
          onDone={picked}
          onDismiss={() => setLoading(false)}
          testID="card-amount"
        />
      ) : null}
      {guard ? (
        <PasscodeSheet
          amount={naira(amount)}
          name="Virtual card"
          detail={`From Everyday · •••• ${lastFour()}`}
          glyph="card"
          verify={app.checkPasscode}
          onDone={done}
          onCancel={() => setGuard(false)}
        />
      ) : null}
    </View>
  );
}
