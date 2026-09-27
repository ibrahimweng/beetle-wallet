import { h, ICO } from '../../lib/utils.js';
import { Button } from './button.js';
import { copyText } from '../../lib/export.js';

/* CodeBlock({ code, label }) -> { el, set } with a copy button in the corner */
export function CodeBlock({ code = '', label = 'Code' } = {}) {
  const pre = h('pre', {}, code);
  const btn = Button({ variant: 'outline', size: 'icon-sm', icon: ICO.copy, class: 'copy', 'aria-label': `Copy ${label}`, onClick: async () => {
    const ok = await copyText(pre.textContent);
    btn.innerHTML = ok ? ICO.check : ICO.copy;
    if (!ok) { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    setTimeout(() => { btn.innerHTML = ICO.copy; }, 1400);
  } });
  const el = h('div', { class: 'code' }, btn, pre);
  return { el, set: c => { pre.textContent = c; } };
}
