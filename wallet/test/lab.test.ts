import { describe, expect, it, vi } from 'vitest';

/* The catalogue reaches the services for the demo account and the account
   number, and they reach for the device; none of that is under test here. */
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined } }));
vi.mock('react-native', () => ({ Platform: { OS: 'web', select: (o: Record<string, unknown>) => o.default } }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n), CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digestStringAsync: async () => 'h' }));

import { FEATURES, HOME, WAY_IN } from '@/lab/catalogue';
import { nextStep, type Step } from '@/features/onboarding/machine';
import { initialStage, isStage, STAGES, type Stage } from '@/features/onboarding/stages';

/* What the way in should still have to do when the lab opens each stage: the
   stage's own step, or for the ones off the main path (nothing came back,
   the way back in) the step they branch from. */
const STILL_TO_DO: Record<Stage, Step> = {
  welcome: 'welcome',
  number: 'welcome',
  code: 'code',
  identity: 'identity',
  confirm: 'confirm',
  nomatch: 'identity',
  face: 'face',
  passcode: 'passcode',
  ready: 'ready',
  signin: 'welcome',
  signcode: 'welcome',
};

describe('the lab', () => {
  it('lists every stage of the way in, once each', () => {
    expect([...WAY_IN.places.map(p => p.id)].sort()).toEqual([...STAGES].sort());
  });

  it('walks exactly the way to each stage, and no further', () => {
    for (const p of WAY_IN.places) {
      const stage = p.id as Stage;
      expect(nextStep(p.seed.progress), `the way in before ${stage}`).toBe(STILL_TO_DO[stage]);
      const asked = new URL('http://app' + p.href).searchParams;
      expect(asked.get('stage')).toBe(stage);
      expect(isStage(asked.get('stage'))).toBe(true);
      if (stage === 'ready') expect(initialStage(p.seed.progress, p.seed.session)).toBe('ready');
      else expect(p.seed.session, `${stage} should open without a session`).toBeNull();
      if (stage === 'signcode') expect(asked.get('phone')).toMatch(/^0\d{10}$/);
    }
  });

  it('opens home signed in, as a new account and as the demo one', () => {
    for (const p of HOME.places) {
      expect(p.href).toBe('/home');
      expect(p.seed.session).not.toBeNull();
      expect(p.seed.progress).toEqual({});
    }
    expect(HOME.places.map(p => !!p.seed.session?.account.demo)).toEqual([false, true]);
  });

  it('gives every place its own id and its own folder', () => {
    const ids = FEATURES.flatMap(f => f.places.map(p => p.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of FEATURES) expect(f.folder).toMatch(/^src\/features\//);
  });
});
