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
  Bubble,
  Button,
  Dock,
  Icon,
  Keypad,
  Receipt,
  Screen,
  ShareSheet,
  Sheet,
  ToolPanel,
  TopBar,
  VoiceSheet,
  Head,
  Label,
  Meta,
  Row,
  colour,
  space,
} from '../design';
import { Route } from '../routes';
import { check, useDraft, useStore } from '../state/live';
import { asked } from './nav';
import { Home } from './home';
import * as act from '../state/actions.js';
import { transfer, contacts, me } from '../state/data.js';
import { start } from '../state/flow.js';

type Nav = { go: (r: Route) => void; back: () => void };

const naira = (n: number) => '₦' + Math.round(n).toLocaleString('en-NG');

/* The frames draw a sheet over the screen it came from, so the sheet screens
   render that screen behind them. It is not reachable through the sheet, so
   its nav goes nowhere. */
export const still: Nav = { go: () => {}, back: () => {} };
const nairaFull = (n: number) =>
  '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* Everything below reads the payment being put together rather than the
   design's seed figures, so what the form says is what the receipt says. */

export const Chat = ({ nav }: { nav: Nav }) => {
  const [d] = useDraft();
  const verdict = check({ amount: d.amount, from: d.from });
  const fee = act.feeFor(d.amount);
  /* Past a cap it can still go; it goes through limitstop. See money.tsx. */
  const past = !verdict.ok && (verdict.code === 'day-limit' || verdict.code === 'transfer-limit');
  const canSend = verdict.ok || past;
  return (
    <Screen
      dock={<Dock placeholder="Reply, or just keep talking" onBack={nav.back} onAsk={q => asked(nav, q)} />}
    >
      <TopBar title="Beetle" onBack={nav.back} />
      <View style={{ alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="mic" size={16} colour={colour.textTertiary} />
        <Bubble who="You">{`Send ${Math.round(d.amount / 1000)}k to ${d.to.name.split(' ')[0]}`}</Bubble>
      </View>
      <View style={{ flexDirection: 'row', gap: space.s2 }}>
        <Icon name="mark" size={32} colour={colour.accent} />
        <View style={{ flex: 1 }}>
          <Bubble>
            {`${d.to.name} at ${d.to.bank}, the same account the flat deposit went to. I am putting it together now.`}
          </Bubble>
        </View>
      </View>
      <ToolPanel
        tool="Beetle Transfers"
        state="Running"
        rows={[
          { k: 'Recipient', v: d.to.name },
          { k: 'Bank', v: `${d.to.bank} · ${d.to.account}` },
          { k: 'Amount', v: naira(d.amount), go: () => nav.go('pay') },
          { k: 'Fee', v: fee ? nairaFull(fee) : 'Free' },
          { k: 'Arrives', v: `Checking with ${d.to.bank}`, done: 'work' as const },
        ]}
      />
      {canSend ? (
        <Button label={`Confirm ${naira(d.amount)}`} onPress={() => nav.go(past ? 'limitstop' : 'confirm')} />
      ) : (
        <Button label="Change it" tone="grey" onPress={() => nav.go('pay')} />
      )}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        <Icon name="lock" size={16} colour={colour.textTertiary} />
        <Meta tone="secondary" style={{ flex: 1 }}>
          Face ID first. Nothing leaves your account until then.
        </Meta>
      </View>
    </Screen>
  );
};

/* The passcode over the transfer. Six digits and it goes; the store is what
   actually moves the money, so the receipt reads the real balance after. */
export const Confirm = ({ nav, faceMissed = false }: { nav: Nav; faceMissed?: boolean }) => {
  const [d] = useDraft();
  const [digits, setDigits] = useState('');
  /* Pure updater, and the send is watched rather than fired from inside it, so
     the money cannot move twice. */
  const key = (k: string) => setDigits(d => (k === 'del' ? d.slice(0, -1) : (d + k).slice(0, 6)));
  React.useEffect(() => {
    if (digits.length < 6) return;
    const t = setTimeout(() => {
      act.send({ to: d.to, amount: d.amount, from: d.from, narration: d.narration });
      nav.go('donesend');
    }, 150);
    return () => clearTimeout(t);
    /* only the sixth digit sends it; watching the transfer as well would send
       it again the moment anything about it changed */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);
  return (
    <Sheet onClose={nav.back} behind={<Chat nav={still} />}>
      <View style={{ alignItems: 'center', gap: space.s3 }}>
        <Head style={{ fontSize: 32, lineHeight: 40, fontWeight: '700' }}>{naira(d.amount)}</Head>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colour.surface3,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Label>{d.to.initials}</Label>
          </View>
          <View>
            <Row>{d.to.name}</Row>
            <Meta tone="secondary">
              {d.to.bank} · {d.to.account}
            </Meta>
          </View>
        </View>
      </View>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Head>Enter your passcode</Head>
        <Meta tone={faceMissed ? 'bad' : 'secondary'}>
          {faceMissed
            ? 'Face ID did not catch you. Tap the face to try again.'
            : 'Or tap the face to use Face ID.'}
        </Meta>
      </View>
      <Keypad onKey={key} onFace={() => nav.go('noface')} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
        <Icon name="lock" size={16} colour={colour.textTertiary} />
        <Meta tone="secondary">
          {faceMissed
            ? 'Three wrong tries locks the passcode for an hour.'
            : 'Nothing moves until the fourth number lands.'}
        </Meta>
      </View>
    </Sheet>
  );
};

/* The receipt of what was actually sent. Opened without having sent anything
   — straight from a link — it shows the transfer the design is written
   around, so the screen is never blank. */
export const DoneSend = ({ nav }: { nav: Nav }) => {
  const s = useStore();
  const [d] = useDraft();
  const r = d.receipt ?? {
    to: d.to,
    amount: transfer.amount,
    fee: transfer.fee,
    from: 'everyday',
    narration: transfer.narration,
    total: transfer.total,
    balanceAfter: s.everyday,
    at: transfer.at,
    session: transfer.session,
  };
  const to = r.to ?? d.to;
  const fee = r.fee ?? 0;
  return (
    <Screen
      dock={<Dock placeholder="Ask about this transfer" onBack={nav.back} onAsk={q => asked(nav, q)} />}
    >
      <View style={{ gap: 8 }}>
        <Head>All done</Head>
        <Meta tone="tertiary" style={{ fontSize: 16, lineHeight: 24 }}>
          {r.at}
        </Meta>
      </View>
      <Receipt
        amount={naira(r.amount)}
        line={`Sent to ${to.name}`}
        fields={[
          ['To', to.name, `${to.bank} · ${to.account}`],
          ['From', r.from === 'dollars' ? 'Dollars' : 'Everyday', me.account],
          ['Narration', r.narration || 'None'],
          ['Amount', nairaFull(r.amount)],
          ['Fee', fee ? nairaFull(fee) : 'Free', 'Transfers under ₦10,000 carry none'],
          ['Total charged', nairaFull(r.total ?? r.amount + fee)],
          ['Balance after', nairaFull(r.balanceAfter ?? s.everyday)],
        ]}
        session={r.session}
      />
      <Button label="Share receipt" leading="share" onPress={() => nav.go('share')} />
      <Pressable accessibilityRole="button" onPress={() => nav.go('rule')}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.s3,
            backgroundColor: colour.surface2,
            borderRadius: 20,
            padding: space.s4,
          }}
        >
          <Icon name="mark" size={32} colour={colour.accent} />
          <Meta style={{ flex: 1 }}>She has it. Rent again next month?</Meta>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: colour.surface,
              borderRadius: 19,
              paddingHorizontal: 16,
              paddingVertical: 9,
            }}
          >
            <Label>Set it up</Label>
            <Icon name="chevron" size={12} />
          </View>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => nav.go('wrong')}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        <Label>Something wrong with this?</Label>
        <Icon name="chevron" size={12} />
      </Pressable>
    </Screen>
  );
};

/* Sharing the receipt. The frame draws the sheet over the receipt it is
   sharing, and names the amount, who it went to and the time. */
export const Share = ({ nav }: { nav: Nav }) => {
  const [d] = useDraft();
  const r = d.receipt;
  const at = (r?.at ?? transfer.at).split(' at ')[1] ?? '7:55 AM';
  return (
    <ShareSheet
      line={`${naira(r?.amount ?? transfer.amount)} to ${(r?.to ?? d.to).name}, ${at}`}
      onClose={nav.back}
      behind={<DoneSend nav={still} />}
    />
  );
};

/* The voice sheet the flow starts from. Its three suggestions are the ones the
   frame offers, and "Not what I said" is what opens the typed version. */
export const Ask = ({ nav }: { nav: Nav }) => (
  <VoiceSheet
    said="Send 20k to "
    tail="Sarah"
    seed={11}
    offers={['Pay my light bill', 'How much did I spend on data?', 'What can I borrow?']}
    onOffer={(t: string) => asked(nav, t)}
    onNotThis={() => nav.go('misheard')}
    onStop={() => nav.go('home')}
    onSend={() => {
      start({ to: contacts.sarah, amount: 20000, narration: transfer.narration, spoken: transfer.spoken });
      nav.go('chat');
    }}
    onClose={nav.back}
    behind={<Home nav={still} />}
  />
);
