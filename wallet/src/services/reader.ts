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
};

export type RequestReading = { from: string; amount: number; note?: string; when?: string };

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

export class MockReader implements ReaderService {
  readonly real = false;
  constructor(private readonly delay = 900) {}
  /** the sample slip; a photo whose name says it is soft comes back with the
      digit in doubt, and one whose name says it is a message as the friend
      asking to be paid */
  async read(uri = ''): Promise<Reading> {
    await wait(this.delay);
    if (uri.includes('soft')) return { ...SOFT_READING };
    if (uri.includes('message')) return { ...MESSAGE_READING };
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
    return { text, numbers: accountNumbersIn(text), real: true, request: requestIn(text) ?? undefined };
  }
}
