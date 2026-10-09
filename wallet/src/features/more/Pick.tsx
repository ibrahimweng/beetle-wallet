/* Which account? (Round 36, the owner's word: two accounts, the naira and
   the dollars, and Send and Receive on the plus are for both.) Send and
   Receive from the plus come here first: the Naira account, Everyday, with
   what it holds, and the Dollar account, stablecoins on Solana, with what it
   holds. Sending, the naira go to Send money (its camera reads a code or
   written details) and the dollars to Send dollars. Receiving, the naira go
   back to home with the Receive sheet up and the dollars to Receive dollars,
   and the page says how each one comes in before it is picked. */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChoiceRow, Meta, PageHead, Screen, colour } from '../../design';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from './Foot';
import { openTab } from '../tabs/tabs';
import { holdingsFor } from '../home/account';
import { balanceOf, useMoves } from '../home/moves';
import { dollarsOf, usdFull } from '../dollars/dollars';
import { listedWords } from '../dollars/chains';
import { naira } from '../../lib/format';

export function Pick() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ for?: string }>();
  const receiving = asked.for === 'receive';
  const account = app.session?.account;
  const { moves } = useMoves(account?.accountNumber);
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  useFoot({ kind: 'back' });
  if (!ok || !account || !h) return null;
  const everyday = Math.max(0, Math.floor(h.everyday + balanceOf(moves)));
  const dollars = Math.max(0, dollarsOf(h.dollars, moves));
  return (
    <Screen head={<PageHead lead title="Which account?" sub={receiving ? 'Receive into your naira or your dollars' : 'Send from your naira or your dollars'} />}>
      <View testID="pick-accounts">
        <ChoiceRow
          glyph="bank"
          title="Naira account"
          sub={`Everyday · ${naira(everyday)}`}
          onPress={() => (receiving ? openTab(router, 'home', { receive: `pick-${Date.now()}` }) : router.push('/send'))}
          testID="pick-naira"
        />
        <ChoiceRow glyph="dollar" title="Dollar account" sub={`Stablecoins · ${usdFull(dollars)}`} to={receiving ? '/coins' : '/coins/send'} testID="pick-dollars" />
      </View>
      {/* how each one comes in, or goes out, said before it is picked */}
      <View style={s.notes} testID="pick-notes">
        {receiving ? (
          <>
            <Meta tone="secondary">Naira come in by bank transfer to your account number, from any Nigerian bank, or from a Beetle $tag.</Meta>
            <Meta tone="secondary">{`Dollars come in as stablecoins: ${listedWords()}, sent on Solana to your Dollar account’s own address. Any other network or coin is lost.`}</Meta>
          </>
        ) : (
          <>
            <Meta tone="secondary">Naira go to any Nigerian bank account or a Beetle $tag. The camera on Send money reads a code or written details.</Meta>
            <Meta tone="secondary">Dollars go to a Beetle $tag, free and at once, or out as stablecoins to a Solana wallet.</Meta>
          </>
        )}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  notes: { gap: 12, paddingTop: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colour.rule, paddingVertical: 16 },
});
