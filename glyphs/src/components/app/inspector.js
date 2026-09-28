/* The inspector: everything on the right is about one thing at a time. The
   scope switch at the top says which: this icon, or the whole library.

   This icon: name and tags, the weight switch made of the icon's own two
   previews (the one you edit is the one the grid shows), the icon on paper and
   on ink at three sizes, copy and download, the point editor, the parts list,
   and the SVG code. Whole library: the six parameters every icon is derived
   from, presets, the weight the grid shows, the preview surface, and the
   sprite, font and JSON exports of the current view. */
import * as E from '../../lib/engine.js';
import { h, ICO, fmtInt } from '../../lib/utils.js';
import { Badge } from '../ui/badge.js';
import { Button } from '../ui/button.js';
import { store } from '../../lib/store.js';
import { lib, primsOf, hasOwnSolid } from '../../lib/library.js';
import { Editor } from './editor.js';
import { LibraryPanel } from './library-panel.js';
import { IconExport, LibraryExport } from './export-panel.js';

const SCOPES = [['icon', 'This icon'], ['library', 'Whole library']];

function Section({ title, description, actions, content }) {
  return h('section', { class: 'section' },
    h('div', { class: 'section-head' }, h('div', { class: 'stack', style: { gap: '2px' } }, h('div', { class: 'section-title' }, title), description ? h('div', { class: 'section-desc' }, description) : null), actions || null),
    content);
}

export function Inspector() {
  const editor = Editor(), library = LibraryPanel(), iconExport = IconExport(), libExport = LibraryExport();

  /* head: the scope */
  const scopeBtns = SCOPES.map(([v, label]) => h('button', { type: 'button', role: 'tab', 'data-value': v, 'aria-selected': 'false', onClick: () => store.set({ scope: v }) }, label));
  const scope = h('div', { class: 'scope', role: 'tablist', 'aria-label': 'What the inspector edits' }, scopeBtns);
  const scopeDesc = h('div', { class: 'scope-desc' });
  const head = h('div', { class: 'inspector-head' }, scope, scopeDesc);

  /* this icon */
  const name = h('h2', { class: 'icon-name' });
  const meta = h('div', { class: 'row wrap', style: { gap: '6px' } });
  const editedBadge = Badge('Edited', 'default', { hidden: true });
  const cell = w => h('button', { type: 'button', class: 'weight-cell', 'data-value': w, 'aria-pressed': 'false', title: `Show and edit the ${w} weight`, onClick: () => store.set({ P: { ...store.get().P, weight: w } }) }, h('span', { class: 'w-art' }), h('span', { class: 'w-label' }, h('span', { html: w === 'outline' ? ICO.circle : ICO.disc }), w === 'outline' ? 'Outline' : 'Solid'));
  const cells = { outline: cell('outline'), solid: cell('solid') };
  const weightSwitch = h('div', { class: 'weight-switch', role: 'group', 'aria-label': 'Weight' }, cells.outline, cells.solid);
  const editing = h('div', { class: 'section-desc' });
  const previews = h('div', { class: 'previews' });
  const resetBtn = Button({ variant: 'ghost', size: 'xs', icon: ICO.rotate, label: 'Reset icon', title: 'Back to the library version, both weights', onClick: () => editor.reset() });
  const source = h('div', { class: 'section-desc' });
  const iconPane = h('div', { class: 'inspector-body', 'data-scope': 'icon' },
    h('div', { class: 'stack', style: { gap: '6px' } }, h('div', { class: 'row', style: { gap: '8px' } }, name, editedBadge), meta),
    Section({ title: 'Weight', content: h('div', { class: 'stack', style: { gap: '8px' } }, weightSwitch, editing) }),
    Section({ title: 'Preview', description: 'On paper and on ink, at 32, 20 and 16.', content: previews }),
    Section({ title: 'Use it', content: iconExport.actions }),
    Section({ title: 'Points', actions: resetBtn, content: h('div', { class: 'stack', style: { gap: '10px' } }, source, editor.el) }),
    Section({ title: 'Parts', description: 'Click a part to see its points. The role is what it does in the solid weight.', content: editor.partsEl }),
    iconExport.code);

  /* the whole library */
  const libDesc = h('div', { class: 'section-desc' });
  const libPane = h('div', { class: 'inspector-body', 'data-scope': 'library', hidden: true },
    Section({ title: 'Parameters', description: libDesc, content: library.el }),
    Section({ title: 'Export the library', content: libExport.el }));

  const el = h('div', { class: 'inspector-inner' }, head, iconPane, libPane);

  const svgIn = (prims, P, weight, size, uid) => E.svg(prims, P, { size, weight, uid });
  function refresh() {
    const s = store.get(); const e = lib.byKey.get(s.sel); if (!e) return;
    const prims = primsOf(s.sel, s);
    name.textContent = e.label;
    editedBadge.hidden = !editor.isEdited();
    meta.innerHTML = '';
    meta.append(Badge(e.set === 'beetle' ? 'app glyph' : e.set === 'core' ? 'core set' : e.set, 'secondary'));
    if (e.base) meta.append(Badge('uses ' + e.base.replace(':', ' / '), 'outline'));
    for (const a of e.aliases || []) meta.append(Badge('was ' + a, 'outline'));
    for (const t of e.tags.filter(t => t !== e.label).slice(0, 4)) meta.append(Badge(t, 'outline'));
    for (const w of ['outline', 'solid']) { const c = cells[w]; c.setAttribute('aria-pressed', w === s.P.weight ? 'true' : 'false'); c.querySelector('.w-art').innerHTML = svgIn(primsOf(s.sel, s, w), s.P, w, 44, 'w-' + w); }
    const own = hasOwnSolid(s.sel);
    editing.textContent = `You are editing the ${s.P.weight} of ${e.label}. The grid shows every icon in this weight.` + (own ? ' This icon keeps separate edits for each weight.' : '');
    previews.innerHTML = ['paper', 'ink'].map(sf => `<div class="preview-surface" data-surface="${sf}">${[32, 20, 16].map((z, i) => svgIn(prims, s.P, s.P.weight, z, `pv-${sf}-${i}`)).join('')}</div>`).join('');
    source.textContent = editor.isEditedWeight() ? `Your edited ${s.P.weight}. Corner kinds still follow the library parameters.`
      : e.key.startsWith('param:') ? 'Parametric: derived from the library parameters.'
      : own ? (s.P.weight === 'solid' ? 'The designer’s solid.' : e.derived ? 'An outline derived from the designer’s solid.' : 'The designer’s outline.')
      : `The library ${s.P.weight}. Drag a point to make it yours.`;
  }
  function refreshScope() {
    const s = store.get();
    for (const b of scopeBtns) b.setAttribute('aria-selected', b.dataset.value === s.scope ? 'true' : 'false');
    iconPane.hidden = s.scope !== 'icon'; libPane.hidden = s.scope !== 'library';
    const e = lib.byKey.get(s.sel);
    scopeDesc.textContent = s.scope === 'icon' ? `Changes here apply to ${e ? e.label : 'this icon'} only.` : `Changes here apply to all ${fmtInt(lib.sets.all || 0)} icons at once.`;
    libDesc.textContent = `Every icon is re-derived from these six values. They apply to all ${fmtInt(lib.sets.all || 0)} icons.`;
  }
  store.subscribe((s, keys) => { if (keys.some(k => ['sel', 'P', 'edits', 'ready'].includes(k))) refresh(); if (keys.some(k => ['scope', 'sel', 'ready'].includes(k))) refreshScope(); });
  refreshScope();
  return { el, refresh, editor };
}
