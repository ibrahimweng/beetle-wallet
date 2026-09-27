/* The top bar: brand, navigation, the search button that opens the command
   palette, the theme toggle and the repository link. */
import { h, ICO, isMac } from '../../lib/utils.js';
import { Button } from '../ui/button.js';
import { Kbd } from '../ui/card.js';
import { store } from '../../lib/store.js';

const MARK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16.9 7.9a6.4 6.4 0 1 1-9.8 0"/><circle cx="12" cy="12" r="2.7"/></svg>';

export function Topbar({ onSearch, onMenu, onInspector, repo }) {
  const theme = Button({ variant: 'ghost', size: 'icon', icon: ICO.sun, 'aria-label': 'Toggle theme', onClick: () => { const order = ['light', 'dark', 'system']; const cur = store.get().theme; store.set({ theme: order[(order.indexOf(cur) + 1) % order.length] }); } });
  const el = h('header', { class: 'topbar' },
    Button({ variant: 'ghost', size: 'icon', icon: ICO.menu, class: 'mobile-only', 'aria-label': 'Open library navigation', onClick: onMenu }),
    h('a', { class: 'brand', href: '#' , onClick: ev => ev.preventDefault() }, h('span', { html: MARK }), 'Beetle Glyphs'),
    h('nav', { class: 'topnav', 'aria-label': 'Sections' },
      h('a', { href: '#library', 'aria-current': 'page' }, 'Library'),
      h('a', { href: '#scenarios', onClick: ev => { ev.preventDefault(); store.set({ filter: { ...store.get().filter, set: 'scenarios', cat: 'all' } }); } }, 'Scenarios'),
      h('a', { href: '#about' }, 'About')),
    h('button', { type: 'button', class: 'search-btn', onClick: onSearch, 'aria-label': 'Search icons', html: ICO.search }, h('span', { class: 'hint' }, 'Search icons…'), Kbd(isMac ? '⌘K' : 'Ctrl K')),
    theme,
    repo ? h('a', { class: 'btn btn-ghost btn-icon', href: repo, target: '_blank', rel: 'noreferrer', 'aria-label': 'Repository', html: ICO.github }) : null,
    Button({ variant: 'outline', size: 'icon', icon: ICO.panel, class: 'mobile-only', 'aria-label': 'Open inspector', onClick: onInspector }));
  const syncTheme = t => { theme.innerHTML = t === 'dark' ? ICO.moon : t === 'light' ? ICO.sun : ICO.laptop; theme.title = `Theme: ${t}`; };
  store.subscribe((s, keys) => { if (keys.includes('theme')) syncTheme(s.theme); });
  syncTheme(store.get().theme);
  return { el };
}
