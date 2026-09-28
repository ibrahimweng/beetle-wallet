/* One way to open a browser, for every check that needs one.

   Playwright normally downloads a Chromium of its own. Where one is already
   on the machine — a container that ships with it, or a developer who would
   rather not download another — point CHROMIUM at it and this uses that
   instead of failing. */
import { chromium } from 'playwright';
import { existsSync } from 'fs';

const KNOWN = ['/opt/pw-browsers/chromium'];

export function launch(opts = {}) {
  const found = process.env.CHROMIUM || KNOWN.find(p => existsSync(p));
  return chromium.launch(found ? { ...opts, executablePath: found } : opts);
}
