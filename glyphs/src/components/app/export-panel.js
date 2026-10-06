/* Exports. IconExport: the selected icon as SVG, in the weight being edited.
   LibraryExport: the icons in the current view as a sprite, a font or JSON. */
import { h, ICO, fmtInt } from '../../lib/utils.js';
import { Button } from '../ui/button.js';
import { CodeBlock } from '../ui/code-block.js';
import { store } from '../../lib/store.js';
import { primsOf, search, exportName } from '../../lib/library.js';
import { saveFile, copyText, iconSVG, spriteOf, fontOf, jsonOf, usageSnippet } from '../../lib/export.js';

const wait = () => new Promise(r => setTimeout(r, 30));

export function IconExport() {
  const status = h('div', { class: 'status' });
  const say = t => { status.textContent = t; };
  const code = CodeBlock({ label: 'SVG' });
  const cur = () => { const s = store.get(); return iconSVG(s.sel, primsOf(s.sel, s), s.P); };
  const copy = Button({ size: 'sm', icon: ICO.copy, label: 'Copy SVG', onClick: async () => say((await copyText(cur())) ? 'SVG copied.' : 'Select the code below and copy it.') });
  const download = Button({ variant: 'outline', size: 'sm', icon: ICO.download, label: 'Download', onClick: async () => { const s = store.get(); say(await saveFile(`${exportName(s.sel)}-${s.P.weight}.svg`, cur(), 'image/svg+xml')); } });
  const actions = h('div', { class: 'stack', style: { gap: '6px' } }, h('div', { class: 'row wrap' }, copy, download), status);
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
  const sprite = Button({ size: 'sm', icon: ICO.download, label: 'Sprite', title: 'One SVG with a <symbol> per icon', onClick: async () => { const r = results(); say(`Building a sprite of ${fmtInt(r.length)} icons…`); await wait(); say(await saveFile(`beetle-glyphs-${P().weight}-sprite.svg`, spriteOf(r, P(), prims), 'image/svg+xml')); } });
  const font = Button({ size: 'sm', icon: ICO.download, label: 'Font .ttf', title: 'A TrueType icon font, icons at U+E000 upward', onClick: async () => {
    const r = results(); const t0 = performance.now(); say(`Building a font of ${fmtInt(r.length)} icons…`); await wait();
    try { const { buf, map } = fontOf(r, P(), prims); const msg = await saveFile(`beetle-glyphs-${P().weight}.ttf`, buf, 'font/ttf'); mapCode.set(map.map(m => `${m.name}\tU+${m.cp.toString(16).toUpperCase()}`).join('\n')); say(`${msg} ${map.length} glyphs, ${(buf.byteLength / 1024).toFixed(0)} KB, ${Math.round(performance.now() - t0)} ms.`); }
    catch (e) { say('Font build failed: ' + e.message); }
  } });
  const json = Button({ variant: 'outline', size: 'sm', icon: ICO.download, label: 'JSON', title: 'Engine primitives and the parameters', onClick: async () => say(await saveFile('beetle-glyphs.json', jsonOf(results(), P(), prims), 'application/json')) });
  const el = h('div', { class: 'stack', style: { gap: '10px' } },
    count,
    h('div', { class: 'row wrap' }, sprite, font, json),
    status,
    h('details', { class: 'fold' }, h('summary', {}, h('span', { html: ICO.chevron }), 'How to use a sprite or the font'), h('div', { class: 'fold-body stack' }, useCode.el, mapCode.el)));
  const refresh = () => { const s = store.get(); const r = results(); const where = { all: 'all icons', scenarios: 'the app scenarios', beetle: 'the app glyphs', core: 'the core set' }[s.filter.set] || 'the current view'; count.textContent = `${fmtInt(r.length)} icons in the current view (${where}${s.filter.q ? `, matching “${s.filter.q}”` : ''}${s.filter.cat && s.filter.cat !== 'all' ? `, ${s.filter.cat.replace(/-/g, ' ')}` : ''}), in the ${s.P.weight} weight at the current parameters.`; useCode.set(usageSnippet(s.sel, s.P.weight)); };
  store.subscribe((s, keys) => { if (keys.some(k => ['filter', 'P', 'ready', 'sel'].includes(k))) refresh(); });
  return { el, refresh };
}
