/* A small stand-in for Figma's plugin API, enough to run code.js outside
   Figma. It keeps a tree of layers and records every call that matters, so a
   test can read what the plugin did. It runs in Node and in a browser page. */
export function makeFigma({ command = '', storage = {}, noId = false } = {}) {
  let ids = 0;
  const calls = [];
  const log = (name, detail) => calls.push({ name, ...detail });
  const handlers = {};
  const byId = new Map();

  class Node {
    constructor(type, props = {}) {
      this.id = '1:' + (++ids); this.type = type; this.name = type.toLowerCase(); this.parent = null;
      this.x = 0; this.y = 0; this.width = 100; this.height = 100;
      this.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
      this._data = {}; this.relaunch = null; this.removed = false;
      if (type !== 'VECTOR') this.children = [];
      Object.assign(this, props);
      byId.set(this.id, this);
    }
    appendChild(n) { return this.insertChild(this.children.length, n); }
    insertChild(i, n) {
      if (n.parent) { const at = n.parent.children.indexOf(n); n.parent.children.splice(at, 1); if (n.parent === this && at < i) i--; }
      this.children.splice(Math.min(i, this.children.length), 0, n); n.parent = this; return n;
    }
    remove() { if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); this.parent = null; this.removed = true; byId.delete(this.id); }
    rescale(s) { log('rescale', { id: this.id, scale: s }); this._scale(s); }
    _scale(s) { this.width *= s; this.height *= s; if (this.strokeWeight) this.strokeWeight *= s; for (const c of this.children || []) { c.x *= s; c.y *= s; c._scale(s); } }
    resize(w, h) { this.width = w; this.height = h; }
    getPluginData(k) { return this._data[k] || ''; }
    setPluginData(k, v) { log('setPluginData', { id: this.id, key: k }); this._data[k] = v; }
    setRelaunchData(d) { this.relaunch = d; log('setRelaunchData', { id: this.id, data: d }); }
    findAll(fn) { const out = []; const walk = n => { for (const c of n.children || []) { if (!fn || fn(c)) out.push(c); walk(c); } }; walk(this); return out; }
    findAllWithCriteria(c) { return this.findAll(n => (!c.types || c.types.includes(n.type)) && (!c.pluginData || c.pluginData.keys.every(k => n._data[k]))); }
    get remote() { return false; }
    /* instances */
    async getMainComponentAsync() { return this.main || null; }
    swapComponent(c) { log('swapComponent', { id: this.id, to: c.id }); this.main = c; }
    createInstance() { const i = new Node('INSTANCE', { width: this.width, height: this.height, main: this }); return i; }
  }

  const page = new Node('PAGE', { name: 'Page 1', selection: [] });
  const doc = new Node('DOCUMENT'); doc.children.push(page); page.parent = doc;

  const ui = {
    sent: [],
    onmessage: null,
    postMessage(msg) { ui.sent.push(msg); if (ui.toPanel) ui.toPanel(msg); },
    toPanel: null,
  };

  const figma = {
    command,
    calls, byId,
    root: doc, currentPage: page,
    viewport: { center: { x: 500, y: 300 }, scrollAndZoomIntoView(nodes) { log('scrollAndZoomIntoView', { ids: nodes.map(n => n.id) }); } },
    ui,
    clientStorage: {
      data: storage,
      /* as Figma does for a plugin that has no ID yet, which is every copy before its first publish */
      async getAsync(k) { if (noId) throw new Error(`Failed to get client storage key "${k}": Error: Cannot access client storage without a plugin ID`); return storage[k]; },
      async setAsync(k, v) { if (noId) throw new Error(`Failed to set client storage key "${k}": Error: Cannot access client storage without a plugin ID`); log('clientStorage.setAsync', { key: k }); storage[k] = JSON.parse(JSON.stringify(v)); },
    },
    showUI(html, opts) { log('showUI', { opts, html: typeof html === 'string' ? html.length : 0 }); },
    closePlugin(msg) { log('closePlugin', { msg }); figma.closed = true; },
    notify(text, opts) { log('notify', { text, error: !!(opts && opts.error) }); return { cancel() {} }; },
    on(ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); },
    emit(ev, arg) { let r; for (const fn of handlers[ev] || []) r = fn(arg); return r; },
    async getNodeByIdAsync(id) { return byId.get(id) || null; },
    createNodeFromSvg(svg) {
      log('createNodeFromSvg', { svg });
      if (!/^<svg[\s\S]*<\/svg>$/.test(svg)) throw new Error('not an SVG');
      const f = new Node('FRAME', { width: 24, height: 24, name: 'svg' });
      for (const m of svg.matchAll(/<path\b[^>]*>/g)) {
        const sw = /stroke-width="([\d.]+)"/.exec(m[0]);
        f.appendChild(new Node('VECTOR', { width: 20, height: 20, x: 2, y: 2, svg: m[0], strokeWeight: sw ? +sw[1] : 0 }));
      }
      page.appendChild(f);
      return f;
    },
    createFrame() { log('createFrame', {}); const f = new Node('FRAME'); page.appendChild(f); return f; },
    createComponentFromNode(n) {
      log('createComponentFromNode', { id: n.id });
      const c = new Node('COMPONENT', { width: n.width, height: n.height, x: n.x, y: n.y, name: n.name, fills: n.fills });
      const parent = n.parent || page; const at = parent.children.indexOf(n);
      for (const k of n.children.slice()) c.appendChild(k);
      parent.insertChild(at < 0 ? parent.children.length : at, c); n.remove();
      return c;
    },
    combineAsVariants(comps, parent) {
      log('combineAsVariants', { names: comps.map(c => c.name) });
      if (!comps.length || comps.some(c => c.type !== 'COMPONENT')) throw new Error('combineAsVariants needs components');
      const set = new Node('COMPONENT_SET');
      parent.appendChild(set);
      for (const c of comps) set.appendChild(c);
      return set;
    },
    /* test helpers */
    Node,
    select(nodes) { page.selection = nodes; figma.emit('selectionchange'); },
    message(msg) { return ui.onmessage(msg, { origin: null }); },
  };
  return figma;
}
