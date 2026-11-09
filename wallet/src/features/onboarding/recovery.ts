/* Getting an account back is paused for a day after three wrong BVNs on it
   (Round 30): somebody guessing at another's account gets three tries, not
   a night of them. The real service keeps this against the account on the
   server, where a new phone cannot clear it; this keeps it on the phone. */
import { storage } from '../../services';

const KEY = 'beetle.recovery-paused.v1';
const DAY = 24 * 60 * 60 * 1000;

const clock = (at: number) => {
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} tomorrow`;
};

/** When getting the account back opens again, in words, or null when it is open. */
export async function recoveryPaused(account: string, now = Date.now()): Promise<string | null> {
  const until = ((await storage.get<Record<string, number>>(KEY)) ?? {})[account];
  return until && until > now ? clock(until) : null;
}

/** Paused for a day from now; the time it opens again, in words. */
export async function pauseRecovery(account: string, now = Date.now()): Promise<string> {
  const kept = (await storage.get<Record<string, number>>(KEY)) ?? {};
  await storage.set(KEY, { ...kept, [account]: now + DAY });
  return clock(now + DAY);
}

/* Three numbers that do not match on the way in, and the phone waits a little before it checks again (Round 42, the
   owner's word: a day was a wall; a short wait with its countdown shown is enough to stop somebody trying numbers one
   after another). Held in memory only, like the rest of an unfinished sign-up: nothing about it is kept on the phone. */
export const ID_WAIT_SECONDS = 120;
let idMissCount = 0;
let idPausedUntil = 0;

/** Seconds until checks open again, or 0 when they are open. */
export const idWaitLeft = (now = Date.now()) => Math.max(0, Math.ceil((idPausedUntil - now) / 1000));

/** One more miss: how many there have been, and the seconds to wait if this was the third. */
export function noteIdMiss(now = Date.now()): { misses: number; wait: number } {
  idMissCount += 1;
  if (idMissCount >= 3) {
    const misses = idMissCount;
    idMissCount = 0;
    idPausedUntil = now + ID_WAIT_SECONDS * 1000;
    return { misses, wait: ID_WAIT_SECONDS };
  }
  return { misses: idMissCount, wait: 0 };
}
export const idMisses = () => idMissCount;
export function clearIdMisses() {
  idMissCount = 0;
  idPausedUntil = 0;
}

/* Wrong BVNs while getting an account back, counted against the account on the phone (the analysis after Round 34: the
   screen's own count was the code's too, so two wrong codes left one try at the BVN, and going back to the number gave
   two more each time). A match clears them; the third pauses getting it back for a day and starts the count again. */
const BVN_MISSES = 'beetle.recovery-misses.v1';
/** One more wrong BVN on an account: how many there have been, and when it opens again if this was the third. */
export async function noteRecoveryMiss(account: string, now = Date.now()): Promise<{ misses: number; until: string | null }> {
  const kept = (await storage.get<Record<string, number>>(BVN_MISSES)) ?? {};
  const misses = (kept[account] ?? 0) + 1;
  if (misses >= 3) {
    await storage.set(BVN_MISSES, { ...kept, [account]: 0 });
    return { misses, until: await pauseRecovery(account, now) };
  }
  await storage.set(BVN_MISSES, { ...kept, [account]: misses });
  return { misses, until: null };
}
export async function clearRecoveryMisses(account: string) {
  const kept = (await storage.get<Record<string, number>>(BVN_MISSES)) ?? {};
  await storage.set(BVN_MISSES, { ...kept, [account]: 0 });
}
