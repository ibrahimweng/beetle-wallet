/* The three pages that sit side by side, Home, Activities and Settings,
   and which one is showing. The pager moves between them, the bar draws
   the one showing in black, and a link from anywhere can turn to one. A
   glyph tapped for the page already showing is heard too: home closes its
   chat on it.
   Also what holds the pages still: something open over them (the chat on
   home, a sheet, a receipt) when a swipe must not turn the page. */
import { useEffect, useRef, useState } from 'react';
import type { useRouter } from 'expo-router';

export type Tab = 'home' | 'activities' | 'settings';
export const TABS: readonly Tab[] = ['home', 'activities', 'settings'];
export const isTab = (s: unknown): s is Tab => typeof s === 'string' && (TABS as readonly string[]).includes(s);

let current: Tab = 'home';
const listeners = new Set<(t: Tab) => void>();
const againListeners = new Set<(t: Tab) => void>();

export const tabs = {
  get: (): Tab => current,
  /** Turn to a page. The pager follows; the bar redraws its glyphs. */
  go(t: Tab) {
    if (t === current) return;
    current = t;
    listeners.forEach(l => l(t));
  },
  /** The glyph of the page already showing, tapped again: home closes its chat. */
  again(t: Tab) {
    if (t !== current) return;
    againListeners.forEach(l => l(t));
  },
};

/** The page showing, kept current. */
export function useTab(): Tab {
  const [t, setT] = useState<Tab>(current);
  useEffect(() => {
    setT(current);
    listeners.add(setT);
    return () => {
      listeners.delete(setT);
    };
  }, []);
  return t;
}

/** What a page does when its glyph is tapped while it is already showing. */
export function useTabAgain(t: Tab, fn: () => void) {
  const latest = useRef(fn);
  latest.current = fn;
  useEffect(() => {
    const l = (x: Tab) => {
      if (x === t) latest.current();
    };
    againListeners.add(l);
    return () => {
      againListeners.delete(l);
    };
  }, [t]);
}

/* ---- what holds the pages still ---- */

const holds = new Set<string>();
const heldListeners = new Set<(on: boolean) => void>();

/** Hold the pages still, or let them go, by who is asking; they move again once nobody holds them. */
export function holdPages(who: string, on: boolean) {
  const before = holds.size > 0;
  if (on) holds.add(who);
  else holds.delete(who);
  const after = holds.size > 0;
  if (before !== after) heldListeners.forEach(l => l(after));
}

export const pagesHeld = () => holds.size > 0;

/** Whether anything holds the pages still. */
export function useHeld(): boolean {
  const [on, setOn] = useState(holds.size > 0);
  useEffect(() => {
    setOn(holds.size > 0);
    heldListeners.add(setOn);
    return () => {
      heldListeners.delete(setOn);
    };
  }, []);
  return on;
}

/** Hold the pages still while `on`, and let them go when this unmounts. */
export function useHoldPages(who: string, on: boolean) {
  useEffect(() => {
    holdPages(who, on);
    return () => holdPages(who, false);
  }, [who, on]);
}

/* ---- where a swipe lands ---- */

/** A swipe settles on the next page past a third of the width or on a flick, on the same page otherwise, never past the ends. */
export function settleOn(from: number, dx: number, vx: number, width: number, count: number = TABS.length): number {
  'worklet';
  let to = from;
  if (dx < -width / 3 || vx < -500) to = from + 1;
  else if (dx > width / 3 || vx > 500) to = from - 1;
  return Math.max(0, Math.min(count - 1, to));
}

type Router = ReturnType<typeof useRouter>;

/** From anywhere: turn to one of the three pages, back on the screen that
    holds them. The pages turn at once; the screens above them go. A screen
    that holds them anew opens on the page asked for. */
export function openTab(router: Router, t: Tab, params: Record<string, string> = {}) {
  tabs.go(t);
  router.dismissTo({ pathname: '/home', params: { ...params, tab: t } });
}
