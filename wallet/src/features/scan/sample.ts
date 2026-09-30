/* The slip in assets/: a name, a bank and an account number on paper, for
   where there is no camera, and for trying the reader on the phone without
   finding a real slip. And a message: a friend asking to be paid, the way
   one does on WhatsApp, for the way in to a request. */
import { Asset } from 'expo-asset';
import type { Photo } from '../../services';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SLIP = require('../../../assets/sample-slip.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MESSAGE = require('../../../assets/sample-message.png');

export const samplePhoto = () => sampleOf(SLIP);
/** The stand-in reads it as Musa asking for 20k for the rent balance. */
export const sampleMessage = () => sampleOf(MESSAGE);

async function sampleOf(module: number): Promise<Photo> {
  const asset = Asset.fromModule(module);
  try {
    await asset.downloadAsync();
  } catch {
    /* on the web the address is enough */
  }
  return { uri: asset.localUri ?? asset.uri, width: asset.width ?? undefined, height: asset.height ?? undefined };
}
