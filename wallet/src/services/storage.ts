/* Where things are kept on the device. Ordinary state goes through
   AsyncStorage. Anything that guards money — the session token and the
   passcode's hash — goes through the secure store, which is the keychain on
   iOS and the keystore on Android. The web has no keychain, so there the
   secure store is AsyncStorage under a different key, which is fine for a
   preview and said so in the README. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  async set(key: string, value: unknown) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* the next write will try again */
    }
  },
  async remove(key: string) {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      /* nothing to remove */
    }
  },
};

type Secure = { get(key: string): Promise<string | null>; set(key: string, value: string): Promise<void>; remove(key: string): Promise<void> };

const webSecure: Secure = {
  get: key => AsyncStorage.getItem('secure.' + key).catch(() => null),
  set: (key, value) => AsyncStorage.setItem('secure.' + key, value).catch(() => undefined),
  remove: key => AsyncStorage.removeItem('secure.' + key).catch(() => undefined),
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
