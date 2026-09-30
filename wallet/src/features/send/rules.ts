/* How sure Beetle is of each part of a transfer it filled in from a photo,
   and the rules it keeps before money moves (kept with the services, so the
   scripted Beetle keeps the same ones). */

export { TRY_FIRST, accountAge, refuses } from '../../services/rules';

/** How sure Beetle is of each part of a transfer it filled in. */
export type Check = { label: string; value: 'Certain' | 'Not certain' | 'Not read'; sure: boolean };

export function checksOf(first: string, bank: string, times: number, amountRead: boolean, amountTyped: boolean): Check[] {
  return [
    { label: `Read the name ${first}`, value: 'Certain', sure: true },
    times > 0 ? { label: `Matched ${times} past payment${times === 1 ? '' : 's'}`, value: 'Certain', sure: true } : { label: 'Never paid before', value: 'Not certain', sure: false },
    { label: `Confirmed the account with ${bank}`, value: 'Certain', sure: true },
    amountTyped
      ? { label: 'Read the amount', value: 'Certain', sure: true }
      : amountRead
        ? { label: 'Read the amount', value: 'Not certain', sure: false }
        : { label: 'Read the amount', value: 'Not read', sure: false },
  ];
}

const WORDS = ['None', 'One', 'Two', 'Three', 'Four'];
/** "Three of the four I am sure about." */
export const sureLine = (checks: Check[]) => `${WORDS[checks.filter(c => c.sure).length] ?? String(checks.filter(c => c.sure).length)} of the four I am sure about.`;
