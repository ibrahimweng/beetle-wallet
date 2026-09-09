/* The state layer is written once, at the repository root, and both the web
   build and this app run the same files. This copies them in. The only file
   that differs per platform is storage.js, which is why it is not copied:
   the web one uses localStorage, the one here uses AsyncStorage. */
import { copyFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
const from = join(here, '..', '..', 'src');
const to = join(here, '..', 'src', 'state');
mkdirSync(to, { recursive: true });

const files = ['data.js', 'store.js', 'flow.js', 'actions.js'];
for (const f of files) copyFileSync(join(from, f), join(to, f));
console.log(`state: copied ${files.length} files from src/`);
