/* Reading the shared state from a component. The store is plain JavaScript
   shared with the web build, so these two hooks are what tie it to React:
   one redraws when the account changes, the other when the payment being put
   together changes. */
import { useEffect, useState } from 'react';
/* the state layer is plain JavaScript, shared with the web build */
import { get, subscribe } from './store.js';
import { draft, formDraft, set } from './flow.js';
import * as act from './actions.js';

export type Account = {
  everyday: number;
  dollars: number;
  rate: number;
  health: number;
  goal: { name: string; target: number; saved: number; by: string; paused: boolean };
  card: { spent: number; frozen: boolean };
  limits: { transfer: number; day: number; month: number };
  outToday: number;
  frozen: boolean;
  passcode: string;
  toggles: Record<string, boolean>;
  standing: { name: string; on: boolean }[];
  devices: { name: string }[];
  filter: string;
  ledger: Ledger[];
};

export type Ledger = {
  id: string;
  day: string;
  icon: string;
  name: string;
  detail: string;
  time: string;
  amount: number;
  to: string;
  kind: string;
};

export type Person = { name: string; bank: string; account: string; initials: string; note?: string };

export type Draft = {
  kind: string;
  to: Person;
  amount: number;
  from: 'everyday' | 'dollars';
  narration: string;
  network: string;
  line: string;
  plan: string;
  biller: string;
  meter: string;
  reason: string;
  direction: string;
  spoken?: string;
  receipt: Receipt | null;
};

export type Receipt = {
  to?: Person;
  amount: number;
  fee?: number;
  from?: string;
  narration?: string;
  total?: number;
  balanceAfter?: number;
  at: string;
  session?: string;
  label?: string;
  biller?: string;
  meter?: string;
  token?: string | null;
  gave?: number;
  got?: number;
  rate?: number;
  unit?: string;
  units?: number;
};

/** Redraw whenever the account changes, so every screen agrees about the money. */
export function useStore(): Account {
  const [, tick] = useState(0);
  useEffect(() => {
    const off = subscribe(() => tick(n => n + 1));
    return () => {
      off();
    };
  }, []);
  return get() as Account;
}

/** The payment being put together, and the one way to change it. */
export function useDraft(): [Draft, (patch: Partial<Draft>) => void] {
  const [, tick] = useState(0);
  return [
    draft as Draft,
    (patch: Partial<Draft>) => {
      set(patch);
      tick(n => n + 1);
    },
  ];
}

/** The same, for the send form, which has a transfer of its own until you
    begin one. */
export function useForm(): [Draft, (patch: Partial<Draft>) => void] {
  const [, tick] = useState(0);
  return [
    formDraft() as Draft,
    (patch: Partial<Draft>) => {
      set(patch);
      tick(n => n + 1);
    },
  ];
}

/* The one place the untyped state layer is given a shape the screens can
   rely on. `check` answers whether a payment can leave, and the screens use
   its reason word for word. */
export type Verdict =
  | { ok: true; fee: number; total: number }
  | {
      ok: false;
      code: 'none' | 'frozen' | 'short' | 'transfer-limit' | 'day-limit';
      why: string;
      short?: number;
      over?: number;
    };

/** Can this payment leave, in a shape the screens can narrow on. */
export const check = (p: { amount: number; from?: string }): Verdict => act.check(p) as Verdict;
