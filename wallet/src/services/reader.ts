/* Reading a photo: the words on it, and any account number among them. On a
   phone with the build that carries it, Google's on-device text reader does
   the reading, offline; anywhere else — the web, Expo Go — a stand-in
   answers with the words on the sample slip, so the rest of the flow can be
   tried without a camera. */
import { Platform } from 'react-native';
import { wait } from './support';

export type Reading = {
  /** every line the reader made out, top to bottom */
  text: string;
  /** the ten-digit account numbers among them, first one first */
  numbers: string[];
  /** read off the photo itself, or the stand-in's answer */
  real: boolean;
  /** a number the reader was not sure of: what it most likely is, and what
      else it could be. Beetle shows both rather than choosing. */
  soft?: { number: string; maybe: string };
  /** the photo was of a message asking to be paid: who wrote it, the figure,
      what for, and by when — the pieces of a request */
  request?: RequestReading;
  /** the photo was of a light bill or a meter: the company, the meter and
      what is owed */
  bill?: BillReading;
  /** the photo was of a message asking for data or airtime: whose line,
      the network and the figure */
  topup?: TopupReading;
};

export type RequestReading = { from: string; amount: number; note?: string; when?: string };
export type BillReading = { disco: string; meterKind: 'prepaid' | 'postpaid'; meter: string; amount?: number; address?: string };
export type TopupReading = { from: string; line: string; network: string; amount?: number; data: boolean };

export interface ReaderService {
  readonly real: boolean;
  read(uri: string): Promise<Reading>;
}

/** Nigerian account numbers are ten digits (NUBAN). They are often written
    in groups, so a run of digits with spaces or dashes inside counts, as long
    as it comes to exactly ten. Longer runs are phone numbers and references. */
export function accountNumbersIn(text: string): string[] {
  const found: string[] = [];
  for (const run of text.match(/\d[\d \-–.]*\d/g) ?? []) {
    const digits = run.replace(/\D/g, '');
    if (digits.length === 10 && !found.includes(digits)) found.push(digits);
  }
  return found;
}

/** What the sample slip says. */
export const SAMPLE_TEXT = 'GTBANK\nAccount name\nSarah Adeyemi\nAccount number\n0234 5678 90\nBank\nGuaranty Trust Bank\nPlease pay into the account above. Thank you.';

/** A slip the stand-in is not sure of: the last digit could be a 0 or a 6. */
export const SOFT_TEXT = 'GTBANK\nAccount name\nSarah Adeyemi\nAccount number\n0234 5678 90\nBank\nGuaranty Trust Bank';
export const SOFT_READING: Reading = { text: SOFT_TEXT, numbers: ['0234567890'], real: false, soft: { number: '0234567890', maybe: '0234567896' } };

/** What the sample message says: a friend asking for the account, the way
    one does on WhatsApp. */
export const MESSAGE_TEXT = 'Musa D.\n9:41 AM\nBros, rent balance coming Friday: 20k\nsend me your account';
export const MESSAGE_READING: Reading = { text: MESSAGE_TEXT, numbers: [], real: false, request: { from: 'Musa D.', amount: 20_000, note: 'Rent balance', when: 'Friday' } };

const DAYS = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|tonight|today|next week|month end|end of the month)\b/i;

/** 20k, ₦20,000, 20,000, 2.5k: the first figure in the words, as money. */
function figureIn(text: string): number | null {
  const m = text.match(/(?:₦|n)?\s*(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(k|m)?\b/i);
  if (!m?.[1]) return null;
  const n = Number(m[1].replace(/,/g, ''));
  if (!Number.isFinite(n) || n <= 0) return null;
  const unit = (m[2] ?? '').toLowerCase();
  return unit === 'k' ? n * 1_000 : unit === 'm' ? n * 1_000_000 : n;
}

/** A message asking to be paid, if the words are one: somebody wants the
    account number, and names a figure. Who wrote it is the first line
    where the photo is of a chat, what it is for the words around the
    figure, and by when the day it names. */
export function requestIn(text: string): RequestReading | null {
  const lines = text
    .split(/\n+/)
    .map(l => l.trim())
    .filter(Boolean);
  const lower = text.toLowerCase();
  const asking = /send (me )?(your|ur) (account|acct|acc)|(your|ur) (account|acct|acc) (number|no|details|num)|(account|acct) details|pay (into|to) your/.test(lower);
  if (!asking) return null;
  const line = lines.find(l => /\d/.test(l) && !/^\d{1,2}:\d{2}/.test(l)) ?? '';
  const amount = figureIn(line.replace(/\b\d{1,2}:\d{2}\b/g, '')) ?? figureIn(text.replace(/\b\d{1,2}:\d{2}\b/g, ''));
  if (!amount) return null;
  const from = lines.find(l => /^[a-z][a-z .'-]{1,24}$/i.test(l) && !/^(hi|hello|bros|abeg|please|hey)\b/i.test(l)) ?? 'Somebody';
  const when = text.match(DAYS)?.[1];
  let note: string | undefined;
  const body = line
    .replace(/^(bros|hi|hello|hey|abeg|please|pls)[,!.\s]+/i, '')
    .replace(/[:,]?\s*(?:₦|n)?\s*\d[\d,.]*\s*[km]?\b.*$/i, '')
    .replace(new RegExp(`\\b(coming|by|on|before)\\b.*$`, 'i'), '')
    .replace(/\b(is|are|due|needed|please|pls)\b.*$/i, '')
    .trim();
  if (body.length >= 3 && body.length <= 40) note = body.charAt(0).toUpperCase() + body.slice(1);
  return { from, amount, note, when: when ? when.charAt(0).toUpperCase() + when.slice(1).toLowerCase() : undefined };
}

/** What the sample bill says: the company's slip, as the meter prints one. */
export const BILL_TEXT = 'IKEJA ELECTRIC · Prepaid\nMeter 4457 8891\n₦8,000\n14 Bode Thomas\nKeep this slip for your records';
export const BILL_READING: Reading = { text: BILL_TEXT, numbers: [], real: false, bill: { disco: 'ikeja', meterKind: 'prepaid', meter: '44578891', amount: 8_000, address: '14 Bode Thomas' } };

/** What the sample top-up message says: Mum, out of data again. */
export const TOPUP_TEXT = 'Mum\n8:02 AM\nMy data has finished again: 2k data, MTN, 0803 214 4471';
export const TOPUP_READING: Reading = { text: TOPUP_TEXT, numbers: [], real: false, topup: { from: 'Mum', line: '08032144471', network: 'MTN', amount: 2_000, data: true } };

const DISCO_WORDS: [string, string][] = [
  ['ikeja', 'ikeja'],
  ['eko', 'eko'],
  ['abuja', 'abuja'],
  ['ibadan', 'ibadan'],
  ['enugu', 'enugu'],
  ['kaduna', 'kaduna'],
  ['kano', 'kano'],
  ['jos', 'jos'],
  ['benin', 'benin'],
  ['port harcourt', 'ph'],
  ['yola', 'yola'],
];

/** A light bill, if the words are one: an electricity company's name, a
    meter number of eight or more digits, the kind of meter where it says,
    what is owed where a figure stands on its own, and the address where a
    line starts with a house number. */
export function billIn(text: string): BillReading | null {
  const lower = text.toLowerCase();
  const disco = DISCO_WORDS.find(([w]) => lower.includes(w))?.[1];
  const electric = /electric|disco|kwh|meter|prepaid|postpaid/.test(lower);
  if (!disco || !electric) return null;
  const meterMatch = text.replace(/\b\d{1,2}:\d{2}\b/g, '').match(/(?:meter\s*(?:no\.?|number)?\s*:?\s*)?(\d[\d ]{7,15}\d)/i);
  const meter = meterMatch?.[1]?.replace(/\D/g, '');
  if (!meter || meter.length < 8 || meter.length > 13) return null;
  const meterKind = /postpaid/.test(lower) ? 'postpaid' : 'prepaid';
  const figure = text.match(/(?:₦|n)\s*(\d{1,3}(?:,\d{3})+|\d+)/i);
  const amount = figure?.[1] ? Number(figure[1].replace(/,/g, '')) : undefined;
  const address = text
    .split(/\n+/)
    .map(l => l.trim())
    .find(l => /^\d{1,4}[a-z]?\s+[A-Za-z][A-Za-z .'-]{2,}$/.test(l) && !/meter|kwh/i.test(l));
  return { disco, meterKind, meter, amount, address };
}

/** A message asking for data or airtime, if the words are one: a phone
    number, the network where it is named or as the number says, the figure,
    and who wrote it on the first line. */
export function topupIn(text: string): TopupReading | null {
  const lower = text.toLowerCase();
  const wants = /\b(data|airtime|credit|recharge|top ?up|mb|gb)\b/.test(lower);
  if (!wants) return null;
  const phone = text.replace(/\b\d{1,2}:\d{2}\b/g, '').match(/(?:\+?234|0)[\d ]{9,14}/);
  const line = phone?.[0]?.replace(/\D/g, '').replace(/^234/, '0');
  if (!line || line.length !== 11) return null;
  const named = lower.match(/\b(mtn|airtel|glo|9mobile)\b/)?.[1];
  const NAMES: Record<string, string> = { mtn: 'MTN', airtel: 'Airtel', glo: 'Glo', '9mobile': '9mobile' };
  const network = named ? NAMES[named] : networkFor(line);
  if (!network) return null;
  /* the figure: 2k, ₦2,000, N500, or a bare number before the thing wanted — 500 airtime */
  const clean = text.replace(/\b\d{1,2}:\d{2}\b/g, '');
  const figure = clean.match(/(?:₦|n)?\s*(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(k)\b|(?:₦|n)\s*(\d{1,3}(?:,\d{3})+|\d+)|\b(\d{3,6})\s+(?:naira\s+)?(?:airtime|credit|data|recharge|top ?up)\b/i);
  const amount = figure?.[1] ? Number(figure[1].replace(/,/g, '')) * (figure[2] ? 1_000 : 1) : figure?.[3] ? Number(figure[3].replace(/,/g, '')) : figure?.[4] ? Number(figure[4]) : undefined;
  const lines = text
    .split(/\n+/)
    .map(l => l.trim())
    .filter(Boolean);
  const from = lines.find(l => /^[a-z][a-z .'-]{1,24}$/i.test(l) && !/^(hi|hello|bros|abeg|please|hey|my)\b/i.test(l)) ?? 'Somebody';
  return { from, line, network, amount, data: /\b(data|mb|gb)\b/.test(lower) };
}

/** The network a number belongs to, by its first four digits: the same
    table the knowledge module keeps, kept short here so the reader stands
    on its own. */
function networkFor(line: string): string | null {
  const p = line.slice(0, 4);
  if (['0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906', '0913', '0916'].includes(p)) return 'MTN';
  if (['0802', '0808', '0708', '0812', '0701', '0902', '0901', '0907', '0912'].includes(p)) return 'Airtel';
  if (['0805', '0807', '0705', '0815', '0811', '0905', '0915'].includes(p)) return 'Glo';
  if (['0809', '0818', '0817', '0909', '0908'].includes(p)) return '9mobile';
  return null;
}

export class MockReader implements ReaderService {
  readonly real = false;
  constructor(private readonly delay = 900) {}
  /** the sample slip; a photo whose name says it is soft comes back with the
      digit in doubt, one whose name says it is a message as the friend
      asking to be paid, a bill as the company's slip, and a top-up as Mum
      out of data */
  async read(uri = ''): Promise<Reading> {
    await wait(this.delay);
    if (uri.includes('soft')) return { ...SOFT_READING };
    if (uri.includes('message')) return { ...MESSAGE_READING };
    if (uri.includes('bill')) return { ...BILL_READING };
    if (uri.includes('topup')) return { ...TOPUP_READING };
    return { text: SAMPLE_TEXT, numbers: accountNumbersIn(SAMPLE_TEXT), real: false };
  }
}

type MlKit = { recognizeText(path: string): Promise<{ text: string }> };

/* The device's reader is only there in a build made with it; Expo Go and the
   web have no such module, and asking for it throws, so it is asked for once,
   quietly, and its absence means the stand-in. */
function device(): MlKit | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@infinitered/react-native-mlkit-text-recognition') as MlKit;
    return typeof mod.recognizeText === 'function' ? mod : null;
  } catch {
    return null;
  }
}

export class MlKitReader implements ReaderService {
  private readonly kit = device();
  private readonly standIn = new MockReader();
  get real() {
    return this.kit !== null;
  }
  async read(uri: string): Promise<Reading> {
    if (!this.kit) return this.standIn.read(uri);
    let r: { text: string };
    try {
      r = await this.kit.recognizeText(uri);
    } catch {
      /* some builds of the reader want a bare path rather than a file address */
      r = await this.kit.recognizeText(uri.replace(/^file:\/\//, ''));
    }
    const text = r.text ?? '';
    return { text, numbers: accountNumbersIn(text), real: true, request: requestIn(text) ?? undefined, bill: billIn(text) ?? undefined, topup: topupIn(text) ?? undefined };
  }
}
