/* Where somebody is in the app, told to the test site around it (site/page.html), so its "What to type" list can
   light up the step on screen. Only the web build inside that page says anything; on a phone this does nothing. */
import { Platform } from 'react-native';

let last = '';

export function tellWhere(where: string) {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || window.parent === window) return;
  if (where === last) return;
  last = where;
  try {
    window.parent.postMessage({ beetle: 'where', where }, '*');
  } catch {
    /* a page that will not hear it is no reason to stop */
  }
}
