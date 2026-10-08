/* The places on home the tour lights, measured where they are on the screen
   when the tour gets to them. Each is a view that carries the place's ref. */
import type { View } from 'react-native';

export type SpotId = 'card' | 'send' | 'receive' | 'activities' | 'ask';
export type Rect = { x: number; y: number; w: number; h: number };

type Measurable = Pick<View, 'measureInWindow'>;
const nodes = new Map<SpotId, Measurable>();
const refs = new Map<SpotId, (node: Measurable | null) => void>();

/** The ref for a place: the same function every time, so the view is not let go and taken back on every draw. */
export function spotRef(id: SpotId) {
  let ref = refs.get(id);
  if (!ref) {
    ref = node => {
      if (node) nodes.set(id, node);
      else nodes.delete(id);
    };
    refs.set(id, ref);
  }
  return ref;
}

/** Where a place is now, or null if it is not on the screen. */
export function measureSpot(id: SpotId): Promise<Rect | null> {
  return new Promise(done => {
    const node = nodes.get(id);
    if (!node) return done(null);
    node.measureInWindow((x, y, w, h) => done(w > 0 && h > 0 ? { x, y, w, h } : null));
  });
}

/** The smallest box round all of them. */
export function around(rects: (Rect | null)[]): Rect | null {
  const all = rects.filter((r): r is Rect => !!r);
  if (!all.length) return null;
  const x = Math.min(...all.map(r => r.x));
  const y = Math.min(...all.map(r => r.y));
  return { x, y, w: Math.max(...all.map(r => r.x + r.w)) - x, h: Math.max(...all.map(r => r.y + r.h)) - y };
}
