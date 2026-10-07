/* The slip in assets/: a name, a bank and an account number on paper, for
   where there is no camera, and for trying the reader on the phone without
   finding a real slip. And a message: a friend asking to be paid, the way
   one does on WhatsApp, for the way in to a request. */
import { Asset } from 'expo-asset';
import type { Photo, SampleKind } from '../../services';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SLIP = require('../../../assets/sample-slip.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MESSAGE = require('../../../assets/sample-message.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const BILL = require('../../../assets/sample-bill.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const TOPUP = require('../../../assets/sample-topup.png');

export const samplePhoto = () => sampleOf(SLIP, 'slip');
/** The stand-in reads it as Musa asking for 20k for the rent balance. */
export const sampleMessage = () => sampleOf(MESSAGE, 'message');
/** The stand-in reads it as Ikeja Electric's slip: meter 4457 8891, ₦8,000, 14 Bode Thomas. */
export const sampleBill = () => sampleOf(BILL, 'bill');
/** The stand-in reads it as Mum asking for 2k of MTN data. */
export const sampleTopup = () => sampleOf(TOPUP, 'topup');

export type { SampleKind };
export const SAMPLES: { kind: SampleKind; title: string; sub: string }[] = [
  { kind: 'slip', title: 'An account slip', sub: 'Sarah Adeyemi at GTBank, on paper' },
  { kind: 'message', title: 'A message asking for your account', sub: 'Musa, the rent balance, 20k' },
  { kind: 'bill', title: 'A light bill', sub: 'Ikeja Electric, meter 4457 8891, ₦8,000' },
  { kind: 'topup', title: 'A message asking for data', sub: 'Mum, out of data again' },
];
export const sampleOfKind = (kind: SampleKind) => (kind === 'slip' ? samplePhoto() : kind === 'message' ? sampleMessage() : kind === 'bill' ? sampleBill() : sampleTopup());

/* the photo says which sample it is: on the iPhone, Expo Go keeps an asset
   under a name of its own, and the stand-in reader would take every one for
   the slip (the analysis after Round 21) */
async function sampleOf(module: number, sample: SampleKind): Promise<Photo> {
  const asset = Asset.fromModule(module);
  try {
    await asset.downloadAsync();
  } catch {
    /* on the web the address is enough */
  }
  return { uri: asset.localUri ?? asset.uri, width: asset.width ?? undefined, height: asset.height ?? undefined, sample };
}
