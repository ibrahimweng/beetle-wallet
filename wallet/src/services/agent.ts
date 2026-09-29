/* Beetle, the one you ask. Behind the interface is what answers: for now a
   scripted one that understands the handful of things the app does — sending
   money, topping up, data, dollars, the balance, and reading an account
   number off a photo — and answers with words and the panels the design
   draws. A real model slots in here later, behind the same interface, once
   there is a server to keep its key on; nothing on the screens changes. */
import type { IconName } from '../icons';
import { groupAccount, naira } from '../lib/format';
import type { Account } from './auth';
import type { Reading, ReaderService } from './reader';
import { wait } from './support';

export type Photo = { uri: string; width?: number; height?: number };
export type Ask = { text?: string; photo?: Photo };

export type Person = { name: string; bank: string; number: string };

export type PanelRow = { label: string; value: string; editable?: boolean };

/** A panel the model puts up: what it checked and what it found, and the one
    thing to do about it. */
export type Panel = {
  id: string;
  tool: 'transfer' | 'found' | 'pay' | 'data';
  title: string;
  icon: IconName;
  rows: PanelRow[];
  /** the button, and how much pressing it moves */
  action?: { label: string; amount: number };
  /** the line the ledger gets once it is confirmed */
  move?: Move;
};

export type Move = { name: string; detail: string; amount: number; icon: IconName; kind: 'transfer' | 'bill' | 'airtime' | 'service' };

export type Block =
  | { kind: 'say'; text: string }
  | { kind: 'note'; title: string; body: string }
  | { kind: 'panel'; panel: Panel }
  /** a change to a panel already up: the amount was corrected */
  | { kind: 'amend'; panelId: string; amount: number };

/** What the model is waiting for. Whoever holds the conversation keeps it
    and hands it back with the next ask. */
export type Pending = { need: 'amount'; to: Person } | { need: 'who'; amount: number } | { need: 'amount-for'; panel: Panel } | null;

export type Context = {
  account: Account;
  balance: number;
  rate: number;
  pending: Pending;
};

export type Reply = { blocks: Block[]; pending: Pending; reading?: Reading };

/** A line of what the model is doing while it works, in its own voice, for
    the screen to show as it happens. Only the asks that take time have any. */
export type OnStep = (line: string) => void;

export interface AgentService {
  ask(ask: Ask, ctx: Context, onStep?: OnStep): Promise<Reply>;
}

/* ---- what the scripted one knows ---- */

/** The people the demo account has paid, and where. */
export const PEOPLE: Person[] = [
  { name: 'Sarah Adeyemi', bank: 'GTBank', number: '0123456789' },
  { name: 'Chidi Okafor', bank: 'Access Bank', number: '0234567891' },
  { name: 'Musa Danjuma', bank: 'Zenith Bank', number: '2034567890' },
  { name: 'John Doe', bank: 'Kuda', number: '3012345678' },
];

const BANKS = [
  'GTBank',
  'Guaranty Trust',
  'Access',
  'Zenith',
  'UBA',
  'First Bank',
  'Kuda',
  'Opay',
  'Moniepoint',
  'Wema',
  'Sterling',
  'Fidelity',
  'Union Bank',
  'Stanbic',
  'FCMB',
  'Polaris',
  'Providus',
  'PalmPay',
];

/** ₦20,000, 20k, 20,000, 2.5k, 1m — the first amount in the words, if any.
    A run of ten or more digits is an account number, not an amount. */
export function amountIn(text: string): number | null {
  const m = text.match(/(?:₦|\bn(?=\d))?\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?\s*(k|m|thousand|million)?\b/i);
  if (!m) return null;
  const whole = m[1]!.replace(/,/g, '');
  if (whole.length >= 10) return null;
  let n = Number(whole + (m[2] ? '.' + m[2] : ''));
  const unit = (m[3] ?? '').toLowerCase();
  if (unit === 'k' || unit === 'thousand') n *= 1_000;
  if (unit === 'm' || unit === 'million') n *= 1_000_000;
  return n > 0 ? n : null;
}

/** Ten digits, however they are grouped. */
export function accountIn(text: string): string | null {
  const m = text.match(/\b\d[\d \-]{8,14}\d\b/);
  if (!m) return null;
  const digits = m[0].replace(/\D/g, '');
  return digits.length === 10 ? digits : null;
}

/** Whoever is named: "to Sarah", "Sarah Adeyemi", "chidi". */
export function personIn(text: string, people = PEOPLE): Person | null {
  const lower = text.toLowerCase();
  for (const p of people) if (lower.includes(p.name.toLowerCase())) return p;
  const after = lower.match(/\b(?:to|for)\s+([a-z]+)/);
  const first = after?.[1];
  if (first) {
    const hit = people.find(p =>
      p.name
        .toLowerCase()
        .split(' ')
        .some(w => w === first),
    );
    if (hit) return hit;
  }
  return (
    people.find(p =>
      p.name
        .toLowerCase()
        .split(' ')
        .some(w => w.length > 3 && lower.includes(w)),
    ) ?? null
  );
}

/** ₦10 up to five thousand, ₦25 up to fifty, ₦50 above: the usual scale. */
export const feeFor = (amount: number) => (amount <= 5_000 ? 10 : amount <= 50_000 ? 25 : 50);

/** Who an account number belongs to. The demo knows its own people; for any
    other number the words around it on the slip are the best guess. */
export function whose(number: string, reading?: Reading): Person {
  const known = PEOPLE.find(p => p.number === number);
  if (known) return known;
  const lines = (reading?.text ?? '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);
  const bankLine = lines.find(l => BANKS.some(b => l.toLowerCase().includes(b.toLowerCase())));
  const bank = bankLine ? (BANKS.find(b => bankLine.toLowerCase().includes(b.toLowerCase())) ?? bankLine) : 'Their bank';
  const name = lines.find(l => /^[A-Z][a-z]+(?: [A-Z][a-z]+){1,2}$/.test(l) && !BANKS.some(b => l.includes(b))) ?? 'The account holder';
  return { name, bank: bank === 'Guaranty Trust' ? 'GTBank' : bank, number };
}

let ids = 0;
const nextId = (tool: string) => `${tool}-${++ids}-${Date.now().toString(36)}`;

export function transferPanel(to: Person, amount: number): Panel {
  const fee = feeFor(amount);
  return {
    id: nextId('transfer'),
    tool: 'transfer',
    title: 'Beetle Transfers',
    icon: 'up',
    rows: [
      { label: 'Recipient', value: to.name },
      { label: 'Bank', value: to.bank },
      { label: 'Amount', value: naira(amount), editable: true },
      { label: 'Fee', value: naira(fee) },
      { label: 'Arrives', value: amount > 50_000 ? 'Under a minute' : 'In a moment' },
    ],
    action: { label: `Confirm ${naira(amount)}`, amount: amount + fee },
    move: { name: to.name, detail: `${to.bank} · sent`, amount: -amount, icon: 'send', kind: 'transfer' },
  };
}

export function foundPanel(p: Person): Panel {
  return {
    id: nextId('found'),
    tool: 'found',
    title: 'Read off the photo',
    icon: 'id',
    rows: [
      { label: 'Number', value: groupAccount(p.number) },
      { label: 'Bank', value: p.bank },
      { label: 'Name', value: p.name },
    ],
  };
}

const POWER: Panel = {
  id: 'pay-power',
  tool: 'pay',
  title: 'Beetle Bills',
  icon: 'power',
  rows: [
    { label: 'Biller', value: 'Ikeja Electric' },
    { label: 'Meter', value: '4457 8891' },
    { label: 'Amount', value: naira(8_000), editable: true },
    { label: 'Fee', value: naira(0) },
  ],
  action: { label: `Pay ${naira(8_000)}`, amount: 8_000 },
  move: { name: 'Ikeja Electric', detail: 'Meter 4457 8891', amount: -8_000, icon: 'power', kind: 'bill' },
};

const DATA: Panel = {
  id: 'buy-data',
  tool: 'data',
  title: 'Beetle Data',
  icon: 'data',
  rows: [
    { label: 'Line', value: 'MTN · your line' },
    { label: 'Plan', value: '5GB for 30 days' },
    { label: 'Amount', value: naira(2_500) },
  ],
  action: { label: 'Buy it', amount: 2_500 },
  move: { name: 'MTN', detail: '5GB for 30 days', amount: -2_500, icon: 'data', kind: 'airtime' },
};

/** Ask about the same panel again and it comes back fresh, with its own id. */
const fresh = (p: Panel): Panel => ({ ...p, id: nextId(p.tool), rows: p.rows.map(r => ({ ...r })) });
export const powerPanel = () => fresh(POWER);
export const dataPanel = () => fresh(DATA);

const say = (text: string): Block => ({ kind: 'say', text });

export class ScriptedAgent implements AgentService {
  constructor(
    private readonly reader: ReaderService,
    private readonly delay = 500,
  ) {}

  /** A step said, and the time it takes: the waits scale with the delay, so
      a quick test sees none of them. */
  private async step(onStep: OnStep | undefined, line: string, beat: number) {
    onStep?.(line);
    await wait(this.delay * beat);
  }

  private async transfer(onStep: OnStep | undefined, to: Person) {
    await this.step(onStep, `I'm finding ${to.name.split(' ')[0]}'s account at ${to.bank}…`, 1.4);
    await this.step(onStep, "I'm checking the fee and how fast it lands…", 1.2);
  }

  async ask(ask: Ask, ctx: Context, onStep?: OnStep): Promise<Reply> {
    await wait(this.delay);
    const text = (ask.text ?? '').trim();
    const first = ctx.account.firstName;

    /* a photo: read it, and go on from what it says */
    if (ask.photo) {
      onStep?.("I'm reading the photo…");
      const reading = await this.reader.read(ask.photo.uri);
      const number = reading.numbers[0];
      if (number) {
        await this.step(onStep, `I'm looking up ${groupAccount(number)}…`, 1);
        await this.step(onStep, "I'm checking whose it is…", 0.8);
      }
      if (!number) {
        return {
          blocks: [say('I looked, but I could not make out an account number on that. Try again with the number filling the photo, or type it.')],
          pending: null,
          reading,
        };
      }
      const to = whose(number, reading);
      const amount = amountIn(text);
      const blocks: Block[] = [say(`I read ${groupAccount(number)} off that${reading.real ? '' : ' (a sample, on this device)'}: ${to.name} at ${to.bank}.`), { kind: 'panel', panel: foundPanel(to) }];
      if (amount) {
        blocks.push(say(`${naira(amount)} to ${to.name.split(' ')[0]}, then. Here is what I have.`), { kind: 'panel', panel: transferPanel(to, amount) });
        return { blocks, pending: null, reading };
      }
      blocks.push(say(`How much should I send ${to.name.split(' ')[0]}?`));
      return { blocks, pending: { need: 'amount', to }, reading };
    }

    if (!text) return { blocks: [say('Say what you need, or show me a photo of an account number.')], pending: null };
    const lower = text.toLowerCase();
    const amount = amountIn(text);
    const number = accountIn(text);
    const person = number ? whose(number) : personIn(text);

    /* an amount for a panel already up */
    if (ctx.pending?.need === 'amount-for' && amount) {
      return { blocks: [{ kind: 'amend', panelId: ctx.pending.panel.id, amount }, say(`${naira(amount)} it is.`)], pending: null };
    }
    /* the rest of a transfer it was waiting on */
    if (ctx.pending?.need === 'amount' && amount) {
      await this.transfer(onStep, ctx.pending.to);
      return { blocks: [say(`${naira(amount)} to ${ctx.pending.to.name.split(' ')[0]}. Here is what I have.`), { kind: 'panel', panel: transferPanel(ctx.pending.to, amount) }], pending: null };
    }
    if (ctx.pending?.need === 'who' && person) {
      await this.transfer(onStep, person);
      return { blocks: [say(`${naira(ctx.pending.amount)} to ${person.name}. Here is what I have.`), { kind: 'panel', panel: transferPanel(person, ctx.pending.amount) }], pending: null };
    }

    if (/\b(hi|hello|hey|good (morning|afternoon|evening))\b/.test(lower) && lower.length < 24) {
      return { blocks: [say(`Hello ${first}. I can send money, top up, buy data, and read an account number off a photo. What do you need?`)], pending: null };
    }
    if (/\b(send|transfer|pay|give|move)\b/.test(lower) && (person || amount) && !/\b(electric|light|nepa|meter|data|airtime)\b/.test(lower)) {
      if (person && amount) {
        if (amount > ctx.balance)
          return { blocks: [say(`That is more than the ${naira(ctx.balance)} you have. How much should I send ${person.name.split(' ')[0]} instead?`)], pending: { need: 'amount', to: person } };
        await this.transfer(onStep, person);
        return {
          blocks: [say(`${naira(amount)} to ${person.name} at ${person.bank}. Here is what I have; the amount is yours to change.`), { kind: 'panel', panel: transferPanel(person, amount) }],
          pending: null,
        };
      }
      if (person) return { blocks: [say(`${person.name} at ${person.bank}. How much?`)], pending: { need: 'amount', to: person } };
      return { blocks: [say(`${naira(amount!)} — to whom? A name I know, or the account number.`)], pending: { need: 'who', amount: amount! } };
    }
    if (/\b(top ?up|electric|light|nepa|ikeja|meter|power|bill)\b/.test(lower)) {
      await this.step(onStep, "I'm pulling up your Ikeja Electric meter…", 1.4);
      await this.step(onStep, "I'm checking what it usually costs…", 1);
      return { blocks: [say('Your usual: Ikeja Electric, meter 4457 8891. The last one was ₦8,000, about three weeks ago.'), { kind: 'panel', panel: fresh(POWER) }], pending: null };
    }
    if (/\b(data|gb|mtn|internet|airtime)\b/.test(lower)) {
      await this.step(onStep, "I'm looking at your line…", 1.2);
      await this.step(onStep, "I'm finding the plan you had last time…", 1);
      return { blocks: [say('The same 5GB as last time is ₦2,500, and it usually runs out about now.'), { kind: 'panel', panel: fresh(DATA) }], pending: null };
    }
    if (/\b(dollar|dollars|usd|\$)/.test(lower)) {
      return {
        blocks: [
          { kind: 'note', title: 'Holding dollars', body: 'Your naira buys dollars at the rate you see, and the dollars sit in their own place.' },
          say(
            `Right now ₦${ctx.rate.toLocaleString('en-NG')} buys a dollar, so what you have is about ${Math.round(ctx.balance / ctx.rate).toLocaleString('en-NG')} USD. Holding dollars comes on when you finish setting up.`,
          ),
        ],
        pending: null,
      };
    }
    if (/\b(balance|how much|left|have i got|do i have)\b/.test(lower)) {
      return {
        blocks: [say(`You have ${naira(ctx.balance)} in naira, about ${Math.round(ctx.balance / ctx.rate).toLocaleString('en-NG')} dollars' worth. Nothing is on its way out.`)],
        pending: null,
      };
    }
    if (person) return { blocks: [say(`${person.name} at ${person.bank}, ${groupAccount(person.number)}. Send them something?`)], pending: { need: 'amount', to: person } };
    return { blocks: [say('I can send money, top up electricity, buy data, say how much you have, and read an account number off a photo. Which one?')], pending: null };
  }
}
