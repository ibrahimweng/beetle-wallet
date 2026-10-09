/* A receipt as a sheet from the bottom (Round 19, the owner's word). Right
   after any payment (money sent, a bill, data or airtime, a loan taken,
   money put into a goal, a card loaded, dollars bought) and from a receipt
   in the chat, the whole of it comes up over where it was paid from, never
   the view of a line opened on Activities, which is that page's own.

   It is the frames' All done in a sheet: the title and when, the tick with
   the amount and who, the status, then the slip with every field and the
   session id to copy, a bill's token over it in its grey card. Share
   receipt is the small button at its top, beside the ··· (Ask Beetle about
   this, Report a problem). Done, in black, puts it away and goes back to
   where the paying started; See in Activities, plain under it, goes to the
   record. A swipe down or a tap on what is behind it is Done too. When the
   whole of it is taller than the sheet may be, the receipt scrolls between
   its top and its two buttons. */
import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Caption, Head, Icon, Label, Meta, MoreButton, Receipt, Row, Sheet, Tap, colour, toast, type ReceiptMark } from '../../design';
import { copyText } from '../receive/clipboard';
import { naira } from '../../lib/format';
import { openTab } from '../tabs';
import { ReceiptShare, useReceipt, useReceiptMenu } from './use';
import type { Receipt as ReceiptModel } from './receipts';

/** A line that has not settled says so on its receipt: its own glyph and colour, as Activities draws its status. */
const MARKS: Record<string, ReceiptMark> = {
  'On its way': { glyph: 'clock', tone: colour.accent },
  'Did not go': { glyph: 'close', tone: colour.alert },
  'Came back': { glyph: 'undo-filled', tone: colour.ink },
};

type Props = {
  id: string;
  /** Done, a swipe down or a tap behind it, once the sheet has gone down */
  onDone: () => void;
  /** See in Activities, once it has gone down: by default the record on home */
  onRecord?: () => void;
  /** open with the share sheet over it (the lab's way to the share frames) */
  share?: boolean;
  testID?: string;
};

export function ReceiptSheet(props: Props) {
  const { receipt } = useReceipt(props.id);
  /* a receipt this phone does not have, once a line still being written has
     had its moment: said, and put away, rather than an empty page holding
     the screen (the analysis after Round 21: a stale link froze it) */
  const done = useRef(props.onDone);
  done.current = props.onDone;
  useEffect(() => {
    if (receipt) return;
    const t = setTimeout(() => {
      toast('That receipt is not on this phone.');
      done.current();
    }, 2000);
    return () => clearTimeout(t);
  }, [receipt]);
  return receipt ? <Drawn receipt={receipt} {...props} /> : null;
}

function Drawn({ receipt, id, onDone, onRecord, share = false, testID = 'receipt-sheet' }: Props & { receipt: ReceiptModel }) {
  const router = useRouter();
  const slip = useRef<View>(null);
  const [sharing, setSharing] = useState(share);
  /* where it goes once it has gone down: back, or to the record */
  const [going, setGoing] = useState<'done' | 'record' | null>(null);
  const menu = useReceiptMenu(receipt, id);
  /* the phone's back: the share sheet first, then Done */
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sharing) setSharing(false);
      else setGoing(g => g ?? 'done');
      return true;
    });
    return () => sub.remove();
  }, [sharing]);
  const gone = () => {
    if (going !== 'record') return onDone();
    if (onRecord) onRecord();
    else openTab(router, 'activities');
  };
  const copy = async (what: string, words: string) => {
    toast((await copyText(what)) ? `${words} copied. Paste it anywhere.` : 'This build cannot reach the clipboard.');
  };
  /* a bill's token: what was paid for, so over the slip in its grey card with a button to copy it, as the Bill paid frame has it */
  const token = receipt.token ? (
    <View style={s.token} testID="receipt-token">
      <Caption tone="secondary">Meter token</Caption>
      <Head style={{ fontVariant: ['tabular-nums'] }}>{receipt.token}</Head>
      <Tap accessibilityRole="button" accessibilityLabel="Copy the token" onPress={() => void copy(receipt.token ?? '', 'The token')} style={s.copyToken}>
        <Icon name="copy" size={16} colour={colour.ink} />
        <Label>Copy the token</Label>
      </Tap>
    </View>
  ) : null;
  return (
    <>
      <Sheet leaving={going !== null} onGone={gone} onDismiss={onDone} testID={testID}>
        <View style={s.top}>
          <View style={{ flex: 1, gap: 4 }}>
            <Head>{receipt.head}</Head>
            <Meta tone="tertiary">{receipt.when}</Meta>
          </View>
          <Tap accessibilityRole="button" accessibilityLabel="Share receipt" onPress={() => setSharing(true)} scale={0.94} style={s.share} testID="receipt-share">
            <Icon name="share" size={16} colour={colour.ink} />
            <Label>Share</Label>
          </Tap>
          <MoreButton items={menu} testID="receipt-more" />
        </View>
        <ScrollView style={s.body} contentContainerStyle={s.bodyIn} showsVerticalScrollIndicator={false} bounces={false}>
          {/* what the share sheet pictures: the receipt on its white */}
          <View ref={slip} collapsable={false} style={s.slip}>
            <Receipt
              amount={receipt.figure ?? naira(receipt.amount)}
              line={receipt.line}
              status={receipt.status}
              fields={receipt.fields}
              session={receipt.session}
              sessionLabel={receipt.sessionLabel}
              good={receipt.kind === 'in' || (receipt.kind === 'coin' && receipt.amount > 0)}
              onCopy={() => void copy(receipt.session, `The ${receipt.sessionLabel.toLowerCase()}`)}
              head={token}
              tail={receipt.tail}
              mark={MARKS[receipt.status]}
            />
          </View>
        </ScrollView>
        <View style={s.actions}>
          <Button label="Done" onPress={() => setGoing('done')} />
          <Tap accessibilityRole="button" accessibilityLabel="See in Activities" onPress={() => setGoing('record')} style={s.record} testID="receipt-record">
            <Row>See in Activities</Row>
            <Icon name="chevron" size={12} colour={colour.ink} />
          </Tap>
        </View>
      </Sheet>
      {sharing ? <ReceiptShare receipt={receipt} slip={slip} onDismiss={() => setSharing(false)} /> : null}
    </>
  );
}

const s = StyleSheet.create({
  /* the title and when at the left, Share and the ··· at the right */
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 20 },
  share: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colour.surface2 },
  /* the receipt: it gives way, scrolling, when the whole is taller than the sheet may be */
  body: { flexGrow: 0, flexShrink: 1 },
  bodyIn: { paddingBottom: 4 },
  slip: { gap: 16, backgroundColor: colour.surface },
  token: { gap: 4, padding: 16, borderRadius: 20, backgroundColor: colour.surface2 },
  copyToken: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, marginTop: 8, borderRadius: 22, backgroundColor: colour.surface },
  actions: { paddingTop: 20, gap: 4 },
  record: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44 },
});
