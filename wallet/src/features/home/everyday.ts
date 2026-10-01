/* What a line of the day does to Everyday, kept apart from the store so a
   receipt can work it out without reaching for the phone. */

/** What a line took from Everyday, or put in: its amount, and a transfer's fee on top of it — the
    passcode says "Leaves Everyday ₦20,026.88", and that is what leaves. A line paid from the dollars
    leaves Everyday alone, and a conversion's fee comes out of the dollars, not the naira. */
export const fromEveryday = (r: { amount: number; usd?: number; kind: string; fee?: number }) =>
  r.usd !== undefined && r.kind !== 'convert' ? 0 : r.amount - (r.kind === 'convert' ? 0 : (r.fee ?? 0));
