/* Start over on this phone (Round 34, the owner testing sign-up: every
   number and email tried was "already" an account). This build keeps the
   accounts it opens on the phone itself, standing in for Beetle's servers,
   so a number or an email used once is taken for good. The test build can
   forget them all: every account opened here and everything kept for each,
   the way in, the session, the phones it knew, so sign-up can be tried again
   from nothing. The demo account lives in the code and comes back as its
   frames draw it; the AI key the owner set is kept. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Updates from 'expo-updates';
import { auth, forgetRemembered, secure, storage } from '../../services';
import { forgetHeld } from '../../lib/forget';
import { resetGate } from '../passcode/check';

/** What is kept for each account, under its number. */
const PER_ACCOUNT = (n: string) => [
  ...['moves', 'goals', 'requests', 'chats', 'disputes', 'prefs', 'setup', 'cards'].map(k => `beetle.${k}.${n}.v1`),
  `beetle.passcode.${n}.v3`,
  `beetle.passcode.${n}.v2`,
  `beetle.password.${n}.v1`,
];

/** What is kept for the phone as a whole. */
const PHONE = ['beetle.progress.v1', 'beetle.session.v1', 'beetle.devices.v1', 'beetle.gate.v1', 'beetle.recovery-paused.v1', 'beetle.home.pointed-out.v1', 'beetle.lastProblem', 'beetle.passcode.v1'];

/** Kept through a start over: the owner's own AI key. */
const KEEP = /beetle\.model\.key/;

/** Everything kept for an account, gone, on the phone and in memory: an account closed (the analysis after Round 34: the
    next account opened on that number has the same account number, and found the closed one's setting up, money and
    chats), or every account on a start over. Each key in both places: the secure store holds the secrets and who
    somebody is, plain storage the rest. */
export async function forgetAccount(...numbers: string[]): Promise<void> {
  await Promise.all(numbers.flatMap(PER_ACCOUNT).flatMap(k => [storage.remove(k), secure.remove(k)]));
  forgetHeld(numbers);
}

export async function forgetEverything(): Promise<void> {
  const numbers = await auth.forgetAll();
  await forgetAccount(...numbers);
  await Promise.all(PHONE.flatMap(k => [storage.remove(k), secure.remove(k)]));
  resetGate();
  /* and anything else this build kept under its own name, the AI key aside */
  const ours = (k: string) => /^(secure\.)?beetle\./.test(k) && !KEEP.test(k);
  forgetRemembered(ours);
  try {
    const all = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(all.filter(ours));
  } catch {
    /* nothing more the device will give up */
  }
}

/** Once forgotten, the app opens again from nothing, so nothing it held in memory outlives the start over; where the
    phone will not reopen it (Expo Go can refuse), it goes on to the way in. */
export async function reopen(orElse: () => void) {
  if (Platform.OS === 'web') {
    (globalThis as { location?: { reload(): void } }).location?.reload();
    return;
  }
  try {
    await Updates.reloadAsync();
  } catch {
    orElse();
  }
}
