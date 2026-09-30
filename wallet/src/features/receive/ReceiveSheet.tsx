/* Receive, on its sheet over home, from its frame: the arrow down on its
   disc, the word and the line under it, and the four ways money can reach
   the account, each a row with a glyph, a name and a line, a chevron at its
   end — a bank transfer (the number to hand out, on Three ways to be paid),
   a card, asking someone (a request they can pay), and dollars. Done sends
   it back. Receive on the card, the Receive shortcut, the new account's
   Receive button and Receive in More all open it; a row that leads to a
   page sends the sheet down first, and the page arrives from the row.

   Measured off the frame: the disc 64, 7 under the grabber's band; 16 to
   the word, 12 to the line, 20 to the rows; the rows 72 with a 40 square,
   12 to the words; 16 to Done, 120 by 50, and 17 under it, which puts the
   sheet's foot 13 above the screen's edge as the frame has it. */
import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Head, Icon, Meta, Row, Sheet, Tap, colour, measure, setOrigin, toast } from '../../design';
import type { IconName } from '../../icons';
import type { Account } from '../../services';
import { groupAccount } from '../../lib/format';

const later = (what: string, round: number) => () => toast(`${what} comes with round ${round}.`);

type Way = { glyph: IconName; title: string; sub: string; to?: string; onPress?: () => void };

export function ReceiveSheet({ account, onDismiss }: { account: Account; onDismiss: () => void }) {
  const router = useRouter();
  /* the page a row leads to: the sheet goes down, then the page comes */
  const [going, setGoing] = useState<string | null>(null);
  const ways: Way[] = [
    { glyph: 'bank', title: 'Bank transfer', sub: `Your number, ${groupAccount(account.accountNumber)}`, to: '/ways' },
    { glyph: 'card', title: 'From a card', sub: 'Any Nigerian debit card', onPress: later('Paying in from a card', 5) },
    { glyph: 'request', title: 'Ask someone', sub: 'Send a request they can pay', to: '/request' },
    { glyph: 'dollar', title: 'In dollars', sub: 'Hold it steady, or turn naira across', onPress: later('Dollars', 6) },
  ];
  const gone = () => {
    onDismiss();
    if (going) router.push(going as never);
  };
  return (
    <Sheet leaving={!!going} onGone={gone} onDismiss={onDismiss} testID="receive" foot={17}>
      <View style={{ alignItems: 'center', marginTop: 7 }}>
        <View style={s.disc} testID="receive-glyph">
          <Icon name="down" size={32} colour={colour.ink} />
        </View>
      </View>
      <Head style={{ textAlign: 'center', marginTop: 16 }}>Receive</Head>
      <Body tone="tertiary" style={{ textAlign: 'center', marginTop: 12 }}>
        Pick how you want the money to reach you
      </Body>
      <View style={{ marginTop: 20 }} testID="receive-ways">
        {ways.map(w => (
          <WayRow key={w.title} {...w} onGo={to => setGoing(to)} />
        ))}
      </View>
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <Tap accessibilityRole="button" accessibilityLabel="Done" onPress={onDismiss} style={s.done}>
          <Row>Done</Row>
        </Tap>
      </View>
    </Sheet>
  );
}

function WayRow({ glyph, title, sub, to, onPress, onGo }: Way & { onGo: (to: string) => void }) {
  const ref = useRef<View>(null);
  const press = async () => {
    if (!to) {
      onPress?.();
      return;
    }
    /* the page's title grows out of this row's words */
    const rect = await measure(ref);
    setOrigin({ id: `receive:${title}`, ...rect, words: title, at: Date.now() });
    onGo(to);
  };
  return (
    <Tap ref={ref} accessibilityRole="button" accessibilityLabel={title} onPress={() => void press()} style={s.row} testID="receive-way">
      <View style={s.box}>
        <Icon name={glyph} size={20} colour={colour.ink} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Row>{title}</Row>
        <Meta tone="secondary">{sub}</Meta>
      </View>
      <Icon name="chevron" size={16} colour={colour.textTertiary} />
    </Tap>
  );
}

const s = StyleSheet.create({
  disc: { width: 64, height: 64, borderRadius: 20, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 72 },
  box: { width: 40, height: 40, borderRadius: 13, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  done: { width: 121, height: 50, borderRadius: 25, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
});
