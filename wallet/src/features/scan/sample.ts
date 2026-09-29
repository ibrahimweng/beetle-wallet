/* The slip in assets/: a name, a bank and an account number on paper, for
   where there is no camera, and for trying the reader on the phone without
   finding a real slip. */
import { Asset } from 'expo-asset';
import type { Photo } from '../../services';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SLIP = require('../../../assets/sample-slip.png');

export async function samplePhoto(): Promise<Photo> {
  const asset = Asset.fromModule(SLIP);
  try {
    await asset.downloadAsync();
  } catch {
    /* on the web the address is enough */
  }
  return { uri: asset.localUri ?? asset.uri, width: asset.width ?? undefined, height: asset.height ?? undefined };
}
