/* The ask bar is on almost every screen, so what it does lives in one place.
   A question either takes you somewhere — because the app already has a
   screen that answers it — or it goes to the chat, which answers from what is
   actually in the account. Nothing here reaches a network. */
import { Route } from '../routes';
import { get, dollarsInNaira } from './store.js';

let pending: string | null = null;

/** Hand a question to the chat screen, which picks it up when it opens. */
export const setQuestion = (q: string) => {
  pending = q;
};

/** Read it once. */
export const takeQuestion = () => {
  const q = pending;
  pending = null;
  return q;
};

/* Things that are better shown than described. The order matters: the first
   pattern that matches wins. */
const PLACES: [RegExp, Route][] = [
  [/\b(light|power|electric|meter|nepa)\b/i, 'powerpay'],
  [/\bbills?\b/i, 'bills'],
  [/\b(data|airtime|bundle|top ?up)\b/i, 'airtime'],
  [/\b(borrow|loan)\b/i, 'loan'],
  [/\b(save|saving|savings|goal|holiday)\b/i, 'goal'],
  [/\b(dollar|dollars|usd|convert)\b/i, 'dollars'],
  [/\b(card|netflix)\b/i, 'card'],
  [/\b(history|activity|activities|statement)\b/i, 'history'],
  [/\b(limit|limits|cap)\b/i, 'limits'],
  [/\b(settings|lock|privacy|face ?id|passcode)\b/i, 'settings'],
  [/\b(receive|paid|my code|account number)\b/i, 'ways'],
  [/\b(request|owes?|ask .* for)\b/i, 'askreq'],
  [/\b(send|transfer|pay)\b/i, 'pay'],
  [/\b(health|score)\b/i, 'health'],
  [/\b(standing|instruction|rule)\b/i, 'rules'],
  [/\b(offline|network|no data|connection)\b/i, 'nonetwork'],
];

/** Where a question should take you, or null to let the chat answer it. */
export function place(q: string): Route | null {
  for (const [re, to] of PLACES) if (re.test(q)) return to;
  return null;
}

/* What the agent can say, from the wording in the design. It only ever
   answers from figures that are really in the store. */
const ANSWERS: [RegExp, () => string][] = [
  [
    /spend|spent|went/i,
    () => 'You spent ₦18,900 on airtime and data last month. That is your highest month this year.',
  ],
  [
    /limit|cap/i,
    () => {
      const s = get();
      return `Your daily cap is ₦${s.limits.day.toLocaleString('en-NG')} and ₦${s.outToday.toLocaleString('en-NG')} has gone out today, so ₦${Math.max(0, s.limits.day - s.outToday).toLocaleString('en-NG')} is left before I stop and ask you twice.`;
    },
  ],
  [
    /chidi|fail/i,
    () =>
      'GTBank turned it down at 13:40. Nothing was taken and nothing was charged, and it has been failing since.',
  ],
  [
    /borrow|loan/i,
    () =>
      'Up to ₦150,000 over 90 days, at four per cent a month. I would rather show you what that costs before you take it.',
  ],
  [
    /save|saving|goal/i,
    () => {
      const g = get().goal;
      return `${g.name} is ₦${g.saved.toLocaleString('en-NG')} of ₦${g.target.toLocaleString('en-NG')}, and you are a fortnight ahead of where you need to be.`;
    },
  ],
  [
    /dollar/i,
    () => `You hold $${get().dollars.toFixed(2)}, about ₦${dollarsInNaira().toLocaleString('en-NG')} today.`,
  ],
  [
    /balance|how much (do )?i have/i,
    () =>
      `₦${get().everyday.toLocaleString('en-NG', { minimumFractionDigits: 2 })} in Everyday, and $${get().dollars.toFixed(2)} held in dollars.`,
  ],
  [
    /bill|light|power|meter/i,
    () =>
      'Ikeja Electric is due Thursday and was ₦8,000 last time. I pay that one for you unless it jumps by more than a third.',
  ],
  [
    /data|airtime/i,
    () =>
      'Mum’s MTN line runs out around the 20th. The 10GB plan covers the same use for about ₦2,000 less a month.',
  ],
  [
    /fee|cost|charge/i,
    () => 'Transfers under ₦10,000 are free. Above that it is ₦25 to NIP plus 7.5% VAT, which is ₦26.88.',
  ],
];

/** What the chat says back. */
export function answer(q: string): string {
  const hit = ANSWERS.find(([re]) => re.test(q));
  return hit
    ? hit[1]()
    : 'I only answer from what I can actually see in your account, and I cannot see anything about that yet.';
}
