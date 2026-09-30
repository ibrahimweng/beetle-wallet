/* What the drawer lists: the eight used most, the three lists under them,
   and the way the bar's words find one of them. Plain, so the tests can
   read it. */
import type { IconName } from '../../icons';

export type Service = { glyph: IconName; label: string; sub?: string; /** the page it opens */ to?: string; /** or the word about when it comes */ later?: string };

/** The eight tiles, in the frame's order. */
export const MOST: Service[] = [
  { glyph: 'airtime', label: 'Airtime', to: '/buy?kind=airtime' },
  { glyph: 'data', label: 'Data', to: '/buy' },
  { glyph: 'power', label: 'Power', to: '/pay?biller=ikeja' },
  { glyph: 'send', label: 'Send', to: '/send' },
  { glyph: 'tv', label: 'Cable TV', to: '/pay?biller=dstv' },
  { glyph: 'bet', label: 'Betting', later: 'Betting is not in the frames yet.' },
  { glyph: 'loan', label: 'Loan', to: '/loan' },
  { glyph: 'card', label: 'Cards', to: '/card' },
];

/** The three lists under them. */
export const LISTS: { title: string; items: Service[] }[] = [
  {
    title: 'Bills',
    items: [
      { glyph: 'globe', label: 'Internet', sub: 'Spectranet, Smile, Starlink', to: '/pay?biller=spectranet' },
      { glyph: 'water', label: 'Water', sub: 'State water boards', later: 'Water bills are not in the frames yet.' },
      { glyph: 'waste', label: 'Waste', sub: 'LAWMA and others', to: '/pay?biller=lawma' },
      { glyph: 'school', label: 'School fees', sub: 'WAEC, JAMB, tuition', later: 'School fees are not in the frames yet.' },
    ],
  },
  {
    title: 'Save and borrow',
    items: [
      { glyph: 'pot', label: 'Savings pot', sub: 'Put money aside', to: '/goal' },
      { glyph: 'lock', label: 'Fixed savings', sub: 'Lock it for a set time', later: 'Fixed savings are not in the frames yet.' },
    ],
  },
  {
    title: 'Money',
    items: [
      { glyph: 'dollar', label: 'Dollars', sub: 'holding steady', to: '/dollars' },
      { glyph: 'up', label: 'Request money', sub: 'Ask someone to pay you', to: '/request' },
      { glyph: 'globe', label: 'Send abroad', sub: 'Pounds, dollars and euros', later: 'Sending abroad is not in the frames yet.' },
    ],
  },
];

/** The service the words name, if any: "data", "light", "cable", "loan". */
export function serviceFor(text: string): Service | null {
  const q = text.toLowerCase().trim();
  if (!q) return null;
  const all = [...MOST, ...LISTS.flatMap(l => l.items)];
  const alias: Record<string, string> = {
    light: 'Power',
    electricity: 'Power',
    nepa: 'Power',
    dstv: 'Cable TV',
    gotv: 'Cable TV',
    tv: 'Cable TV',
    borrow: 'Loan',
    card: 'Cards',
    internet: 'Internet',
    wifi: 'Internet',
    bin: 'Waste',
    lawma: 'Waste',
    school: 'School fees',
    save: 'Savings pot',
    savings: 'Savings pot',
    request: 'Request money',
    abroad: 'Send abroad',
    pounds: 'Send abroad',
    dollar: 'Dollars',
    dollars: 'Dollars',
  };
  const hit = all.find(s => q === s.label.toLowerCase() || q.split(/\s+/).some(w => w === s.label.toLowerCase() || alias[w] === s.label));
  return hit ?? null;
}
