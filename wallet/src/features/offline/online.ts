/* Whether the network is there. On the web the browser says so and says
   when it changes; on a phone this build assumes it is, until a network
   module is added (expo-network is the one to add: it is not in this build
   so that Expo Go keeps working without a rebuild). The last moment the
   network was seen is kept, for "last checked twelve minutes ago". */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

let lastSeen = Date.now();

const nav = (): { onLine?: boolean } | undefined => (typeof navigator === 'undefined' ? undefined : (navigator as { onLine?: boolean }));

/** Is the network there right now, as far as this build can tell. */
export function isOnline(): boolean {
  if (Platform.OS !== 'web') return true;
  const on = nav()?.onLine;
  return on === undefined ? true : on;
}

/** Minutes since the network was last seen: 0 while it is there. */
export function minutesOffline(now = Date.now()): number {
  if (isOnline()) {
    lastSeen = now;
    return 0;
  }
  return Math.max(0, Math.round((now - lastSeen) / 60_000));
}

/** "Last checked 12 minutes ago", or "just now". */
export const lastCheckedLine = (minutes: number) => (minutes <= 0 ? 'Last checked just now' : minutes === 1 ? 'Last checked a minute ago' : `Last checked ${minutes} minutes ago`);

export function useOnline(): boolean {
  const [online, setOnline] = useState(isOnline);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const up = () => {
      lastSeen = Date.now();
      setOnline(true);
    };
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}
