/* What went wrong last, kept on the phone so it can be read after Beetle
   closes. A phone keeps no log a tester can read, and Expo Go simply goes
   when the app stops on an error it could not handle (the owner saw it go on
   a slide, Round 13). So every error that would stop the app is written down
   first, at once, in the keychain, and the next time Beetle opens a build
   with the lab says what it was, with a way to copy it. An error inside the
   screens is caught before it stops anything (app/_layout.tsx) and kept the
   same way.

   Only on the phone: the web shows its errors in the console. A stop in the
   phone's own code, below the app, leaves nothing here; nothing kept after a
   close says it was that. */
import { Platform } from 'react-native';

export type Problem = { at: string; message: string; stack?: string; fatal: boolean };

const KEY = 'beetle.lastProblem';

type Store = typeof import('expo-secure-store');
const store: Store | null = (() => {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-secure-store') as Store;
  } catch {
    return null;
  }
})();

/** The words of an error, short enough for the keychain and a phone's alert. */
export function problemOf(error: unknown, fatal: boolean, at = new Date()): Problem {
  const e = error as { name?: string; message?: string; stack?: string } | null;
  const message = e && typeof e === 'object' && e.message ? `${e.name && e.name !== 'Error' ? `${e.name}: ` : ''}${e.message}` : String(error);
  return {
    at: at.toISOString(),
    message: message.slice(0, 500),
    stack: e && typeof e === 'object' && e.stack ? String(e.stack).split('\n').slice(0, 12).join('\n').slice(0, 1500) : undefined,
    fatal,
  };
}

/** Writes it down at once: there may be no later. */
export function keepProblem(problem: Problem) {
  try {
    store?.setItem(KEY, JSON.stringify(problem));
  } catch {
    /* nowhere to keep it: the app goes on as it would have */
  }
}

/** The one kept from last time, read once and forgotten. */
export function takeLastProblem(): Problem | null {
  if (!store) return null;
  try {
    const raw = store.getItem(KEY);
    if (!raw) return null;
    store.deleteItemAsync(KEY).catch(() => {});
    return JSON.parse(raw) as Problem;
  } catch {
    return null;
  }
}

type Handler = (error: unknown, fatal?: boolean) => void;
let watching = false;

/** From now on, an error that would stop the app is kept before it does. */
export function watchProblems() {
  if (watching || !store) return;
  const utils = (globalThis as { ErrorUtils?: { getGlobalHandler(): Handler; setGlobalHandler(h: Handler): void } }).ErrorUtils;
  if (!utils) return;
  watching = true;
  const before = utils.getGlobalHandler();
  utils.setGlobalHandler((error, fatal) => {
    if (fatal) keepProblem(problemOf(error, true));
    before(error, fatal);
  });
}
