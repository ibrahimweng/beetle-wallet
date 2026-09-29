import { describe, expect, it, vi } from 'vitest';

/* the services reach for the device through the index; none of that is under test */
vi.mock('react-native', () => ({ Platform: { OS: 'web', select: (o: Record<string, unknown>) => o.default } }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined } }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n), CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digestStringAsync: async () => 'h' }));

import { ScriptedAgent, accountIn, amountIn, feeFor, personIn, whose, type Context } from '@/services/agent';
import { MockReader } from '@/services/reader';
import { DEMO_ACCOUNT } from '@/services/auth';

const agent = new ScriptedAgent(new MockReader(0), 0);
const ctx = (pending: Context['pending'] = null): Context => ({ account: DEMO_ACCOUNT, balance: 595_320.75, rate: 1552, pending });
const panels = (blocks: Awaited<ReturnType<typeof agent.ask>>['blocks']) => blocks.flatMap(b => (b.kind === 'panel' ? [b.panel] : []));
const said = (blocks: Awaited<ReturnType<typeof agent.ask>>['blocks']) => blocks.flatMap(b => (b.kind === 'say' ? [b.text] : [])).join(' ');

describe('reading an ask', () => {
  it('finds the amount however it is written', () => {
    expect(amountIn('send 20k to sarah')).toBe(20_000);
    expect(amountIn('Send ₦20,000 to Sarah')).toBe(20_000);
    expect(amountIn('2.5k for data')).toBe(2_500);
    expect(amountIn('move 1m')).toBe(1_000_000);
    expect(amountIn('pay 8000')).toBe(8_000);
    expect(amountIn('send to 0123456789')).toBeNull();
    expect(amountIn('how much do I have')).toBeNull();
  });
  it('finds a person by first name, full name, or account number', () => {
    expect(personIn('send 20k to sarah')?.name).toBe('Sarah Adeyemi');
    expect(personIn('Chidi Okafor needs 5k')?.name).toBe('Chidi Okafor');
    expect(personIn('give 2k to nobody')).toBeNull();
    expect(accountIn('send 5k to 0123 4567 89')).toBe('0123456789');
    expect(accountIn('my phone is 0803 214 4471')).toBeNull();
  });
  it('knows the fee scale', () => {
    expect(feeFor(3_000)).toBe(10);
    expect(feeFor(20_000)).toBe(25);
    expect(feeFor(200_000)).toBe(50);
  });
  it('names an unknown number from the words around it', () => {
    const p = whose('9876543210', { text: 'Zenith Bank\nAmaka Nwosu\n9876543210', numbers: ['9876543210'], real: true });
    expect(p).toEqual({ name: 'Amaka Nwosu', bank: 'Zenith', number: '9876543210' });
    expect(whose('0123456789').name).toBe('Sarah Adeyemi');
  });
});

describe('the scripted Beetle', () => {
  it('puts up a transfer for a whole ask', async () => {
    const r = await agent.ask({ text: 'Send 20k to Sarah' }, ctx());
    const [p] = panels(r.blocks);
    expect(p?.tool).toBe('transfer');
    expect(p?.rows.map(x => x.value)).toEqual(['Sarah Adeyemi', 'GTBank', '₦20,000', '₦25', 'In a moment']);
    expect(p?.action).toEqual({ label: 'Confirm ₦20,000', amount: 20_025 });
    expect(p?.move?.amount).toBe(-20_000);
    expect(r.pending).toBeNull();
  });
  it('asks for what is missing, and remembers', async () => {
    const r1 = await agent.ask({ text: 'send something to Chidi' }, ctx());
    expect(panels(r1.blocks)).toHaveLength(0);
    expect(r1.pending).toEqual({ need: 'amount', to: expect.objectContaining({ name: 'Chidi Okafor' }) });
    const r2 = await agent.ask({ text: '5k' }, ctx(r1.pending));
    expect(panels(r2.blocks)[0]?.rows[0]?.value).toBe('Chidi Okafor');
    const r3 = await agent.ask({ text: 'transfer 3000' }, ctx());
    expect(r3.pending).toEqual({ need: 'who', amount: 3_000 });
    const r4 = await agent.ask({ text: '0234567891' }, ctx(r3.pending));
    expect(
      panels(r4.blocks)[0]
        ?.rows.map(x => x.value)
        .slice(0, 3),
    ).toEqual(['Chidi Okafor', 'Access Bank', '₦3,000']);
  });
  it('will not send more than there is', async () => {
    const r = await agent.ask({ text: 'send 900k to Sarah' }, ctx());
    expect(panels(r.blocks)).toHaveLength(0);
    expect(r.pending?.need).toBe('amount');
  });
  it('corrects an amount on a panel already up', async () => {
    const first = await agent.ask({ text: 'Send 20k to Sarah' }, ctx());
    const panel = panels(first.blocks)[0]!;
    const r = await agent.ask({ text: '15k' }, ctx({ need: 'amount-for', panel }));
    expect(r.blocks[0]).toEqual({ kind: 'amend', panelId: panel.id, amount: 15_000 });
  });
  it('reads a photo and goes on from the number', async () => {
    const r = await agent.ask({ photo: { uri: 'file:///slip.jpg' } }, ctx());
    expect(r.reading?.numbers).toEqual(['0123456789']);
    expect(panels(r.blocks)[0]?.tool).toBe('found');
    expect(said(r.blocks)).toContain('Sarah Adeyemi at GTBank');
    expect(r.pending).toEqual({ need: 'amount', to: expect.objectContaining({ number: '0123456789' }) });
    const both = await agent.ask({ photo: { uri: 'file:///slip.jpg' }, text: 'send 20k' }, ctx());
    expect(panels(both.blocks).map(p => p.tool)).toEqual(['found', 'transfer']);
  });
  it('knows the bills, the data, the dollars and the balance', async () => {
    expect(panels((await agent.ask({ text: 'top up my light' }, ctx())).blocks)[0]?.tool).toBe('pay');
    expect(panels((await agent.ask({ text: 'buy data' }, ctx())).blocks)[0]?.tool).toBe('data');
    const d = await agent.ask({ text: 'what about dollars' }, ctx());
    expect(d.blocks[0]?.kind).toBe('note');
    expect(said((await agent.ask({ text: 'how much do I have' }, ctx())).blocks)).toContain('₦595,320');
    expect(said((await agent.ask({ text: 'knit me a jumper' }, ctx())).blocks)).toContain('Which one');
  });
  it('gives every panel its own id', async () => {
    const a = panels((await agent.ask({ text: 'top up' }, ctx())).blocks)[0]!;
    const b = panels((await agent.ask({ text: 'top up' }, ctx())).blocks)[0]!;
    expect(a.id).not.toBe(b.id);
  });
});

describe('what it says while it works', () => {
  const steps = async (text: string) => {
    const lines: string[] = [];
    await agent.ask({ text }, ctx(), (l: string) => lines.push(l));
    return lines;
  };
  it('thinks aloud, in the first person, only where it takes time', async () => {
    const transfer = await steps('Send 20k to Sarah');
    expect(transfer.length).toBe(2);
    for (const l of transfer) expect(l).toMatch(/^I'm /);
    expect(transfer[0]).toContain('Sarah');
    expect(await steps('how much do I have')).toEqual([]);
    expect(await steps('hello')).toEqual([]);
    expect((await steps('top up my light')).length).toBe(2);
  });
  it('reads a photo aloud too', async () => {
    const lines: string[] = [];
    await agent.ask({ photo: { uri: 'file:///slip.jpg' } }, ctx(), (l: string) => lines.push(l));
    expect(lines[0]).toBe("I'm reading the photo…");
    expect(lines).toHaveLength(3);
  });
});
