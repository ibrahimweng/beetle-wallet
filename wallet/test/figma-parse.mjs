/* The frame's numbers, read off the file's own layer listing.

   test/figma/<key>.xml is what Figma reports for a frame: every layer with
   its name, its size, and where it sits inside its parent. This turns that
   into a flat list with each layer's place measured from one corner — the
   frame's own, or the corner of any layer named as the root — so a screen
   can be held to it. Text layers are named by their words, cut at thirty
   characters, which is enough to find the same words on the screen. */
import { readFileSync } from 'fs';

const TAG = /<(\/?)([\w-]+)((?:\s+[\w-]+="[^"]*")*)\s*(\/?)>/g;
const ATTR = /([\w-]+)="([^"]*)"/g;

export function parseFrame(xml, rootId) {
  const nodes = [];
  const stack = [];
  let rooted = !rootId;
  let rootDepth = -1;
  let m;
  while ((m = TAG.exec(xml))) {
    const [, closing, type, attrText, selfClosing] = m;
    if (closing) {
      const gone = stack.pop();
      if (gone && gone.isRoot) rooted = false;
      continue;
    }
    const attrs = {};
    let a;
    while ((a = ATTR.exec(attrText))) attrs[a[1]] = a[2];
    const parent = stack[stack.length - 1];
    const x = (parent ? parent.x : 0) + Number(attrs.x ?? 0);
    const y = (parent ? parent.y : 0) + Number(attrs.y ?? 0);
    const node = { id: attrs.id, name: attrs.name ?? '', type, x, y, w: Number(attrs.width ?? 0), h: Number(attrs.height ?? 0), isRoot: false };
    if (!rooted && attrs.id === rootId) {
      rooted = true;
      node.isRoot = true;
      rootDepth = stack.length;
    }
    if (rooted) nodes.push(node);
    if (!selfClosing) stack.push(node);
  }
  /* measured from the root's own corner */
  const root = nodes.find(n => n.isRoot) ?? nodes[0];
  if (!root) throw new Error(`no layers found${rootId ? ` under ${rootId}` : ''}`);
  const out = nodes.map(n => ({ ...n, x: n.x - root.x, y: n.y - root.y }));
  void rootDepth;
  return { width: root.w, height: root.h, nodes: out };
}

export function loadFrame(path, rootId) {
  return parseFrame(readFileSync(path, 'utf8'), rootId);
}

/** The layer called `name`, the nth of that name, optionally under a
    container: the layer called `within`, the withinNth of that name. */
export function find(frame, name, nth = 0, within, withinNth = 0) {
  let scope = frame.nodes;
  if (within) {
    const box = frame.nodes.filter(n => n.name === within)[withinNth];
    if (!box) return null;
    /* a frame's text can run a pixel or two past the box it sits in */
    scope = frame.nodes.filter(n => n !== box && n.x >= box.x - 2 && n.y >= box.y - 2 && n.x + n.w <= box.x + box.w + 2 && n.y + n.h <= box.y + box.h + 2);
  }
  const hits = scope.filter(n => n.name === name);
  return hits[nth] ?? null;
}

/** Every text layer's words, as the file cut them. */
export const words = frame =>
  frame.nodes
    .filter(n => n.type === 'text')
    .map(n => n.name.trim())
    .filter(Boolean);
