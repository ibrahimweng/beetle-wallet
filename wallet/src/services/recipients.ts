/* Who money goes to. There are two kinds of transfer, and the app always
   says which one it is.

   To a Beetle account, by its tag, written $name: looked up in Beetle's own
   directory, and the account comes back with its holder's name. Beetle to
   Beetle is free and lands at once.

   To another bank, by the ten-digit account number and the bank. The banks
   most likely to hold a number come first: a Nigerian account number (a
   NUBAN) ends in a check digit worked from the bank's code and the nine
   digits before it, so a number only fits some banks; and a number that is
   a phone number without its first nought is the kind the newer banks
   (OPay, PalmPay, Moniepoint, Kuda) hand out. Then the name on the account
   is looked up at that bank — the name enquiry every Nigerian transfer
   starts with — and shown, so the person sending sees it is the right
   person before anything can move.

   The directory and the look-up are this build's own stand-ins, behind the
   same shapes a bank's would have; the people the demo has paid answer with
   their own names. */
import type { Person } from './agent';
import { networkOf } from './nigeria';
import { groupAccount } from '../lib/format';
import { wait } from './support';
import { BANK_LIST, KIND_WORDS, type Bank } from './banks';

/* ---- Beetle's own accounts ---- */

export type BeetleUser = { tag: string; name: string; number: string };

/** The bank a Beetle account is at, as every screen names it. */
export const BEETLE = 'Beetle';

/** Beetle's directory, as far as this build knows it. */
export const BEETLE_USERS: BeetleUser[] = [
  { tag: 'tobi', name: 'Tobi Bakare', number: '9012345671' },
  { tag: 'amaka', name: 'Amaka Eze', number: '9012345672' },
  { tag: 'kemi', name: 'Kemi Adebayo', number: '9012345673' },
  { tag: 'sarahb', name: 'Sarah Bello', number: '9012345674' },
  { tag: 'tunde', name: 'Tunde Afolabi', number: '9012345675' },
  { tag: 'ifeoma', name: 'Ifeoma Nwosu', number: '9012345676' },
  { tag: 'chidi', name: 'Chidi Okafor', number: '9012345677' },
];

/** $tobi, written the way the app writes a tag. */
export const tagWords = (tag: string) => `$${tag}`;

/** The tag in some words, if there is one: "$tobi", "send $Tobi 5k". */
export function tagIn(text: string): string | null {
  const m = text.match(/\$([a-z][a-z0-9_]{1,19})\b/i);
  return m ? m[1]!.toLowerCase() : null;
}

/** The owner's own tag: their first name, as the directory would give it. */
export const ownTag = (firstName: string) => firstName.toLowerCase().replace(/[^a-z0-9_]/g, '');

/** A Beetle account as a person money can go to. */
export const beetlePerson = (u: BeetleUser): Person => ({ name: u.name, bank: BEETLE, number: u.number, tag: u.tag });

export const isBeetle = (p: Pick<Person, 'bank'> | null | undefined) => p?.bank === BEETLE;

/** Looked up by its tag in Beetle's directory: the account, or nobody. */
export async function findTag(tag: string, delay = 350): Promise<Person | null> {
  await wait(delay);
  const u = BEETLE_USERS.find(x => x.tag === tag.replace(/^\$/, '').toLowerCase());
  return u ? beetlePerson(u) : null;
}

/** The same, at once, for the words a model or a test gives. */
export function tagged(tag: string): Person | null {
  const u = BEETLE_USERS.find(x => x.tag === tag.replace(/^\$/, '').toLowerCase());
  return u ? beetlePerson(u) : null;
}

/* ---- the banks ---- */

export { BANK_LIST, KIND_WORDS, type Bank, type BankKind } from './banks';

/** The newer banks that hand out phone numbers, the most used first. */
const PHONE_FIRST = ['Kuda', 'Moniepoint', 'OPay', 'PalmPay', 'Paga', '9PSB', 'MoMo PSB', 'SmartCash PSB', 'HopePSB', 'Eyowo'];

const ALIASES: Record<string, string> = {
  access: 'Access Bank',
  'guaranty trust': 'GTBank',
  gtb: 'GTBank',
  gtbank: 'GTBank',
  zenith: 'Zenith Bank',
  'first bank': 'First Bank',
  firstbank: 'First Bank',
  fidelity: 'Fidelity Bank',
  union: 'Union Bank',
  wema: 'Wema Bank',
  sterling: 'Sterling Bank',
  stanbic: 'Stanbic IBTC',
  polaris: 'Polaris Bank',
  providus: 'Providus Bank',
  keystone: 'Keystone Bank',
  unity: 'Unity Bank',
  ecobank: 'Ecobank',
  opay: 'OPay',
  palmpay: 'PalmPay',
  moniepoint: 'Moniepoint',
  kuda: 'Kuda',
  uba: 'UBA',
  fcmb: 'FCMB',
  diamond: 'Access Bank (Diamond)',
  'diamond bank': 'Access Bank (Diamond)',
  alat: 'ALAT by Wema',
  piggyvest: 'Pocket by PiggyVest',
  'piggy vest': 'Pocket by PiggyVest',
  vbank: 'VFD MFB',
  vfd: 'VFD MFB',
  titan: 'Titan Trust Bank',
  'standard chartered': 'Standard Chartered Bank',
  citi: 'Citibank',
  jaiz: 'Jaiz Bank',
  taj: 'TAJ Bank',
  lotus: 'Lotus Bank',
  globus: 'Globus Bank',
  suntrust: 'SunTrust Bank',
  parallex: 'Parallex Bank',
  premiumtrust: 'PremiumTrust Bank',
  optimus: 'Optimus Bank',
  fairmoney: 'FairMoney',
  'fair money': 'FairMoney',
  gomoney: 'GoMoney',
  momo: 'MoMo PSB',
  smartcash: 'SmartCash PSB',
  'mtn momo': 'MoMo PSB',
  '9psb': '9PSB',
  '9mobile psb': '9PSB',
  rubies: 'Rubies MFB',
  accion: 'Accion MFB',
  beetle: BEETLE,
};

/* names that are ordinary words too: found only with "bank" or "app" after them, or as an alias */
const PLAIN_WORDS = new Set(['Branch', 'Carbon', 'Sparkle', 'Paga', 'TENN', 'Summit Bank']);

const escape = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const whole = (name: string) => new RegExp(`(^|[^a-z0-9])${escape(name.toLowerCase())}($|[^a-z0-9])`);

/** The bank some words name, by the app's own name for it. */
export function bankIn(text: string): string | null {
  const lower = text.toLowerCase();
  /* the longest name first, so "Access Bank (Diamond)" wins over "Access Bank" */
  for (const b of [...BANK_LIST].sort((x, y) => y.name.length - x.name.length)) {
    if (PLAIN_WORDS.has(b.name) ? whole(`${b.name} bank`).test(lower) || whole(`${b.name} app`).test(lower) : whole(b.name).test(lower)) return b.name;
  }
  for (const [k, v] of Object.entries(ALIASES)) if (new RegExp(`\\b${k}\\b`).test(lower)) return v;
  return null;
}

/** The check digit a bank's code and the nine digits before it give, by the CBN's NUBAN rule. */
export function checkDigit(code: string, serial: string): number {
  const digits = (code.length === 3 ? code : code.slice(-3)) + serial;
  const weights = [3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3];
  const sum = digits.split('').reduce((a, d, i) => a + Number(d) * weights[i]!, 0);
  return (10 - (sum % 10)) % 10;
}

/** Whether a number could be an account at a bank, by its check digit. */
export const fits = (number: string, bank: Bank) => /^\d{10}$/.test(number) && checkDigit(bank.code, number.slice(0, 9)) === Number(number[9]);

/* the banks whose account numbers the check digit decides: the ones with a three-digit code */
const CHECKED = BANK_LIST.filter(b => /^\d{3}$/.test(b.code) && (b.kind === 'bank' || b.kind === 'merchant' || b.kind === 'noninterest'));

/** A number that is a phone number without its first nought. */
export const phoneShaped = (number: string) => /^[789]\d{9}$/.test(number) && !!networkOf(`0${number}`);

/** The banks most likely to hold a number, best first: where it has been
    paid before, a Beetle account's own, the newer banks for a phone-shaped
    number, then every bank its check digit fits. */
export function likelyBanks(number: string, known: Pick<Person, 'bank' | 'number'>[] = []): string[] {
  const out: string[] = [];
  const add = (name: string) => {
    if (!out.includes(name)) out.push(name);
  };
  for (const p of known) if (p.number === number) add(p.bank);
  if (BEETLE_USERS.some(u => u.number === number)) add(BEETLE);
  if (phoneShaped(number)) for (const name of PHONE_FIRST) add(name);
  for (const b of CHECKED) if (fits(number, b)) add(b.name);
  return out;
}

/** Every bank, for the list after the likely ones; Beetle first, since it is this app's own. */
export const allBanks = () => [BEETLE, ...BANK_LIST.map(b => b.name)];

/** The words under a bank's name in the list: what kind of bank it is. */
export function bankKindWords(name: string): string {
  if (name === BEETLE) return 'This app · free and at once';
  const b = BANK_LIST.find(x => x.name === name);
  return b ? KIND_WORDS[b.kind] : '';
}

/* ---- the name on an account ---- */

const FIRST = [
  'Adaeze',
  'Babajide',
  'Chiamaka',
  'Damilola',
  'Emeka',
  'Funmilayo',
  'Gbenga',
  'Halima',
  'Ifeoma',
  'Jide',
  'Kelechi',
  'Lola',
  'Nkechi',
  'Obinna',
  'Rotimi',
  'Segun',
  'Temitope',
  'Uche',
  'Yetunde',
  'Zainab',
];
const LAST = ['Adebayo', 'Bello', 'Chukwu', 'Danladi', 'Eze', 'Fashola', 'Garba', 'Ibrahim', 'Johnson', 'Lawal', 'Mohammed', 'Nwosu', 'Okonkwo', 'Olawale', 'Uchenna', 'Yusuf'];

/** The name a number answers with in this build: the same name every time it is asked. */
function standIn(number: string): string {
  let h = 17;
  for (const c of number) h = (h * 31 + c.charCodeAt(0)) % 1_000_003;
  return `${FIRST[h % FIRST.length]} ${LAST[Math.floor(h / FIRST.length) % LAST.length]}`;
}

export type NameCheck = { found: true; person: Person } | { found: false; why: string };

/** The name enquiry: whose an account number is at a bank. The people paid
    before answer with their own names, Beetle accounts with theirs; any
    other number answers at a bank its digits fit, and nowhere else. */
export function nameAt(number: string, bank: string, known: Pick<Person, 'name' | 'bank' | 'number'>[] = []): NameCheck {
  const digits = number.replace(/\D/g, '');
  if (digits.length !== 10) return { found: false, why: 'An account number is ten digits.' };
  const had = known.find(p => p.number === digits);
  if (had) {
    if (had.bank === bank) return { found: true, person: { name: had.name, bank, number: digits } };
    return { found: false, why: `There is no account ${groupTen(digits)} at ${bank}. You paid this number at ${had.bank}.` };
  }
  const user = BEETLE_USERS.find(u => u.number === digits);
  if (user) return bank === BEETLE ? { found: true, person: beetlePerson(user) } : { found: false, why: `There is no account ${groupTen(digits)} at ${bank}. It is a Beetle account.` };
  if (bank === BEETLE) return { found: false, why: `There is no Beetle account ${groupTen(digits)}. Check the digits, or pick their bank.` };
  if (!likelyBanks(digits).includes(bank)) return { found: false, why: `There is no account ${groupTen(digits)} at ${bank}. Check the digits, or the bank.` };
  return { found: true, person: { name: standIn(digits), bank, number: digits } };
}

/** The same, the time a bank takes to answer. */
export async function checkName(number: string, bank: string, known: Pick<Person, 'name' | 'bank' | 'number'>[] = [], delay = 700): Promise<NameCheck> {
  await wait(delay);
  return nameAt(number, bank, known);
}

const groupTen = (d: string) => groupAccount(d);

/* ---- a name typed: the closest ones ---- */

export type Match = { person: Person; /** paid before, how many times */ times?: number };

/** The closest names to what was typed, among the people paid before and
    Beetle's directory: whole first names first, then the start of a name,
    then anywhere in it. A $ looks in the directory only. */
export function closest(query: string, paid: (Pick<Person, 'name' | 'bank' | 'number'> & { times?: number })[], limit = 4): Match[] {
  const q = query.trim().toLowerCase();
  const tagOnly = q.startsWith('$');
  const words = q.replace(/^\$/, '');
  if (!words) return tagOnly ? BEETLE_USERS.slice(0, limit).map(u => ({ person: beetlePerson(u) })) : [];
  const score = (name: string, tag?: string) => {
    const n = name.toLowerCase();
    const parts = n.split(' ');
    if (tag && tag === words) return 0;
    if (parts.some(p => p === words)) return 1;
    if (tag && tag.startsWith(words)) return 2;
    if (parts.some(p => p.startsWith(words)) || n.startsWith(words)) return 3;
    if (n.includes(words) || (tag && tag.includes(words))) return 4;
    return 9;
  };
  const found: (Match & { s: number })[] = [];
  if (!tagOnly)
    for (const p of paid) {
      const s = score(p.name);
      if (s < 9) found.push({ person: { name: p.name, bank: p.bank, number: p.number }, times: p.times, s });
    }
  for (const u of BEETLE_USERS) {
    const s = score(u.name, u.tag);
    if (s < 9) found.push({ person: beetlePerson(u), s });
  }
  return found.sort((a, b) => a.s - b.s || (b.times ?? 0) - (a.times ?? 0)).slice(0, limit);
}

/** What the first field holds: a tag, an account number (whole or on its way), or a name. */
export type ToKind = 'tag' | 'number' | 'name' | 'empty';
export function toKind(text: string): ToKind {
  const t = text.trim();
  if (!t) return 'empty';
  if (t.startsWith('$')) return 'tag';
  if (/^[\d\s-]+$/.test(t)) return 'number';
  return 'name';
}
