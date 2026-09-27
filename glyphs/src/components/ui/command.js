import { h, ICO, clear } from '../../lib/utils.js';

/* CommandPalette({ search: q => [{ key, label, meta, icon }], onPick }) -> { open, close, toggle }
   A search dialog with keyboard navigation: arrows move, Enter picks, Escape closes. */
export function CommandPalette({ search, onPick, placeholder = 'Search icons…' }) {
  let overlay = null, input = null, list = null, items = [], cursor = 0;
  const render = () => {
    clear(list); cursor = 0;
    items = search(input.value);
    if (!items.length) { list.append(h('div', { class: 'cmd-empty' }, 'No icon matches that.')); return; }
    list.append(h('div', { class: 'cmd-group' }, input.value.trim() ? 'Icons' : 'App scenarios'));
    items.forEach((it, i) => list.append(h('div', { class: 'cmd-item', role: 'option', 'data-i': i, 'aria-selected': i === 0 ? 'true' : 'false', onClick: () => pick(i), html: (it.icon || '') }, h('span', { class: 'truncate' }, it.label), it.meta ? h('span', { class: 'meta' }, it.meta) : null)));
  };
  const move = d => { const n = list.querySelectorAll('.cmd-item'); if (!n.length) return; n[cursor].setAttribute('aria-selected', 'false'); cursor = (cursor + d + n.length) % n.length; n[cursor].setAttribute('aria-selected', 'true'); n[cursor].scrollIntoView({ block: 'nearest' }); };
  const pick = i => { const it = items[i]; close(); if (it) onPick(it); };
  const onKey = ev => {
    if (ev.key === 'Escape') { ev.preventDefault(); close(); }
    else if (ev.key === 'ArrowDown') { ev.preventDefault(); move(1); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); move(-1); }
    else if (ev.key === 'Enter') { ev.preventDefault(); pick(cursor); }
  };
  function open() {
    if (overlay) return;
    input = h('input', { type: 'text', placeholder, 'aria-label': placeholder, autocomplete: 'off', spellcheck: 'false' });
    list = h('div', { class: 'cmd-list', role: 'listbox' });
    overlay = h('div', { class: 'cmd-overlay', onClick: ev => { if (ev.target === overlay) close(); } },
      h('div', { class: 'cmd', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Search icons' }, h('div', { class: 'cmd-input', html: ICO.search }, input), list));
    document.body.append(overlay);
    input.addEventListener('input', render);
    document.addEventListener('keydown', onKey);
    render(); input.focus();
  }
  function close() { if (!overlay) return; overlay.remove(); overlay = null; document.removeEventListener('keydown', onKey); }
  return { open, close, toggle: () => (overlay ? close() : open()) };
}
