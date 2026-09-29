/* Copying the account number. expo-clipboard is in the web, Expo Go and any
   APK made after it was added; a build without it says so instead of
   crashing. The web has the browser's own clipboard. */
import { Platform } from 'react-native';

type ClipboardModule = typeof import('expo-clipboard');
const clip: ClipboardModule | null = (() => {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-clipboard') as ClipboardModule;
  } catch {
    return null;
  }
})();

/** Puts the text on the clipboard; false where this build cannot. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      const nav = (globalThis as { navigator?: { clipboard?: { writeText(t: string): Promise<void> } } }).navigator;
      if (!nav?.clipboard) return false;
      await nav.clipboard.writeText(text);
      return true;
    }
    if (!clip) return false;
    await clip.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}
