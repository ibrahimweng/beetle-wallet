/* The screen fixes after the analysis of Round 21: the camera a page of the
   app's own stack, never a sheet; the sample photos read as what they are
   wherever the phone keeps them; an answer put into a chat the same way
   wherever it lands; and a line of the record said whole to VoiceOver. */
import { vi } from 'vitest';
/* the services and the sheet stack reach for the phone; here they get stand-ins, as in agent.test.ts */
vi.mock('react-native', () => ({ Platform: { OS: 'web', select: (o: Record<string, unknown>) => o.default }, Animated: {} }));
vi.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined } }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n), CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digestStringAsync: async () => 'h' }));
import { isSheet } from '../src/design/sheetStack';
import { MockReader } from '../src/services/reader';
import { PEOPLE, transferPanel } from '../src/services/agent';
import { isAsk, isPanel, turn, withBlock } from '../src/features/agent/turns';
import { spokenLine } from '../src/lib/spoken';

const routes = (...names: string[]) => names.map((name, i) => ({ key: `k${i}`, name }));

describe('the camera', () => {
  it('is a page, the whole screen, even opened from a sheet', () => {
    const r = routes('home', 'services', 'bills', 'scan');
    expect(isSheet(r, 'k2')).toBe(true);
    expect(isSheet(r, 'k3')).toBe(false);
  });
  it('leaves what it opens in its place a sheet, as it would be from the page under it', () => {
    expect(isSheet(routes('home', 'services', 'bills', 'meter'), 'k3')).toBe(true);
    expect(isSheet(routes('home', 'send', 'scan'), 'k2')).toBe(false);
  });
});

describe('a sample photo', () => {
  const r = new MockReader(0);
  it('reads as the sample it says it is, whatever the phone named it', async () => {
    const kept = 'file:///var/mobile/Containers/ExponentAsset-4f1c9a.png';
    expect((await r.read(kept, 'bill')).bill?.meter).toBe('44578891');
    expect((await r.read(kept, 'message')).request?.from).toBe('Musa D.');
    expect((await r.read(kept, 'topup')).topup?.line).toBe('08032144471');
    expect((await r.read(kept, 'slip')).numbers.length).toBe(1);
  });
  it('is still known by its name where it keeps one', async () => {
    expect((await r.read('/assets/sample-bill.png')).bill).toBeDefined();
    expect((await r.read('/assets/sample-slip.png')).bill).toBeUndefined();
  });
});

describe('an answer put into a chat', () => {
  it('adds what is new: an ask open, a panel with its rows still to land', () => {
    const p = transferPanel(PEOPLE[0]!, 5_000);
    const list = withBlock(withBlock([turn.you('Send 5k to Sarah')], { kind: 'say', text: 'Here it is.' }), { kind: 'panel', panel: p });
    expect(list).toHaveLength(3);
    const last = list[2]!;
    expect(isPanel(last) && last.state).toBe('running');
  });
  it('changes what is there: a panel drawn again for a new amount, an ask filled', () => {
    const p = transferPanel(PEOPLE[0]!, 5_000);
    const amended = withBlock([turn.panel(p)], { kind: 'amend', panelId: p.id, amount: 20_000 });
    const t = amended[0]!;
    expect(isPanel(t) && t.block.panel.action?.amount).toBe(20_026.88);
    const ask = { id: 'a1', tool: 'transfer' as const, title: 'Send money', values: {}, fields: [] };
    const filled = withBlock([turn.ask(ask as never, 'busy')], { kind: 'fill', askId: 'a1', values: { amount: 5000 } as never, done: true });
    const f = filled[0]!;
    expect(isAsk(f) && f.state).toBe('done');
  });
});

describe('a line of the record, to VoiceOver', () => {
  it('says which way the money went, how much, and the line’s own words', () => {
    expect(spokenLine('−₦20,026.88', 'GTBank · 14:05')).toBe('Money out, ₦20,026.88, GTBank, 14:05');
    expect(spokenLine('+₦50,000', 'Salary · 09:00')).toBe('Money in, ₦50,000, Salary, 09:00');
    expect(spokenLine('₦0', '')).toBe('₦0');
  });
});
