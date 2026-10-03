/* Is the screen drawn to the frame?

   For every screen in test/figma/screens.json this opens the screen through
   the lab, finds each named piece on it and measures where it sits and how
   big it is, and holds that to the frame's own numbers in test/figma/<key>.xml:
   within three of the frame's figure, or of that figure snapped to the
   4-point grid, which is the rule the app builds to: two for the grid (a
   figure on it is never more than two from the one it was snapped from) and
   one for the slop in a frame's own text boxes, which sit a pixel off their
   lines. It also checks
   that every line of words the frame carries is on the screen, and lays the
   frame's picture and the screen side by side into shots/figma/<key>.png so
   the two can be looked at together.

   Not every difference is a fault: a figure that comes from live state, a
   piece the app draws in another place on purpose, a line reworded. Those
   are in test/figma/allowed.json, each with why, and nothing else passes.
   A screen can be anchored on one piece: every other piece is then held to
   the frame from that piece's own corner, for a frame whose head box clips
   a line the build gives room to; the anchor's own offset is reported, and
   needs its reason in allowed.json like anything else. Where a block changes
   height on purpose, a band of the frame can be allowed to move as one:
   {band: [from, to], dy, why} holds every piece the frame has from y from up
   to y to (pinned and container-measured pieces aside) to the frame moved by
   dy, so what came up under the block is still measured, and each piece it
   moves says so.

     node test/figma.mjs dist            # every screen
     node test/figma.mjs dist welcome    # one
*/
import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { launch } from './browser.mjs';
import { serve } from './serve.mjs';
import { find, loadFrame, words } from './figma-parse.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const FRAMES = join(here, 'figma');
const OUT = resolve(here, '..', 'shots', 'figma');
const only = process.argv[3];

const screens = JSON.parse(await readFile(join(FRAMES, 'screens.json'), 'utf8'));
const allowed = JSON.parse(await readFile(join(FRAMES, 'allowed.json'), 'utf8'));
await mkdir(OUT, { recursive: true });

const { base, close } = await serve(process.argv[2] || 'dist');
const b = await launch();
const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 1 });
await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
const page = await ctx.newPage();
page.setDefaultTimeout(15000);

/* an allowance names its piece by name and nth, or lists pieces: a name
   (any of that name) or [name, nth] (that one alone) */
const allows = (a, piece) =>
  (a.piece === piece.name && (a.nth ?? 0) === (piece.nth ?? 0)) || (a.pieces ?? []).some(p => (Array.isArray(p) ? p[0] === piece.name && p[1] === (piece.nth ?? 0) : p === piece.name));
const snap4 = v => Math.round(v / 4) * 4;
const near = (got, want) => Math.abs(got - want) <= 3 || Math.abs(got - snap4(want)) <= 3;
const fmt = v => (Math.round(v * 10) / 10).toString();

/* where a thing is on the screen: its box, in the page's own coordinates
   even when a list has been scrolled */
async function measure(spec) {
  return page.evaluate(spec => {
    const visible = el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && !el.closest('[aria-hidden="true"]');
    };
    const box = el => {
      const r = el.getBoundingClientRect();
      let dy = 0;
      /* a list's own scroll, on top of the page's; the document's is window.scrollY, counted once */
      for (let p = el.parentElement; p; p = p.parentElement) if (p !== document.documentElement && p !== document.body) dy += p.scrollTop || 0;
      return { x: r.left, y: r.top + dy + (window.scrollY || 0), w: r.width, h: r.height };
    };
    let el = null;
    /* inside a container, when the same words are on the screen behind it too */
    const root = spec.inside ? (document.querySelector(`[data-testid="${spec.inside}"]`) ?? document) : document;
    const all = [...root.querySelectorAll('*')];
    /* the nth match, where the same words are on the screen more than once */
    const pick = list => list[spec.nth ?? 0] ?? null;
    if (spec.text !== undefined) {
      const t = spec.text;
      const fits = s => (spec.exact ? s === t : s.startsWith(t));
      el = pick(all.filter(e => e.childElementCount === 0 && fits((e.textContent || '').trim()) && visible(e)));
      /* words split across nested spans: the innermost element holding them all */
      if (!el) {
        const holding = all.filter(e => fits((e.textContent || '').replace(/\s+/g, ' ').trim()) && visible(e));
        el = pick(holding.filter(e => !holding.some(o => o !== e && e.contains(o))).sort((a, b) => a.textContent.length - b.textContent.length));
      }
    } else if (spec.button !== undefined) {
      el = pick(all.filter(e => e.getAttribute('role') === 'button' && ((e.getAttribute('aria-label') || '').trim() === spec.button || (e.textContent || '').trim() === spec.button) && visible(e)));
    } else if (spec.label !== undefined) {
      el = pick(all.filter(e => (e.getAttribute('aria-label') || '').trim() === spec.label && visible(e)));
    } else if (spec.testid !== undefined) {
      el = pick(all.filter(e => e.getAttribute('data-testid') === spec.testid && visible(e)));
    }
    if (!el) return null;
    for (let i = 0; i < (spec.up ?? 0); i++) el = el.parentElement ?? el;
    /* down into it: one child, or a path of them; a pressed row's wash, drawn first under the rest, is not one of them */
    const kids = e => [...e.children].filter(c => c.getAttribute('data-testid') !== 'wash');
    for (const i of spec.child === undefined ? [] : [].concat(spec.child)) el = kids(el)[i] ?? el;
    return box(el);
  }, spec);
}

/* wait for the screen to stop moving: a card settling, a sheet arriving. Five
   samples alike, 300 apart, is longer than any pause inside a movement. */
async function still() {
  const sample = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('[data-testid], [role="button"]')]
        .map(e => {
          const r = e.getBoundingClientRect();
          return `${Math.round(r.left * 2)},${Math.round(r.top * 2)},${Math.round(r.width * 2)},${Math.round(r.height * 2)}`;
        })
        .join('|'),
    );
  let last = await sample();
  for (let i = 0, same = 0; i < 40 && same < 5; i++) {
    await page.waitForTimeout(300);
    const now = await sample();
    same = now === last ? same + 1 : 0;
    last = now;
  }
}

const failures = [];
const report = [];
const keys = Object.keys(screens).filter(k => !only || k === only);

for (const key of keys) {
  const s = screens[key];
  const frame = loadFrame(join(FRAMES, `${s.frame}.xml`), s.root);
  const lines = [];
  let bad = 0;

  /* get there: the lab opens the place with the state it needs */
  await page.goto(base + '/lab', { waitUntil: 'load' });
  await page.getByText('Beetle Lab').first().waitFor();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: s.place, exact: true }).first().click();
  for (const step of s.then ?? []) {
    if (step.tap) await page.getByRole('button', { name: step.tap, exact: true }).first().click();
    if (step.wait) await page.waitForTimeout(step.wait);
  }
  if (s.wait) await page.getByText(s.wait, { exact: !!s.waitExact }).filter({ visible: true }).first().waitFor();
  await page.waitForTimeout(s.settle ?? 1200);
  await still();
  const appShot = join(OUT, `${key}-app.png`);
  await page.screenshot({ path: appShot });

  /* the corner everything is measured from: the frame's, or the anchor's */
  let corner = { x: 0, y: 0 };
  if (s.anchor) {
    const want = find(frame, s.anchor.name, s.anchor.nth ?? 0);
    const got = await measure(s.anchor.find);
    if (!want || !got) {
      lines.push(`✗ anchor ${s.anchor.name}: ${want ? 'not on the screen' : 'not in the frame'}`);
      bad++;
    } else {
      corner = { x: got.x - want.x, y: got.y - want.y };
      const off = Math.round(corner.y) || Math.round(corner.x);
      const pass = (allowed[key] ?? []).find(a => a.anchor);
      if (!off) lines.push(`✓ anchored on ${s.anchor.name}, where the frame has it`);
      else if (pass) lines.push(`~ anchored on ${s.anchor.name}: ${fmt(corner.y)} lower, ${fmt(corner.x)} right of the frame — allowed: ${pass.why}`);
      else {
        lines.push(`✗ anchored on ${s.anchor.name}: ${fmt(corner.y)} lower, ${fmt(corner.x)} right of the frame`);
        bad++;
      }
    }
  }

  /* the pieces */
  for (const piece of s.pieces ?? []) {
    const want = find(frame, piece.name, piece.nth ?? 0, piece.within, piece.withinNth ?? 0);
    if (!want) {
      lines.push(`? ${piece.name}: not in the frame`);
      bad++;
      continue;
    }
    let got = await measure(piece.withinFind?.testid ? { ...piece.find, inside: piece.withinFind.testid } : piece.find);
    let origin = piece.fixed ? { x: 0, y: 0 } : { ...corner };
    if (piece.within) {
      const box = find(frame, piece.within, piece.withinNth ?? 0);
      const appBox = piece.withinFind ? await measure(piece.withinFind) : null;
      if (!appBox) {
        lines.push(`? ${piece.name}: the container ${piece.within} is not on the screen`);
        bad++;
        continue;
      }
      origin = { x: appBox.x - box.x, y: appBox.y - box.y };
    }
    if (!got) {
      /* a figure that is live, or a line the build words otherwise, is allowed by name */
      const pass = (allowed[key] ?? []).find(a => allows(a, piece));
      if (pass) lines.push(`~ ${piece.name}: not on the screen — allowed: ${pass.why}`);
      else {
        lines.push(`✗ ${piece.name}: not on the screen`);
        bad++;
      }
      continue;
    }
    got = { x: got.x - origin.x, y: got.y - origin.y, w: got.w, h: got.h };
    /* in a band that moved as one, the frame's figure moved with it */
    const band = piece.fixed || piece.within ? null : (allowed[key] ?? []).find(a => a.band && want.y >= a.band[0] && want.y < a.band[1]);
    const held = band ? { ...want, y: want.y + band.dy } : want;
    const moved = band ? `moved ${fmt(band.dy)} with the band from ${fmt(band.band[0])}: ${band.why}` : '';
    const dims = piece.only ?? (piece.find.text !== undefined ? ['x', 'y', 'h'] : ['x', 'y', 'w', 'h']);
    const off = dims.filter(d => !near(got[d], held[d]));
    const show = dims.map(d => `${d} ${fmt(got[d])}${near(got[d], held[d]) ? '' : `≠${fmt(held[d])}`}`).join(' ');
    if (off.length) {
      /* allowed by name, or as one of a set that is off for one reason */
      const pass = (allowed[key] ?? []).find(a => allows(a, piece));
      if (pass) lines.push(`~ ${piece.name}: ${show} — allowed: ${pass.why}${band ? `; ${moved}` : ''}`);
      else {
        lines.push(`✗ ${piece.name}: ${show}${band ? ` (${moved})` : ''}`);
        bad++;
      }
    } else if (band) lines.push(`~ ${piece.name}: ${show} — ${moved}`);
    else lines.push(`✓ ${piece.name}: ${show}`);
  }

  /* the words */
  const text = (await page.evaluate(() => document.body.innerText || '')).replace(/\s+/g, ' ');
  for (const w of words(frame)) {
    if (s.skipWords?.some(p => w.startsWith(p))) continue;
    if (text.includes(w)) continue;
    const pass = (allowed[key] ?? []).find(a => a.text && w.startsWith(a.text));
    if (pass) lines.push(`~ "${w}" — allowed: ${pass.why}`);
    else {
      lines.push(`✗ "${w}" is not on the screen`);
      bad++;
    }
  }

  /* the two, side by side */
  const framePng = await readFile(join(FRAMES, `${s.picture ?? s.frame}.png`)).then(x => x.toString('base64'));
  const appPng = await readFile(appShot).then(x => x.toString('base64'));
  const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#f5f5f7;font:13px/1.45 -apple-system,Helvetica,Arial,sans-serif;color:#111">
    <div style="display:flex;gap:24px;padding:20px;align-items:flex-start">
      <div><div style="margin-bottom:8px;font-weight:600">Frame ${s.frame}${s.root ? ` · ${s.root}` : ''}</div><img src="data:image/png;base64,${framePng}" style="width:393px;display:block;border:1px solid #ddd"></div>
      <div><div style="margin-bottom:8px;font-weight:600">The app · ${key}</div><img src="data:image/png;base64,${appPng}" style="width:393px;display:block;border:1px solid #ddd"></div>
      <div style="max-width:520px"><div style="margin-bottom:8px;font-weight:600">${bad ? `${bad} off the frame` : 'On the frame'}</div><pre style="white-space:pre-wrap;margin:0;font:12px/1.5 ui-monospace,Menlo,monospace">${lines.map(l => l.replace(/</g, '&lt;')).join('\n')}</pre></div>
    </div></body>`;
  const sheet = await ctx.newPage();
  await sheet.setViewportSize({ width: 1400, height: 900 });
  await sheet.setContent(html);
  await sheet.screenshot({ path: join(OUT, `${key}.png`), fullPage: true });
  await sheet.close();

  console.log(`${key}: ${bad ? `${bad} off the frame` : 'on the frame'}`);
  for (const l of lines) console.log('  ' + l);
  if (bad) failures.push(key);
  report.push({ key, bad, lines });
}

await b.close();
close();
await writeFile(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
if (failures.length) {
  console.log(`\nOff the frame: ${failures.join(', ')} — see shots/figma/`);
  process.exit(1);
}
console.log('\nEvery screen is on its frame.');
