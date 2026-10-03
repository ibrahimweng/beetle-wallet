/* Words typed at home that are a page rather than a chat: asking somebody
   for money is the Request page. Asking how to be paid is the Receive card
   in the chat, as the chip puts it up. Everything else goes to Beetle. */
import { amountIn } from '../../services/agent';
import { requestDraft } from './hand';
import { noteIn, payerIn } from './people';

/** "ask musa for 20k", "request 5k from sarah", "musa owes me 20k": a request. */
export function isRequest(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return /^(ask|request|remind)\b/.test(lower) || /\b(owes? me|send me|request .* from|ask .* for)\b/.test(lower);
}

/** "how do I get paid", "receive money", "my account number", "how can people pay me": the ways. */
export function isWays(text: string): boolean {
  const lower = text.toLowerCase();
  return /\b(get paid|be paid|receive money|receiving money|pay me|my account number|account details|how do i receive|how can .* pay me|my code|qr)\b/.test(lower);
}

/** "my bills", "what do I owe this month", "bills": the month's bills. */
export function isBills(text: string): boolean {
  return /\b(my bills|the bills|bills this month|what do i owe|what is due|due this month)\b|^bills$/i.test(text.trim());
}

/** "borrow", "loan", "how much can I borrow": Borrow. */
export function isLoan(text: string): boolean {
  return /\b(borrow|loan|lend me|overdraft)\b/i.test(text);
}

/** "services", "what can I pay for", "everything": the drawer. */
export function isServices(text: string): boolean {
  return /\b(all services|what can i pay|what can you pay|everything you can do|services)\b/i.test(text);
}

/** "convert", "buy dollars", "turn 50k into dollars": Convert. */
export function isConvert(text: string): boolean {
  return /\b(convert|buy dollars|into dollars|to dollars|dollars? (in)?to naira|back to naira|change (some )?naira)\b/i.test(text);
}

/** "my goal", "my savings", "holiday goal", "how is my saving going": the goal page. Money put away is the chat's Save card (see isSave). */
export function isGoal(text: string): boolean {
  return /\b(my goals?|the goal|my savings?|savings? goals?|holiday goal|how is my saving)\b/i.test(text);
}

/** "start a goal", "a new goal", "save up for a car": the goal page with a new goal on its sheet, filled, and named where the words name it. */
export function newGoalIn(text: string): { name?: string } | null {
  const q = text.trim();
  const m = q.match(/\b(?:save|saving)(?: up)? for (an?|my) ([a-z][a-z ]{1,20}?)[.!]*$/i);
  if (m && !amountIn(q)) {
    const what = `${m[1]!.toLowerCase() === 'my' ? '' : `${m[1]} `}${m[2]!.trim()}`;
    return { name: what.charAt(0).toUpperCase() + what.slice(1) };
  }
  return /\b(start|set up|create|make|open) (a |my )?(new )?(savings? )?goal\b|\bnew (savings? )?goal\b/i.test(q) ? {} : null;
}

/** "money health", "my score", "how am I doing": Money health. */
export function isHealth(text: string): boolean {
  return /\b(money health|health score|my score|how am i doing|how am i handling)\b/i.test(text);
}

/** The page the words open, with what they carry handed to it; null for the chat. */
export function pageFor(text: string): string | null {
  const q = text.trim();
  if (!q) return null;
  if (isBills(q)) return '/bills';
  if (isLoan(q)) return '/loan';
  if (isServices(q)) return '/services';
  if (isConvert(q)) return '/convert';
  const fresh = newGoalIn(q);
  if (fresh) return fresh.name ? `/goal?new=1&name=${encodeURIComponent(fresh.name)}` : '/goal?new=1';
  if (isGoal(q)) return '/goal';
  if (isHealth(q)) return '/health';
  if (isRequest(q)) {
    const who = payerIn(q);
    const amount = amountIn(q) ?? undefined;
    const note = noteIn(q) ?? undefined;
    requestDraft.put({ who: who ?? undefined, amount, note, said: q });
    return '/request';
  }
  return null;
}
