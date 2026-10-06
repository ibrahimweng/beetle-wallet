import { h, ICO, reducedMotion } from '../../lib/utils.js';
import { Button } from './button.js';

/* openSheet({ side: 'right' | 'left' | 'bottom', title, content, onClose }) -> close().
   A panel that slides in over the page with an overlay; Escape, the overlay and
   its close button close it. It slides out before it goes, and onClose runs
   once it has gone, however it was closed. */
const OUT = 260;
export function openSheet({ side = 'right', title, content, onClose }) {
  let closing = false;
  const close = () => {
    if (closing || !panel.isConnected) return;
    closing = true;
    document.removeEventListener('keydown', onKey);
    overlay.dataset.state = panel.dataset.state = 'closed';
    const done = () => { overlay.remove(); panel.remove(); if (onClose) onClose(); };
    if (reducedMotion()) done(); else setTimeout(done, OUT);
  };
  const onKey = ev => { if (ev.key === 'Escape') close(); };
  const overlay = h('div', { class: 'sheet-overlay', 'data-state': 'open', onClick: close });
  const panel = h('aside', { class: ['sheet', `sheet-${side}`], 'data-state': 'open', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('div', { class: 'sheet-head' }, h('div', { class: 'font-semibold' }, title), Button({ variant: 'ghost', size: 'icon-sm', icon: ICO.x, 'aria-label': 'Close', onClick: close })),
    h('div', { class: 'sheet-body' }, content));
  document.body.append(overlay, panel);
  document.addEventListener('keydown', onKey);
  return close;
}
