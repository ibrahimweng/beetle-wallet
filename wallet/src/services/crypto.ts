/* The passcode is never kept as typed. It is salted and hashed, and the hash
   is what the secure store holds; opening the app later hashes what you type
   and compares. */
import * as Crypto from 'expo-crypto';

export async function randomSalt(bytes = 16): Promise<string> {
  const arr = Crypto.getRandomBytes(bytes);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPasscode(code: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${code}`);
}

export const randomToken = () => randomSalt(24);
