/* The virtual cards, kept on this phone per account and shared: the card
   page, home's Card tile and a dispute that freezes them all hold the same
   list, so a card made or frozen on one is so on the others at once. Until
   something changes nothing is written, and the list is what the account
   starts with (see seedCards). */
import { useCallback, useEffect, useState } from 'react';
import { storage } from '../../services';
import { onForget } from '../../lib/forget';
import { seedCards, type VirtualCard } from './card';

export const cardsKey = (account: string) => `beetle.cards.${account}.v1`;

const kept = new Map<string, VirtualCard[] | null>();
onForget(account => kept.delete(account));
const listeners = new Set<(account: string) => void>();

/** The list as this phone last had it, forgotten: the lab starts a place afresh. */
export function forgetCards(account: string) {
  kept.delete(account);
}

export function useCards(account: string | undefined, demo: boolean) {
  const [list, setList] = useState<VirtualCard[] | null>(() => (account ? (kept.get(account) ?? null) : null));
  const [ready, setReady] = useState(() => !!account && kept.has(account));
  useEffect(() => {
    if (!account) return;
    let live = true;
    const listen = (a: string) => {
      if (a === account && live) setList(kept.get(a) ?? null);
    };
    listeners.add(listen);
    if (kept.has(account)) {
      setList(kept.get(account) ?? null);
      setReady(true);
    } else {
      void storage.get<VirtualCard[]>(cardsKey(account)).then(stored => {
        if (!live) return;
        if (!kept.has(account)) kept.set(account, stored ?? null);
        setList(kept.get(account) ?? null);
        setReady(true);
      });
    }
    return () => {
      live = false;
      listeners.delete(listen);
    };
  }, [account]);

  const cards = list ?? seedCards(demo);
  const keep = useCallback(
    (next: VirtualCard[]) => {
      if (!account) return;
      kept.set(account, next);
      void storage.set(cardsKey(account), next);
      listeners.forEach(l => l(account));
    },
    [account],
  );
  const now = () => (account && kept.get(account)) || seedCards(demo);
  const add = (card: VirtualCard) => keep([...now(), card]);
  const update = (id: string, change: Partial<VirtualCard>) => keep(now().map(c => (c.id === id ? { ...c, ...change } : c)));
  const remove = (id: string) => keep(now().filter(c => c.id !== id));
  /** a card reported as not the owner's doing: every card stops at once */
  const freezeAll = () => keep(now().map(c => ({ ...c, frozen: true })));
  return { cards, ready, add, update, remove, freezeAll };
}
