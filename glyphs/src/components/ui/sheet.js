import { h, ICO } from '../../lib/utils.js';
import { Button } from './button.js';

/* openSheet({ side: 'right' | 'left', title, content, onClose }) -> close(). A
   panel that slides over the page with an overlay; Escape and the overlay close
   it. onClose runs once, however it was closed. */
export function openSheet({ side = 'right', title, content, onClose }) {
  const close = () => { if (!panel.isConnected) return; overlay.remove(); panel.remove(); document.removeEventListener('keydown', onKey); if (onClose) onClose(); };
  const onKey = ev => { if (ev.key === 'Escape') close(); };
  const overlay = h('div', { class: 'sheet-overlay', onClick: close });
  const panel = h('aside', { class: ['sheet', `sheet-${side}`], role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('div', { class: 'sheet-head' }, h('div', { class: 'font-semibold' }, title), Button({ variant: 'ghost', size: 'icon-sm', icon: ICO.x, 'aria-label': 'Close', onClick: close })),
    h('div', { class: 'sheet-body' }, content));
  document.body.append(overlay, panel);
  document.addEventListener('keydown', onKey);
  return close;
}
