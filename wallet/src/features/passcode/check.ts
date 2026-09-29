/* The gate money goes through. Six digits, checked against the passcode
   kept on this device — hashed, never as typed — or, in this build, the two
   keys it lets through so that trying the app never means remembering one.
   Three wrong in a row and the gate shuts for half a minute; a right one
   opens it and forgets the wrong ones. The face, where the phone has one and
   it is enrolled, is the way past the digits. */
import { Platform } from 'react-native';
import { DEMO_PASSCODES, MOCK } from '../../services';

export const TRIES = 3;
export const LOCK_MS = 30_000;

type Gate = { wrong: number; lockedUntil: number };
const gate: Gate = { wrong: 0, lockedUntil: 0 };

/** Seconds the gate stays shut for, or 0 when it is open. */
export function lockedFor(now = Date.now()): number {
  return gate.lockedUntil > now ? Math.ceil((gate.lockedUntil - now) / 1000) : 0;
}

export type Verdict = { ok: true } | { ok: false; triesLeft: number } | { ok: false; lockedFor: number };

/** What was typed, against what the device holds. `own` is the device's own
    check; the build's keys go through without it. */
export async function checkCode(code: string, own: (code: string) => Promise<boolean>, now = Date.now()): Promise<Verdict> {
  const shut = lockedFor(now);
  if (shut) return { ok: false, lockedFor: shut };
  const right = (MOCK && DEMO_PASSCODES.includes(code)) || (await own(code));
  if (right) {
    gate.wrong = 0;
    return { ok: true };
  }
  gate.wrong += 1;
  if (gate.wrong >= TRIES) {
    gate.wrong = 0;
    gate.lockedUntil = now + LOCK_MS;
    return { ok: false, lockedFor: Math.ceil(LOCK_MS / 1000) };
  }
  return { ok: false, triesLeft: TRIES - gate.wrong };
}

/** The gate as new, for a test or a fresh sign in. */
export function resetGate() {
  gate.wrong = 0;
  gate.lockedUntil = 0;
}

/** The words for a verdict that said no. */
export function refusal(v: Extract<Verdict, { ok: false }>): string {
  if ('lockedFor' in v) return `That was three tries. Give it ${v.lockedFor} seconds and try again.`;
  return v.triesLeft === 1 ? 'Not it. One more try.' : `Not it. ${v.triesLeft} more tries.`;
}

type FaceModule = typeof import('expo-local-authentication');
const faceModule: FaceModule | null = (() => {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-local-authentication') as FaceModule;
  } catch {
    return null;
  }
})();

/** Can the phone check a face, and has one been enrolled? */
export async function faceAvailable(): Promise<boolean> {
  if (!faceModule) return false;
  try {
    return (await faceModule.hasHardwareAsync()) && (await faceModule.isEnrolledAsync());
  } catch {
    return false;
  }
}

/** The face check itself: true when the phone is sure. */
export async function checkFace(): Promise<boolean> {
  if (!faceModule) return false;
  try {
    const r = await faceModule.authenticateAsync({
      promptMessage: 'Confirm with your face',
      cancelLabel: 'Use the passcode',
      disableDeviceFallback: true,
    });
    return r.success;
  } catch {
    return false;
  }
}
