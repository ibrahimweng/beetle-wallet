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
};

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
export const SAMPLE_TEXT = 'GTBANK\nAccount name\nSarah Adeyemi\nAccount number\n0123456789\nBank\nGuaranty Trust Bank\nPlease pay into the account above. Thank you.';

export class MockReader implements ReaderService {
  readonly real = false;
  constructor(private readonly delay = 900) {}
  async read(): Promise<Reading> {
    await wait(this.delay);
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
    if (!this.kit) return this.standIn.read();
    let r: { text: string };
    try {
      r = await this.kit.recognizeText(uri);
    } catch {
      /* some builds of the reader want a bare path rather than a file address */
      r = await this.kit.recognizeText(uri.replace(/^file:\/\//, ''));
    }
    const text = r.text ?? '';
    return { text, numbers: accountNumbersIn(text), real: true };
  }
}
