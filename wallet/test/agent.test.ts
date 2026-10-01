import { describe, expect, it, vi } from 'vitest';

/* the services reach for the device through the index; none of that is under test */
vi.mock('react-native', () => ({ Platform: { OS: 'web', select: (o: Record<string, unknown>) => o.default } }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined } }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n), CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digestStringAsync: async () => 'h' }));

import { ScriptedAgent, accountIn, amountIn, askMissing, feeFor, panelFromAsk, personIn, resolveWho, savedOf, transferPanel, whose, PEOPLE, type Context } from '@/services/agent';
import { MockMeters } from '@/services/nigeria';
import { MockReader } from '@/services/reader';
import { DEMO_ACCOUNT } from '@/services/auth';

const agent = new ScriptedAgent(new MockReader(0), 0, new MockMeters(0));
const ctx = (pending: Context['pending'] = null): Context => ({ account: DEMO_ACCOUNT, balance: 595_320.75, rate: 1552, pending });
type Blocks = Awaited<ReturnType<typeof agent.ask>>['blocks'];
const panels = (blocks: Blocks) => blocks.flatMap(b => (b.kind === 'panel' ? [b.panel] : []));
const asks = (blocks: Blocks) => blocks.flatMap(b => (b.kind === 'ask' ? [b.ask] : []));
const fills = (blocks: Blocks) => blocks.flatMap(b => (b.kind === 'fill' ? [b] : []));
const said = (blocks: Blocks) => blocks.flatMap(b => (b.kind === 'say' ? [b.text] : [])).join(' ');

describe('reading an ask', () => {
  it('finds the amount however it is written', () => {
    expect(amountIn('send 20k to sarah')).toBe(20_000);
    expect(amountIn('Send ₦20,000 to Sarah')).toBe(20_000);
    expect(amountIn('2.5k for data')).toBe(2_500);
    expect(amountIn('move 1m')).toBe(1_000_000);
    expect(amountIn('pay 8000')).toBe(8_000);
    expect(amountIn('send to 0123456789')).toBeNull();
    expect(amountIn('how much do I have')).toBeNull();
    expect(amountIn('data for 0812 345 6789')).toBeNull();
    expect(amountIn('prepaid, JED, 12345678901, 5k')).toBe(5_000);
    expect(amountIn('2gb for 500')).toBe(500);
  });
  it('finds a person by first name, full name, or account number', () => {
    expect(personIn('send 20k to sarah')?.name).toBe('Sarah Adeyemi');
    expect(personIn('Chidi Okafor needs 5k')?.name).toBe('Chidi Okafor');
    expect(personIn('give 2k to nobody')).toBeNull();
    expect(accountIn('send 5k to 0123 4567 89')).toBe('0123456789');
    expect(accountIn('my phone is 0803 214 4471')).toBeNull();
  });
  it('knows the fee scale', () => {
    expect(feeFor(3_000)).toBe(0);
    expect(feeFor(20_000)).toBe(26.88);
    expect(feeFor(200_000)).toBe(53.75);
  });
  it('names an unknown number from the words around it', () => {
    const p = whose('9876543210', { text: 'Zenith Bank\nAmaka Nwosu\n9876543210', numbers: ['9876543210'], real: true });
    expect(p).toEqual({ name: 'Amaka Nwosu', bank: 'Zenith', number: '9876543210' });
    expect(whose('0234567890').name).toBe('Sarah Adeyemi');
  });
});

describe('the scripted Beetle', () => {
  it('puts up the card for a whole ask, and asks whether a name is the person', async () => {
    const r = await agent.ask({ text: 'Send 20k to Sarah' }, ctx());
    expect(panels(r.blocks)).toHaveLength(0);
    const [card] = asks(r.blocks);
    expect(card).toMatchObject({ tool: 'transfer', values: { who: 'Sarah Adeyemi', amount: 20_000 }, found: { person: { name: 'Sarah Adeyemi', bank: 'GTBank' } }, confirmWho: true });
    expect(askMissing(card!)).toEqual([]);
    /* the card asks "Is this the person?"; the words say who was found, and where */
    expect(said(r.blocks)).toContain('I found Sarah Adeyemi at GTBank.');
    expect(r.pending).toEqual({ need: 'ask', ask: card });
    /* the card stands for this, on the passcode sheet and once it is through */
    const p = panelFromAsk(card!);
    expect(p?.rows.map(x => x.value)).toEqual(['Sarah Adeyemi', 'GTBank', '₦20,000', '₦26.88', 'In a few seconds']);
    expect(p?.action).toEqual({ label: 'Confirm ₦20,000', amount: 20_026.88 });
    expect(p?.move?.amount).toBe(-20_000);
  });
  it('gives the Beetle account for a $tag: free, and there at once', async () => {
    const r = await agent.ask({ text: 'send 5k to $tobi' }, ctx());
    const [card] = asks(r.blocks);
    expect(card).toMatchObject({ values: { amount: 5_000 }, found: { person: { name: 'Tobi Bakare', bank: 'Beetle', tag: 'tobi' } }, confirmWho: false });
    expect(said(r.blocks)).toContain('Free, and there at once');
    const p = panelFromAsk(card!);
    expect(p?.rows.map(x => x.value)).toEqual(['Tobi Bakare', 'Beetle · $tobi', '₦5,000', 'Free', 'Instantly']);
    expect(p?.move?.detail).toBe('Beetle · $tobi · sent');
  });
  it('asks which bank a number is at, and looks the name up there', async () => {
    const r = await agent.ask({ text: 'send 5k to 0123456785' }, ctx());
    const [card] = asks(r.blocks);
    expect(card).toMatchObject({ hint: '0123456785', found: { person: null } });
    expect(askMissing(card!)).toEqual(['who']);
    expect(said(r.blocks)).toContain('Which bank is 0123 4567 85 at?');
    const r2 = await agent.ask({ text: 'GTBank' }, ctx(r.pending));
    expect(fills(r2.blocks)[0]).toMatchObject({ found: { person: { bank: 'GTBank', number: '0123456785' } }, confirmWho: true });
    expect(said(r2.blocks)).toContain('All there');
    /* a bank the number cannot be at says so */
    const r3 = await agent.ask({ text: 'send 5k to 0123456785 at Unity Bank' }, ctx());
    expect(said(r3.blocks)).toContain('no account 0123 4567 85 at Unity Bank');
  });
  it('gives a new ask its own card, and fills the one up with anything less', async () => {
    const first = await agent.ask({ text: 'Send 20k to Sarah' }, ctx());
    const [sarah] = asks(first.blocks);
    const r = await agent.ask({ text: 'send 5k to 0123456785' }, ctx(first.pending));
    expect(fills(r.blocks)).toHaveLength(0);
    const [card] = asks(r.blocks);
    expect(card!.id).not.toBe(sarah!.id);
    expect(card).toMatchObject({ tool: 'transfer', values: { amount: 5_000 }, hint: '0123456785' });
    /* the same person again is the same card, with the new amount */
    const again = await agent.ask({ text: 'send 30k to Sarah' }, ctx(first.pending));
    expect(fills(again.blocks)[0]).toMatchObject({ askId: sarah!.id, values: { amount: 30_000 } });
    /* and an amount alone goes onto the card that is up */
    const more = await agent.ask({ text: 'make it 10k' }, ctx(r.pending));
    expect(fills(more.blocks)[0]).toMatchObject({ askId: card!.id, values: { amount: 10_000 } });
  });
  it('reads who the way the To field does', () => {
    expect(resolveWho('send to $amaka').person?.bank).toBe('Beetle');
    expect(resolveWho('pay sarah').confirm).toBe(true);
    expect(resolveWho('0234567890').person?.name).toBe('Sarah Adeyemi');
    expect(resolveWho('give it to bola')).toEqual({ person: null, hint: 'bola' });
    expect(resolveWho("send 2k to tobi's beetle account").person?.tag).toBe('tobi');
  });
  it('asks for what is missing on the card, and takes the rest in words', async () => {
    const r1 = await agent.ask({ text: 'send something to Chidi' }, ctx());
    expect(panels(r1.blocks)).toHaveLength(0);
    const [ask] = asks(r1.blocks);
    expect(ask).toMatchObject({ tool: 'transfer', fields: ['who', 'amount'], values: { who: 'Chidi Okafor' }, found: { person: expect.objectContaining({ bank: 'Access Bank' }) }, saved: 'person' });
    expect(askMissing(ask!)).toEqual(['amount']);
    expect(r1.pending).toEqual({ need: 'ask', ask });
    /* the amount typed goes onto the card, which is then ready for its own button */
    const r2 = await agent.ask({ text: '5k' }, ctx(r1.pending));
    expect(fills(r2.blocks)[0]).toMatchObject({ askId: ask!.id, values: { who: 'Chidi Okafor', amount: 5_000 } });
    expect(fills(r2.blocks)[0]?.done).toBeFalsy();
    expect(said(r2.blocks)).toContain('All there');
    expect(r2.pending?.need).toBe('ask');
    /* an amount with nobody named: the card asks who */
    const r3 = await agent.ask({ text: 'transfer 3000' }, ctx());
    const [who] = asks(r3.blocks);
    expect(who?.values).toEqual({ who: undefined, amount: 3_000 });
    expect(askMissing(who!)).toEqual(['who']);
    const r4 = await agent.ask({ text: '0234567891' }, ctx(r3.pending));
    expect(fills(r4.blocks)[0]?.found?.person).toMatchObject({ name: 'Chidi Okafor', bank: 'Access Bank' });
    /* a name it does not know stays open, with a word about it */
    const r5 = await agent.ask({ text: 'bola' }, ctx(r3.pending));
    expect(fills(r5.blocks)[0]).toMatchObject({ values: { who: 'bola' }, found: { person: null }, hint: 'bola' });
    expect(said(r5.blocks)).toContain('not paid anyone called bola');
    expect(r5.pending?.need).toBe('ask');
  });
  it('takes the card filled in by hand', async () => {
    const r1 = await agent.ask({ text: 'send money' }, ctx());
    const [ask] = asks(r1.blocks);
    expect(askMissing(ask!)).toEqual(['who', 'amount']);
    const r2 = await agent.ask({ answers: { askId: ask!.id, values: { who: 'Sarah', amount: 2_000 } } }, ctx(r1.pending));
    const filled = r2.pending?.need === 'ask' ? r2.pending.ask : null;
    expect(askMissing(filled!)).toEqual([]);
    expect(panelFromAsk(filled!)?.rows.map(x => x.value)).toEqual(['Sarah Adeyemi', 'GTBank', '₦2,000', 'Free', 'In a few seconds']);
  });
  it('will not send more than there is', async () => {
    const r = await agent.ask({ text: 'send 900k to Sarah' }, ctx());
    expect(panels(r.blocks)).toHaveLength(0);
    expect(r.pending?.need).toBe('ask');
    expect(asks(r.blocks)[0]?.values.amount).toBeUndefined();
    expect(asks(r.blocks)[0]?.note).toContain('more than');
  });
  it('will not send all of it to a number never paid, whatever bank it is at', async () => {
    const r = await agent.ask({ text: 'send everything to 0123456789' }, ctx());
    expect(asks(r.blocks)).toHaveLength(0);
    expect(said(r.blocks)).toContain('I will not do this one from here');
    /* a number paid before is somebody known: the card comes up */
    const known = await agent.ask({ text: 'send 5k to 0234567890' }, ctx());
    expect(asks(known.blocks)[0]?.found?.person?.name).toBe('Sarah Adeyemi');
  });
  it('corrects an amount on a panel already up', async () => {
    const panel = transferPanel(PEOPLE[0]!, 20_000);
    const r = await agent.ask({ text: '15k' }, ctx({ need: 'amount-for', panel }));
    expect(r.blocks[0]).toEqual({ kind: 'amend', panelId: panel.id, amount: 15_000 });
  });
  it('reads a photo and asks whether that is the person', async () => {
    const r = await agent.ask({ photo: { uri: 'file:///slip.jpg' } }, ctx());
    expect(r.reading?.numbers).toEqual(['0234567890']);
    expect(panels(r.blocks)[0]?.tool).toBe('found');
    expect(said(r.blocks)).toContain('Sarah Adeyemi at GTBank');
    expect(r.pending).toMatchObject({ need: 'ask', ask: { tool: 'transfer', values: { who: 'Sarah Adeyemi' }, confirmWho: true } });
    const both = await agent.ask({ photo: { uri: 'file:///slip.jpg' }, text: 'send 20k' }, ctx());
    expect(panels(both.blocks).map(p => p.tool)).toEqual(['found']);
    expect(asks(both.blocks)[0]?.values.amount).toBe(20_000);
  });
  it('knows the bills, the data, the dollars and the balance', async () => {
    const bill = panels((await agent.ask({ text: 'top up my light' }, ctx())).blocks)[0];
    expect(bill?.tool).toBe('pay');
    expect(bill?.rows.map(x => x.value)).toEqual(['Ikeja Electric', 'Prepaid · 4457 8891', 'Ibrahim Musa', '₦8,000', 'About 38 kWh', 'Free']);
    expect(bill?.move?.reference).toMatch(/^\d{5} \d{5} \d{5} \d{5}$/);
    const data = panels((await agent.ask({ text: 'buy data' }, ctx())).blocks)[0];
    expect(data?.tool).toBe('data');
    expect(data?.rows.map(x => x.value)).toEqual(['0906 911 3588 · your line', 'MTN', '5GB for 30 days', '₦2,500']);
    const d = await agent.ask({ text: 'what about dollars' }, ctx());
    expect(d.blocks[0]?.kind).toBe('note');
    expect(said((await agent.ask({ text: 'how much do I have' }, ctx())).blocks)).toContain('₦595,320');
    expect(said((await agent.ask({ text: 'knit me a jumper' }, ctx())).blocks)).toContain('Which one');
  });
  it('gives every panel its own id', async () => {
    const a = panels((await agent.ask({ text: 'top up my light' }, ctx())).blocks)[0]!;
    const b = panels((await agent.ask({ text: 'top up my light' }, ctx())).blocks)[0]!;
    expect(a.id).not.toBe(b.id);
  });
});

describe('what Beetle asks for', () => {
  it('skips the asking for a repeat: a line or a meter paid before', async () => {
    const mum = await agent.ask({ text: '2k data for mum' }, ctx());
    expect(asks(mum.blocks)).toHaveLength(0);
    expect(panels(mum.blocks)[0]?.rows.map(x => x.value)).toEqual(['Mum · 0803 214 4471', 'MTN', '2GB for 30 days', '₦2,000']);
    const usual = await agent.ask({ text: 'data for mum' }, ctx());
    expect(panels(usual.blocks)[0]?.rows[2]?.value).toBe('5GB for 30 days');
    expect(said(usual.blocks)).toContain('as last time');
    const dad = await agent.ask({ text: 'airtime for dad' }, ctx());
    expect(panels(dad.blocks)[0]?.rows.map(x => x.value)).toEqual(['Dad · 0805 331 0921', 'Glo', '₦1,000', 'At once']);
    const flat = await agent.ask({ text: "pay mum's flat" }, ctx());
    expect(panels(flat.blocks)[0]?.rows.map(x => x.value)).toEqual(['Eko Electricity', 'Postpaid · 5415 0011 234', 'Aisha Musa', '₦12,000', 'The account, at once', 'Free']);
    const usualBill = await agent.ask({ text: 'pay my light bill, 5k' }, ctx());
    expect(panels(usualBill.blocks)[0]?.action).toEqual({ label: 'Pay ₦5,000', amount: 5_000 });
  });
  it('asks for the plan on a number not topped up before, with the network known', async () => {
    const r = await agent.ask({ text: 'data for 0812 345 6789' }, ctx());
    const [ask] = asks(r.blocks);
    expect(ask).toMatchObject({ tool: 'data', fields: ['number', 'plan'], values: { number: '08123456789' }, saved: 'line' });
    expect(askMissing(ask!)).toEqual(['plan']);
    expect(said(r.blocks)).toContain('Airtel');
    const r2 = await agent.ask({ text: '2gb' }, ctx(r.pending));
    expect(fills(r2.blocks)[0]).toMatchObject({ values: { number: '08123456789', plan: 'airtel-2gb-30d' } });
    const ready = r2.pending?.need === 'ask' ? r2.pending.ask : null;
    expect(panelFromAsk(ready!)?.rows.map(x => x.value)).toEqual(['0812 345 6789', 'Airtel', '2GB for 30 days', '₦1,800']);
    /* a plan on the wrong network is not one */
    const wrong = await agent.ask({ answers: { askId: ask!.id, values: { number: '08123456789', plan: 'mtn-5gb-30d' } } }, ctx(r.pending));
    expect(panels(wrong.blocks)).toHaveLength(0);
    expect(wrong.pending?.need).toBe('ask');
  });
  it('asks for the number and the plan when they are for somebody it has no number for', async () => {
    const r = await agent.ask({ text: 'buy data for my sister' }, ctx());
    expect(askMissing(asks(r.blocks)[0]!)).toEqual(['number', 'plan']);
    expect(said(r.blocks)).toContain('do not have a number');
  });
  it('asks how much airtime, on the own line', async () => {
    const r = await agent.ask({ text: 'airtime' }, ctx());
    const [ask] = asks(r.blocks);
    expect(ask).toMatchObject({ tool: 'airtime', values: { number: '09069113588' } });
    expect(askMissing(ask!)).toEqual(['amount']);
    const r2 = await agent.ask({ text: '500' }, ctx(r.pending));
    const ready = r2.pending?.need === 'ask' ? r2.pending.ask : null;
    expect(panelFromAsk(ready!, savedOf(ctx()))?.rows.map(x => x.value)).toEqual(['0906 911 3588 · your line', 'MTN', '₦500', 'At once']);
    expect(panels((await agent.ask({ text: '1k airtime for 0803 214 4471' }, ctx())).blocks)[0]?.rows[0]?.value).toBe('Mum · 0803 214 4471');
  });
  it('asks for a new meter piece by piece, and looks it up', async () => {
    const r = await agent.ask({ text: 'pay a bill' }, ctx());
    const [ask] = asks(r.blocks);
    expect(ask).toMatchObject({ tool: 'pay', fields: ['disco', 'meterKind', 'meter', 'amount'], saved: 'meter' });
    expect(askMissing(ask!)).toEqual(['disco', 'meterKind', 'meter', 'amount']);
    const r2 = await agent.ask({ text: 'prepaid, JED, 12345678901, 5k' }, ctx(r.pending));
    expect(fills(r2.blocks)[0]).toMatchObject({ values: { meterKind: 'prepaid', disco: 'jos', meter: '12345678901', amount: 5_000 } });
    const ready = r2.pending?.need === 'ask' ? r2.pending.ask : null;
    const p = panelFromAsk(ready!);
    expect(p?.rows[0]?.value).toBe('Jos Electricity');
    expect(p?.rows[2]?.value).toBeTruthy();
    expect(p?.rows[4]?.value).toBe('About 24 kWh');
    /* a meter the company does not know stays open */
    const dud = await agent.ask({ answers: { askId: ask!.id, values: { meterKind: 'prepaid', disco: 'jos', meter: '12345670000', amount: 5_000 } } }, ctx(r.pending));
    expect(panels(dud.blocks)).toHaveLength(0);
    expect(fills(dud.blocks)[0]?.found?.meter).toBeNull();
    expect(said(dud.blocks)).toContain('no prepaid meter');
  });
  it('answers a question in the middle without losing the panel', async () => {
    const r = await agent.ask({ text: 'send money' }, ctx());
    const r2 = await agent.ask({ text: 'how much do I have' }, ctx(r.pending));
    expect(said(r2.blocks)).toContain('₦595,320');
    expect(r2.pending).toEqual(r.pending);
    const r3 = await agent.ask({ text: '???' }, ctx(r.pending));
    expect(said(r3.blocks)).toContain('Who is it for');
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
