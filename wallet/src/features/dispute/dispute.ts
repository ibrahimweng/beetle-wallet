/* A dispute: a transfer that went through and is being chased — traced
   with the bank because it never arrived, frozen and reported because it
   was not yours, or asked back from the person who got it. Five days, a
   step a day, and the day it closes with the money back. The demo's own
   is the one the frames draw: ₦20,000 to Sarah Adeyemi, day three of five. */
import type { LedgerRow } from '../home/account';
import { naira } from '../../lib/format';

export type DisputeKind = 'trace' | 'fraud' | 'recall';

export type Dispute = {
  id: string;
  rowId: string;
  kind: DisputeKind;
  amount: number;
  name: string;
  bank: string;
  /** the time the transfer left, HH:MM */
  sent: string;
  /** the day it was reported, short and long: 28 Aug, 28 August */
  opened: string;
  openedLong: string;
  /** the day the bank acknowledged it, once it has */
  acknowledged?: string;
  /** the day the bank has to answer by */
  decisionBy: string;
  day: number;
  status: 'open' | 'closed';
  /** when it closed: the day the bank decided, short and long, and the time the money came back */
  decided?: string;
  decidedLong?: string;
  returnedAt?: string;
};

export const DAYS = 5;

const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const shortDay = (d: Date) => `${d.getDate()} ${SHORT[d.getMonth()]}`;
export const longDay = (d: Date) => `${d.getDate()} ${LONG[d.getMonth()]}`;
export const firstOf = (name: string) => name.split(' ')[0] ?? name;

/** The bank a line went to, from the person on it or the words of the line. */
export const bankOnRow = (row: LedgerRow) => row.person?.bank ?? row.detail.split(' · ')[0] ?? 'their bank';

/** A dispute opened today on a line: reported and filed at once, the bank's answer due in a week. */
export function newDispute(row: LedgerRow, kind: DisputeKind, today = new Date()): Dispute {
  const by = new Date(today);
  by.setDate(by.getDate() + 7);
  return {
    id: `d${today.getTime().toString(36)}`,
    rowId: row.id,
    kind,
    amount: Math.abs(row.amount),
    name: row.name,
    bank: bankOnRow(row),
    sent: row.time,
    opened: shortDay(today),
    openedLong: longDay(today),
    decisionBy: longDay(by),
    day: 1,
    status: 'open',
  };
}

/** The frame's dispute, on the demo account: ₦20,000 to Sarah, day three of five. */
export const DEMO_DISPUTE: Dispute = {
  id: 'demo',
  rowId: 'l08',
  kind: 'trace',
  amount: 20_000,
  name: 'Sarah Adeyemi',
  bank: 'GTBank',
  sent: '14:22',
  opened: '28 Aug',
  openedLong: '28 August',
  acknowledged: '29 Aug',
  decisionBy: '4 September',
  day: 3,
  status: 'open',
};

/** The same dispute the day it closed, as the frame draws it. */
export const closedDemo = (d: Dispute = DEMO_DISPUTE): Dispute => ({ ...d, status: 'closed', decided: '3 Sep', decidedLong: '3 September', returnedAt: '11:40' });

export type Step = { label: string; value: string; done: boolean };

/** The steps the panel shows, by the kind of dispute and how far it is. */
export function stepsOf(d: Dispute): Step[] {
  if (d.status === 'closed') {
    return [
      { label: 'You reported it', value: d.opened, done: true },
      { label: `${d.bank} decided`, value: d.decided ?? '', done: true },
      { label: 'Money returned', value: d.returnedAt ?? '', done: false },
    ];
  }
  const first = firstOf(d.name);
  const decision = { label: 'Their decision', value: `By ${d.decisionBy}`, done: false };
  if (d.kind === 'fraud')
    return [{ label: 'You reported it', value: d.opened, done: true }, { label: 'Card frozen', value: d.opened, done: true }, { label: `Filed with ${d.bank}`, value: d.opened, done: true }, decision];
  if (d.kind === 'recall')
    return [
      { label: 'You reported it', value: d.opened, done: true },
      { label: `${first} asked to approve`, value: d.opened, done: true },
      { label: `Filed with ${d.bank}`, value: d.opened, done: true },
      { label: `${first}'s answer`, value: d.acknowledged ?? 'Waiting', done: !!d.acknowledged },
    ];
  return [
    { label: 'You reported it', value: d.opened, done: true },
    { label: `Filed with ${d.bank}`, value: d.opened, done: true },
    { label: `${d.bank} acknowledged`, value: d.acknowledged ?? 'Waiting', done: !!d.acknowledged },
    decision,
  ];
}

/** Where it actually is: the three lines and the one under them. */
export function whereLines(d: Dispute): { notes: { glyph: 'check' | 'lock'; text: string }[]; foot: string } {
  return {
    notes: [
      { glyph: 'check', text: `${d.bank} has it and the clock is running. Nothing more is needed from you.` },
      { glyph: 'lock', text: 'I check every morning and tell you the day it moves.' },
      { glyph: 'lock', text: `If they miss ${d.decisionBy} it escalates on its own.` },
    ],
    foot: 'You do not have to call anybody, and you do not have to watch this screen.',
  };
}

/** The exact wording filed with the bank, and what went with it. */
export function filedWords(d: Dispute): string {
  const what =
    d.kind === 'fraud'
      ? `was not made by the account holder. The card has been frozen. Please reverse it and trace where it went.`
      : d.kind === 'recall'
        ? `was sent to the wrong account. Please ask the receiver to approve its return.`
        : `did not reach them. Please trace it and return it to the sender.`;
  return `Filed with ${d.bank} on ${d.openedLong}: "${naira(d.amount)} sent to ${d.name} (${d.bank}) at ${d.sent} ${what}" Attached: the receipt, with its session id.`;
}

/** The closing letter, in Beetle's words. */
export function closingLetter(d: Dispute): string {
  return `Closing letter, ${d.decidedLong ?? d.decisionBy}: the ${naira(d.amount)} sent to ${d.name} at ${d.bank} on ${d.openedLong} was traced and returned. ${d.bank} decided on ${d.decidedLong ?? d.decisionBy}; the money was back in Everyday at ${d.returnedAt ?? 'the same time'}. Nothing was charged. Keep this with your records.`;
}
