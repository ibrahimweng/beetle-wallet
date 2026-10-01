/* Beetle, the one you ask. Behind the interface is what answers: for now a
   scripted one that understands the handful of things the app does — sending
   money, airtime, data, the light bill, dollars, the balance, and reading an
   account number off a photo — and answers with words and the panels the
   design draws. Where an ask does not carry everything the thing needs, it
   puts up an ask panel with the fields, filled with what was said, and
   goes on once they are filled; where the ask names someone or something
   paid before, it skips the asking. A real model slots in here later,
   behind the same interface, once there is a server to keep its key on;
   nothing on the screens changes. */
import { OFFLINE_LINE, TRY_FIRST, feeFor, refusalLine, refuses, wantsEverything } from './rules';
import type { IconName } from '../icons';
import { groupAccount, naira } from '../lib/format';
import type { Account } from './auth';
import {
  BILL_AMOUNTS,
  DEMO_SAVED,
  MockMeters,
  beneficiariesOf,
  dataIn,
  discoById,
  discoIn,
  groupMeter,
  groupPhoneNumber,
  labelIn,
  meterIn,
  meterKindIn,
  meterProblem,
  networkOf,
  normalisePhone,
  ownLine,
  phoneIn,
  phoneProblem,
  planById,
  planFor,
  planName,
  savedLineIn,
  savedMeterIn,
  unitsFor,
  type Beneficiaries,
  type LinePaid,
  type MeterKind,
  type MeterPaid,
  type MeterRecord,
  type MeterService,
  type Network,
  type Plan,
  type Target,
} from './nigeria';
import type { Reading, ReaderService } from './reader';
import { wait } from './support';

/** A photo, and what was already read off it where the camera read it first. */
export type Photo = { uri: string; width?: number; height?: number; reading?: Reading };
/** What is asked: words, a photo, or an ask panel's fields, filled. */
export type Ask = { text?: string; photo?: Photo; answers?: { askId: string; values: AskValues } };

export type Person = { name: string; bank: string; number: string };

export type PanelRow = { label: string; value: string; editable?: boolean };

/** A panel the model puts up: what it checked and what it found, and the one
    thing to do about it. */
export type Panel = {
  id: string;
  tool: 'transfer' | 'found' | 'pay' | 'data' | 'airtime';
  title: string;
  icon: IconName;
  rows: PanelRow[];
  /** the button, and how much pressing it moves */
  action?: { label: string; amount: number };
  /** the line the ledger gets once it is confirmed */
  move?: Move;
  /** who a transfer is to, for the row on the passcode sheet */
  person?: Person;
};

export type Move = {
  name: string;
  detail: string;
  amount: number;
  icon: IconName;
  kind: 'transfer' | 'bill' | 'airtime' | 'service' | 'in' | 'saving' | 'convert' | 'card';
  /** what its receipt needs beyond the line: the fee, who, what was written */
  fee?: number;
  person?: Person;
  reference?: string;
  /** the line or the meter it went to, so a repeat is a repeat */
  target?: Target;
  /** who it went to was read off a photo: a wrong digit is then Beetle's own */
  read?: 'photo';
  /** the dollars it moved: into the holding on a conversion, out of it where it was paid from */
  usd?: number;
};

/* ---- what Beetle asks for ---- */

export type AskTool = 'transfer' | 'data' | 'airtime' | 'pay';
export type AskField = 'who' | 'amount' | 'number' | 'plan' | 'disco' | 'meterKind' | 'meter';
export type AskValues = {
  /** a name, or ten digits */
  who?: string;
  amount?: number;
  /** eleven digits */
  number?: string;
  /** a plan's id */
  plan?: string;
  /** a company's id */
  disco?: string;
  meterKind?: MeterKind;
  meter?: string;
};
/** What the values came to: the person `who` names, whose the meter is.
    Null is looked up and not found; undefined is not looked up yet. */
export type AskFound = { person?: Person | null; meter?: MeterRecord | null };

/** A panel of the fields a thing still needs, with what was said already
    in them. Filled and continued, it becomes the panel to confirm. */
export type AskPanel = {
  id: string;
  tool: AskTool;
  title: string;
  icon: IconName;
  fields: AskField[];
  values: AskValues;
  found?: AskFound;
  /** the line under the fields: there are people, lines or meters paid before to pick from */
  saved?: 'person' | 'line' | 'meter';
  /** a word about why it is asking, or what was wrong */
  note?: string;
};

export type Block =
  | { kind: 'say'; text: string }
  | { kind: 'note'; title: string; body: string }
  /** a line of small print beside a lock, under what was said */
  | { kind: 'aside'; text: string }
  | { kind: 'panel'; panel: Panel }
  /** a change to a panel already up: the amount was corrected */
  | { kind: 'amend'; panelId: string; amount: number }
  /** the fields a thing still needs */
  | { kind: 'ask'; ask: AskPanel }
  /** an ask panel's fields filled by words; `done` once it has all it needs and the panel to confirm follows */
  | { kind: 'fill'; askId: string; values: AskValues; found?: AskFound; note?: string; done?: boolean };

/** What the model is waiting for. Whoever holds the conversation keeps it
    and hands it back with the next ask. */
export type Pending = { need: 'amount-for'; panel: Panel } | { need: 'ask'; ask: AskPanel } | null;

export type Context = {
  account: Account;
  balance: number;
  rate: number;
  pending: Pending;
  /** the conversation so far, for a Beetle with a memory of its own */
  transcript?: { who: 'you' | 'beetle'; text: string }[];
  /** the people, lines and meters paid before */
  saved?: Beneficiaries;
  /** whether the network is there: false and Beetle holds a transfer rather than send it */
  online?: boolean;
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
  { name: 'Sarah Adeyemi', bank: 'GTBank', number: '0234567890' },
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
    A phone number, an account number or a meter number — a run of eight or
    more digits, however grouped — is not an amount; nor is a size of data;
    nor does an amount start with a nought. */
export function amountIn(text: string): number | null {
  const clean = text
    .replace(/(?:\+?234[\s-]?|\b0)(?:\d[\s-]?){10}(?!\d)/g, ' ')
    .replace(/\b\d(?:[\s-]?\d){7,}\b/g, ' ')
    .replace(/\d+(?:\.\d+)?\s*(?:gb|mb|gigs?)\b/gi, ' ');
  const m = clean.match(/(?:₦|\bn(?=\d))?\s*\b([1-9]\d{0,2}(?:,\d{3})+|[1-9]\d*)(?:\.(\d+))?\s*(k|m|thousand|million)?\b/i);
  if (!m) return null;
  const whole = m[1]!.replace(/,/g, '');
  if (whole.length >= 8) return null;
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

/** Nothing under ₦10,000 — Beetle carries those — then the banks' own ₦25
    with the tax on it up to ₦50,000, and ₦50 with the tax above, which is
    what the receipts print. */
export { feeFor };
/** The fee as a row says it: Free, or the figure with its kobo. */
export const feeLabel = (fee: number) => (fee ? '₦' + fee.toFixed(2) : 'Free');

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
      { label: 'Fee', value: feeLabel(fee) },
      { label: 'Arrives', value: amount > 50_000 ? 'Under a minute' : 'In a moment' },
    ],
    action: { label: `Confirm ${naira(amount)}`, amount: amount + fee },
    person: to,
    move: { name: to.name, detail: `${to.bank} · sent`, amount: -amount, icon: 'send', kind: 'transfer', fee, person: to },
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

/** A line the data or the airtime goes to. */
export type PhoneLine = { number: string; network: Network; label?: string };
const lineWords = (l: PhoneLine) => (l.label === 'Your line' ? `${groupPhoneNumber(l.number)} · your line` : l.label ? `${l.label} · ${groupPhoneNumber(l.number)}` : groupPhoneNumber(l.number));

export function dataPanelFor(line: PhoneLine, plan: Plan): Panel {
  return {
    id: nextId('data'),
    tool: 'data',
    title: 'Beetle Data',
    icon: 'data',
    rows: [
      { label: 'Line', value: lineWords(line) },
      { label: 'Network', value: line.network },
      { label: 'Plan', value: planName(plan) },
      { label: 'Amount', value: naira(plan.price) },
    ],
    action: { label: `Buy ${naira(plan.price)}`, amount: plan.price },
    move: {
      name: line.network,
      detail: `${planName(plan)} · ${line.label ?? groupPhoneNumber(line.number)}`,
      amount: -plan.price,
      icon: 'data',
      kind: 'airtime',
      target: { kind: 'line', number: line.number, network: line.network, label: line.label, plan: plan.id },
    },
  };
}

export function airtimePanelFor(line: PhoneLine, amount: number): Panel {
  return {
    id: nextId('airtime'),
    tool: 'airtime',
    title: 'Beetle Airtime',
    icon: 'airtime',
    rows: [
      { label: 'Line', value: lineWords(line) },
      { label: 'Network', value: line.network },
      { label: 'Amount', value: naira(amount), editable: true },
      { label: 'Lands', value: 'At once' },
    ],
    action: { label: `Buy ${naira(amount)}`, amount },
    move: {
      name: line.network,
      detail: `Airtime · ${line.label ?? groupPhoneNumber(line.number)}`,
      amount: -amount,
      icon: 'airtime',
      kind: 'airtime',
      target: { kind: 'line', number: line.number, network: line.network, label: line.label },
    },
  };
}

/** A meter the light goes to. */
export type Meter = { disco: string; meterKind: MeterKind; meter: string; name: string; label?: string };

/** A token the way the companies print one: twenty digits in fives. */
const tokenFor = (meter: string, amount: number) => {
  let h = amount;
  const out: string[] = [];
  for (let i = 0; i < 4; i++) {
    for (const c of meter + i) h = (h * 33 + c.charCodeAt(0)) % 100_000;
    out.push(String(h).padStart(5, '0'));
  }
  return out.join(' ');
};

export function billPanelFor(meter: Meter, amount: number): Panel {
  const disco = discoById(meter.disco);
  const name = disco?.name ?? 'The electricity company';
  const prepaid = meter.meterKind === 'prepaid';
  return {
    id: nextId('pay'),
    tool: 'pay',
    title: 'Beetle Bills',
    icon: 'power',
    rows: [
      { label: 'Biller', value: name },
      { label: 'Meter', value: `${prepaid ? 'Prepaid' : 'Postpaid'} · ${groupMeter(meter.meter)}` },
      { label: 'Name', value: meter.name },
      { label: 'Amount', value: naira(amount), editable: true },
      prepaid ? { label: 'Units', value: `About ${unitsFor(amount)} kWh` } : { label: 'Settles', value: 'The account, at once' },
      { label: 'Fee', value: 'Free' },
    ],
    action: { label: `Pay ${naira(amount)}`, amount },
    move: {
      name,
      detail: `Meter ${groupMeter(meter.meter)}`,
      amount: -amount,
      icon: 'power',
      kind: 'bill',
      reference: prepaid ? tokenFor(meter.meter, amount) : undefined,
      target: { kind: 'meter', disco: meter.disco, meterKind: meter.meterKind, meter: meter.meter, name: meter.name, label: meter.label },
    },
  };
}

/** The demo account's usual: its meter at Ikeja Electric, and the 5GB on its own line. */
export const USUAL_METER: Meter = { disco: 'ikeja', meterKind: 'prepaid', meter: '44578891', name: 'Ibrahim Musa', label: 'Home' };
export const USUAL_LINE: PhoneLine = { number: '09069113588', network: 'MTN', label: 'Your line' };
export const powerPanel = () => billPanelFor(USUAL_METER, 8_000);
export const dataPanel = () => dataPanelFor(USUAL_LINE, planById('mtn-5gb-30d')!);

/* ---- the ask panel ---- */

const ASK_FIELDS: Record<AskTool, AskField[]> = {
  transfer: ['who', 'amount'],
  data: ['number', 'plan'],
  airtime: ['number', 'amount'],
  pay: ['meterKind', 'disco', 'meter', 'amount'],
};
const ASK_LOOK: Record<AskTool, { title: string; icon: IconName; saved: 'person' | 'line' | 'meter' }> = {
  transfer: { title: 'Beetle Transfers', icon: 'up', saved: 'person' },
  data: { title: 'Beetle Data', icon: 'data', saved: 'line' },
  airtime: { title: 'Beetle Airtime', icon: 'airtime', saved: 'line' },
  pay: { title: 'Beetle Bills', icon: 'power', saved: 'meter' },
};

/** The people, lines and meters paid before: what the conversation
    passes, or, for the demo account asked with none, the demo's own. */
export function savedOf(ctx: Context): Beneficiaries {
  if (ctx.saved) return ctx.saved;
  return beneficiariesOf([], ctx.account.demo ? DEMO_SAVED : { lines: [], meters: [] }, PEOPLE, ownLine(ctx.account.phone));
}

/** What is there to pick from, for a tool. */
export function savedFor(tool: AskTool, saved?: Beneficiaries): boolean {
  if (!saved) return false;
  if (tool === 'transfer') return saved.people.length > 0;
  if (tool === 'pay') return saved.meters.length > 0;
  return saved.lines.some(l => !l.own);
}

export function newAsk(tool: AskTool, values: AskValues, ctx: Context, found?: AskFound, note?: string): AskPanel {
  const look = ASK_LOOK[tool];
  return { id: nextId('ask'), tool, title: look.title, icon: look.icon, fields: ASK_FIELDS[tool], values, found, saved: savedFor(tool, savedOf(ctx)) ? look.saved : undefined, note };
}

/** The fields an ask still needs, given what is in it and what was found. */
export function askMissing(ask: Pick<AskPanel, 'fields' | 'values' | 'found'>): AskField[] {
  const v = ask.values;
  const network = v.number ? networkOf(v.number) : null;
  return ask.fields.filter(f => {
    switch (f) {
      case 'who':
        return !ask.found?.person;
      case 'amount':
        return !(v.amount && v.amount > 0);
      case 'number':
        return !v.number || !!phoneProblem(v.number);
      case 'plan': {
        const p = v.plan ? planById(v.plan) : null;
        return !p || !network || p.network !== network;
      }
      case 'disco':
        return !v.disco || !discoById(v.disco);
      case 'meterKind':
        return !v.meterKind;
      case 'meter':
        return !v.meter || !!meterProblem(v.meter) || ask.found?.meter === null;
    }
  });
}

/** The question for the first thing still missing. */
export const askQuestion: Record<AskField, string> = {
  who: 'Who is it for? A name I know, or the account number.',
  amount: 'How much?',
  number: 'Which number?',
  plan: 'Which plan?',
  disco: 'Which electricity company?',
  meterKind: 'Prepaid or postpaid?',
  meter: 'What is the meter number?',
};

/* ---- the scripted Beetle ---- */

const say = (text: string): Block => ({ kind: 'say', text });
const firstName = (p: Person) => p.name.split(' ')[0];

/** "for mum", "for my sister": the data or airtime is for somebody else. */
const forSomeoneElse = (lower: string) =>
  /\bfor\s+(?!me\b|myself\b|my (?:own )?(?:line|number|phone)\b)[a-z]/.test(lower) || /\b(his|her|their|sister|brother|friend|wife|husband|son|daughter)\b/.test(lower);
/** "the usual", "again", "same as last time". */
const theUsual = (lower: string) => /\b(usual|again|same|last time|as before)\b/.test(lower);

export class ScriptedAgent implements AgentService {
  constructor(
    private readonly reader: ReaderService,
    private readonly delay = 500,
    private readonly meters: MeterService = new MockMeters(delay),
  ) {}

  /** A step said, and the time it takes: the waits scale with the delay, so
      a quick test sees none of them. */
  private async step(onStep: OnStep | undefined, line: string, beat: number) {
    onStep?.(line);
    await wait(this.delay * beat);
  }

  private async transfer(onStep: OnStep | undefined, to: Person) {
    await this.step(onStep, `I'm finding ${firstName(to)}'s account at ${to.bank}…`, 1.4);
    await this.step(onStep, "I'm checking the fee and how fast it lands…", 1.2);
  }

  /* ---- the lines and meters the words mean ---- */

  private lineFor(text: string, ctx: Context): PhoneLine | null {
    const lower = text.toLowerCase();
    const lines = savedOf(ctx).lines;
    const known = savedLineIn(text, lines);
    if (known) return { number: known.number, network: known.network, label: known.label };
    const number = phoneIn(text);
    if (number) return { number, network: networkOf(number)!, label: undefined };
    if (forSomeoneElse(lower)) return null;
    const own = lines.find(l => l.own) ?? lineOf(ctx.account.phone);
    return own ? { number: own.number, network: own.network, label: 'Your line' } : null;
  }

  private savedLine(line: PhoneLine, ctx: Context): LinePaid | undefined {
    return savedOf(ctx).lines.find(l => l.number === line.number);
  }

  /* ---- finishing a thing: the steps, the words, the panel ---- */

  private async finishData(onStep: OnStep | undefined, line: PhoneLine, plan: Plan, repeat: boolean): Promise<Reply> {
    await this.step(onStep, `I'm checking whose line ${groupPhoneNumber(line.number)} is…`, 1.2);
    await this.step(onStep, `I'm finding the ${planName(plan).split(' for ')[0]} plan on ${line.network}…`, 1);
    const who = line.label === 'Your line' ? 'your line' : line.label ? `${line.label}'s ${line.network} line` : `${groupPhoneNumber(line.number)}, on ${line.network}`;
    return {
      blocks: [say(`${planName(plan)} for ${naira(plan.price)}, on ${who}${repeat ? ', as last time' : ''}. Here is what I have.`), { kind: 'panel', panel: dataPanelFor(line, plan) }],
      pending: null,
    };
  }

  private async finishAirtime(onStep: OnStep | undefined, line: PhoneLine, amount: number): Promise<Reply> {
    await this.step(onStep, `I'm checking the line at ${line.network}…`, 1.2);
    const who = line.label === 'Your line' ? 'your line' : line.label ? `${line.label}'s line` : groupPhoneNumber(line.number);
    return { blocks: [say(`${naira(amount)} of airtime on ${who}. It lands the moment you confirm.`), { kind: 'panel', panel: airtimePanelFor(line, amount) }], pending: null };
  }

  private async finishBill(onStep: OnStep | undefined, meter: Meter, amount: number, repeat: boolean): Promise<Reply> {
    const disco = discoById(meter.disco);
    await this.step(onStep, `I'm looking the meter up at ${disco?.name ?? 'the company'}…`, 1.4);
    await this.step(onStep, "I'm checking the name on it…", 1);
    const words = repeat
      ? `Your usual: ${disco?.name}, meter ${groupMeter(meter.meter)}, in ${meter.name}'s name. ${naira(amount)}, the same as last time.`
      : `${disco?.name}, ${meter.meterKind} meter ${groupMeter(meter.meter)}, in ${meter.name}'s name. Here is what I have.`;
    return { blocks: [say(words), { kind: 'panel', panel: billPanelFor(meter, amount) }], pending: null };
  }

  /* ---- an ask panel, filled or not ---- */

  /** What the words carry for a tool's fields. */
  private pieces(tool: AskTool, text: string, ctx: Context, values: AskValues): { values: AskValues; found: AskFound } {
    const out: AskValues = {};
    const found: AskFound = {};
    const amount = amountIn(text);
    if (tool === 'transfer') {
      const number = accountIn(text);
      const person = number ? whose(number) : personIn(text);
      if (person) {
        out.who = person.name;
        found.person = person;
      } else if (number) {
        out.who = number;
        found.person = null;
      } else if (looksLikeName(text) && !amount) {
        out.who = text.trim();
        found.person = null;
      }
      if (amount) out.amount = amount;
    } else if (tool === 'data' || tool === 'airtime') {
      const known = savedLineIn(text, savedOf(ctx).lines);
      const number = known?.number ?? phoneIn(text);
      if (number) out.number = number;
      else if (/\b(my (own )?(line|number|phone)|myself|for me|me)\b/.test(text.toLowerCase())) {
        const own = lineOf(ctx.account.phone);
        if (own) out.number = own.number;
      }
      const at = out.number ?? values.number;
      const network = at ? networkOf(at) : null;
      if (tool === 'data' && network) {
        const gb = dataIn(text);
        const usual = this.savedLine({ number: at!, network }, ctx)?.plan;
        const plan = planFor(network, { gb, amount: gb ? null : amount, usual: theUsual(text.toLowerCase()) ? usual : null });
        if (plan) out.plan = plan.id;
      }
      if (tool === 'airtime' && amount) out.amount = amount;
    } else {
      const disco = discoIn(text);
      if (disco) out.disco = disco.id;
      const kind = meterKindIn(text);
      if (kind) out.meterKind = kind;
      const meter = meterIn(text);
      if (meter) {
        out.meter = meter;
        found.meter = undefined;
      }
      if (amount) out.amount = amount;
    }
    return { values: out, found };
  }

  /** The ask, with what it has now: everything there, the thing goes on;
      something still missing, the panel is filled as far as it goes. */
  private async settle(ask: AskPanel, values: AskValues, found: AskFound, ctx: Context, onStep: OnStep | undefined, answered: boolean): Promise<Reply> {
    const v = { ...ask.values, ...values };
    const f: AskFound = { ...ask.found, ...found };
    /* the person the words name, or the number they give */
    if (ask.tool === 'transfer' && v.who && f.person === undefined) {
      const number = accountIn(v.who) ?? (/^\d{10}$/.test(v.who) ? v.who : null);
      f.person = number ? whose(number) : personIn(v.who);
    }
    /* whose the meter is */
    let note: string | undefined;
    if (ask.tool === 'pay' && v.meter && v.disco && v.meterKind && !meterProblem(v.meter) && f.meter === undefined) {
      await this.step(onStep, `I'm looking the meter up at ${discoById(v.disco)?.name ?? 'the company'}…`, 1.2);
      f.meter = await this.meters.lookup(v.disco, v.meterKind, v.meter);
      if (!f.meter) note = `There is no ${v.meterKind} meter ${groupMeter(v.meter)} at ${discoById(v.disco)?.name ?? 'that company'}. Check the digits, or the company.`;
    }
    if (ask.tool === 'transfer' && v.who && f.person === null) note = /^\d{10}$/.test(v.who) ? undefined : `I do not know anyone called ${v.who}. Their account number would do it.`;
    const missing = askMissing({ fields: ask.fields, values: v, found: f });
    const filled: Block = { kind: 'fill', askId: ask.id, values: v, found: f, note };
    if (missing.length) {
      const first = missing[0]!;
      const lead = answered ? '' : Object.keys(values).length ? 'Got it. ' : '';
      const question = note && (first === 'who' || first === 'meter') ? note : `${lead}${askQuestion[first]}`;
      return { blocks: [filled, say(question)], pending: { need: 'ask', ask: { ...ask, values: v, found: f, note } } };
    }
    if (ask.tool === 'transfer' && v.amount! > ctx.balance) {
      return {
        blocks: [filled, say(`That is more than the ${naira(ctx.balance)} you have. How much should I send ${firstName(f.person!)} instead?`)],
        pending: { need: 'ask', ask: { ...ask, values: { ...v, amount: undefined }, found: f } },
      };
    }
    const done: Block = { ...filled, done: true };
    const rest = await this.complete(ask.tool, v, f, ctx, onStep);
    return { ...rest, blocks: [done, ...rest.blocks] };
  }

  /** Everything is there: the steps, the words and the panel to confirm. */
  private async complete(tool: AskTool, v: AskValues, f: AskFound, ctx: Context, onStep: OnStep | undefined): Promise<Reply> {
    if (tool === 'transfer') {
      await this.transfer(onStep, f.person!);
      return {
        blocks: [
          say(`${naira(v.amount!)} to ${f.person!.name} at ${f.person!.bank}. Here is what I have; the amount is yours to change.`),
          { kind: 'panel', panel: transferPanel(f.person!, v.amount!) },
        ],
        pending: null,
      };
    }
    const network = networkOf(v.number ?? '');
    if (tool === 'data' || tool === 'airtime') {
      const known = this.savedLine({ number: v.number!, network: network! }, ctx);
      const line: PhoneLine = { number: v.number!, network: network!, label: known?.label };
      if (tool === 'data') return this.finishData(onStep, line, planById(v.plan!)!, false);
      return this.finishAirtime(onStep, line, v.amount!);
    }
    const known = savedOf(ctx).meters.find(m => m.meter === v.meter);
    return this.finishBill(onStep, { disco: v.disco!, meterKind: v.meterKind!, meter: v.meter!, name: f.meter?.name ?? known?.name ?? 'the account holder', label: known?.label }, v.amount!, false);
  }

  /* ---- the ask itself ---- */

  async ask(ask: Ask, ctx: Context, onStep?: OnStep): Promise<Reply> {
    await wait(this.delay);
    const text = (ask.text ?? '').trim();
    const first = ctx.account.firstName;

    /* an ask panel filled and continued */
    if (ask.answers && ctx.pending?.need === 'ask' && ctx.pending.ask.id === ask.answers.askId) {
      const pending = ctx.pending.ask;
      /* what changed is looked at afresh */
      const found: AskFound = { ...pending.found };
      if (ask.answers.values.who !== pending.values.who) delete found.person;
      if (ask.answers.values.meter !== pending.values.meter || ask.answers.values.disco !== pending.values.disco || ask.answers.values.meterKind !== pending.values.meterKind) delete found.meter;
      return this.settle({ ...pending, found: {} }, { ...pending.values, ...ask.answers.values }, found, ctx, onStep, true);
    }

    /* a photo: read it, and go on from what it says */
    if (ask.photo) {
      onStep?.("I'm reading the photo…");
      const reading = ask.photo.reading ?? (await this.reader.read(ask.photo.uri));
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
        blocks.push(say(`${naira(amount)} to ${firstName(to)}, then. Here is what I have.`), { kind: 'panel', panel: transferPanel(to, amount) });
        return { blocks, pending: null, reading };
      }
      const asking = newAsk('transfer', { who: to.name }, ctx, { person: to });
      blocks.push(say(`How much should I send ${firstName(to)}?`), { kind: 'ask', ask: asking });
      return { blocks, pending: { need: 'ask', ask: asking }, reading };
    }

    if (!text) return { blocks: [say('Say what you need, or show me a photo of an account number.')], pending: null };
    const lower = text.toLowerCase();
    const amount = amountIn(text);

    /* an amount for a panel already up */
    if (ctx.pending?.need === 'amount-for' && amount) {
      return { blocks: [{ kind: 'amend', panelId: ctx.pending.panel.id, amount }, say(`${naira(amount)} it is.`)], pending: null };
    }

    const intent = intentOf(lower, ctx);

    /* words for an ask panel already up: what they carry goes into it */
    if (ctx.pending?.need === 'ask' && (!intent || intent === ctx.pending.ask.tool)) {
      const pending = ctx.pending.ask;
      const { values, found } = this.pieces(pending.tool, text, ctx, pending.values);
      if (Object.keys(values).length) return this.settle(pending, values, found, ctx, onStep, false);
      if (!intent) {
        const missing = askMissing(pending)[0];
        if (missing && !/\b(hi|hello|hey|balance|how much|dollar|help|what can)\b/.test(lower)) return { blocks: [say(`I did not catch that. ${askQuestion[missing]}`)], pending: ctx.pending };
      }
    }
    const keep: Pending = ctx.pending?.need === 'ask' ? ctx.pending : null;

    /* the first question, from its frame: an account with nothing in it yet gets the plain answer, and the line under it */
    if (/\b(what can you do|what do you do|what are you|who are you|what is this)\b/.test(lower)) {
      if (!ctx.account.demo && ctx.balance === 0)
        return {
          blocks: [say('Very little yet, and I would rather say so. I have no history to read.'), { kind: 'aside', text: 'I only tell you things I have seen in your own money.' }],
          pending: keep,
        };
      return {
        blocks: [say('I can send money, buy airtime and data, pay the light bill, read an account number off a photo, and say what I see in your money. Ask, or just say what you need.')],
        pending: keep,
      };
    }
    if (/\b(hi|hello|hey|good (morning|afternoon|evening))\b/.test(lower) && lower.length < 24) {
      return { blocks: [say(`Hello ${first}. I can send money, buy airtime and data, pay the light bill, and read an account number off a photo. What do you need?`)], pending: keep };
    }

    if (intent === 'transfer') {
      if (ctx.online === false) return { blocks: [say(OFFLINE_LINE)], pending: keep };
      const number = accountIn(text);
      const person = number ? whose(number) : personIn(text);
      /* the whole balance to an account never paid: Beetle stops, and says why */
      const asked = wantsEverything(lower) ? ctx.balance : amount;
      const paidBefore = !!person && (PEOPLE.some(p => p.number === person.number) || !!ctx.saved?.people.some(p => p.number === person.number));
      if (person && asked && refuses(asked, ctx.balance, paidBefore)) return { blocks: [say(refusalLine(naira(ctx.balance), naira(TRY_FIRST)))], pending: keep };
      if (person && amount) {
        if (amount > ctx.balance) {
          const asking = newAsk('transfer', { who: person.name }, ctx, { person }, `That is more than the ${naira(ctx.balance)} you have.`);
          return {
            blocks: [say(`That is more than the ${naira(ctx.balance)} you have. How much should I send ${firstName(person)} instead?`), { kind: 'ask', ask: asking }],
            pending: { need: 'ask', ask: asking },
          };
        }
        return this.complete('transfer', { who: person.name, amount }, { person }, ctx, onStep);
      }
      const who = person?.name ?? number ?? undefined;
      const asking = newAsk('transfer', { who, amount: amount ?? undefined }, ctx, person ? { person } : who ? { person: null } : undefined);
      const words = person
        ? `${person.name} at ${person.bank}. How much?`
        : amount
          ? `${naira(amount)} — to whom? A name I know, or the account number.`
          : 'Who to, and how much? A name I know, or an account number — or show me a photo of one.';
      return { blocks: [say(words), { kind: 'ask', ask: asking }], pending: { need: 'ask', ask: asking } };
    }

    if (intent === 'pay') {
      const known = savedMeterIn(text, savedOf(ctx).meters);
      const disco = discoIn(text);
      const kind = meterKindIn(text);
      const meter = meterIn(text);
      /* the usual, or one named: no asking */
      if (known && !meter) {
        return this.finishBill(
          onStep,
          { disco: known.disco, meterKind: known.meterKind, meter: known.meter, name: known.name, label: known.label },
          amount ?? known.amount ?? BILL_AMOUNTS[1]!,
          !amount,
        );
      }
      const values: AskValues = { disco: disco?.id, meterKind: kind ?? undefined, meter: meter ?? undefined, amount: amount ?? undefined };
      const asking = newAsk('pay', values, ctx);
      if (!askMissing(asking).length) return this.settle(asking, {}, {}, ctx, onStep, false);
      const missing = askMissing(asking)[0]!;
      const words = meter
        ? `A meter I have not paid before. ${askQuestion[missing]}`
        : `Which meter? ${savedOf(ctx).meters.length ? 'One you have paid before, or a new one — ' : ''}${askQuestion[missing].charAt(0).toLowerCase()}${askQuestion[missing].slice(1)}`;
      return { blocks: [say(words), { kind: 'ask', ask: asking }], pending: { need: 'ask', ask: asking } };
    }

    if (intent === 'data') {
      const line = this.lineFor(text, ctx);
      const known = line ? this.savedLine(line, ctx) : undefined;
      const gb = dataIn(text);
      const plan = line ? planFor(line.network, { gb, amount: gb ? null : amount, usual: known?.plan ?? (line.label === 'Your line' ? USUAL_LINE_PLAN(ctx) : null) }) : null;
      if (line && plan) return this.finishData(onStep, line, plan, !gb && !amount);
      const asking = newAsk('data', { number: line?.number, plan: plan?.id }, ctx);
      const words = !line
        ? forSomeoneElse(lower)
          ? 'I do not have a number for them yet. Which number, and which plan?'
          : 'Which number, and which plan?'
        : `${line.label && line.label !== 'Your line' ? `${line.label}'s line` : line.label === 'Your line' ? 'Your line' : `${groupPhoneNumber(line.number)}, on ${line.network}`}. Which plan?`;
      return { blocks: [say(words), { kind: 'ask', ask: asking }], pending: { need: 'ask', ask: asking } };
    }

    if (intent === 'airtime') {
      const line = this.lineFor(text, ctx);
      const known = line ? this.savedLine(line, ctx) : undefined;
      const worth = amount ?? (theUsual(lower) || (known && !known.own && !amount) ? known?.amount : undefined);
      if (line && worth) return this.finishAirtime(onStep, line, worth);
      const asking = newAsk('airtime', { number: line?.number, amount: amount ?? undefined }, ctx);
      const words = !line
        ? 'Which number, and how much?'
        : line.label === 'Your line'
          ? 'On your line. How much?'
          : `${line.label ? `${line.label}'s line` : `${groupPhoneNumber(line.number)}, on ${line.network}`}. How much?`;
      return { blocks: [say(words), { kind: 'ask', ask: asking }], pending: { need: 'ask', ask: asking } };
    }

    if (/\b(money (is|gets) tight|things (are|get) tight|tight this month|gets tight|if money)\b/.test(lower)) {
      return {
        blocks: [
          say(
            'Tell me, and I stop moving money into savings and stop asking you to. Your goals wait where they are: nothing is lost and nothing is charged. It is also a switch under Standing instructions, in Settings.',
          ),
        ],
        pending: keep,
      };
    }
    if (/\b(saving for|should i (be )?sav|what to save|save for)\b/.test(lower)) {
      return {
        blocks: [
          say(
            'A cushion first: three months of what you spend, so one bad month touches nothing else. After that, whatever you would put a date on. A goal with a rule feeding it looks after itself.',
          ),
        ],
        pending: keep,
      };
    }
    if (/\b(dollar|dollars|usd|\$)/.test(lower)) {
      return {
        blocks: [
          { kind: 'note', title: 'Holding dollars', body: 'Your naira buys dollars at the rate you see, and the dollars sit in their own place, in a domiciliary account at our partner bank.' },
          say(
            `Right now ₦${ctx.rate.toLocaleString('en-NG')} buys a dollar, so ${naira(ctx.balance)} would be about ${Math.round(ctx.balance / ctx.rate).toLocaleString('en-NG')} USD. Your dollars are on the card: tap the chip to see them, or say "convert" to move some across.`,
          ),
        ],
        pending: keep,
      };
    }
    if (/\b(balance|how much|left|have i got|do i have)\b/.test(lower)) {
      return {
        blocks: [say(`You have ${naira(ctx.balance)} in naira, about ${Math.round(ctx.balance / ctx.rate).toLocaleString('en-NG')} dollars' worth. Nothing is on its way out.`)],
        pending: keep,
      };
    }
    const person = accountIn(text) ? whose(accountIn(text)!) : personIn(text);
    if (person) {
      const asking = newAsk('transfer', { who: person.name }, ctx, { person });
      return { blocks: [say(`${person.name} at ${person.bank}, ${groupAccount(person.number)}. Send them something?`), { kind: 'ask', ask: asking }], pending: { need: 'ask', ask: asking } };
    }
    return { blocks: [say('I can send money, buy airtime and data, pay the light bill, say how much you have, and read an account number off a photo. Which one?')], pending: keep };
  }
}

/** The account's own line, from its number. */
export function lineOf(phone: string): PhoneLine | null {
  const network = networkOf(phone);
  return network ? { number: normalisePhone(phone), network, label: 'Your line' } : null;
}

/** The plan the demo account's own line has bought before. */
const USUAL_LINE_PLAN = (ctx: Context) => (ctx.account.demo ? 'mtn-5gb-30d' : null);

/** One to three plain words, and not a question: a name, as far as the words go. */
const looksLikeName = (text: string) =>
  /^[a-z]+(?:[ .'-][a-z]+){0,2}$/i.test(text.trim()) && !/\b(hi|hello|hey|how|what|which|why|when|where|balance|much|have|dollars?|help|yes|no|ok|okay|thanks|thank)\b/i.test(text);

/** Which thing the words are about, if any. */
export function intentOf(lower: string, ctx?: Context): AskTool | null {
  if (/\b(electric|electricity|light|nepa|phcn|meter|power|bills?|token|units|disco)\b/.test(lower) || discoIn(lower)) return 'pay';
  if (/\b(data|gb|mb|bundle|internet)\b/.test(lower)) return 'data';
  if (/\b(airtime|recharge|credit|top ?up)\b/.test(lower)) return 'airtime';
  if (/\b(send|transfer|give|move)\b/.test(lower)) return 'transfer';
  if (/\bpay\b/.test(lower)) {
    if (personIn(lower) || accountIn(lower)) return 'transfer';
    if (ctx && savedOf(ctx).meters.some(m => labelIn(lower, m.label))) return 'pay';
  }
  return null;
}
