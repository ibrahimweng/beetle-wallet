/* Where things are kept on the device. Ordinary state goes through
   AsyncStorage. Anything that guards money — the session token and the
   passcode's hash — goes through the secure store, which is the keychain on
   iOS and the keystore on Android. The web has no keychain, so there the
   secure store is AsyncStorage under a different key, which is fine for a
   preview and said so in the README. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/* Where the device refuses to keep anything — a browser with site data
   blocked, a private window — what is written is kept for the session
   instead, so the app still works and simply starts afresh next time. */
const memory = new Map<string, string>();
const kept = {
  async get(key: string): Promise<string | null> {
    try {
      const v = await AsyncStorage.getItem(key);
      if (v !== null) return v;
    } catch {
      /* fall through to what the session remembers */
    }
    return memory.get(key) ?? null;
  },
  async set(key: string, value: string) {
    memory.set(key, value);
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      /* kept for the session only */
    }
  },
  async remove(key: string) {
    memory.delete(key);
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      /* nothing on the device to remove */
    }
  },
};

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await kept.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  set: (key: string, value: unknown) => kept.set(key, JSON.stringify(value)),
  remove: (key: string) => kept.remove(key),
};

type Secure = { get(key: string): Promise<string | null>; set(key: string, value: string): Promise<void>; remove(key: string): Promise<void> };

const webSecure: Secure = {
  get: key => kept.get('secure.' + key),
  set: (key, value) => kept.set('secure.' + key, value),
  remove: key => kept.remove('secure.' + key),
};

let nativeSecure: Secure | null = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SecureStore = require('expo-secure-store') as typeof import('expo-secure-store');
  nativeSecure = {
    get: key => SecureStore.getItemAsync(key).catch(() => null),
    set: (key, value) => SecureStore.setItemAsync(key, value).catch(() => undefined),
    remove: key => SecureStore.deleteItemAsync(key).catch(() => undefined),
  };
}

export const secure: Secure = nativeSecure ?? webSecure;
