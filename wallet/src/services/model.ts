/* Beetle with a real model behind it. The same interface as the scripted
   one: an ask in, words and panels out, with what it is doing said as it
   goes. The model is Claude, through the Messages API, with tools that do
   what the app does — find an account, a line or a meter, put up the panel
   of fields a thing still needs, prepare a transfer, a bill, data or
   airtime, identify a number read off a photo — and every tool takes a
   line, in Beetle's own voice, that the screen shows while it works. The
   model never moves money: it puts up a panel, and the owner's passcode
   moves it.

   The key comes from the phone's own keychain (set on the lab's model
   screen) or from the build (EXPO_PUBLIC_ANTHROPIC_API_KEY at export time).
   Neither is the shape a shipped app should have — that is a server that
   keeps the key — and EXPO_PUBLIC_ANTHROPIC_BASE_URL is where such a server
   goes when there is one, with no other change.

   Plain fetch rather than the SDK: React Native is not a runtime the SDK
   supports, and the request is small. */
import { groupAccount, naira } from '../lib/format';
import type { AgentService, Ask, AskFound, AskTool, AskValues, Block, Context, OnStep, Panel, Pending, Person, Reply } from './agent';
import { PEOPLE, accountIn, airtimePanelFor, askMissing, billPanelFor, dataPanelFor, feeFor, foundPanel, lineOf, newAsk, personIn, savedOf, transferPanel, whose } from './agent';
import {
  MockMeters,
  discoById,
  discoIn,
  groupMeter,
  groupPhoneNumber,
  meterProblem,
  networkOf,
  normalisePhone,
  phoneProblem,
  planById,
  planName,
  plansFor,
  savedLineIn,
  savedMeterIn,
  type MeterKind,
  type MeterService,
  type Network,
} from './nigeria';
import type { Reading, ReaderService } from './reader';
import { secure } from './storage';

export const MODEL = 'claude-opus-5-5';
const API = 'https://api.anthropic.com';
const KEY = 'beetle.model.key.v1';
/** How many times the model may call tools for one ask before it must answer. */
const ROUNDS = 8;

export type ModelConfig = { key: string; baseUrl: string; from: 'phone' | 'build' };

/** Where the key is: the phone's own first, then the build's. */
export const modelKey = {
  async config(): Promise<ModelConfig | null> {
    const baseUrl = (process.env.EXPO_PUBLIC_ANTHROPIC_BASE_URL || API).replace(/\/$/, '');
    const own = await secure.get(KEY);
    if (own) return { key: own, baseUrl, from: 'phone' };
    const built = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
    if (built) return { key: built, baseUrl, from: 'build' };
    return null;
  },
  set: (key: string) => secure.set(KEY, key.trim()),
  clear: () => secure.remove(KEY),
};

/** A line of the conversation so far, for the model's memory. */
export type Line = { who: 'you' | 'beetle'; text: string };

export class ModelError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

/* ---- the wire ---- */

type TextBlock = { type: 'text'; text: string };
type ToolUse = { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> };
type ContentBlock = TextBlock | ToolUse | { type: string; [k: string]: unknown };
type Message = { role: 'user' | 'assistant'; content: string | ContentBlock[] };
type Response = {
  content: ContentBlock[];
  stop_reason: string;
  model?: string;
  stop_details?: { category?: string | null } | null;
};

const saying = {
  type: 'string',
  description: 'One short line, first person, present tense, ending with …, that the owner sees while you work: "I\'m finding Sarah\'s account at GTBank…"',
};
const tool = (name: string, description: string, properties: Record<string, unknown>) => ({
  name,
  description,
  strict: true,
  input_schema: {
    type: 'object',
    properties: { ...properties, saying },
    required: [...Object.keys(properties), 'saying'],
    additionalProperties: false,
  },
});
/** A piece the model may leave out: null where it was not said. */
const maybe = (type: 'string' | 'number', description: string) => ({ type: [type, 'null'], description });

export const TOOLS = [
  tool('find_account', 'Call this before any transfer, with the name or the ten-digit account number the owner gave. It answers with the account, or that there is no such person.', {
    query: { type: 'string', description: 'the name as the owner said it, or the account number' },
  }),
  tool(
    'find_line',
    'Which phone line data or airtime is for. Call it with what the owner said — "mum", "my line", "me", or an eleven-digit number. It answers with the number, its network, whose it is and what was bought for it before, or that the number is new and which network it is on, or that there is nobody saved by that name.',
    { query: { type: 'string' } },
  ),
  tool(
    'find_meter',
    'Which electricity meter a bill is for. Call it with what the owner said — "my light", "the usual", "mum\'s flat", a company\'s name, or a meter number. It answers with the meter, its company, prepaid or postpaid, the name on it and what was paid last, or that it is not one paid before.',
    { query: { type: 'string' } },
  ),
  tool('list_plans', 'The data plans a network sells, with their prices. Call it before preparing data for a line, to pick the plan the owner meant.', {
    network: { type: 'string', enum: ['MTN', 'Airtel', 'Glo', '9mobile'] },
  }),
  tool('lookup_meter', 'Whose a meter is, at a company. Call it for a meter the owner has not paid before, once the company, the kind and the number are known.', {
    disco: { type: 'string', description: "the company's id, from ask_for's list: ikeja, eko, abuja, jos, kano, ibadan, enugu, portharcourt, benin, kaduna, yola" },
    meter_kind: { type: 'string', enum: ['prepaid', 'postpaid'] },
    meter: { type: 'string', description: 'eight to thirteen digits' },
  }),
  tool(
    'ask_for',
    'Puts up the panel of fields a thing still needs, with what the owner has said already in it, so they can fill the rest. Call it whenever a piece is missing — the amount, who to, the number, the plan, the company, prepaid or postpaid, the meter — with everything you know so far; null for what was not said. Call it again with more when the owner says more. Once nothing is missing, call prepare_transfer, prepare_data, prepare_airtime or prepare_bill instead.',
    {
      tool: { type: 'string', enum: ['transfer', 'data', 'airtime', 'pay'] },
      who: maybe('string', 'a name or ten-digit account number, for a transfer'),
      amount: maybe('number', 'in naira'),
      number: maybe('string', 'eleven digits, for data or airtime'),
      plan_id: maybe('string', 'a plan id from list_plans, for data'),
      disco: maybe('string', "the electricity company's id, for a bill"),
      meter_kind: maybe('string', 'prepaid or postpaid, for a bill'),
      meter: maybe('string', 'the meter number, for a bill'),
    },
  ),
  tool(
    'prepare_transfer',
    'Puts up the transfer for the owner to confirm, once find_account has found the person. It answers with the fee and when it lands, or that the amount is more than the balance.',
    {
      name: { type: 'string' },
      bank: { type: 'string' },
      number: { type: 'string', description: 'ten digits' },
      amount: { type: 'number', description: 'in naira' },
    },
  ),
  tool('prepare_bill', 'Puts up the electricity payment for the owner to confirm: the company, the meter, the name on it and the amount. Call it once all four are known.', {
    disco: { type: 'string', description: "the company's id" },
    meter_kind: { type: 'string', enum: ['prepaid', 'postpaid'] },
    meter: { type: 'string' },
    amount: { type: 'number', description: 'in naira' },
  }),
  tool('prepare_data', 'Puts up the data plan for the owner to confirm, on a line. Call it once the number and the plan are known.', {
    number: { type: 'string', description: 'eleven digits' },
    plan_id: { type: 'string', description: "from list_plans, on the line's own network" },
  }),
  tool('prepare_airtime', 'Puts up the airtime for the owner to confirm, on a line. Call it once the number and the amount are known.', {
    number: { type: 'string', description: 'eleven digits' },
    amount: { type: 'number', description: 'in naira, ₦100 to ₦10,000' },
  }),
  tool('identify_account', 'Says whose a ten-digit account number is, and shows the owner what was read. Call it with a number read off a photo, or one the owner typed.', {
    number: { type: 'string', description: 'ten digits' },
  }),
  tool('change_amount', "Changes the amount on a panel already up, when the owner corrects it. Use the panel's id from the earlier tool answer.", {
    panel_id: { type: 'string' },
    amount: { type: 'number', description: 'in naira' },
  }),
];

const VOICE = `You are Beetle, the money assistant inside the Beetle wallet app, talking with the account's owner in the chat on their home screen.

Voice: warm, plain, brief. First person. One to three short sentences, no more. Naira with the ₦ sign and thousands separators. No headings, no lists, no markdown, no emoji. Use the owner's first name now and then, not every time.

What you do: send money to a person or an account number, buy airtime and data for a phone line, pay an electricity bill on a meter, say the balance and what it is worth in dollars, and read an account number off a photo the owner sends. Nothing else moves money; for anything else, say what you can do.

How money moves: you never move it yourself. A tool puts up a panel; the owner reads it, presses its button and confirms with their passcode. Before any panel, work out what the thing needs: a transfer needs who and how much; data needs the number and the plan; airtime needs the number and the amount; a bill needs the company, prepaid or postpaid, the meter number and the amount. Use find_account, find_line and find_meter to fill in from what the owner has paid before — "mum", "my light", "the usual" mean what they paid before, and a name or a meter paid before needs no asking. When something is still missing, call ask_for with everything you know: it puts up the fields for the owner to fill, so do not ask in words as well beyond one short line. When the owner types a missing piece, call ask_for again with everything; when the owner fills the panel in and continues, you get its values — then call prepare_transfer, prepare_data, prepare_airtime or prepare_bill. For a meter not paid before, lookup_meter first, and refuse a meter it does not find. If the amount is more than the balance, say so and ask for another. After a panel is up, say one short line about it — the fee, when it lands — and do not repeat the panel's rows.

Save the owner time and trouble: fill in what you can, offer the usual, and never let more go than they have.

When the owner sends a photo, the words read off it are in their message; if there is a ten-digit account number among them, call identify_account, and if they said an amount go on to the transfer.

----

Every tool takes "saying": one short line, first person, present tense, ending with …, that the owner sees while you work.`;

const when = (d: Date) =>
  d.toLocaleString('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

function state(ctx: Context, now: Date): string {
  const a = ctx.account;
  const lines = [
    `Now: ${when(now)}.`,
    `Owner: ${a.firstName} ${a.lastName}, account ${groupAccount(a.accountNumber)} at Beetle, phone ${groupPhoneNumber(a.phone)}${networkOf(a.phone) ? ` (${networkOf(a.phone)})` : ''}.`,
    `Balance: ${naira(ctx.balance)}. A dollar is ₦${ctx.rate.toLocaleString('en-NG')}.`,
  ];
  const s = savedOf(ctx);
  {
    if (s.people.length) lines.push(`People paid before: ${s.people.map(p => `${p.name} (${p.bank} ${p.number}, ${p.when.toLowerCase()})`).join('; ')}.`);
    if (s.lines.length)
      lines.push(
        `Lines topped up: ${s.lines.map(l => `${l.label} ${groupPhoneNumber(l.number)} on ${l.network}${l.plan ? `, usually ${planName(planById(l.plan)!)}` : ''}${l.amount ? `, usually ${naira(l.amount)} airtime` : ''}`).join('; ')}.`,
      );
    if (s.meters.length)
      lines.push(
        `Meters paid: ${s.meters.map(m => `${m.label}: ${discoById(m.disco)?.name ?? m.disco} ${m.meterKind} ${groupMeter(m.meter)} in ${m.name}'s name${m.amount ? `, usually ${naira(m.amount)}` : ''}`).join('; ')}.`,
      );
  }
  const p = ctx.pending;
  if (p?.need === 'ask') {
    const filled = Object.entries(p.ask.values)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    lines.push(
      `An ask panel (${p.ask.id}, for ${p.ask.tool}) is up with ${filled || 'nothing'} filled and ${askMissing(p.ask).join(', ') || 'nothing'} missing. What the owner says next may be one of the missing pieces: call ask_for again with everything known, or prepare_${p.ask.tool === 'pay' ? 'bill' : p.ask.tool} once nothing is missing.`,
    );
  }
  if (p?.need === 'amount-for') lines.push(`You asked what the amount on panel ${p.panel.id} should be; an amount alone answers that — call change_amount with it.`);
  return lines.join('\n');
}

/** The conversation so far as the model sees it: turns merged by speaker,
    the ask itself left off the end. */
function history(lines: Line[] | undefined, ask: string): Message[] {
  const out: Message[] = [];
  for (const l of lines ?? []) {
    const role = l.who === 'you' ? 'user' : 'assistant';
    const last = out[out.length - 1];
    if (last && last.role === role) last.content = `${last.content}\n\n${l.text}`;
    else out.push({ role, content: l.text });
  }
  const last = out[out.length - 1];
  if (last && last.role === 'user' && last.content === ask) out.pop();
  /* the model's memory starts with the owner speaking */
  while (out.length && out[0]!.role === 'assistant') out.shift();
  return out;
}

const text = (r: Response): string[] =>
  r.content
    .filter((b): b is TextBlock => b.type === 'text')
    .map(b => b.text.trim())
    .filter(Boolean);

/** An ask panel's values, as words for the model. */
const valuesWords = (v: AskValues) =>
  Object.entries(v)
    .filter(([, x]) => x !== undefined && x !== '')
    .map(([k, x]) => `${k}: ${x}`)
    .join(', ');

export class ModelAgent implements AgentService {
  constructor(
    private readonly reader: ReaderService,
    private readonly config: () => Promise<ModelConfig | null> = modelKey.config,
    private readonly fetchFn: typeof fetch = (...a) => fetch(...a),
    private readonly clock: () => Date = () => new Date(),
    private readonly meters: MeterService = new MockMeters(300),
  ) {}

  async ask(ask: Ask, ctx: Context, onStep?: OnStep): Promise<Reply> {
    const cfg = await this.config();
    if (!cfg) throw new ModelError('There is no key for the model on this phone or in this build.');

    /* a photo is read here, on the device, and the words go to the model */
    let reading: Reading | undefined;
    let said = (ask.text ?? '').trim();
    if (ask.photo) {
      onStep?.("I'm reading the photo…");
      reading = await this.reader.read(ask.photo.uri);
      const words = reading.text.trim();
      said = `${said ? said + '\n\n' : ''}[The owner sent a photo. ${words ? `The words read off it, top to bottom:\n${words}` : 'Nothing could be read off it.'}${reading.real ? '' : ' (On this device the reader is a stand-in, reading the sample slip.)'}]`;
    }
    /* an ask panel filled in and continued */
    if (ask.answers)
      said = `${said ? said + '\n\n' : ''}[The owner filled in the ask panel ${ask.answers.askId} and pressed Continue: ${valuesWords(ask.answers.values) || 'nothing'}. Go on to the panel to confirm.]`;
    if (!said) said = '[The owner sent nothing.]';

    const messages: Message[] = [...history(ctx.transcript, (ask.text ?? '').trim()), { role: 'user', content: said }];
    const panels: Block[] = [];
    const steps: string[] = [];
    let pending: Pending = ctx.pending?.need === 'ask' ? ctx.pending : null;
    let says: string[] = [];
    const run = (name: string, input: Record<string, unknown>): Promise<unknown> => {
      const line = typeof input.saying === 'string' ? input.saying : null;
      if (line) {
        onStep?.(line);
        steps.push(line);
      }
      return this.tool(name, input, ctx, reading, panels, p => {
        pending = p;
      });
    };

    for (let round = 0; round <= ROUNDS; round++) {
      const r = await this.post(cfg, ctx, messages);
      if (r.stop_reason === 'refusal') {
        return {
          blocks: [{ kind: 'say', text: 'That is one I cannot help with here.' }],
          pending: null,
          reading,
        };
      }
      const uses = r.content.filter((b): b is ToolUse => b.type === 'tool_use');
      if (r.stop_reason !== 'tool_use' || !uses.length || round === ROUNDS) {
        says = text(r);
        break;
      }
      /* the words before a tool call are what it is doing, not the answer */
      for (const t of text(r)) if (!steps.includes(t)) onStep?.(t.replace(/\.$/, '…'));
      messages.push({ role: 'assistant', content: r.content });
      const results: ContentBlock[] = [];
      for (const u of uses) {
        try {
          results.push({ type: 'tool_result', tool_use_id: u.id, content: JSON.stringify(await run(u.name, u.input)) });
        } catch (e) {
          results.push({ type: 'tool_result', tool_use_id: u.id, content: (e as Error).message, is_error: true });
        }
      }
      messages.push({ role: 'user', content: results });
    }

    const blocks: Block[] = [];
    for (const s of says) for (const para of s.split(/\n{2,}/)) if (para.trim()) blocks.push({ kind: 'say', text: para.trim() });
    if (!blocks.length && !panels.length) blocks.push({ kind: 'say', text: 'I did not catch that. Say it another way?' });
    /* a panel to confirm closes the ask it came from */
    const confirmable = panels.some(b => b.kind === 'panel' && b.panel.action);
    if (confirmable && pending?.need === 'ask') {
      const p = pending;
      panels.unshift({ kind: 'fill', askId: p.ask.id, values: p.ask.values, found: p.ask.found, done: true });
      pending = null;
    }
    return { blocks: [...blocks, ...panels], pending, reading };
  }

  /* what each tool does: the same panels the scripted Beetle puts up */
  private async tool(name: string, input: Record<string, unknown>, ctx: Context, reading: Reading | undefined, panels: Block[], hold: (p: Pending) => void): Promise<unknown> {
    const str = (k: string) => (typeof input[k] === 'string' ? (input[k] as string).trim() : '');
    const num = (k: string) => (typeof input[k] === 'number' ? (input[k] as number) : Number(String(input[k] ?? '').replace(/[^\d.]/g, '')));
    const saved = savedOf(ctx);
    switch (name) {
      case 'find_account': {
        const q = str('query');
        const number = accountIn(q);
        const p = number ? whose(number, reading) : personIn(q, PEOPLE);
        if (!p)
          return {
            found: false,
            hint: 'No such person among the accounts the owner has paid. Ask for the account number.',
          };
        return { found: true, name: p.name, bank: p.bank, number: p.number };
      }
      case 'find_line': {
        const q = str('query');
        const known = savedLineIn(q, saved.lines) ?? (/^(me|myself|my line|my number|mine)$/i.test(q) ? (saved.lines.find(l => l.own) ?? null) : null);
        if (known) {
          return {
            found: true,
            number: known.number,
            network: known.network,
            label: known.label,
            own: !!known.own,
            usual_plan: known.plan ? { plan_id: known.plan, name: planName(planById(known.plan)!), price: planById(known.plan)!.price } : null,
            usual_airtime: known.amount ?? null,
          };
        }
        const digits = normalisePhone(q);
        if (/^\d{11}$/.test(digits)) {
          const problem = phoneProblem(digits);
          if (problem) return { found: false, problem };
          return { found: false, number: digits, network: networkOf(digits), hint: 'A number not topped up before; its network is known from the digits.' };
        }
        const own = lineOf(ctx.account.phone);
        return { found: false, hint: `Nobody saved by that name. The owner's own line is ${own ? `${own.number} on ${own.network}` : 'unknown'}; otherwise ask for the number.` };
      }
      case 'find_meter': {
        const q = str('query');
        const known = savedMeterIn(q, saved.meters);
        if (!known) {
          const disco = discoIn(q);
          return { found: false, hint: 'Not a meter paid before. Ask for the company, prepaid or postpaid, and the meter number.', disco: disco?.id ?? null };
        }
        return {
          found: true,
          label: known.label,
          disco: known.disco,
          company: discoById(known.disco)?.name,
          meter_kind: known.meterKind,
          meter: known.meter,
          name: known.name,
          usual_amount: known.amount ?? null,
        };
      }
      case 'list_plans': {
        const network = str('network') as Network;
        const plans = plansFor(network);
        if (!plans.length) throw new Error('network must be MTN, Airtel, Glo or 9mobile');
        return { network, plans: plans.map(p => ({ plan_id: p.id, name: planName(p), price: p.price })) };
      }
      case 'lookup_meter': {
        const disco = str('disco');
        const kind = str('meter_kind') as MeterKind;
        const meter = str('meter').replace(/\D/g, '');
        if (!discoById(disco)) throw new Error('disco must be one of ikeja, eko, abuja, jos, kano, ibadan, enugu, portharcourt, benin, kaduna, yola');
        const problem = meterProblem(meter);
        if (problem) return { found: false, problem };
        const record = await this.meters.lookup(disco, kind, meter);
        return record ? { found: true, ...record } : { found: false, problem: `No ${kind} meter ${groupMeter(meter)} at ${discoById(disco)?.name}` };
      }
      case 'ask_for': {
        const tool = str('tool') as AskTool;
        if (!['transfer', 'data', 'airtime', 'pay'].includes(tool)) throw new Error('tool must be transfer, data, airtime or pay');
        const values: AskValues = {};
        const found: AskFound = {};
        if (str('who')) {
          values.who = str('who');
          const number = accountIn(values.who);
          found.person = number ? whose(number, reading) : personIn(values.who);
        }
        if (num('amount') > 0) values.amount = num('amount');
        if (str('number')) values.number = normalisePhone(str('number'));
        if (str('plan_id')) values.plan = str('plan_id');
        if (str('disco')) values.disco = str('disco');
        if (str('meter_kind')) values.meterKind = str('meter_kind') as MeterKind;
        if (str('meter')) values.meter = str('meter').replace(/\D/g, '');
        const up = ctx.pending?.need === 'ask' && ctx.pending.ask.tool === tool ? ctx.pending.ask : null;
        const ask = up ? { ...up, values: { ...up.values, ...values }, found: { ...up.found, ...found }, note: undefined } : newAsk(tool, values, ctx, found);
        if (up) panels.push({ kind: 'fill', askId: ask.id, values: ask.values, found: ask.found });
        else panels.push({ kind: 'ask', ask });
        hold({ need: 'ask', ask });
        const missing = askMissing(ask);
        return {
          ok: true,
          ask_id: ask.id,
          missing,
          filled: valuesWords(ask.values) || 'nothing',
          hint: missing.length ? 'The panel is up with those fields; say one short line at most.' : 'Nothing is missing: prepare the panel to confirm.',
          companies: tool === 'pay' ? 'ikeja, eko, abuja, jos, kano, ibadan, enugu, portharcourt, benin, kaduna, yola' : undefined,
        };
      }
      case 'prepare_transfer': {
        const amount = num('amount');
        const number = str('number').replace(/\D/g, '');
        if (!(amount > 0)) throw new Error('amount must be a number of naira above zero');
        if (number.length !== 10) throw new Error('number must be ten digits');
        if (amount > ctx.balance)
          return {
            ok: false,
            reason: `more than the balance of ${naira(ctx.balance)}`,
            balance: ctx.balance,
          };
        const to: Person = { name: str('name'), bank: str('bank'), number };
        const panel = transferPanel(to, amount);
        panels.push({ kind: 'panel', panel });
        return {
          ok: true,
          panel_id: panel.id,
          fee: feeFor(amount),
          total: amount + feeFor(amount),
          arrives: panel.rows[4]?.value ?? 'in a moment',
        };
      }
      case 'prepare_bill': {
        const disco = str('disco');
        const kind = str('meter_kind') as MeterKind;
        const meter = str('meter').replace(/\D/g, '');
        const amount = num('amount');
        if (!discoById(disco)) throw new Error('disco must be a company id');
        if (kind !== 'prepaid' && kind !== 'postpaid') throw new Error('meter_kind must be prepaid or postpaid');
        const problem = meterProblem(meter);
        if (problem) throw new Error(problem);
        if (!(amount > 0)) throw new Error('amount must be a number of naira above zero');
        if (amount > ctx.balance) return { ok: false, reason: `more than the balance of ${naira(ctx.balance)}`, balance: ctx.balance };
        const known = saved.meters.find(m => m.meter === meter);
        const record = known ? { name: known.name } : await this.meters.lookup(disco, kind, meter);
        if (!record) return { ok: false, reason: `no ${kind} meter ${groupMeter(meter)} at ${discoById(disco)?.name}` };
        const panel = billPanelFor({ disco, meterKind: kind, meter, name: record.name, label: known?.label }, amount);
        panels.push({ kind: 'panel', panel });
        return {
          ok: true,
          panel_id: panel.id,
          company: discoById(disco)?.name,
          name: record.name,
          units: panel.rows[4]?.value,
          fee: 0,
          token: kind === 'prepaid' ? 'arrives on the receipt once it is paid' : undefined,
        };
      }
      case 'prepare_data': {
        const number = normalisePhone(str('number'));
        const problem = phoneProblem(number);
        if (problem) throw new Error(problem);
        const plan = planById(str('plan_id'));
        if (!plan) throw new Error('plan_id must be one from list_plans');
        const network = networkOf(number)!;
        if (plan.network !== network) return { ok: false, reason: `${number} is on ${network}; that plan is ${plan.network}'s. Call list_plans for ${network}.` };
        if (plan.price > ctx.balance) return { ok: false, reason: `more than the balance of ${naira(ctx.balance)}`, balance: ctx.balance };
        const known = saved.lines.find(l => l.number === number);
        const panel = dataPanelFor({ number, network, label: known?.label }, plan);
        panels.push({ kind: 'panel', panel });
        return { ok: true, panel_id: panel.id, line: known?.label ?? groupPhoneNumber(number), network, plan: planName(plan), amount: plan.price };
      }
      case 'prepare_airtime': {
        const number = normalisePhone(str('number'));
        const problem = phoneProblem(number);
        if (problem) throw new Error(problem);
        const amount = num('amount');
        if (!(amount >= 50)) throw new Error('amount must be at least ₦50');
        if (amount > ctx.balance) return { ok: false, reason: `more than the balance of ${naira(ctx.balance)}`, balance: ctx.balance };
        const network = networkOf(number)!;
        const known = saved.lines.find(l => l.number === number);
        const panel = airtimePanelFor({ number, network, label: known?.label }, amount);
        panels.push({ kind: 'panel', panel });
        return { ok: true, panel_id: panel.id, line: known?.label ?? groupPhoneNumber(number), network, amount, lands: 'at once' };
      }
      case 'identify_account': {
        const number = str('number').replace(/\D/g, '');
        if (number.length !== 10) throw new Error('number must be ten digits');
        const p = whose(number, reading);
        panels.push({ kind: 'panel', panel: foundPanel(p) });
        return { name: p.name, bank: p.bank, number: p.number, read_off_photo: !!reading };
      }
      case 'change_amount': {
        const amount = num('amount');
        if (!(amount > 0)) throw new Error('amount must be a number of naira above zero');
        panels.push({ kind: 'amend', panelId: str('panel_id'), amount });
        return { ok: true, amount, fee: feeFor(amount) };
      }
      default:
        throw new Error(`no tool called ${name}`);
    }
  }

  private async post(cfg: ModelConfig, ctx: Context, messages: Message[]): Promise<Response> {
    const body = {
      model: MODEL,
      max_tokens: 8192,
      output_config: { effort: 'low' },
      fallbacks: 'default',
      system: [
        { type: 'text', text: VOICE, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: state(ctx, this.clock()) },
      ],
      tools: TOOLS,
      tool_choice: { type: 'auto' },
      messages,
    };
    let res: globalThis.Response;
    try {
      res = await this.fetchFn(`${cfg.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': cfg.key,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'server-side-fallback-2026-07-01',
          /* the web export calls from a page; the header says that is meant */
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      throw new ModelError(`The model could not be reached: ${(e as Error).message}`);
    }
    if (!res.ok) {
      let detail = '';
      try {
        const j = (await res.json()) as { error?: { message?: string } };
        detail = j.error?.message ?? '';
      } catch {
        /* no body worth reading */
      }
      const why =
        res.status === 401
          ? 'the key was refused'
          : res.status === 403
            ? 'the key is not allowed to do this'
            : res.status === 429
              ? 'too many asks at once'
              : res.status >= 500
                ? 'the model is having trouble'
                : `the ask was not accepted (${res.status})`;
      throw new ModelError(`${why}${detail ? `: ${detail}` : ''}`, res.status);
    }
    return (await res.json()) as Response;
  }
}

/* ---- which Beetle answers ---- */

/** The model where there is a key, the script where there is not, and the
    script with a word about why when the model could not answer. */
export class Beetle implements AgentService {
  constructor(
    private readonly model: AgentService,
    private readonly scripted: AgentService,
    private readonly config: () => Promise<ModelConfig | null> = modelKey.config,
  ) {}

  async ask(ask: Ask, ctx: Context, onStep?: OnStep): Promise<Reply> {
    const cfg = await this.config();
    if (!cfg) return this.scripted.ask(ask, ctx, onStep);
    try {
      return await this.model.ask(ask, ctx, onStep);
    } catch (e) {
      const r = await this.scripted.ask(ask, ctx, onStep);
      const why = e instanceof ModelError ? e.message : (e as Error).message;
      return {
        ...r,
        blocks: [
          {
            kind: 'note',
            title: 'The model could not answer',
            body: `${why}. This is the scripted Beetle instead.`,
          },
          ...r.blocks,
        ],
      };
    }
  }
}

export type { Pending, Panel };
