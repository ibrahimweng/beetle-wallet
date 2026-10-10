/* The virtual cards (Round 37, the owner's word: more than one card, swiped
   between, each with its own colour and photo, its own lines listed under it,
   and the standard things done to it from its back).

   A card is made for one merchant, or for any shop online, with a monthly
   limit of its own; what is loaded onto it from Everyday it can spend on top
   of that. The demo account has the card the frames draw, kept to Netflix,
   with the four payments the frames count; any other account starts with
   none and makes its own. The cardholder's name, the number and the expiry
   are the issuer's and are never edited; the colour, a photo, a nickname
   and the limit are the owner's, and the mark stays on the face whatever is
   behind it. This build's own until a card issuer stands behind it. */
import type { LedgerRow } from '../home/account';

/** The card the frames draw: kept to Netflix, its number with the middle hidden and whole, when it runs out, and how much
    of its monthly ceiling has gone. */
export const CARD = { only: 'NETFLIX ONLY', hidden: '5399 •••• •••• 4471', full: '5399 8123 4567 4471', expiry: '09/28', spent: 21000, ceiling: 50000 } as const;

/** The last four digits, as a card is named where there is no room for its face. */
export const lastFour = (n: string = CARD.full) => n.replace(/\D/g, '').slice(-4);

/** The colours a card can take: the frame's cocoa first, then five more in the brand's earth. */
export const TONES = {
  cocoa: { name: 'Cocoa', colours: ['#5a3524', '#1f1a15'] },
  ink: { name: 'Ink', colours: ['#45403a', '#141210'] },
  clay: { name: 'Clay', colours: ['#c0643a', '#5a2715'] },
  moss: { name: 'Moss', colours: ['#56703f', '#1b2414'] },
  sea: { name: 'Sea', colours: ['#2f6280', '#10222e'] },
  plum: { name: 'Plum', colours: ['#734064', '#25131f'] },
} as const;
export type CardTone = keyof typeof TONES;
export const TONE_IDS = Object.keys(TONES) as CardTone[];

export type VirtualCard = {
  id: string;
  /** the merchant it is kept to, or '' for any shop online */
  merchant: string;
  /** the owner's own name for it, over the merchant's on its face */
  nickname: string;
  /** sixteen digits */
  number: string;
  expiry: string;
  cvv: string;
  /** what it may spend in a month */
  limit: number;
  /** spent this month before this phone knew it (the demo's four Netflix payments) */
  spentBefore: number;
  /** loaded onto it from Everyday, its to spend on top of its month */
  loaded: number;
  tone: CardTone;
  /** a photo picked for its face, kept on this phone */
  photo?: string;
  frozen: boolean;
  made: number;
};

/** What a card can be kept to, when it is made: any shop online (''), the five most kept to, then every other
    merchant a Nigerian card most pays online, A to Z (Round 39: the owner's word, far more than six). */
export const MERCHANT_LIST: { name: string; what: string }[] = [
  { name: '', what: 'Not kept to one merchant' },
  { name: 'Netflix', what: 'Films and shows' },
  { name: 'Spotify', what: 'Music' },
  { name: 'Showmax', what: 'Films, shows and football' },
  { name: 'Apple', what: 'App Store and Apple subscriptions' },
  { name: 'Google Play', what: 'Apps and games' },
  { name: 'Adobe', what: 'Design apps' },
  { name: 'AliExpress', what: 'Shopping' },
  { name: 'Amazon', what: 'Shopping' },
  { name: 'Airbnb', what: 'Stays' },
  { name: 'Apple Music', what: 'Music' },
  { name: 'Apple TV+', what: 'Films and shows' },
  { name: 'Audiomack', what: 'Music' },
  { name: 'Bolt', what: 'Rides' },
  { name: 'Boomplay', what: 'Music' },
  { name: 'Booking.com', what: 'Stays' },
  { name: 'Canva', what: 'Design' },
  { name: 'CapCut', what: 'Video editing' },
  { name: 'ChatGPT', what: 'AI' },
  { name: 'Claude', what: 'AI' },
  { name: 'Cloudflare', what: 'Websites' },
  { name: 'Coursera', what: 'Courses' },
  { name: 'Crunchyroll', what: 'Anime' },
  { name: 'Deezer', what: 'Music' },
  { name: 'DigitalOcean', what: 'Servers' },
  { name: 'Discord', what: 'Chat' },
  { name: 'Disney+', what: 'Films and shows' },
  { name: 'Dropbox', what: 'Storage' },
  { name: 'Duolingo', what: 'Languages' },
  { name: 'DStv', what: 'TV' },
  { name: 'eBay', what: 'Shopping' },
  { name: 'Etsy', what: 'Shopping' },
  { name: 'Figma', what: 'Design' },
  { name: 'Fiverr', what: 'Freelancers' },
  { name: 'GitHub', what: 'Code' },
  { name: 'GoDaddy', what: 'Domains' },
  { name: 'Google Cloud', what: 'Servers' },
  { name: 'Google Drive', what: 'Storage' },
  { name: 'Google One', what: 'Storage' },
  { name: 'Grammarly', what: 'Writing' },
  { name: 'Hostinger', what: 'Websites' },
  { name: 'iCloud', what: 'Storage' },
  { name: 'Jumia', what: 'Shopping' },
  { name: 'LinkedIn', what: 'Jobs' },
  { name: 'Medium', what: 'Reading' },
  { name: 'Microsoft 365', what: 'Office apps' },
  { name: 'Namecheap', what: 'Domains' },
  { name: 'Notion', what: 'Notes' },
  { name: 'Paramount+', what: 'Films and shows' },
  { name: 'Patreon', what: 'Creators' },
  { name: 'Perplexity', what: 'AI' },
  { name: 'PlayStation', what: 'Games' },
  { name: 'Prime Video', what: 'Films and shows' },
  { name: 'Shein', what: 'Shopping' },
  { name: 'Shopify', what: 'Online shops' },
  { name: 'Snapchat', what: 'Snapchat+' },
  { name: 'Steam', what: 'Games' },
  { name: 'Substack', what: 'Reading' },
  { name: 'Telegram', what: 'Telegram Premium' },
  { name: 'Temu', what: 'Shopping' },
  { name: 'TikTok', what: 'Coins and shopping' },
  { name: 'Twitch', what: 'Streams' },
  { name: 'Uber', what: 'Rides' },
  { name: 'Udemy', what: 'Courses' },
  { name: 'Upwork', what: 'Freelancers' },
  { name: 'Vercel', what: 'Websites' },
  { name: 'X', what: 'X Premium' },
  { name: 'Xbox', what: 'Games' },
  { name: 'YouTube', what: 'YouTube Premium' },
  { name: 'Zoom', what: 'Calls' },
];
export const MERCHANTS = MERCHANT_LIST.map(m => m.name);
export const merchantName = (m: string) => m || 'Any shop online';

/** What its face says across the top: its nickname, or what it is kept to. */
export const faceLine = (c: VirtualCard) => (c.nickname ? c.nickname : c.merchant ? `${c.merchant} only` : 'Online').toUpperCase();
/** Its name in a sentence. */
export const cardName = (c: VirtualCard) => c.nickname || (c.merchant ? `${c.merchant} card` : 'Online card');

export const hiddenNumber = (n: string) => `${n.slice(0, 4)} •••• •••• ${n.slice(-4)}`;
export const fullNumber = (n: string) => n.replace(/(\d{4})(?=\d)/g, '$1 ');

/** The most cards an account may hold in this build. */
export const MOST_CARDS = 5;
/** The limits a new card can start at, and the most any can have. */
export const LIMITS = [20_000, 50_000, 100_000] as const;
export const MOST_LIMIT = 500_000;

/** The demo's card, as the frames draw it. */
export const DEMO_CARD: VirtualCard = {
  id: 'c1',
  merchant: 'Netflix',
  nickname: '',
  number: CARD.full.replace(/\D/g, ''),
  expiry: CARD.expiry,
  cvv: '318',
  limit: CARD.ceiling,
  spentBefore: CARD.spent,
  loaded: 0,
  tone: 'cocoa',
  frozen: false,
  made: 0,
};

export const seedCards = (demo: boolean): VirtualCard[] => (demo ? [DEMO_CARD] : []);

/** A line a card made: a payment with it, or money loaded onto it. */
export type CardLine = { id: string; name: string; detail: string; when: string; amount: number; loaded: boolean; receipt?: string };

/** The demo card's four Netflix payments this month, the frames' ₦21,000; the newest is the record's own line. */
const NETFLIX_PAID: CardLine[] = [
  { id: 'l12', name: 'Netflix', detail: 'Premium plan', when: 'Yesterday', amount: -5200, loaded: false, receipt: 'l12' },
  { id: 'n2', name: 'Netflix', detail: 'Extra member', when: '6 October', amount: -5200, loaded: false },
  { id: 'n3', name: 'Netflix', detail: 'Mobile plan', when: '3 October', amount: -4400, loaded: false },
  { id: 'n4', name: 'Netflix', detail: 'Premium plan', when: '1 October', amount: -6200, loaded: false },
];

/** Is this line the card's? Its own id, or, for a load kept before lines carried one, the demo card's last four. */
export const isCardLine = (card: VirtualCard, r: Pick<LedgerRow, 'kind' | 'cardId' | 'detail'>) =>
  r.kind === 'card' && (r.cardId === card.id || (!r.cardId && card.id === DEMO_CARD.id && r.detail.includes(card.number.slice(-4))));

/** A card's lines, newest first: what this phone loaded onto it, then the payments it made before. Loads are the money
    going onto the card, so they read as money in for it. */
export function linesOf(card: VirtualCard, moves: LedgerRow[], dayWord: (r: LedgerRow) => string): CardLine[] {
  const here = moves
    .filter(r => isCardLine(card, r))
    .slice()
    .reverse()
    .map<CardLine>(r => ({ id: r.id, name: 'Loaded from Everyday', detail: `•••• ${card.number.slice(-4)}`, when: dayWord(r), amount: -r.amount, loaded: true, receipt: r.id }));
  return [...here, ...(card.id === DEMO_CARD.id && card.spentBefore ? NETFLIX_PAID : [])];
}

/** What it has spent this month, what it can still spend, and how far through its limit it is. */
export function standing(card: VirtualCard) {
  const spent = card.spentBefore;
  const left = Math.max(0, card.limit - spent + card.loaded);
  return { spent, left, pct: card.limit ? Math.min(100, (spent / card.limit) * 100) : 0 };
}

/** The digit that makes a number pass the check every card number passes. */
export function luhnDigit(body: string): string {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    let d = Number(body[body.length - 1 - i]);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return String((10 - (sum % 10)) % 10);
}

export const luhnOk = (n: string) => /^\d{16}$/.test(n) && luhnDigit(n.slice(0, -1)) === n.slice(-1);

/** A new card's number: the issuer's 5399, eleven more at random, and the check digit. */
export function newNumber(random = Math.random): string {
  const body = '5399' + Array.from({ length: 11 }, () => Math.floor(random() * 10)).join('');
  return body + luhnDigit(body);
}

/** Three years from now, as a card's expiry reads. */
export function expiryFrom(now = new Date()) {
  return `${String(now.getMonth() + 1).padStart(2, '0')}/${String((now.getFullYear() + 3) % 100).padStart(2, '0')}`;
}

/** A new card, kept to a merchant, at a limit, in a colour. */
export function makeCard({ merchant, limit, tone }: { merchant: string; limit: number; tone: CardTone }, now = new Date(), random = Math.random): VirtualCard {
  return {
    id: `c${now.getTime().toString(36)}`,
    merchant,
    nickname: '',
    number: newNumber(random),
    expiry: expiryFrom(now),
    cvv: String(Math.floor(random() * 900) + 100),
    limit,
    spentBefore: 0,
    loaded: 0,
    tone,
    frozen: false,
    made: now.getTime(),
  };
}
