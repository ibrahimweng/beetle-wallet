/* Words typed at home that are a page rather than a chat: asking somebody
   for money is the Request page, and asking how to be paid is Three ways
   to be paid. Everything else goes to Beetle in the chat. */
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

/** The page the words open, with what they carry handed to it; null for the chat. */
export function pageFor(text: string): string | null {
  const q = text.trim();
  if (!q) return null;
  if (isRequest(q)) {
    const who = payerIn(q);
    const amount = amountIn(q) ?? undefined;
    const note = noteIn(q) ?? undefined;
    requestDraft.put({ who: who ?? undefined, amount, note, said: q });
    return '/request';
  }
  if (isWays(q)) return '/ways';
  return null;
}
