import { h } from '../../lib/utils.js';

/* Card({ title, description, content, class }) */
export function Card({ title, description, content, class: klass } = {}) {
  return h('div', { class: ['card', klass] },
    title || description ? h('div', { class: 'card-header' }, title ? h('div', { class: 'card-title' }, title) : null, description ? h('div', { class: 'card-description' }, description) : null) : null,
    content ? h('div', { class: 'card-content' }, content) : null);
}
export const Separator = () => h('div', { class: 'separator', role: 'separator' });
export const Kbd = text => h('kbd', { class: 'kbd' }, text);
