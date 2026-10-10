/* The companies' own marks: every company the app names finds its tile, a line finds the company it paid, and every
   tile is drawn from plain shapes. */
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'web', select: (o: Record<string, unknown>) => o.default } }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined } }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n), CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digestStringAsync: async () => 'h' }));
import { LOGOS } from '../src/design/logos';
import { logoOf } from '../src/design/brands';
import { lineLogo } from '../src/features/home/lineLogo';
import { BANK_LIST } from '../src/services/recipients';
import { DISCOS, NETWORKS } from '../src/services/nigeria';
import { BILLERS, DEMO_MONTH } from '../src/features/bills/billers';
import { MERCHANTS } from '../src/features/settings/card';
import { LISTED } from '../src/features/dollars/chains';
import { DEMO_LEDGER } from '../src/features/home/account';

describe('company logos (Round 38)', () => {
  it('every bank, network, electricity company, merchant and coin the app names has its logo', () => {
    for (const b of BANK_LIST) expect(logoOf(b.name), b.name).toBeDefined();
    expect(logoOf('Beetle')).toBe('beetle');
    for (const n of NETWORKS) expect(logoOf(n.name), n.name).toBeDefined();
    for (const d of DISCOS) {
      expect(logoOf(d.id), d.id).toBeDefined();
      expect(logoOf(d.name), d.name).toBe(logoOf(d.id));
    }
    for (const m of MERCHANTS.filter(Boolean)) expect(logoOf(m), m).toBeDefined();
    for (const c of LISTED) expect(logoOf(c.id), c.id).toBeDefined();
  });

  it('every biller has one but Lagos Water, which publishes none, and keeps its glyph', () => {
    for (const b of BILLERS) expect(!!logoOf(b.id), b.id).toBe(b.id !== 'lwc');
    for (const b of DEMO_MONTH) expect(!!(logoOf(b.biller) ?? logoOf(b.name)), b.name).toBe(true);
  });

  it('a line named for what was bought still finds whose it was; a name it does not know finds nothing', () => {
    expect(logoOf('MTN data')).toBe('mtn');
    expect(logoOf('Glo airtime')).toBe('glo');
    expect(logoOf('DStv Compact')).toBe('dstv');
    expect(logoOf('WAEC result checker')).toBe('waec');
    expect(logoOf('USDC in')).toBe('usdc');
    expect(logoOf('Guaranty Trust Bank')).toBe('gtbank');
    expect(logoOf('9mobile')).toBe('t2');
    expect(logoOf('Pagrin Limited')).toBeUndefined();
    expect(logoOf('Converted from naira')).toBeUndefined();
    expect(logoOf('Lagos Water')).toBeUndefined();
    expect(logoOf('')).toBeUndefined();
  });

  it('a line wears the company it paid, never a person’s or Beetle’s own', () => {
    const byId = Object.fromEntries(DEMO_LEDGER.map(r => [r.id, lineLogo(r)]));
    expect(byId.l04).toBe('netflix');
    expect(byId.l07).toBe('mtn');
    expect(byId.l11).toBe('ikeja');
    expect(byId.l12).toBe('netflix');
    expect(byId.l05).toBeUndefined();
    expect(byId.l09).toBeUndefined();
    expect(byId.l10).toBeUndefined();
    expect(lineLogo({ kind: 'bill', name: 'Beetle Loans', icon: 'loan' })).toBeUndefined();
    expect(lineLogo({ kind: 'coin', name: 'USDT in', coin: { coin: 'USDT' } })).toBe('usdt');
  });

  it('each tile is a ground and plain shapes: nothing a phone draws differently (no text, pictures or styles)', () => {
    for (const [name, t] of Object.entries(LOGOS)) {
      expect(t.ground, name).toMatch(/^#[0-9a-f]{6}$/);
      expect(t.body, name).not.toMatch(/<(text|image|style|filter|foreignObject|use)\b|class=/);
      /* a tile's ids are left to be made unique where it is drawn */
      for (const id of t.body.match(/\bid="([^"]+)"/g) ?? []) expect(id, name).toMatch(/id="__ID__/);
      expect(t.body.length, name).toBeLessThan(14_000);
    }
  });
});
