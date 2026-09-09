/* The send flow, built from the frames in "Sending money".

   Chat is the agent putting the transfer together: your line as a black
   bubble, its reply in the wash, then the tool panel with the five things it
   filled in, rows 44 apart, the amount row with somewhere to go and Arrives
   still working. Confirm is the same screen with the passcode over it. The
   money only moves when the passcode lands, and it moves through the shared
   state layer, so the balance on every other screen changes with it. */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  Bubble, Button, Dock, Icon, Keypad, Receipt, Screen, Sheet, StatusPill, ToolPanel, TopBar,
  Caption, Head, Label, Meta, Row, colour, space,
} from '../design';
import { Route } from '../routes';
import { get } from '../state/store.js';
import * as act from '../state/actions.js';
import { transfer, contacts } from '../state/data.js';

type Nav = { go: (r: Route) => void; back: () => void };

const naira = (n: number) => '₦' + Math.round(n).toLocaleString('en-NG');

/* What the agent has filled in. The amount row is the one you can change,
   which is why it is the only one with somewhere to go. */
const steps = (onAmount: () => void) => [
  { k: 'Recipient', v: contacts.sarah.name },
  { k: 'Bank', v: `${contacts.sarah.bank} · ${contacts.sarah.account}` },
  { k: 'Amount', v: naira(transfer.amount), go: onAmount },
  { k: 'Fee', v: 'Free' },
  { k: 'Arrives', v: 'Checking with GTBank', done: 'work' as const },
];

function Thread({ nav }: { nav: Nav }) {
  return (
    <>
      <View style={{ alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="mic" size={16} colour={colour.textTertiary} />
        <Bubble who="You">Send 20k to Sarah</Bubble>
      </View>
      <View style={{ flexDirection: 'row', gap: space.s2 }}>
        <Icon name="mark" size={32} colour={colour.accent} />
        <View style={{ flex: 1 }}>
          <Bubble>
            Sarah Adeyemi at GTBank, the same account the flat deposit went to. I am putting it together now.
          </Bubble>
        </View>
      </View>
      <ToolPanel tool="Beetle Transfers" state="Running" rows={steps(() => nav.go('pay'))} />
    </>
  );
}

export const Chat = ({ nav }: { nav: Nav }) => (
  <Screen dock={<Dock placeholder="Reply, or just keep talking" onBack={nav.back} />}>
    <TopBar title="Beetle" onBack={nav.back} />
    <Thread nav={nav} />
    <Button label={`Confirm ${naira(transfer.amount)}`} onPress={() => nav.go('confirm')} />
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
      <Icon name="lock" size={16} colour={colour.textTertiary} />
      <Meta tone="secondary" style={{ flex: 1 }}>
        Face ID first. Nothing leaves your account until then.
      </Meta>
    </View>
  </Screen>
);

/* The passcode over the transfer. Six digits and it goes; the store is what
   actually moves the money, so the receipt reads the real balance after. */
export const Confirm = ({ nav, faceMissed = false }: { nav: Nav; faceMissed?: boolean }) => {
  const [digits, setDigits] = useState('');
  /* Pure updater, and the send is watched rather than fired from inside it, so
     the money cannot move twice. */
  const key = (k: string) => setDigits(d => (k === 'del' ? d.slice(0, -1) : (d + k).slice(0, 6)));
  React.useEffect(() => {
    if (digits.length < 6) return;
    const t = setTimeout(() => {
      act.send({ to: contacts.sarah, amount: transfer.amount, from: 'everyday', narration: transfer.narration });
      nav.go('donesend');
    }, 150);
    return () => clearTimeout(t);
  }, [digits]);
  return (
    <Sheet onClose={nav.back}>
      <View style={{ alignItems: 'center', gap: space.s3 }}>
        <Head style={{ fontSize: 32, lineHeight: 40, fontWeight: '700' }}>{naira(transfer.amount)}</Head>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colour.surface3, alignItems: 'center', justifyContent: 'center' }}>
            <Label>SA</Label>
          </View>
          <View>
            <Row>{contacts.sarah.name}</Row>
            <Meta tone="secondary">{contacts.sarah.bank} · {contacts.sarah.account}</Meta>
          </View>
        </View>
      </View>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Head>Enter your passcode</Head>
        <Meta tone={faceMissed ? 'bad' : 'secondary'}>
          {faceMissed ? 'Face ID did not catch you. Type the six digits.' : 'Or tap the face to use Face ID.'}
        </Meta>
      </View>
      <Keypad onKey={key} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
        <Icon name="lock" size={16} colour={colour.textTertiary} />
        <Meta tone="secondary">Nothing moves until the fourth number lands.</Meta>
      </View>
    </Sheet>
  );
};

const receiptFields = () => {
  const s = get();
  return [
    ['To', contacts.sarah.name, `${contacts.sarah.bank} · ${contacts.sarah.account}`],
    ['From', 'Everyday', '0102 4457 88'],
    ['Narration', transfer.narration],
    ['Amount', '₦' + transfer.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })],
    ['Fee', '₦26.88', 'Transfers under ₦10,000 carry none'],
    ['Total charged', '₦' + (transfer.amount + 26.88).toLocaleString('en-NG', { minimumFractionDigits: 2 })],
    ['Balance after', '₦' + s.everyday.toLocaleString('en-NG', { minimumFractionDigits: 2 })],
  ] as [string, string, string?][];
};

export const DoneSend = ({ nav }: { nav: Nav }) => (
  <Screen dock={<Dock placeholder="Ask about this transfer" onBack={nav.back} />}>
    <View style={{ gap: 8 }}>
      <Head>All done</Head>
      <Meta tone="tertiary" style={{ fontSize: 16, lineHeight: 24 }}>28 August 2026 at 7:55 AM</Meta>
    </View>
    <Receipt
      amount={naira(transfer.amount)}
      line={`Sent to ${contacts.sarah.name}`}
      fields={receiptFields()}
      session="000016 260828 075504 471803 926104"
    />
    <Button label="Share receipt" leading="share" onPress={() => nav.go('share')} />
    <Pressable accessibilityRole="button" onPress={() => nav.go('rule')}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3, backgroundColor: colour.surface2, borderRadius: 20, padding: space.s4 }}>
        <Icon name="mark" size={32} colour={colour.accent} />
        <Meta style={{ flex: 1 }}>She has it. Rent again next month?</Meta>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colour.surface, borderRadius: 19, paddingHorizontal: 16, paddingVertical: 9 }}>
          <Label>Set it up</Label>
          <Icon name="chevron" size={12} />
        </View>
      </View>
    </Pressable>
    <Pressable accessibilityRole="button" onPress={() => nav.go('wrong')}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <Label>Something wrong with this?</Label>
      <Icon name="chevron" size={12} />
    </Pressable>
  </Screen>
);

/* Four ways out, and a line about what is left off every copy. */
export const Share = ({ nav }: { nav: Nav }) => {
  const way = (icon: Parameters<typeof Icon>[0]['name'], title: string, sub: string) => (
    <Pressable key={title} accessibilityRole="button" onPress={nav.back}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.s5 }}>
      <Icon name={icon} size={20} />
      <View style={{ flex: 1, gap: 2 }}>
        <Row>{title}</Row>
        <Meta tone="secondary">{sub}</Meta>
      </View>
      <Icon name="chevron" size={16} colour={colour.textTertiary} />
    </Pressable>
  );
  return (
    <Sheet onClose={nav.back}>
      <View style={{ alignItems: 'center' }}>
        <Icon name="share" size={28} />
      </View>
      <View style={{ gap: 8 }}>
        <Head>Share this receipt</Head>
        <Meta tone="tertiary" style={{ fontSize: 16, lineHeight: 24 }}>
          {naira(transfer.amount)} to {contacts.sarah.name}, 7:55 AM
        </Meta>
      </View>
      <View style={{ gap: 28 }}>
        {way('chat', 'WhatsApp', 'The picture, ready to send')}
        {way('camera', 'Save to photos', 'It stays on this phone')}
        {way('receipt', 'Save as PDF', 'The full record, for an office')}
        {way('grid', 'Somewhere else', 'Messages, mail, anywhere you share')}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        <Icon name="eye" size={16} colour={colour.textTertiary} />
        <Meta tone="secondary" style={{ flex: 1 }}>
          Your balance and the full account numbers are left off every copy that leaves the phone.
        </Meta>
      </View>
      <Button label="Done" tone="grey" onPress={nav.back} />
    </Sheet>
  );
};

/* The voice sheet the flow starts from. Its three suggestions are the ones the
   frame offers, and "Not what I said" is what opens the typed version. */
export const Ask = ({ nav }: { nav: Nav }) => (
  <Sheet onClose={nav.back}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Icon name="mark" size={20} colour={colour.accent} />
      <Label tone="accent">Listening</Label>
    </View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      <Head style={{ fontSize: 32, lineHeight: 40 }}>Send 20k to </Head>
      <Head style={{ fontSize: 32, lineHeight: 40, color: colour.textTertiary }}>Sarah</Head>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, height: 28 }}>
      {Array.from({ length: 30 }).map((_, i) => (
        <View key={i} style={{
          width: 3, borderRadius: 2, backgroundColor: colour.accent,
          height: 6 + Math.abs(Math.sin(i * 1.7)) * 20,
        }} />
      ))}
    </View>
    <Meta tone="tertiary">Or try one of these</Meta>
    <View style={{ gap: space.s2 }}>
      {['Pay my light bill', 'How much did I spend on data?', 'What can I borrow?'].map(t => (
        <Button key={t} label={t} tone="grey" size={48} onPress={() => nav.go('chat')} />
      ))}
    </View>
    <Pressable accessibilityRole="button" onPress={() => nav.go('typed')} style={{ alignSelf: 'center' }}>
      <Label tone="accent">Not what I said</Label>
    </Pressable>
    <Button label="Release to send" tone="blue" onPress={() => nav.go('chat')} />
  </Sheet>
);
