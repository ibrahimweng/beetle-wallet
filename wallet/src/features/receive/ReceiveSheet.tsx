/* Receive, on its sheet over home: the account's own details, one tap from
   the card — the account number at Beetle, for any bank, and the $tag, for
   another Beetle account — each with Copy beside it, and Share details to
   hand them on at once, the same as the chat's Receive card. Under them the
   two other ways money comes: asking someone (a request they can pay) and
   dollars. Done sends it back. Receive on the card, the Receive shortcut,
   the new account's Receive button and Receive in More all open it; a row
   that leads to a page sends the sheet down first, and the page arrives from
   the row. The owner made it this short after Round 11: no paying in from a
   card, no code to scan, and no page of its own for a bank transfer.

   From the frame: the disc 64, 7 under the grabber's band; 16 to the word,
   12 to the line; the rows 72 with a 40 square, 12 to the words; Done 120
   by 50, and 17 under it. The details sit on a grey card between the line
   and the rows. */
import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Button, Caption, Head, Icon, Label, Meta, Row, Sheet, Tap, colour, measure, setOrigin } from '../../design';
import type { IconName } from '../../icons';
import type { Account } from '../../services';
import { detailsOf } from './details';
import { copyDetail, shareDetails } from './share';

type Way = { glyph: IconName; title: string; sub: string; to: string };

const WAYS: Way[] = [
  { glyph: 'request', title: 'Ask someone', sub: 'Send a request they can pay', to: '/request' },
  /* Round 36: stablecoins into the Dollar account, its address and how receiving works */
  { glyph: 'dollar', title: 'In dollars', sub: 'USDC, USDT or PYUSD on Solana', to: '/coins' },
];

export function ReceiveSheet({ account, onDismiss }: { account: Account; onDismiss: () => void }) {
  const router = useRouter();
  /* the page a row leads to: the sheet goes down, then the page comes */
  const [going, setGoing] = useState<string | null>(null);
  const d = detailsOf(account);
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
        Give these to whoever is paying you
      </Body>
      <View style={s.details} testID="receive-details">
        <Detail label="Account number" value={d.number} sub={`Beetle · ${d.name}`} onCopy={() => void copyDetail(account.accountNumber, d.number, 'sheet')} testID="receive-sheet-number" />
        <View style={s.rule} />
        <Detail label="Beetle tag" value={`$${d.tag}`} sub="Free and instant on Beetle" onCopy={() => void copyDetail(`$${d.tag}`, `$${d.tag}`, 'sheet')} testID="receive-sheet-tag" />
      </View>
      <Button label="Share details" leading="share" size={48} onPress={() => void shareDetails(d.all, 'sheet')} style={{ marginTop: 12 }} />
      <View style={{ marginTop: 8 }} testID="receive-ways">
        {WAYS.map(w => (
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

/* A detail on the grey card: what it is, the thing itself, a line under it,
   and Copy at its end. */
function Detail({ label, value, sub, onCopy, testID }: { label: string; value: string; sub: string; onCopy: () => void; testID: string }) {
  return (
    <View style={s.detail} testID={testID}>
      <View style={{ flex: 1, gap: 2 }}>
        <Meta tone="secondary">{label}</Meta>
        <Head>{value}</Head>
        <Caption tone="tertiary">{sub}</Caption>
      </View>
      <Tap accessibilityRole="button" accessibilityLabel={`Copy ${label.toLowerCase()}`} onPress={onCopy} hitSlop={8} style={s.copy}>
        <Icon name="copy" size={14} colour={colour.ink} />
        <Label>Copy</Label>
      </Tap>
    </View>
  );
}

function WayRow({ glyph, title, sub, to, onGo }: Way & { onGo: (to: string) => void }) {
  const ref = useRef<View>(null);
  const press = async () => {
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
  details: { marginTop: 20, backgroundColor: colour.surface2, borderRadius: 20, paddingHorizontal: 16 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rule: { height: 1, backgroundColor: colour.rule },
  copy: { height: 36, borderRadius: 18, paddingHorizontal: 14, backgroundColor: colour.surface, flexDirection: 'row', alignItems: 'center', gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 72 },
  box: { width: 40, height: 40, borderRadius: 13, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  done: { width: 121, height: 50, borderRadius: 25, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
});
