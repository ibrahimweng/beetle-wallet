/* Exports. IconExport: the selected icon as SVG, in the weight being edited.
   LibraryExport: the icons in the current view as a sprite, a font or JSON.
   Every export is there plain, as drawn, and beside it with goo. */
import { h, ICO, fmtInt, STYLE_LABEL } from '../../lib/utils.js';
import { Button } from '../ui/button.js';
import { CodeBlock } from '../ui/code-block.js';
import { store } from '../../lib/store.js';
import { primsOf, search, exportName, entryOf, drawingsFor } from '../../lib/library.js';
import { saveFile, copyText, iconSVG, gooIconSVG, spriteOf, gooSpriteOf, fontOf, gooFontOf, jsonOf, gooJsonOf, usageSnippet, fileStem } from '../../lib/export.js';

/* the four-style drawings an export needs, here before it starts */
const isDrawn = key => { const e = entryOf(key); const b = e && e.base ? entryOf(e.base) : e; return !!(b && b.drawn); };

const wait = () => new Promise(r => setTimeout(r, 30));

export function IconExport() {
  const status = h('div', { class: 'status' });
  const say = t => { status.textContent = t; };
  const code = CodeBlock({ label: 'SVG' });
  const cur = () => { const s = store.get(); return iconSVG(s.sel, primsOf(s.sel, s), s.P); };
  const copy = Button({ size: 'sm', icon: ICO.copy, label: 'Copy SVG', onClick: async () => say((await copyText(cur())) ? 'SVG copied.' : 'Select the code below and copy it.') });
  const download = Button({ variant: 'outline', size: 'sm', icon: ICO.download, label: 'Download', onClick: async () => { const s = store.get(); say(await saveFile(`${exportName(s.sel)}-${fileStem(s.P)}.svg`, cur(), 'image/svg+xml')); } });
  /* the same icon with goo: paths alone, at the goo amount set under Goo */
  const curGoo = () => { const s = store.get(); return gooIconSVG(primsOf(s.sel, s), s.P); };
  const copyGoo = Button({ variant: 'outline', size: 'sm', icon: ICO.copy, label: 'Copy with goo', title: 'The SVG with goo: paths alone', onClick: async () => say((await copyText(curGoo())) ? 'SVG with goo copied.' : 'Copying is blocked here. Download it with goo instead.') });
  const downloadGoo = Button({ variant: 'outline', size: 'sm', icon: ICO.download, label: 'Download with goo', title: 'The SVG with goo: paths alone', onClick: async () => { const s = store.get(); say(await saveFile(`${exportName(s.sel)}-${fileStem(s.P)}-goo.svg`, curGoo(), 'image/svg+xml')); } });
  const actions = h('div', { class: 'stack', style: { gap: '6px' } }, h('div', { class: 'row wrap' }, copy, download), h('div', { class: 'row wrap' }, copyGoo, downloadGoo), status);
  const fold = h('details', { class: 'fold' }, h('summary', {}, h('span', { html: ICO.chevron }), 'SVG code of this icon'), h('div', { class: 'fold-body' }, code.el));
  const refresh = () => { if (fold.open) code.set(cur().replace(/></g, '>\n<')); };
  fold.addEventListener('toggle', refresh);
  store.subscribe((s, keys) => { if (keys.some(k => ['sel', 'P', 'edits'].includes(k))) { refresh(); status.textContent = ''; } });
  return { actions, code: fold };
}

export function LibraryExport() {
  const status = h('div', { class: 'status' });
  const say = t => { status.textContent = t; };
  const count = h('div', { class: 'section-desc' });
  const useCode = CodeBlock({ label: 'usage' });
  const mapCode = CodeBlock({ label: 'codepoint map', code: 'Build the font to see the codepoint map.' });
  const results = () => search(store.get().filter);
  const prims = key => primsOf(key, store.get());
  const P = () => store.get().P;
  const sprite = Button({ size: 'sm', icon: ICO.download, label: 'Sprite', title: 'One SVG with a <symbol> per icon', onClick: async () => { const r = results(); say(`Building a sprite of ${fmtInt(r.length)} icons…`); await drawingsFor(P()); await wait(); say(await saveFile(`beetle-glyphs-${fileStem(P())}-sprite.svg`, spriteOf(r, P(), prims), 'image/svg+xml')); } });
  const font = Button({ size: 'sm', icon: ICO.download, label: 'Font .ttf', title: 'A TrueType icon font, icons at U+E000 upward', onClick: async () => {
    const r = results(); const t0 = performance.now(); say(`Building a font of ${fmtInt(r.length)} icons…`);
    /* a font has one colour: a duotone font takes the four-style set's fill drawings */
    const duo = P().weight === 'duotone';
    const fontPrims = key => primsOf(key, store.get(), duo && isDrawn(key) ? 'solid' : undefined);
    try { await drawingsFor(P(), duo ? ['duotone', 'solid'] : [P().weight]); await wait(); const { buf, map } = fontOf(r, P(), fontPrims); const msg = await saveFile(`beetle-glyphs-${fileStem(P())}.ttf`, buf, 'font/ttf'); mapCode.set(map.map(m => `${m.name}\tU+${m.cp.toString(16).toUpperCase()}`).join('\n')); say(`${msg} ${map.length} glyphs, ${(buf.byteLength / 1024).toFixed(0)} KB, ${Math.round(performance.now() - t0)} ms.`); }
    catch (e) { say('Font build failed: ' + e.message); }
  } });
  const json = Button({ variant: 'outline', size: 'sm', icon: ICO.download, label: 'JSON', title: 'Engine primitives and the parameters', onClick: async () => { await drawingsFor(P()); say(await saveFile(`beetle-glyphs-${fileStem(P())}.json`, jsonOf(results(), P(), prims), 'application/json')); } });

  /* with goo: worked out icon by icon, so a large view takes a while; the
     settings are the ones at the click, and one runs at a time */
  const gooButtons = [];
  const withGoo = (label, title, run) => {
    const b = Button({ variant: 'outline', size: 'sm', icon: ICO.download, label, title, onClick: async () => {
      if (gooButtons.some(x => x.disabled)) return;
      gooButtons.forEach(x => { x.disabled = true; });
      const s = store.get(), r = search(s.filter), t0 = performance.now();
      const progress = (n, total) => say(`Adding goo: ${fmtInt(n)} of ${fmtInt(total)} icons…`);
      say(`Adding goo to ${fmtInt(r.length)} icons…`);
      try { await run(r, s, progress); await wait(); status.textContent += ` ${fmtInt(r.length)} icons with goo in ${((performance.now() - t0) / 1000).toFixed(1)} s.`; }
      catch (e) { say(`${label} failed: ${e.message}`); }
      gooButtons.forEach(x => { x.disabled = false; });
    } });
    gooButtons.push(b);
    return b;
  };
  const gooSprite = withGoo('Sprite with goo', 'The sprite with goo: every symbol paths alone', async (r, s, progress) => {
    await drawingsFor(s.P); await wait();
    say(await saveFile(`beetle-glyphs-${fileStem(s.P)}-goo-sprite.svg`, await gooSpriteOf(r, s.P, key => primsOf(key, s), progress), 'image/svg+xml'));
  });
  const gooFont = withGoo('Font with goo', 'The icon font with goo, as its own family: Beetle Glyphs Goo', async (r, s, progress) => {
    const duo = s.P.weight === 'duotone';
    await drawingsFor(s.P, duo ? ['duotone', 'solid'] : [s.P.weight]); await wait();
    const { buf, map } = await gooFontOf(r, s.P, key => primsOf(key, s, duo && isDrawn(key) ? 'solid' : undefined), progress);
    say(`${await saveFile(`beetle-glyphs-${fileStem(s.P)}-goo.ttf`, buf, 'font/ttf')} ${map.length} glyphs, ${(buf.byteLength / 1024).toFixed(0)} KB.`);
    mapCode.set(map.map(m => `${m.name}\tU+${m.cp.toString(16).toUpperCase()}`).join('\n'));
  });
  const gooJson = withGoo('JSON with goo', 'Each icon as its layers of path data with goo, and the parameters', async (r, s, progress) => {
    await drawingsFor(s.P); await wait();
    say(await saveFile(`beetle-glyphs-${fileStem(s.P)}-goo.json`, await gooJsonOf(r, s.P, key => primsOf(key, s), progress), 'application/json'));
  });

  const el = h('div', { class: 'stack', style: { gap: '10px' } },
    count,
    h('div', { class: 'row wrap' }, sprite, font, json),
    h('div', { class: 'row wrap' }, gooSprite, gooFont, gooJson),
    status,
    h('details', { class: 'fold' }, h('summary', {}, h('span', { html: ICO.chevron }), 'How to use a sprite or the font'), h('div', { class: 'fold-body stack' }, useCode.el, mapCode.el)));
  const refresh = () => { const s = store.get(); const r = results(); const where = { all: 'all icons', scenarios: 'the app scenarios', beetle: 'the app glyphs', core: 'the core set', four: 'the four-style set' }[s.filter.set] || 'the current view'; count.textContent = `${fmtInt(r.length)} icons in the current view (${where}${s.filter.q ? `, matching “${s.filter.q}”` : ''}${s.filter.cat && s.filter.cat !== 'all' ? `, ${s.filter.cat.replace(/-/g, ' ')}` : ''}), in ${(STYLE_LABEL[s.P.weight] || s.P.weight).toLowerCase()}${s.P.corners === 'sharp' ? ', sharp' : ''}, at the current parameters. Fonts have one colour: two-tone exports its line and duotone its fill. Goo is worked out icon by icon, so with goo a large view takes a while.`; useCode.set(usageSnippet(s.sel, s.P)); };
  store.subscribe((s, keys) => { if (keys.some(k => ['filter', 'P', 'ready', 'sel'].includes(k))) refresh(); });
  return { el, refresh };
}
