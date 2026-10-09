/* A receipt for every line the day shows: what moved, to whom, from where,
   the fee, the total, the balance after, when, and the session id, in the
   shape the frames draw a receipt. The lines the frames draw carry the
   frames' own figures; a line this phone added carries what its panel or
   its arrival knew. */
import type { Account } from '../../services';
import { groupAccount, longDate, naira } from '../../lib/format';
import { localIsoDay, sessionWhen } from '../../lib/days';
import type { LedgerRow } from '../home/account';
import { fromEveryday } from '../home/everyday';
import { usdFull } from '../dollars/dollars';
import { networkOf, shortAddress } from '../dollars/chains';

/** Where a transfer went, as its receipt says it: the bank and the number
    the line carries; otherwise what the line's own words begin with, for a
    settled one (a line still on its way, that did not go or came back
    begins with that instead, so it says nothing here and the view that
    shows it fills the bank in from the people the day knows). */
function toNote(row: LedgerRow): string | undefined {
  if (row.person) return `${row.person.bank} · ${groupAccount(row.person.number)}`;
  return row.status === 'done' ? (row.detail.split(' · ')[0] ?? row.detail) : undefined;
}

export type Field = [label: string, value: string, note?: string];

export type Receipt = {
  id: string;
  kind: LedgerRow['kind'];
  /** the page's title: All done, Bill paid, Money in */
  head: string;
  /** under the title: the day and the time */
  when: string;
  amount: number;
  /** the amount as the slip prints it, where it is not naira: a stablecoin line's dollars */
  figure?: string;
  /** under the amount: who it went to, or came from */
  line: string;
  status: string;
  fields: Field[];
  session: string;
  sessionLabel: string;
  /** a bill's token, above the slip with a button to copy it */
  token?: string;
  /** what Beetle offers under the slip, and the word on its chip */
  nudge: { text: string; action: string };
  /** the way to say something is wrong */
  wrong: string;
  /** the ask bar's placeholder on the page */
  ask: string;
  /** room the frame leaves under the reference, or takes away */
  tail?: number;
};

/** ₦20,026.88 — the kobo shown, as the slip prints money. */
export const nairaFull = (n: number) => '₦' + Math.abs(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 7:55 AM, from the day's HH:MM. */
export const clock12 = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  const hour = h ?? 0;
  return `${hour % 12 || 12}:${String(m ?? 0).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
};

/** When a line happened, as the page says it: the day and the time, by this phone's own calendar (the UTC day is
    yesterday's for the hour after midnight in Lagos); from the moment it moved, where it is known. */
export function whenOf(row: LedgerRow, now = new Date()): string {
  const at = row.at ?? sessionWhen(row.session);
  if (at !== undefined) return `${longDate(localIsoDay(new Date(at)))} at ${clock12(row.time)}`;
  const d = new Date(now);
  if (row.day === 'yesterday') d.setDate(d.getDate() - 1);
  return `${longDate(localIsoDay(d))} at ${clock12(row.time)}`;
}

/** The balance once a line had moved: kept on the line where this phone
    added it, worked back from today's balance for the day the frames draw. */
export function balanceAfter(row: LedgerRow, rows: LedgerRow[], balanceNow: number): number {
  if (row.after !== undefined) return row.after;
  const order = (r: LedgerRow) => (r.day === 'yesterday' ? 0 : 1) * 10_000 + Number(r.time.replace(':', ''));
  const newer = rows.filter(r => r.status === 'done' && r.id !== row.id && (order(r) > order(row) || r.after !== undefined));
  return Math.round((balanceNow - newer.reduce((a, r) => a + fromEveryday(r), 0)) * 100) / 100;
}

/** A session id for a line the frames draw, the same every time it is asked for. */
export function fixedSession(id: string, time: string): string {
  let h = 7;
  for (const ch of id + time) h = (h * 31 + ch.charCodeAt(0)) % 1_000_000_007;
  const group = (n: number) => String((h * n) % 1_000_000).padStart(6, '0');
  return `000016 260828 ${time.replace(':', '')}04 ${group(3)} ${group(7)}`;
}

type Fixed = Partial<Omit<Receipt, 'id' | 'kind' | 'amount' | 'when'>> & { fields: Field[]; session: string };

/* The lines the frames draw, with the figures the frames print on their
   receipts: the account's own number stands in for the frames'. */
const FIXED = (account: string): Record<string, Fixed> => ({
  l08: {
    head: 'All done',
    line: 'Sent to Sarah Adeyemi',
    fields: [
      ['To', 'Sarah Adeyemi', 'GTBank · 0234 5678 90'],
      ['From', 'Everyday', account],
      ['Narration', 'Rent part payment'],
      ['Amount', nairaFull(20_000)],
      ['Fee', nairaFull(26.88), 'Transfers under ₦10,000 carry none'],
      ['Total charged', nairaFull(20_026.88)],
      ['Balance after', nairaFull(659_320.75)],
    ],
    session: '000016 260828 142204 471803 926104',
    nudge: { text: 'She has it. Rent again next month?', action: 'Set it up' },
    wrong: 'Something wrong with this?',
    ask: 'Ask about this transfer',
  },
  l06: {
    head: 'All done',
    line: 'Sent to Sarah Adeyemi',
    fields: [
      ['To', 'Sarah Adeyemi', 'GTBank · 0234 5678 90'],
      ['From', 'Everyday', account],
      ['Narration', 'Flat deposit'],
      ['Amount', nairaFull(50_000)],
      ['Fee', nairaFull(26.88), 'Transfers under ₦10,000 carry none'],
      ['Total charged', nairaFull(50_026.88)],
      ['Balance after', nairaFull(606_820.75)],
    ],
    session: '000016 260828 091402 338291 774022',
    nudge: { text: 'She has it. The same on the first of every month?', action: 'Set it up' },
    wrong: 'Something wrong with this?',
    ask: 'Ask about this transfer',
  },
  l05: {
    head: 'All done',
    line: 'Sent to John Doe',
    fields: [
      ['To', 'John Doe', 'Access Bank · 0044 8821'],
      ['From', 'Everyday', account],
      ['Narration', 'Grocery shopping'],
      ['Amount', nairaFull(8_000)],
      ['Fee', 'Free', 'Because it is under ₦10,000'],
      ['Total charged', nairaFull(8_000)],
      ['Balance after', nairaFull(598_820.75)],
    ],
    session: '000016 260828 104511 902744 118635',
    nudge: { text: 'Grocery money every Friday?', action: 'Set it up' },
    wrong: 'Something wrong with this?',
    ask: 'Ask about this transfer',
  },
  l04: {
    head: 'All done',
    line: 'Netflix',
    fields: [
      ['To', 'Netflix', 'netflix.com'],
      ['From', 'Virtual card', '•••• 4471'],
      ['What', 'Monthly subscription', 'Renews 28 September'],
      ['Amount', nairaFull(3_500)],
      ['Fee', 'Free'],
      ['Total charged', nairaFull(3_500)],
      ['Balance after', nairaFull(595_320.75)],
    ],
    session: 'NFX 4471 8823 1104',
    sessionLabel: 'Card reference',
    nudge: { text: 'Netflix takes this every month. Stop it?', action: 'Open the card' },
    wrong: 'You did not make this payment?',
    ask: 'Ask about this payment',
  },
  l07: {
    head: 'All done',
    line: '5GB sent to Mum',
    fields: [
      ['To', 'Mum', '0803 214 4471 · MTN'],
      ['From', 'Everyday', account],
      ['What', '5GB for 30 days', 'Valid until 27 September'],
      ['Amount', nairaFull(2_500)],
      ['Fee', 'Free'],
      ['Total charged', nairaFull(2_500)],
      ['Balance after', nairaFull(656_847.63)],
    ],
    session: 'MTN 88231 4471 0392',
    sessionLabel: 'MTN reference',
    tail: 24,
    nudge: { text: 'Mum has it. Every month, without asking?', action: 'Set it up' },
    wrong: 'Something wrong with this?',
    ask: 'Ask about this',
  },
  l11: {
    head: 'Bill paid',
    line: 'Ikeja Electric',
    token: '4471 8823 0195 6640 3277',
    fields: [
      ['To', 'Ikeja Electric', 'Meter 4457 8891'],
      ['From', 'Everyday', account],
      ['Amount', nairaFull(8_000)],
      ['Fee', 'Free'],
      ['Total charged', nairaFull(8_000)],
      ['Balance after', nairaFull(39_654.51)],
    ],
    session: 'IKJ 4457 8891 2208',
    sessionLabel: 'Ikeja reference',
    nudge: { text: 'Pay this every month, without asking?', action: 'Set it up' },
    wrong: 'The token did not work?',
    ask: 'Ask about this payment',
  },
  l10: {
    head: 'Money in',
    line: 'From Pagrin Limited',
    status: 'Cleared',
    fields: [
      ['From', 'Pagrin Limited', 'Zenith Bank · 1014 2288 31'],
      ['To', 'Everyday', account],
      ['They wrote', 'August salary'],
      ['Amount', nairaFull(640_000)],
      ['Fee', 'None on money in'],
      ['Total credited', nairaFull(640_000)],
      ['Balance after', nairaFull(679_654.51)],
    ],
    session: '000015 260827 164004 118220 774301',
    tail: -20,
    nudge: { text: 'Put ₦50,000 away before it goes?', action: 'Set it up' },
    wrong: 'Expecting more than this?',
    ask: 'Ask about this payment',
  },
  l12: {
    head: 'All done',
    line: 'Netflix',
    fields: [
      ['To', 'Netflix', 'netflix.com'],
      ['From', 'Virtual card', '•••• 4471'],
      ['What', 'Monthly subscription', 'Renews 27 September'],
      ['Amount', nairaFull(5_200)],
      ['Fee', 'Free'],
      ['Total charged', nairaFull(5_200)],
      ['Balance after', nairaFull(47_654.51)],
    ],
    session: 'NFX 4471 8823 0195',
    sessionLabel: 'Card reference',
    nudge: { text: 'Freeze this card, or see what else it pays?', action: 'Open the card' },
    wrong: 'You did not make this payment?',
    ask: 'Ask about this payment',
  },
});

/** The receipt for a line in the day. */
export function receiptFor(row: LedgerRow, ctx: { account: Account; balanceNow: number; rows: LedgerRow[] }): Receipt {
  const number = groupAccount(ctx.account.accountNumber);
  const fixed = ctx.account.demo ? FIXED(number)[row.id] : undefined;
  const base = { id: row.id, kind: row.kind, amount: row.amount, when: whenOf(row) };
  if (fixed) {
    return {
      ...base,
      head: fixed.head ?? 'All done',
      line: fixed.line ?? row.name,
      status: fixed.status ?? 'Successful',
      fields: fixed.fields,
      session: fixed.session,
      sessionLabel: fixed.sessionLabel ?? 'Session ID',
      token: fixed.token,
      tail: fixed.tail,
      nudge: fixed.nudge ?? { text: 'The same again next month?', action: 'Set it up' },
      wrong: fixed.wrong ?? 'Something wrong with this?',
      ask: fixed.ask ?? 'Ask about this',
    };
  }
  const after = nairaFull(balanceAfter(row, ctx.rows, ctx.balanceNow));
  const amount = Math.abs(row.amount);
  const fee = row.fee ?? 0;
  const session = row.session ?? fixedSession(row.id, row.time);
  /* paid from the dollars: the row carries what left them, and the rate is in its line */
  const paidInUsd = row.usd !== undefined && row.kind !== 'convert' ? -row.usd : 0;
  const rate = row.detail.match(/at (₦[\d,]+ to \$1)/)?.[1] ?? '₦1,552 to $1';
  const from: Field = paidInUsd ? ['From', 'Dollars', `${usdFull(paidInUsd)} at ${rate}`] : ['From', 'Everyday', number];
  const first = row.name.split(' ')[0] ?? row.name;
  if (row.kind === 'convert') {
    const intoDollars = (row.usd ?? 0) > 0;
    const usd = usdFull(row.usd ?? 0);
    return {
      ...base,
      head: 'Converted',
      line: intoDollars ? `${usd} into Dollars` : `${usd} back to naira`,
      status: 'Successful',
      fields: [
        intoDollars ? ['To', 'Dollars', usd] : ['From', 'Dollars', usd],
        intoDollars ? ['From', 'Everyday', number] : ['To', 'Everyday', number],
        ['Rate', rate],
        /* the fee comes out of the dollars going across, never on top of the naira (the analysis after Round 21):
           into dollars, the naira charged is the amount; back to naira, what is credited is the amount less the fee */
        ['Amount', nairaFull(intoDollars ? amount : amount + fee)],
        fee > 0 ? ['Fee', nairaFull(fee), 'One percent over $500, out of the dollars'] : ['Fee', 'Free', 'Because it is under $500'],
        [intoDollars ? 'Total charged' : 'Total credited', nairaFull(amount)],
        ['Balance after', after],
      ],
      session,
      sessionLabel: 'Session ID',
      nudge: { text: 'Move some across every payday?', action: 'Set it up' },
      wrong: 'Something wrong with this?',
      ask: 'Ask about this',
    };
  }
  if (row.kind === 'coin' && row.coin) {
    /* a stablecoin in or out (Round 33): in dollars, one coin to the dollar, the network's fee out of what is sent */
    const c = row.coin;
    const on = `${c.coin} on ${networkOf(c.network).name}`;
    const moved = Math.abs(row.usd ?? 0);
    const settled = row.status === 'done';
    if ((row.usd ?? 0) > 0) {
      return {
        ...base,
        figure: usdFull(moved),
        head: settled ? 'Coins in' : 'On its way',
        line: `${usdFull(moved)} ${on}`,
        status: settled ? 'Arrived' : 'On its way',
        fields: [
          ['From', shortAddress(c.address), row.detail.split(' · ')[0] ?? on],
          ['Coin', on, 'On a test network: no real coin moved'],
          ['To', 'Dollars', 'One coin, one dollar'],
          ['Amount', usdFull(moved)],
          ['Fee', 'None on coins in'],
          ['Total credited', usdFull(moved)],
        ],
        session: c.hash,
        sessionLabel: 'Transaction',
        nudge: { text: 'Add more the same way?', action: 'Show the address' },
        wrong: 'Expecting more than this?',
        ask: 'Ask about these coins',
      };
    }
    return {
      ...base,
      figure: usdFull(moved),
      head: settled ? 'Sent' : row.status === 'pending' ? 'On its way' : row.status === 'failed' ? 'It did not go' : 'It came back',
      line: `${usdFull(Math.max(0, moved - c.fee))} ${c.coin} to ${shortAddress(c.address)}`,
      status: settled ? 'Successful' : row.status === 'pending' ? 'On its way' : row.status === 'failed' ? 'Did not go' : 'Came back',
      fields: [
        ['To', shortAddress(c.address), on],
        ['From', 'Dollars', 'One dollar, one coin'],
        ['Amount', usdFull(moved)],
        ['Network fee', usdFull(c.fee), 'The network’s own, out of what is sent'],
        ['They get', usdFull(Math.max(0, moved - c.fee))],
        ['Total charged', usdFull(moved)],
      ],
      session: c.hash,
      sessionLabel: 'Transaction',
      nudge: { text: 'Send to this address again?', action: 'Send again' },
      wrong: 'Something wrong with this?',
      ask: 'Ask about these coins',
    };
  }
  if (row.kind === 'in') {
    return {
      ...base,
      head: 'Money in',
      line: `From ${row.name}`,
      status: 'Cleared',
      fields: [
        ['From', row.name, row.person ? `${row.person.bank} · ${groupAccount(row.person.number)}` : (row.detail.split(' · ')[0] ?? row.detail)],
        ['To', 'Everyday', number],
        ...(row.reference ? [['They wrote', row.reference] as Field] : []),
        ['Amount', nairaFull(amount)],
        ['Fee', 'None on money in'],
        ['Total credited', nairaFull(amount)],
        ['Balance after', after],
      ],
      session,
      sessionLabel: 'Session ID',
      nudge: { text: 'Put some of it away before it goes?', action: 'Set it up' },
      wrong: 'Expecting more than this?',
      ask: 'Ask about this payment',
    };
  }
  if (row.kind === 'transfer') {
    return {
      ...base,
      /* a receipt can open on any line (Round 19): one that has not settled is titled for what it is */
      head: row.status === 'done' ? 'All done' : row.status === 'pending' ? 'On its way' : row.status === 'failed' ? 'It did not go' : 'It came back',
      line: `Sent to ${row.name}`,
      status: row.status === 'done' ? 'Successful' : row.status === 'pending' ? 'On its way' : row.status === 'failed' ? 'Did not go' : 'Came back',
      fields: [
        ['To', row.name, toNote(row)],
        from,
        ...(row.reference ? [['Narration', row.reference] as Field] : []),
        ['Amount', nairaFull(amount)],
        fee > 0
          ? ['Fee', nairaFull(fee), 'Transfers under ₦10,000 carry none']
          : ['Fee', 'Free', paidInUsd ? 'Nothing on money from your dollars' : row.person?.bank === 'Beetle' ? 'Nothing between Beetle accounts' : 'Because it is under ₦10,000'],
        ['Total charged', paidInUsd ? usdFull(paidInUsd) : nairaFull(amount + fee)],
        ['Balance after', after],
      ],
      session,
      sessionLabel: 'Session ID',
      nudge: { text: `${first} has it. The same next month?`, action: 'Set it up' },
      wrong: 'Something wrong with this?',
      ask: 'Ask about this transfer',
    };
  }
  if (row.kind === 'bill' && row.name === 'Beetle Loans') {
    /* a loan paid back (Round 33): no token, and what is still owed is on Borrow */
    return {
      ...base,
      head: 'Paid back',
      line: 'Beetle Loans',
      status: 'Successful',
      fields: [['To', 'Beetle Loans', 'Your loan'], from, ['Amount', nairaFull(amount)], ['Fee', 'None for paying early'], ['Total charged', nairaFull(amount)], ['Balance after', after]],
      session,
      sessionLabel: 'Session ID',
      nudge: { text: 'See what is still owed?', action: 'Open Borrow' },
      wrong: 'Something wrong with this?',
      ask: 'Ask about this payment',
    };
  }
  if (row.kind === 'bill') {
    return {
      ...base,
      head: 'Bill paid',
      line: row.name,
      status: 'Successful',
      token: row.reference,
      fields: [['To', row.name, row.detail.replace(/ · \d\d:\d\d$/, '')], from, ['Amount', nairaFull(amount)], ['Fee', 'Free'], ['Total charged', nairaFull(amount)], ['Balance after', after]],
      session,
      sessionLabel: `${first} reference`,
      nudge: { text: 'Pay this every month, without asking?', action: 'Set it up' },
      wrong: 'The token did not work?',
      ask: 'Ask about this payment',
    };
  }
  const what = row.detail.replace(/ · \d\d:\d\d$/, '');
  if (row.kind === 'saving' && row.amount > 0) {
    return {
      ...base,
      head: 'Taken back',
      line: `From ${row.name}`,
      status: 'Successful',
      fields: [
        ['From', row.name, 'Nothing here is locked'],
        ['To', 'Everyday', number],
        ['Amount', nairaFull(amount)],
        ['Fee', 'Free'],
        ['Total credited', nairaFull(amount)],
        ['Balance after', after],
      ],
      session,
      sessionLabel: 'Session ID',
      nudge: { text: 'Put it back on payday?', action: 'Set it up' },
      wrong: 'Something wrong with this?',
      ask: 'Ask about this',
    };
  }
  return {
    ...base,
    head: 'All done',
    line: row.kind === 'saving' ? row.name : what,
    status: 'Successful',
    fields: [
      ['To', row.name, row.kind === 'saving' ? 'Put away' : undefined],
      from,
      ['What', what],
      ['Amount', nairaFull(amount)],
      ['Fee', 'Free'],
      ['Total charged', nairaFull(amount)],
      ['Balance after', after],
    ],
    session,
    sessionLabel: row.kind === 'saving' ? 'Session ID' : `${first} reference`,
    nudge: { text: row.kind === 'saving' ? 'Keep it going every week?' : 'Every month, without asking?', action: 'Set it up' },
    wrong: 'Something wrong with this?',
    ask: 'Ask about this',
  };
}

/** The line a shared copy carries: what moved and when, and nothing of the balance or the account numbers. */
export function shareLine(r: Receipt): string {
  const at = r.when.split(' at ')[1] ?? r.when;
  /* data and airtime: ₦2,500 of data for Mum, as the share frame says it */
  const sent = r.kind === 'airtime' ? r.line.match(/^(.+?) sent to (.+)$/) : null;
  if (sent) return `${naira(r.amount)} of ${/\d(GB|MB)/.test(sent[1] ?? '') ? 'data' : 'airtime'} for ${sent[2]}, ${at}`;
  return `${naira(r.amount)} ${r.line.replace(/^Sent to /, 'to ').replace(/^From /, 'from ')}, ${at}`;
}
