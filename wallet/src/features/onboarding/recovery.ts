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

/* The same pause for the details held to a BVN or NIN on the way in (Round 32): three that do not match, and this
   phone checks no more for a day, so it cannot be used to try names and birthdays against other people's numbers. */
const ID_CHECKS = 'way-in:id-checks';
export const idChecksPaused = (now = Date.now()) => recoveryPaused(ID_CHECKS, now);
export const pauseIdChecks = (now = Date.now()) => pauseRecovery(ID_CHECKS, now);

/* The misses are counted on the phone, not in the screen, so closing the app and opening it again does not give three
   more; a match clears them, and the third pauses checks and starts the count again. */
const MISSES = 'beetle.id-misses.v1';
/** One more miss: how many there have been, and when checks open again if this was the third. */
export async function noteIdMiss(now = Date.now()): Promise<{ misses: number; until: string | null }> {
  const misses = ((await storage.get<number>(MISSES)) ?? 0) + 1;
  if (misses >= 3) {
    await storage.set(MISSES, 0);
    return { misses, until: await pauseIdChecks(now) };
  }
  await storage.set(MISSES, misses);
  return { misses, until: null };
}
export const idMisses = async () => (await storage.get<number>(MISSES)) ?? 0;
export const clearIdMisses = () => storage.set(MISSES, 0);
