/* What went wrong?, from its frame: the three things that can be wrong with
   a payment that went through, Beetle's word on which it can do itself and
   which only a bank can, and the payment itself. Reached from a receipt's
   "Something wrong with this?". The wrong person leads to Asking for it
   back — or, where Beetle read the number off a photo, to I sent it wrong,
   since the digit was its own. The other two open a dispute: a trace with
   the bank, or the card frozen first and then the report. */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Card, ChoiceList, Facts, Head, PageHead, Say, Screen } from '../../design';
import { useFoot } from '../more/Foot';
import { askHome } from '../more/More';
import { naira } from '../../lib/format';
import { useOpenDispute } from '../dispute';
import { bankOf, whenOf } from './states';
import { useLine } from './use';

export function Wrong({ id }: { id: string }) {
  const router = useRouter();
  const { ok, ready, row, account } = useLine(id);
  const open = useOpenDispute(account?.accountNumber, !!account?.demo);
  const about = row ? `${naira(row.amount)} to ${row.name}, ${whenOf(row).toLowerCase()}` : undefined;
  useFoot({ kind: 'ask', placeholder: 'Tell me what happened', onAsk: q => askHome(router, q, about), onScan: () => router.push('/scan') });
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
  return (
    <Screen head={<PageHead title="What went wrong?" sub="Tell me which and I start it now" />}>
      <ChoiceList
        testID="ways"
        items={[
          { glyph: 'person', title: 'It went to the wrong person', sub: 'I ask their bank to send it back', to: row.read === 'photo' ? `/alreadygone/${row.id}` : `/recall/${row.id}` },
          { glyph: 'search', title: 'They say it never arrived', sub: `I make ${bank} trace it`, onPress: () => open(row, 'trace') },
          { glyph: 'shield', title: 'I did not make this payment', sub: 'I freeze the account first, then we look', onPress: () => open(row, 'fraud') },
        ]}
      />
      <View style={{ marginTop: -4 }}>
        <Say testID="say">Some of this I can do in minutes. Some of it only a bank can do, and that takes days. I will tell you which one you are in before you start, not after.</Say>
      </View>
      {/* the frame's card: the title 18 down, 12 to the rows, 12 between them, 16 under */}
      <Card outline style={s.payment} testID="payment">
        <Body tone="secondary">The payment</Body>
        <View style={{ gap: 12 }}>
          <Facts inset={8} rows={[{ label: 'Amount', value: naira(row.amount) }]} />
          <Facts inset={8} rows={[{ label: 'To', value: `${row.name} · ${bank}` }]} />
          <Facts inset={8} rows={[{ label: 'Sent', value: whenOf(row) }]} />
        </View>
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  payment: { marginTop: -16, paddingTop: 18, paddingBottom: 16, paddingHorizontal: 16, gap: 12 },
});
