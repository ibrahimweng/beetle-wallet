import { h, cn } from '../../lib/utils.js';

/* Button({ variant: 'default' | 'secondary' | 'outline' | 'ghost', size: 'default' | 'sm' | 'xs' | 'icon', icon, label, onClick, ...attrs }) */
export function Button({ variant = 'default', size = 'default', icon, label, onClick, class: klass, ...attrs } = {}) {
  const cls = cn('btn', variant !== 'default' && `btn-${variant}`, size === 'sm' && 'btn-sm', size === 'xs' && 'btn-xs', size === 'icon' && 'btn-icon', size === 'icon-sm' && 'btn-icon btn-sm', klass);
  const el = h('button', { type: 'button', class: cls, onClick, ...attrs });
  if (icon) el.insertAdjacentHTML('beforeend', icon);
  if (label) el.append(document.createTextNode(label));
  return el;
}
