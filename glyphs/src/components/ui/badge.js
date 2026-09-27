import { h, cn } from '../../lib/utils.js';

/* Badge(text, variant: 'default' | 'secondary' | 'outline' | 'brand') */
export const Badge = (text, variant = 'default', attrs = {}) => h('span', { class: cn('badge', variant !== 'default' && `badge-${variant}`), ...attrs }, text);
