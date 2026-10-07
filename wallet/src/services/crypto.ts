/* The passcode is never kept as typed. It is salted and stretched, and what
   comes of that is what the secure store holds; opening the app later does
   the same to what you type and compares.

   How it is kept says which way it was made (the analysis after Round 21:
   one round of SHA-256 with nothing to say how, so it could never be made
   stronger). Version 2 is PBKDF2 with SHA-256 over a random salt, the
   rounds kept beside it so they can be raised; a passcode kept the first
   way (version 1, one round) is still checked, and kept again the new way
   the first time it is typed right. */
import * as Crypto from 'expo-crypto';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

export async function randomSalt(bytes = 16): Promise<string> {
  const arr = Crypto.getRandomBytes(bytes);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

/** Version 1: one round of SHA-256. Kept only to check passcodes kept that way. */
export async function hashPasscode(code: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${code}`);
}

/** How many rounds a passcode kept now is stretched over: enough to slow a guess, not so many that a phone waits on it. */
export const PASSCODE_ROUNDS = 1000;

/** A passcode as the secure store holds it. */
export type KeptPasscode = { v: 2; salt: string; rounds: number; hash: string } | { v?: 1; salt: string; hash: string };

const stretch = (code: string, salt: string, rounds: number) => bytesToHex(pbkdf2(sha256, code, salt, { c: rounds, dkLen: 32 }));

/** A new passcode, ready to keep. */
export async function keepPasscode(code: string, rounds = PASSCODE_ROUNDS): Promise<Extract<KeptPasscode, { v: 2 }>> {
  const salt = await randomSalt();
  return { v: 2, salt, rounds, hash: stretch(code, salt, rounds) };
}

/** Does what was typed match what is kept, whichever way it was kept? */
export async function matchesPasscode(code: string, kept: KeptPasscode): Promise<boolean> {
  const made = kept.v === 2 ? stretch(code, kept.salt, kept.rounds) : await hashPasscode(code, kept.salt);
  return same(made, kept.hash);
}

/** Kept a way that is weaker than the way a passcode is kept now. */
export const keptWeakly = (kept: KeptPasscode) => kept.v !== 2 || kept.rounds < PASSCODE_ROUNDS;

/* compared in full every time, so how long it takes says nothing about how much matched */
function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export const randomToken = () => randomSalt(24);
