/* The rules Beetle keeps before money moves, and the reading it gives of
   an account it has never paid. The figures are this build's own until a
   bank's look-up stands behind them: an account Beetle has never seen is
   read as four minutes old, the way the frame draws it. */

/** The whole balance to somebody never paid before: Beetle stops. */
/** What a transfer costs on top of itself: free under ₦10,000, ₦26.88 up to ₦50,000, ₦53.75 above. */
export const feeFor = (amount: number) => (amount < 10_000 ? 0 : amount <= 50_000 ? 26.88 : 53.75);

/** What a transfer to somebody costs: nothing to a Beetle account, which is free and lands at once; the banks' fee to any other bank. */
export const feeTo = (amount: number, bank?: string) => (bank === 'Beetle' ? 0 : feeFor(amount));

/** When it lands: at once at Beetle; in seconds, or under a minute for a large sum, at another bank. */
export const arrivesAt = (amount: number, bank?: string) => (bank === 'Beetle' ? 'Instantly' : amount > 50_000 ? 'Under a minute' : 'In a few seconds');

/** The whole balance, or all of it that can be sent once the fee is counted, to an account never paid before: what
    would be left is under a naira. "All of it" is the balance less the fee rounded down to the naira, so it leaves a
    few kobo behind, and those kobo are still the whole balance (the analysis after Round 21: rounding let it past).
    The fee is the one this transfer carries: none to a Beetle account. */
export const refuses = (amount: number, balance: number, paidBefore: boolean, bank?: string) =>
  amount > 0 && !paidBefore && Math.round(balance * 100) - Math.round((amount + feeTo(amount, bank)) * 100) < 100;

/** How old the account is, for one Beetle has never paid; nothing for one it has. */
export const accountAge = (paidBefore: boolean) => (paidBefore ? undefined : 'Four minutes');

/** What Beetle offers instead of the whole balance: enough to check it arrives. */
export const TRY_FIRST = 20_000;

/** "send everything", "all of it", "my whole balance". */
export const wantsEverything = (text: string) => /\b(everything|all of it|all my money|my whole balance|the whole lot|the lot)\b/i.test(text);

/** Beetle's line when it will not send: the whole balance to an account it has never seen. */
export const refusalLine = (balance: string, tryFirst: string) =>
  `Your whole balance, to an account ${(accountAge(false) ?? 'minutes').toLowerCase()} old. I will not do this one from here: send ${tryFirst} first, enough to check it arrives, or wait until tomorrow and I ask you again.`;

/** What a payment takes out of Everyday when it goes through: the money and its fee; nothing for money coming in. */
export const takesOut = (move: { amount: number } | undefined, total: number | undefined) => (move && move.amount < 0 ? (total ?? -move.amount) : 0);

/** Beetle's line when a payment is more than Everyday holds, checked as it is confirmed (the analysis after Round 21:
    a card filled while there was enough could be confirmed after there was not). */
export const overLine = (out: string, have: string) => `That comes to ${out}, more than the ${have} in Everyday. Make it smaller, or put money in first.`;

/** Beetle's line when the network is not there. */
export const OFFLINE_LINE = 'I will not send money against a balance I cannot check. Tell me what you want, I hold it, and it goes the second the network is back.';
