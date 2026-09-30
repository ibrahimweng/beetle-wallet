/* The virtual card the frames draw: kept to Netflix, its number with the
   middle hidden and whole, when it runs out, and how much of its monthly
   ceiling has gone. This build's own until a card issuer stands behind it;
   the card's page and home's Card both read it. */
export const CARD = { only: 'NETFLIX ONLY', hidden: '5399 •••• •••• 4471', full: '5399 8123 4567 4471', expiry: '09/28', spent: 21000, ceiling: 50000 } as const;

/** The last four digits, as a card is named where there is no room for its face. */
export const lastFour = (n: string = CARD.full) => n.replace(/\D/g, '').slice(-4);
