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
