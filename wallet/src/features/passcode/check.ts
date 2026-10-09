/* The gate money goes through, and the one the app opens with. Six digits,
   checked against the passcode kept on this device for the account —
   stretched, never as typed — or, where the build lets them (the lab, and
   the demo account), its keys, so that trying the app never means
   remembering one; the device's own check says which (onboarding/store).
   Three wrong in a row and the gate shuts: half a minute the first time,
   then five minutes, then half an hour, then two hours each time after. A
   right one opens it and forgets the wrong ones. The gate is kept on the
   phone, so closing the app does not open it again (the analysis after
   Round 21: it was kept in memory only, and shut for half a minute at
   most). The face or the finger, where the phone has one set up and it is
   switched on, is asked first, and the six digits are the way past it
   (biometric.ts). The password (Round 30) is not these six: it logs in on a
   new phone, and is changed from Lock and privacy (Round 32, the owner's
   word). */
import { DEMO_PASSCODES, DEMO_PASSWORDS, MOCK, sealed } from '../../services';
import { LAB } from '../../lab/enabled';

/** The build's own keys let anyone through only where trying the app is
    the point: the lab, and the demo account — 123456 and 654321 for the six
    digits, beetle123 and beetle321 for the password on Log in. Every other
    account needs its own, in every build (the analysis after Round 21: they
    opened every account in every build). */
export const demoPasscodeOpens = (code: string, account: { demo?: boolean } | undefined, lab = LAB) =>
  MOCK && (lab || !!account?.demo) && (DEMO_PASSCODES.includes(code) || DEMO_PASSWORDS.includes(code));

/** The line where the build's keys open it, so trying the app never means guessing: the six digits on the keypad
    screens, the password where one is typed; nothing anywhere else. */
export const demoHint = (account: { demo?: boolean } | undefined, what: 'passcode' | 'password' = 'passcode', lab = LAB) =>
  MOCK && (lab || !!account?.demo) ? `This build takes ${what === 'passcode' ? DEMO_PASSCODES[1] : DEMO_PASSWORDS[1]} as well.` : undefined;

export const TRIES = 3;
/** How long the gate stays shut each time it shuts, one after another; the last holds after that. */
export const LOCKS_MS = [30_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000] as const;
export const LOCK_MS = LOCKS_MS[0];
const GATE_KEY = 'beetle.gate.v1';

type Gate = { wrong: number; lockedUntil: number; shut: number };
const gate: Gate = { wrong: 0, lockedUntil: 0, shut: 0 };
let loaded: Promise<void> | null = null;

/** The gate as the phone kept it, read once. It is kept with the passcode, in the secure store (the analysis after
    Round 34: in plain storage, removing the app on an iPhone cleared the lockout while the keychain kept the session). */
export function loadGate(): Promise<void> {
  loaded ??= sealed
    .get<Partial<Gate>>(GATE_KEY)
    .then(kept => {
      if (!kept) return;
      gate.wrong = Math.max(gate.wrong, kept.wrong ?? 0);
      gate.lockedUntil = Math.max(gate.lockedUntil, kept.lockedUntil ?? 0);
      gate.shut = Math.max(gate.shut, kept.shut ?? 0);
    })
    .catch(() => undefined);
  return loaded;
}
const keepGate = () => void sealed.set(GATE_KEY, { ...gate });

/** Seconds the gate stays shut for, or 0 when it is open. */
export function lockedFor(now = Date.now()): number {
  return gate.lockedUntil > now ? Math.ceil((gate.lockedUntil - now) / 1000) : 0;
}

export type Verdict = { ok: true } | { ok: false; triesLeft: number } | { ok: false; lockedFor: number };

/** What was typed, against what the device holds (`own`, the device's own check). */
export async function checkCode(code: string, own: (code: string) => Promise<boolean>, now = Date.now()): Promise<Verdict> {
  await loadGate();
  const shut = lockedFor(now);
  if (shut) return { ok: false, lockedFor: shut };
  if (await own(code)) {
    gate.wrong = 0;
    gate.shut = 0;
    keepGate();
    return { ok: true };
  }
  gate.wrong += 1;
  if (gate.wrong >= TRIES) {
    const ms = LOCKS_MS[Math.min(gate.shut, LOCKS_MS.length - 1)]!;
    gate.wrong = 0;
    gate.shut += 1;
    gate.lockedUntil = now + ms;
    keepGate();
    return { ok: false, lockedFor: Math.ceil(ms / 1000) };
  }
  keepGate();
  return { ok: false, triesLeft: TRIES - gate.wrong };
}

/** The gate as new, for a test or a fresh sign in. */
export function resetGate() {
  gate.wrong = 0;
  gate.lockedUntil = 0;
  gate.shut = 0;
  keepGate();
}

/** How long, in words: "30 seconds", "5 minutes", "2 hours". */
export function waitWords(seconds: number): string {
  if (seconds < 90) return `${seconds} seconds`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 90) return `${minutes} minutes`;
  return `${Math.ceil(minutes / 60)} hours`;
}

/** The words for a verdict that said no. */
export function refusal(v: Extract<Verdict, { ok: false }>): string {
  if ('lockedFor' in v) return `That was three tries. Give it ${waitWords(v.lockedFor)} and try again.`;
  return v.triesLeft === 1 ? 'Not it. One more try.' : `Not it. ${v.triesLeft} more tries.`;
}
