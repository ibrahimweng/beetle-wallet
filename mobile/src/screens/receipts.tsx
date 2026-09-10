/* Money in, and the four past payments a line in the feed opens.

   Frames 490:12465 and 490:12558 for the salary. The four past receipts have
   no frame of their own — the file draws the feed lines and the receipt
   component, and these are that component with the figures those lines
   carry. Being past payments, their figures are fixed and do not move with
   the live balance. */
import React from 'react';
import { View } from 'react-native';
import {
  AgentAsk,
  Bubble,
  Button,
  Ghost,
  Head,
  Meta,
  Receipt,
  ReceiptField,
  Screen,
  ShareSheet,
  naira,
  nairaFull,
} from '../design';
import { Nav, dock } from './nav';
import { still } from './send';
import { Route } from '../routes';
import { me } from '../state/data.js';

/* ---- the salary ---- */

export const DoneIn = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask about this payment', nav, 'history')}>
    <View style={{ gap: 8 }}>
      <Head>Money in</Head>
      <Meta tone="tertiary" style={{ fontSize: 16, lineHeight: 24 }}>
        27 August 2026 at 4:40 PM
      </Meta>
    </View>
    <Receipt
      amount={naira(640000)}
      line="From Pagrin Limited"
      icon="check"
      status="Cleared"
      good
      fields={[
        ['From', 'Pagrin Limited', 'Zenith Bank · 1014 2288 31'],
        ['To', 'Everyday', me.account],
        ['They wrote', 'August salary'],
        ['Amount', nairaFull(640000)],
        ['Fee', 'None on money in'],
        ['Total credited', nairaFull(640000)],
        ['Balance after', nairaFull(679654.51)],
      ]}
      session="000015 260827 164004 118220 774301"
    />
    <Button label="Share receipt" leading="share" onPress={() => nav.go('sharein')} />
    <AgentAsk
      question="Put ₦50,000 away before it goes?"
      answer="Set it up"
      onAnswer={() => nav.go('saverule')}
    />
    <Ghost label="Expecting more than this?" onPress={() => nav.go('agentchat')} />
  </Screen>
);

export const ShareIn = ({ nav }: { nav: Nav }) => (
  <ShareSheet
    line={`${naira(640000)} from Pagrin Limited, 4:40 PM`}
    onClose={() => nav.go('donein')}
    behind={<DoneIn nav={still} />}
  />
);

/* ---- the four past payments ---- */

type Past = {
  head: string;
  at: string;
  amount: number;
  line: string;
  fields: ReceiptField[];
  session: string;
  sessionLabel?: string;
  nudge: string;
  nudgeAction: string;
  nudgeTo: Route;
  wrong: string;
  wrongTo: Route;
  share: Route;
  ask: string;
};

const past = (p: Past) => {
  const Past = ({ nav }: { nav: Nav }) => (
    <Screen dock={dock(p.ask, nav, 'history')}>
      <View style={{ gap: 8 }}>
        <Head>{p.head}</Head>
        <Meta tone="tertiary" style={{ fontSize: 16, lineHeight: 24 }}>
          {p.at}
        </Meta>
      </View>
      <Receipt
        amount={naira(p.amount)}
        line={p.line}
        fields={p.fields}
        session={p.session}
        sessionLabel={p.sessionLabel}
      />
      <Button label="Share receipt" leading="share" onPress={() => nav.go(p.share)} />
      <Bubble>{p.nudge}</Bubble>
      <Button label={p.nudgeAction} tone="grey" onPress={() => nav.go(p.nudgeTo)} />
      <Ghost label={p.wrong} onPress={() => nav.go(p.wrongTo)} />
    </Screen>
  );
  Past.displayName = 'Past(' + p.share + ')';
  return Past;
};

export const DoneFlat = past({
  head: 'All done',
  at: '28 August 2026 at 9:14 AM',
  amount: 50000,
  line: 'Sent to Sarah Adeyemi',
  fields: [
    ['To', 'Sarah Adeyemi', 'GTBank · 0234 5678 90'],
    ['From', 'Everyday', me.account],
    ['Narration', 'Flat deposit'],
    ['Amount', nairaFull(50000)],
    ['Fee', nairaFull(26.88), 'Transfers under ₦10,000 carry none'],
    ['Total charged', nairaFull(50026.88)],
    ['Balance after', nairaFull(606820.75)],
  ],
  session: '000016 260828 091402 338291 774022',
  nudge: 'She has it. The same on the first of every month?',
  nudgeAction: 'Set it up',
  nudgeTo: 'rule',
  wrong: 'Something wrong with this?',
  wrongTo: 'wrong',
  share: 'shareflat',
  ask: 'Ask about this transfer',
});

export const DoneShop = past({
  head: 'All done',
  at: '28 August 2026 at 10:45 AM',
  amount: 8000,
  line: 'Sent to John Doe',
  fields: [
    ['To', 'John Doe', 'Access Bank · 0044 8821'],
    ['From', 'Everyday', me.account],
    ['Narration', 'Grocery shopping'],
    ['Amount', nairaFull(8000)],
    ['Fee', 'Free', 'Because it is under ₦10,000'],
    ['Total charged', nairaFull(8000)],
    ['Balance after', nairaFull(598820.75)],
  ],
  session: '000016 260828 104511 902744 118635',
  nudge: 'Grocery money every Friday?',
  nudgeAction: 'Set it up',
  nudgeTo: 'rule',
  wrong: 'Something wrong with this?',
  wrongTo: 'wrong',
  share: 'shareshop',
  ask: 'Ask about this transfer',
});

export const DoneSub = past({
  head: 'All done',
  at: '28 August 2026 at 12:00 PM',
  amount: 3500,
  line: 'Netflix',
  fields: [
    ['To', 'Netflix', 'netflix.com'],
    ['From', 'Virtual card', '•••• 4471'],
    ['What', 'Monthly subscription', 'Renews 28 September'],
    ['Amount', nairaFull(3500)],
    ['Fee', 'Free'],
    ['Total charged', nairaFull(3500)],
    ['Balance after', nairaFull(595320.75)],
  ],
  session: 'NFX 4471 8823 1104',
  sessionLabel: 'Card reference',
  nudge: 'Netflix takes this every month. Stop it?',
  nudgeAction: 'Open the card',
  nudgeTo: 'card',
  wrong: 'You did not make this payment?',
  wrongTo: 'wrong',
  share: 'sharesub',
  ask: 'Ask about this payment',
});

export const DoneCard = past({
  head: 'All done',
  at: '27 August 2026 at 9:00 AM',
  amount: 5200,
  line: 'Netflix',
  fields: [
    ['To', 'Netflix', 'netflix.com'],
    ['From', 'Virtual card', '•••• 4471'],
    ['What', 'Monthly subscription', 'Renews 27 September'],
    ['Amount', nairaFull(5200)],
    ['Fee', 'Free'],
    ['Total charged', nairaFull(5200)],
    ['Balance after', nairaFull(47654.51)],
  ],
  session: 'NFX 4471 8823 0195',
  sessionLabel: 'Card reference',
  nudge: 'Freeze this card, or see what else it pays?',
  nudgeAction: 'Open the card',
  nudgeTo: 'card',
  wrong: 'You did not make this payment?',
  wrongTo: 'wrong',
  share: 'sharecard',
  ask: 'Ask about this payment',
});

/* Their share sheets, which differ only in the line at the top. */
const pastShare = (line: string, back: Route, Behind: React.ComponentType<{ nav: Nav }>) => {
  const PastShare = ({ nav }: { nav: Nav }) => (
    <ShareSheet line={line} onClose={() => nav.go(back)} behind={<Behind nav={still} />} />
  );
  PastShare.displayName = 'PastShare(' + back + ')';
  return PastShare;
};

export const ShareFlat = pastShare('₦50,000 to Sarah Adeyemi, 9:14 AM', 'doneflat', DoneFlat);
export const ShareShop = pastShare('₦8,000 to John Doe, 10:45 AM', 'doneshop', DoneShop);
export const ShareSub = pastShare('₦3,500 to Netflix, 12:00 PM', 'donesub', DoneSub);
export const ShareCard = pastShare('₦5,200 to Netflix, 9:00 AM', 'donecard', DoneCard);
