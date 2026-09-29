/* Beetle with a real model behind it. The same interface as the scripted
   one: an ask in, words and panels out, with what it is doing said as it
   goes. The model is Claude, through the Messages API, with tools that do
   what the app does — find an account, prepare a transfer, a bill, data,
   identify a number read off a photo — and every tool takes a line, in
   Beetle's own voice, that the screen shows while it works. The model never
   moves money: it puts up a panel, and the owner's passcode moves it.

   The key comes from the phone's own keychain (set on the lab's model
   screen) or from the build (EXPO_PUBLIC_ANTHROPIC_API_KEY at export time).
   Neither is the shape a shipped app should have — that is a server that
   keeps the key — and EXPO_PUBLIC_ANTHROPIC_BASE_URL is where such a server
   goes when there is one, with no other change.

   Plain fetch rather than the SDK: React Native is not a runtime the SDK
   supports, and the request is small. */
import { groupAccount, naira } from '../lib/format';
import type { AgentService, Ask, Block, Context, OnStep, Panel, Pending, Person, Reply } from './agent';
import { PEOPLE, accountIn, dataPanel, feeFor, foundPanel, personIn, powerPanel, transferPanel, whose } from './agent';
import type { Reading, ReaderService } from './reader';
import { secure } from './storage';

export const MODEL = 'claude-opus-5-5';
const API = 'https://api.anthropic.com';
const KEY = 'beetle.model.key.v1';
/** How many times the model may call tools for one ask before it must answer. */
const ROUNDS = 6;

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

export const TOOLS = [
  tool('find_account', 'Call this before any transfer, with the name or the ten-digit account number the owner gave. It answers with the account, or that there is no such person.', {
    query: { type: 'string', description: 'the name as the owner said it, or the account number' },
  }),
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
  tool('prepare_bill', 'Puts up the electricity top up for the owner to confirm: their usual meter and what it usually costs. Call it when they ask to top up their light, power, NEPA or meter.', {}),
  tool('prepare_data', 'Puts up the data plan the owner buys for the owner to confirm. Call it when they ask for data, airtime or internet.', {}),
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

What you do: send money to a person or an account number, pay the electricity bill, buy data, say the balance and what it is worth in dollars, and read an account number off a photo the owner sends. Nothing else moves money; for anything else, say what you can do.

How money moves: you never move it yourself. A tool puts up a panel; the owner reads it, presses its button and confirms with their passcode. For a transfer: find_account first, then prepare_transfer. If the amount is missing, ask for it in one line and wait. If the person is unknown, say so and ask for the account number. If the amount is more than the balance, say so and ask what to send instead. After a panel is up, say one short line about it — the fee, when it lands — and do not repeat the panel's rows.

When the owner sends a photo, the words read off it are in their message; if there is a ten-digit account number among them, call identify_account, and if they said an amount go on to the transfer.

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
    `Owner: ${a.firstName} ${a.lastName}, account ${groupAccount(a.accountNumber)} at Beetle.`,
    `Balance: ${naira(ctx.balance)}. A dollar is ₦${ctx.rate.toLocaleString('en-NG')}.`,
  ];
  const p = ctx.pending;
  if (p?.need === 'amount') lines.push(`You asked how much to send ${p.to.name} (${p.to.bank}, ${p.to.number}); an amount alone answers that.`);
  if (p?.need === 'who') lines.push(`You asked whom to send ${naira(p.amount)} to; a name or an account number answers that.`);
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

export class ModelAgent implements AgentService {
  constructor(
    private readonly reader: ReaderService,
    private readonly config: () => Promise<ModelConfig | null> = modelKey.config,
    private readonly fetchFn: typeof fetch = (...a) => fetch(...a),
    private readonly clock: () => Date = () => new Date(),
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
    if (!said) said = '[The owner sent nothing.]';

    const messages: Message[] = [...history(ctx.transcript, (ask.text ?? '').trim()), { role: 'user', content: said }];
    const panels: Block[] = [];
    const steps: string[] = [];
    let says: string[] = [];
    const run = (name: string, input: Record<string, unknown>): unknown => {
      const line = typeof input.saying === 'string' ? input.saying : null;
      if (line) {
        onStep?.(line);
        steps.push(line);
      }
      return this.tool(name, input, ctx, reading, panels);
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
      messages.push({
        role: 'user',
        content: uses.map(u => {
          try {
            return { type: 'tool_result', tool_use_id: u.id, content: JSON.stringify(run(u.name, u.input)) };
          } catch (e) {
            return { type: 'tool_result', tool_use_id: u.id, content: (e as Error).message, is_error: true };
          }
        }),
      });
    }

    const blocks: Block[] = [];
    for (const s of says) for (const para of s.split(/\n{2,}/)) if (para.trim()) blocks.push({ kind: 'say', text: para.trim() });
    if (!blocks.length && !panels.length) blocks.push({ kind: 'say', text: 'I did not catch that. Say it another way?' });
    return { blocks: [...blocks, ...panels], pending: null, reading };
  }

  /* what each tool does: the same panels the scripted Beetle puts up */
  private tool(name: string, input: Record<string, unknown>, ctx: Context, reading: Reading | undefined, panels: Block[]): unknown {
    const str = (k: string) => (typeof input[k] === 'string' ? (input[k] as string).trim() : '');
    const num = (k: string) => (typeof input[k] === 'number' ? (input[k] as number) : Number(String(input[k] ?? '').replace(/[^\d.]/g, '')));
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
        const panel = powerPanel();
        panels.push({ kind: 'panel', panel });
        return {
          ok: true,
          panel_id: panel.id,
          biller: 'Ikeja Electric',
          meter: '4457 8891',
          usual: 8000,
          last: 'about three weeks ago',
          fee: 0,
        };
      }
      case 'prepare_data': {
        const panel = dataPanel();
        panels.push({ kind: 'panel', panel });
        return {
          ok: true,
          panel_id: panel.id,
          line: 'MTN, the owner’s own',
          plan: '5GB for 30 days',
          amount: 2500,
          note: 'the same plan as last time, which usually runs out about now',
        };
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
