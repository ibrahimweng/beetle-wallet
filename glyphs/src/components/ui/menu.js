import { h, reducedMotion } from '../../lib/utils.js';

/* Menu({ trigger, content, align, label, onOpen }) -> { el, open, close }. A panel
   that grows out of its trigger: it fades and scales in from just above, and
   fades and shrinks away. Escape, a click outside and choosing an item (any
   element with data-close) close it, and focus goes back to the trigger. */
export function Menu({ trigger, content, align = 'start', label, onOpen, class: klass }) {
  const panel = h('div', { class: ['menu', `menu-${align}`, klass], role: 'dialog', 'aria-label': label, hidden: true }, content);
  const el = h('div', { class: 'menu-wrap' }, trigger, panel);
  trigger.setAttribute('aria-haspopup', 'dialog'); trigger.setAttribute('aria-expanded', 'false');
  let timer = null;
  const onDoc = ev => { if (!el.contains(ev.target)) close(); };
  const onKey = ev => { if (ev.key === 'Escape') { ev.stopPropagation(); close(true); } };
  function open() {
    clearTimeout(timer); onOpen && onOpen();
    panel.hidden = false; panel.dataset.state = 'open'; trigger.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', onDoc, true); document.addEventListener('keydown', onKey, true);
    const first = panel.querySelector('button, input, [tabindex]'); if (first) first.focus({ preventScroll: true });
  }
  function close(refocus) {
    if (panel.hidden || panel.dataset.state === 'closed') return;
    panel.dataset.state = 'closed'; trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', onDoc, true); document.removeEventListener('keydown', onKey, true);
    timer = setTimeout(() => { panel.hidden = true; }, reducedMotion() ? 0 : 100);
    if (refocus) trigger.focus({ preventScroll: true });
  }
  trigger.addEventListener('click', () => (panel.hidden || panel.dataset.state === 'closed' ? open() : close()));
  panel.addEventListener('click', ev => { if (ev.target.closest('[data-close]')) close(true); });
  return { el, open, close };
}
