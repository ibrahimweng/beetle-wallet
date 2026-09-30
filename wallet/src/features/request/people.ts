/* Who can be asked for money: the people who have paid this account, each
   with the line the request reaches them on. A request goes to a phone,
   not a bank account — WhatsApp and a text — so what Beetle keeps about a
   payer is their name and their line. The demo account has paid-by lines
   the frames name; a real account service will fill this from what came
   in. */
export type Payer = {
  name: string;
  /** the phone the request goes to */
  phone: string;
  /** he, she, they: how Beetle refers to them */
  pronoun: 'he' | 'she' | 'they';
  /** what Beetle knows them by */
  note: string;
};

export const PAYERS: Payer[] = [
  { name: 'Musa Danjuma', phone: '08032214471', pronoun: 'he', note: 'paid you before' },
  { name: 'Sarah Adeyemi', phone: '08021118842', pronoun: 'she', note: 'paid you before' },
  { name: 'Chidi Okafor', phone: '07031234567', pronoun: 'he', note: 'paid you before' },
];

/** Musa, from Musa Danjuma. */
export const firstOf = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/** The line ending 4471: the last four digits. */
export const lineEnding = (phone: string) => phone.slice(-4);

/** him, her, them. */
export const objectOf = (p: Payer['pronoun']) => (p === 'he' ? 'him' : p === 'she' ? 'her' : 'them');

/** He, She, They. */
export const subjectOf = (p: Payer['pronoun']) => (p === 'he' ? 'He' : p === 'she' ? 'She' : 'They');

/** The payer the words name, by first name, last name or the whole of it;
    Musa D. counts as Musa Danjuma. */
export function payerIn(text: string, payers = PAYERS): Payer | null {
  const lower = text.toLowerCase();
  for (const p of payers) {
    const [first, last] = p.name.toLowerCase().split(' ');
    if (lower.includes(p.name.toLowerCase())) return p;
    if (first && new RegExp(`\\b${first}\\b`).test(lower)) return p;
    if (last && new RegExp(`\\b${last}\\b`).test(lower)) return p;
  }
  return null;
}

/** What the request is for, from the words: "for the rent balance" → Rent balance. */
export function noteIn(text: string): string | null {
  const m = text.match(/\bfor\s+(?:the\s+)?([a-z][a-z' ]{2,40})$/i);
  if (!m?.[1]) return null;
  const words = m[1].trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
