/* What Beetle says about a request, and how money is written the way a
   message writes it. Plain words, with nothing of the screen in them, so
   the tests can read them. */
import { groupPhone, naira } from '../../lib/format';
import { firstOf, lineEnding, subjectOf, type Payer } from './people';

/** 20k, from 20,000: money the way a message writes it. */
export const shortMoney = (n: number) => (n >= 1_000 && n % 1_000 === 0 && n < 1_000_000 ? `${n / 1_000}k` : naira(n));

/** What Beetle says about where the request stands. */
export function lineFor(who: Payer | null, amount: number): string {
  if (who && amount) {
    if (who.note === 'paid you before') {
      const first = firstOf(who.name);
      const verb = who.pronoun === 'they' ? 'are' : 'is';
      return `${who.name}, the line ending ${lineEnding(who.phone)}. ${subjectOf(who.pronoun)} ${verb} the only ${first} who has ever paid you.`;
    }
    return `${who.name}, on ${groupPhone(who.phone)}. I have not seen this line before, so check it before you send.`;
  }
  if (who) return `Tap Amount to say how much to ask ${firstOf(who.name)} for.`;
  if (amount) return `Tap Person to pick someone who has paid you before, or somebody new.`;
  return 'Tap Person and Amount to fill them in.';
}
