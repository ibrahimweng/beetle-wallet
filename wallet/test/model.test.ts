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
import { ScriptedAgent, type Context } from '@/services/agent';
import { MockReader } from '@/services/reader';
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

  it('runs the tools it is asked for, says the steps, and puts up the panel', async () => {
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
            number: '0123456789',
            amount: 20000,
            saying: "I'm checking the fee…",
          }),
        ],
        stop_reason: 'tool_use',
      },
      {
        content: [text('₦20,000 to Sarah at GTBank, ₦25 fee, lands in a moment.\n\nConfirm when you are ready.')],
        stop_reason: 'end_turn',
      },
    ]);
    const steps: string[] = [];
    const agent = new ModelAgent(new MockReader(0), async () => cfg, api.fetchFn);
    const r = await agent.ask({ text: 'Send 20k to Sarah' }, ctx(), l => steps.push(l));
    expect(steps).toEqual(["I'm finding Sarah's account…", "I'm checking the fee…"]);
    expect(r.blocks.map(b => b.kind)).toEqual(['say', 'say', 'panel']);
    const panel = r.blocks.find(b => b.kind === 'panel');
    expect(panel && panel.kind === 'panel' && panel.panel.rows.map(x => x.value)).toEqual(['Sarah Adeyemi', 'GTBank', '₦20,000', '₦25', 'In a moment']);
    /* what the tools answered went back as results, in one message each round */
    const second = api.requests[1]?.body.messages as { role: string; content: unknown }[];
    expect(second.map(m => m.role)).toEqual(['user', 'assistant', 'user']);
    const result = (second[2]!.content as { type: string; tool_use_id: string; content: string }[])[0]!;
    expect(result.tool_use_id).toBe('t1');
    expect(JSON.parse(result.content)).toEqual({
      found: true,
      name: 'Sarah Adeyemi',
      bank: 'GTBank',
      number: '0123456789',
    });
    const third = api.requests[2]?.body.messages as { role: string; content: unknown }[];
    const prepared = JSON.parse((third[4]!.content as { content: string }[])[0]!.content) as {
      ok: boolean;
      fee: number;
      total: number;
    };
    expect(prepared).toMatchObject({ ok: true, fee: 25, total: 20025 });
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
            number: '0123456789',
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
        content: [use('t1', 'identify_account', { number: '0123456789', saying: "I'm checking whose it is…" })],
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
    expect(first).toContain('0123456789');
    expect(r.reading?.numbers).toEqual(['0123456789']);
    expect(r.blocks.map(b => b.kind)).toEqual(['say', 'panel']);
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
