/* The inspector: the selected icon at four sizes in both weights, then tabs
   for editing, parameters and export. */
import * as E from '../../lib/engine.js';
import { h } from '../../lib/utils.js';
import { Badge } from '../ui/badge.js';
import { Tabs } from '../ui/tabs.js';
import { store } from '../../lib/store.js';
import { lib, primsOf } from '../../lib/library.js';
import { Editor } from './editor.js';
import { Params } from './params.js';
import { ExportPanel } from './export-panel.js';

export function Inspector() {
  const name = h('div', { class: 'font-semibold', style: { fontSize: '16px', lineHeight: '22px' } });
  const meta = h('div', { class: 'row wrap', style: { gap: '6px' } });
  const twins = h('div', { class: 'row', style: { gap: '12px' } });
  const sizes = h('div', { class: 'sizes' });
  const preview = h('div', { class: 'preview' }, twins, sizes);
  const editor = Editor(), params = Params(), exporter = ExportPanel();
  const tabs = Tabs({ value: store.get().tab || 'edit', onChange: v => store.set({ tab: v }), tabs: [
    { value: 'edit', label: 'Edit', content: editor.el },
    { value: 'params', label: 'Parameters', content: params.el },
    { value: 'export', label: 'Export', content: exporter.el },
  ] });
  const el = h('div', { class: 'stack', style: { gap: '12px' } }, h('div', { class: 'stack', style: { gap: '6px' } }, name, meta), preview, tabs.el);
  function refresh() {
    const s = store.get(); const e = lib.byKey.get(s.sel); if (!e) return;
    const prims = primsOf(s.sel, s);
    name.textContent = e.label;
    meta.innerHTML = '';
    meta.append(Badge(e.set, e.set === 'lucide' ? 'secondary' : 'brand'));
    if (e.base) meta.append(Badge(e.base.replace(':', ' / '), 'outline'));
    if (e.makeSolid) meta.append(Badge(e.derived ? 'outline derived' : 'both weights drawn', 'outline'));
    for (const a of e.aliases || []) meta.append(Badge('was ' + a, 'outline'));
    for (const t of e.tags.slice(0, 4)) meta.append(Badge(t, 'outline'));
    twins.innerHTML = E.svg(primsOf(s.sel, s, 'outline'), s.P, { size: 44, weight: 'outline', uid: 'tw1' }) + E.svg(primsOf(s.sel, s, 'solid'), s.P, { size: 44, weight: 'solid', uid: 'tw2' });
    sizes.innerHTML = [32, 24, 16].map((z, i) => E.svg(prims, s.P, { size: z, uid: 'sz' + i })).join('');
  }
  store.subscribe((s, keys) => { if (keys.some(k => ['sel', 'P', 'edits', 'ready'].includes(k))) refresh(); });
  return { el, refresh, editor };
}
