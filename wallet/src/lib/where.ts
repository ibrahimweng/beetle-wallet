/* Where somebody is in the app, told to the test site around it (site/page.html), so its "What to type" card shows the
   step on screen. Only the web build inside that page says anything; on a phone this does nothing.

   A screen over everything (the app locked, asking for the passcode) is said over where the page is, and when it goes
   the page under it is said again. */
import { Platform } from 'react-native';

let last = '';
let under = '';
let over: string | null = null;

function post(where: string) {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || window.parent === window) return;
  if (where === last) return;
  last = where;
  try {
    window.parent.postMessage({ beetle: 'where', where }, '*');
  } catch {
    /* a page that will not hear it is no reason to stop */
  }
}

/** The page or the step on screen. */
export function tellWhere(where: string) {
  under = where;
  if (!over) post(where);
}

/** A screen over everything, or null once it has gone. */
export function tellOver(where: string | null) {
  over = where;
  post(where ?? under);
}
