import { describe, expect, it, vi } from 'vitest';

/* the services reach for the device through the index; none of that is under test */
vi.mock('react-native', () => ({
  Platform: { OS: 'web', select: (o: Record<string, unknown>) => o.default },
}));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined },
}));
vi.mock('expo-crypto', () => ({
  getRandomBytes: (n: number) => new Uint8Array(n),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: async () => 'h',
}));

import { Beetle, ModelAgent, ModelError, TOOLS, type ModelConfig } from '@/services/model';
import { ScriptedAgent, panelFromAsk, type Context } from '@/services/agent';
import { MockReader } from '@/services/reader';
import { MockMeters } from '@/services/nigeria';
import { DEMO_ACCOUNT } from '@/services/auth';

const cfg: ModelConfig = { key: 'sk-test', baseUrl: 'https://model.test', from: 'phone' };
const ctx = (extra: Partial<Context> = {}): Context => ({
  account: DEMO_ACCOUNT,
  balance: 595_320.75,
  rate: 1552,
  pending: null,
  ...extra,
});

type Turn = { content: unknown[]; stop_reason: string };
/* a model that answers from a script of turns, and keeps every request it saw */
function fakeApi(turns: Turn[], status = 200) {
  const requests: { url: string; headers: Record<string, string>; body: Record<string, unknown> }[] = [];
  let i = 0;
  const fetchFn = (async (url: string | URL | Request, init?: RequestInit) => {
    requests.push({
      url: String(url),
      headers: init?.headers as Record<string, string>,
      body: JSON.parse(String(init?.body)),
    });
    if (status !== 200) return new Response(JSON.stringify({ error: { message: 'no such key' } }), { status });
    const t = turns[Math.min(i++, turns.length - 1)]!;
    return new Response(JSON.stringify({ ...t, model: 'claude-opus-5-5' }), { status: 200 });
  }) as typeof fetch;
  return { fetchFn, requests };
}
const text = (t: string) => ({ type: 'text', text: t });
const use = (id: string, name: string, input: Record<string, unknown>) => ({
  type: 'tool_use',
  id,
  name,
  input,
});

describe('the tools the model is given', () => {
  it('are strict, and every one takes a saying', () => {
    for (const t of TOOLS) {
      expect(t.strict).toBe(true);
      expect(t.input_schema.additionalProperties).toBe(false);
      expect(t.input_schema.required).toContain('saying');
      expect(Object.keys(t.input_schema.properties).sort()).toEqual([...t.input_schema.required].sort());
    }
  });
});

describe('Beetle with a model behind it', () => {
  it('sends no key at all to a server of its own, which keeps the key', async () => {
    const api = fakeApi([{ content: [text('Hello.')], stop_reason: 'end_turn' }]);
    const agent = new ModelAgent(new MockReader(0), async () => ({ key: '', baseUrl: 'https://beetle.server', from: 'server' }), api.fetchFn);
    await agent.ask({ text: 'hi' }, ctx());
    const [req] = api.requests;
    expect(req?.url).toBe('https://beetle.server/v1/messages');
    expect(req?.headers['x-api-key']).toBeUndefined();
    expect(req?.headers['anthropic-dangerous-direct-browser-access']).toBeUndefined();
  });
  it('asks the model the right way', async () => {
    const api = fakeApi([{ content: [text('Hello Ibrahim. What do you need?')], stop_reason: 'end_turn' }]);
    const agent = new ModelAgent(
      new MockReader(0),
      async () => cfg,
      api.fetchFn,
      () => new Date('2026-09-29T15:00:00Z'),
    );
    const r = await agent.ask(
      { text: 'hi' },
      ctx({
        transcript: [
          { who: 'beetle', text: 'Your data is nearly gone.' },
          { who: 'you', text: 'hi' },
        ],
      }),
    );
    expect(r.blocks).toEqual([{ kind: 'say', text: 'Hello Ibrahim. What do you need?' }]);
    const [req] = api.requests;
    expect(req?.url).toBe('https://model.test/v1/messages');
    expect(req?.headers['x-api-key']).toBe('sk-test');
    expect(req?.headers['anthropic-version']).toBe('2023-06-01');
    expect(req?.body.model).toBe('claude-opus-5-5');
    expect(req?.body.fallbacks).toBe('default');
    expect(req?.body.output_config).toEqual({ effort: 'low' });
    expect(req?.body.tool_choice).toEqual({ type: 'auto' });
    /* the state the model is told, and the memory: the ask itself is not repeated */
    const system = req?.body.system as { text: string }[];
    expect(system[1]?.text).toContain('Balance: ₦595,320');
    expect(system[1]?.text).toContain('Ibrahim Musa');
    expect(req?.body.messages).toEqual([{ role: 'user', content: 'hi' }]);
  });

  it('runs the tools it is asked for, says the steps, and puts up the card', async () => {
    const api = fakeApi([
      {
        content: [use('t1', 'find_account', { query: 'Sarah', saying: "I'm finding Sarah's account…" })],
        stop_reason: 'tool_use',
      },
      {
        content: [
          use('t2', 'prepare_transfer', {
            name: 'Sarah Adeyemi',
            bank: 'GTBank',
            number: '0234567890',
            amount: 20000,
            tag: null,
            ask_about: true,
            saying: "I'm checking the fee…",
          }),
        ],
        stop_reason: 'tool_use',
      },
      {
        content: [text('₦20,000 to Sarah at GTBank, ₦26.88 fee, lands in a moment.\n\nConfirm when you are ready.')],
        stop_reason: 'end_turn',
      },
    ]);
    const steps: string[] = [];
    const agent = new ModelAgent(new MockReader(0), async () => cfg, api.fetchFn);
    const r = await agent.ask({ text: 'Send 20k to Sarah' }, ctx(), l => steps.push(l));
    expect(steps).toEqual(["I'm finding Sarah's account…", "I'm checking the fee…"]);
    expect(r.blocks.map(b => b.kind)).toEqual(['say', 'say', 'ask']);
    const card = r.blocks.find(b => b.kind === 'ask');
    expect(card && card.kind === 'ask' && card.ask).toMatchObject({ tool: 'transfer', values: { amount: 20_000 }, found: { person: { name: 'Sarah Adeyemi', bank: 'GTBank' } }, confirmWho: true });
    expect(card && card.kind === 'ask' && panelFromAsk(card.ask)?.rows.map(x => x.value)).toEqual(['Sarah Adeyemi', 'GTBank', '₦20,000', '₦26.88', 'In a few seconds']);
    expect(r.pending?.need).toBe('ask');
    /* what the tools answered went back as results, in one message each round */
    const second = api.requests[1]?.body.messages as { role: string; content: unknown }[];
    expect(second.map(m => m.role)).toEqual(['user', 'assistant', 'user']);
    const result = (second[2]!.content as { type: string; tool_use_id: string; content: string }[])[0]!;
    expect(result.tool_use_id).toBe('t1');
    expect(JSON.parse(result.content)).toEqual({
      found: true,
      name: 'Sarah Adeyemi',
      bank: 'GTBank',
      number: '0234567890',
      tag: null,
      ask_about: true,
    });
    const third = api.requests[2]?.body.messages as { role: string; content: unknown }[];
    const prepared = JSON.parse((third[4]!.content as { content: string }[])[0]!.content) as {
      ok: boolean;
      fee: number;
      total: number;
    };
    expect(prepared).toMatchObject({ ok: true, fee: 26.88, total: 20026.88 });
  });

  it('tells the model when a transfer is more than the balance, and about people it does not know', async () => {
    const api = fakeApi([
      {
        content: [use('t1', 'find_account', { query: 'Amaka', saying: 'Looking…' })],
        stop_reason: 'tool_use',
      },
      {
        content: [
          use('t2', 'prepare_transfer', {
            name: 'Sarah Adeyemi',
            bank: 'GTBank',
            number: '0234567890',
            amount: 900000,
            saying: 'Checking…',
          }),
        ],
        stop_reason: 'tool_use',
      },
      { content: [text('That is more than you have.')], stop_reason: 'end_turn' },
    ]);
    const agent = new ModelAgent(new MockReader(0), async () => cfg, api.fetchFn);
    const r = await agent.ask({ text: 'send 900k to Amaka' }, ctx());
    expect(r.blocks).toEqual([{ kind: 'say', text: 'That is more than you have.' }]);
    const results = api.requests.slice(1).map(q => {
      const m = q.body.messages as { content: { content: string }[] }[];
      return JSON.parse(m[m.length - 1]!.content[0]!.content);
    });
    expect(results[0]).toMatchObject({ found: false });
    expect(results[1]).toMatchObject({ ok: false, balance: 595_320.75 });
  });

  it('reads a photo on the device and hands the words to the model', async () => {
    const api = fakeApi([
      {
        content: [use('t1', 'identify_account', { number: '0234567890', saying: "I'm checking whose it is…" })],
        stop_reason: 'tool_use',
      },
      {
        content: [text('That is Sarah Adeyemi at GTBank. How much should I send?')],
        stop_reason: 'end_turn',
      },
    ]);
    const steps: string[] = [];
    const agent = new ModelAgent(new MockReader(0), async () => cfg, api.fetchFn);
    const r = await agent.ask({ photo: { uri: 'file:///slip.png' } }, ctx(), l => steps.push(l));
    expect(steps[0]).toBe("I'm reading the photo…");
    const first = (api.requests[0]?.body.messages as { content: string }[])[0]!.content;
    expect(first).toContain('The owner sent a photo');
    expect(first).toContain('0234 5678 90');
    expect(r.reading?.numbers).toEqual(['0234567890']);
    expect(r.blocks.map(b => b.kind)).toEqual(['say', 'panel']);
  });

  it('puts up the ask panel for what is missing, and the panel to confirm once it is filled', async () => {
    const api = fakeApi([
      {
        content: [use('t1', 'find_line', { query: 'my sister', saying: "I'm looking for her line…" })],
        stop_reason: 'tool_use',
      },
      {
        content: [use('t2', 'ask_for', { tool: 'data', who: null, amount: null, number: null, plan_id: null, disco: null, meter_kind: null, meter: null, saying: "I'm putting the fields up…" })],
        stop_reason: 'tool_use',
      },
      { content: [text('I do not have a number for her yet. Fill in the number and the plan.')], stop_reason: 'end_turn' },
    ]);
    const agent = new ModelAgent(new MockReader(0), async () => cfg, api.fetchFn);
    const r = await agent.ask({ text: 'data for my sister' }, ctx());
    expect(r.blocks.map(b => b.kind)).toEqual(['say', 'ask']);
    const ask = r.blocks.find(b => b.kind === 'ask');
    expect(ask && ask.kind === 'ask' && ask.ask).toMatchObject({ tool: 'data', fields: ['number', 'plan'] });
    expect(r.pending).toMatchObject({ need: 'ask', ask: { tool: 'data' } });
    const results = api.requests.slice(1).map(q => {
      const m = q.body.messages as { content: { content: string }[] }[];
      return JSON.parse(m[m.length - 1]!.content[0]!.content);
    });
    expect(results[0]).toMatchObject({ found: false });
    expect(results[1]).toMatchObject({ ok: true, missing: ['number', 'plan'] });

    /* the owner fills the panel and continues: the model is told, and prepares the data */
    const api2 = fakeApi([
      {
        content: [use('t3', 'prepare_data', { number: '08123456789', plan_id: 'airtel-2gb-30d', saying: "I'm finding the 2GB plan…" })],
        stop_reason: 'tool_use',
      },
      { content: [text('2GB for 30 days on 0812 345 6789, ₦1,800.')], stop_reason: 'end_turn' },
    ]);
    const agent2 = new ModelAgent(new MockReader(0), async () => cfg, api2.fetchFn);
    const pending = r.pending!;
    const r2 = await agent2.ask({ answers: { askId: pending.need === 'ask' ? pending.ask.id : '', values: { number: '08123456789', plan: 'airtel-2gb-30d' } } }, ctx({ pending }));
    const first = (api2.requests[0]?.body.messages as { content: string }[])[0]!.content;
    expect(first).toContain('pressed Continue');
    expect(first).toContain('08123456789');
    const system = api2.requests[0]?.body.system as { text: string }[];
    expect(system[1]?.text).toContain('An ask panel');
    expect(r2.blocks.map(b => b.kind)).toEqual(['say', 'fill', 'panel']);
    expect(r2.blocks.find(b => b.kind === 'fill')).toMatchObject({ done: true });
    expect(r2.pending).toBeNull();
  });

  it('knows the lines, the meters and the plans, and refuses a plan on the wrong network', async () => {
    const api = fakeApi([
      {
        content: [
          use('t1', 'find_line', { query: 'mum', saying: 'Looking…' }),
          use('t2', 'find_meter', { query: 'my light', saying: 'Looking…' }),
          use('t3', 'list_plans', { network: 'Glo', saying: 'Looking…' }),
          use('t4', 'prepare_data', { number: '08032144471', plan_id: 'airtel-2gb-30d', saying: 'Preparing…' }),
          use('t5', 'lookup_meter', { disco: 'jos', meter_kind: 'prepaid', meter: '12345670000', saying: 'Looking…' }),
        ],
        stop_reason: 'tool_use',
      },
      { content: [text('Done.')], stop_reason: 'end_turn' },
    ]);
    const agent = new ModelAgent(
      new MockReader(0),
      async () => cfg,
      api.fetchFn,
      () => new Date(),
      new MockMeters(0),
    );
    await agent.ask({ text: 'things' }, ctx());
    const m = api.requests[1]?.body.messages as { content: { content: string }[] }[];
    const results = m[m.length - 1]!.content.map(c => JSON.parse(c.content));
    expect(results[0]).toMatchObject({ found: true, label: 'Mum', network: 'MTN', usual_plan: { plan_id: 'mtn-5gb-30d' } });
    expect(results[1]).toMatchObject({ found: true, label: 'Home', company: 'Ikeja Electric', meter: '44578891', usual_amount: 8000 });
    expect(results[2].plans.length).toBeGreaterThan(3);
    expect(results[3]).toMatchObject({ ok: false });
    expect(results[3].reason).toContain('MTN');
    expect(results[4]).toMatchObject({ found: false });
    const system = api.requests[0]?.body.system as { text: string }[];
    expect(system[1]?.text).toContain('Lines topped up');
    expect(system[1]?.text).toContain('Meters paid');
  });

  it('says plainly when the key is refused', async () => {
    const api = fakeApi([], 401);
    const agent = new ModelAgent(new MockReader(0), async () => cfg, api.fetchFn);
    await expect(agent.ask({ text: 'hi' }, ctx())).rejects.toThrow(/the key was refused: no such key/);
  });

  it('is the script with a word about why when the model fails, and the script alone without a key', async () => {
    const failing = new ModelAgent(new MockReader(0), async () => cfg, fakeApi([], 500).fetchFn);
    const scripted = new ScriptedAgent(new MockReader(0), 0);
    const r = await new Beetle(failing, scripted, async () => cfg).ask({ text: 'how much do I have' }, ctx());
    expect(r.blocks[0]).toMatchObject({ kind: 'note', title: 'The model could not answer' });
    expect(r.blocks[1]).toMatchObject({ kind: 'say', text: expect.stringContaining('₦595,320') });
    const r2 = await new Beetle(failing, scripted, async () => null).ask({ text: 'how much do I have' }, ctx());
    expect(r2.blocks[0]).toMatchObject({ kind: 'say' });
    expect(new ModelError('x', 401).status).toBe(401);
  });
});
