/* Export tabs: the selected icon as SVG, and the current results as a sprite,
   an icon font or JSON. */
import { h, ICO } from '../../lib/utils.js';
import { Tabs } from '../ui/tabs.js';
import { Button } from '../ui/button.js';
import { CodeBlock } from '../ui/code-block.js';
import { store } from '../../lib/store.js';
import { primsOf, search, labelOf, fileName } from '../../lib/library.js';
import { saveFile, copyText, iconSVG, spriteOf, fontOf, jsonOf, usageSnippet } from '../../lib/export.js';

export function ExportPanel() {
  const status = h('div', { class: 'status' });
  const say = t => { status.textContent = t; };
  const svgCode = CodeBlock({ label: 'SVG' });
  const useCode = CodeBlock({ label: 'usage' });
  const mapCode = CodeBlock({ label: 'codepoint map' });
  const results = () => search(store.get().filter);
  const prims = key => primsOf(key, store.get());
  const P = () => store.get().P;
  const wait = () => new Promise(r => setTimeout(r, 30));

  const svgTab = h('div', { class: 'stack', style: { gap: '10px' } },
    h('div', { class: 'row wrap' },
      Button({ size: 'sm', icon: ICO.copy, label: 'Copy SVG', onClick: async () => say((await copyText(iconSVG(store.get().sel, prims(store.get().sel), P()))) ? 'SVG copied.' : 'Select the code and copy it.') }),
      Button({ variant: 'outline', size: 'sm', icon: ICO.download, label: 'Download SVG', onClick: async () => say(await saveFile(`${fileName(store.get().sel)}-${P().weight}.svg`, iconSVG(store.get().sel, prims(store.get().sel), P()), 'image/svg+xml')) })),
    svgCode.el);
  const spriteTab = h('div', { class: 'stack', style: { gap: '10px' } },
    h('p', { class: 'text-sm text-muted' }, 'One SVG with a <symbol> per icon in the current results, at the current settings. Reference a symbol with <use href="sprite.svg#name">.'),
    h('div', { class: 'row wrap' }, Button({ size: 'sm', icon: ICO.download, label: 'Download sprite', onClick: async () => { const r = results(); say(`Building a sprite of ${r.length} icons…`); await wait(); say(await saveFile(`beetle-glyphs-${P().weight}-sprite.svg`, spriteOf(r, P(), prims), 'image/svg+xml')); } })),
    useCode.el);
  const fontTab = h('div', { class: 'stack', style: { gap: '10px' } },
    h('p', { class: 'text-sm text-muted' }, 'A TrueType font of the current results. Every primitive is flattened, offset by half a stroke with round joins and caps, unioned and cut. Icons map to U+E000 upward in result order.'),
    h('div', { class: 'row wrap' }, Button({ size: 'sm', icon: ICO.download, label: 'Download .ttf', onClick: async () => {
      const r = results(); const t0 = performance.now(); say(`Building a font of ${r.length} icons…`); await wait();
      try { const { buf, map } = fontOf(r, P(), prims); const msg = await saveFile(`beetle-glyphs-${P().weight}.ttf`, buf, 'font/ttf'); mapCode.set(map.map(m => `${m.name}\tU+${m.cp.toString(16).toUpperCase()}`).join('\n')); say(`${msg} ${map.length} glyphs, ${(buf.byteLength / 1024).toFixed(0)} KB, ${Math.round(performance.now() - t0)} ms.`); }
      catch (e) { say('Font build failed: ' + e.message); }
    } })),
    mapCode.el);
  const jsonTab = h('div', { class: 'stack', style: { gap: '10px' } },
    h('p', { class: 'text-sm text-muted' }, 'The current results as engine primitives with the parameters, for another tool or a later import.'),
    h('div', { class: 'row wrap' }, Button({ size: 'sm', icon: ICO.download, label: 'Download JSON', onClick: async () => say(await saveFile('beetle-glyphs.json', jsonOf(results(), P(), prims), 'application/json')) })));
  const tabs = Tabs({ value: 'svg', tabs: [{ value: 'svg', label: 'SVG', content: svgTab }, { value: 'sprite', label: 'Sprite', content: spriteTab }, { value: 'font', label: 'Font', content: fontTab }, { value: 'json', label: 'JSON', content: jsonTab }] });
  const el = h('div', { class: 'stack', style: { gap: '10px' } }, tabs.el, status);
  const refresh = () => { const s = store.get(); svgCode.set(iconSVG(s.sel, prims(s.sel), s.P).replace(/></g, '>\n<')); useCode.set(usageSnippet(s.sel, s.P.weight)); mapCode.set(mapCode.el.querySelector('pre').textContent || 'Build the font to see the codepoint map.'); };
  store.subscribe((s, keys) => { if (keys.some(k => ['sel', 'P', 'edits'].includes(k))) refresh(); });
  refresh();
  return { el, say };
}
