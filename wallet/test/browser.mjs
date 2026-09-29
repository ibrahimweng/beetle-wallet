/* One way to open a browser, for every check that needs one.

   Playwright normally downloads a Chromium of its own. Where one is already
   on the machine — a container that ships with it, or a developer who would
   rather not download another — point CHROMIUM at it and this uses that
   instead of failing. */
import { chromium } from 'playwright';
import { existsSync } from 'fs';

const KNOWN = ['/opt/pw-browsers/chromium'];

/* A camera that is always there: Chromium can stand one in, so the screen
   that reads a photo can be walked where there is no camera at all. */
const CAMERA = ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'];

export function launch(opts = {}) {
  const found = process.env.CHROMIUM || KNOWN.find(p => existsSync(p));
  const args = [...(opts.args || []), ...CAMERA];
  return chromium.launch(found ? { ...opts, args, executablePath: found } : { ...opts, args });
}
