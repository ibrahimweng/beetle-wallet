/* The rules Beetle keeps before money moves, and the reading it gives of
   an account it has never paid. The figures are this build's own until a
   bank's look-up stands behind them: an account Beetle has never seen is
   read as four minutes old, the way the frame draws it. */

/** The whole balance to somebody never paid before: Beetle stops. */
export const refuses = (amount: number, balance: number, paidBefore: boolean) => amount > 0 && amount >= balance && !paidBefore;

/** How old the account is, for one Beetle has never paid; nothing for one it has. */
export const accountAge = (paidBefore: boolean) => (paidBefore ? undefined : 'Four minutes');

/** What Beetle offers instead of the whole balance: enough to check it arrives. */
export const TRY_FIRST = 20_000;

/** "send everything", "all of it", "my whole balance". */
export const wantsEverything = (text: string) => /\b(everything|all of it|all my money|my whole balance|the whole lot|the lot)\b/i.test(text);

/** Beetle's line when it will not send: the whole balance to an account it has never seen. */
export const refusalLine = (balance: string, tryFirst: string) =>
  `Your whole balance, to an account ${(accountAge(false) ?? 'minutes').toLowerCase()} old. I will not do this one from here: send ${tryFirst} first, enough to check it arrives, or wait until tomorrow and I ask you again.`;

/** Beetle's line when the network is not there. */
export const OFFLINE_LINE = 'I will not send money against a balance I cannot check. Tell me what you want, I hold it, and it goes the second the network is back.';
