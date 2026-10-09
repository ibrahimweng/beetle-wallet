/* The goals, kept on this phone per account, and shared: home's Savings card,
   the goal page and the chat's Save card all hold the same list, so a goal
   started on the page is on the card the moment the page goes. Until
   something is changed nothing is written, and the list is what the account
   starts with (see seedGoals). */
import { useCallback, useEffect, useState } from 'react';
import { storage } from '../../services';
import { seedGoals, type Goal } from './goals';
import { onForget } from '../../lib/forget';

export const goalsKey = (account: string) => `beetle.goals.${account}.v1`;

/* one list per account, shared by every screen holding it; null where nothing is kept yet */
const kept = new Map<string, Goal[] | null>();
onForget(account => kept.delete(account));
const listeners = new Set<(account: string) => void>();

/** The list as this phone last had it, forgotten: the lab starts a place afresh. */
export function forgetGoals(account: string) {
  kept.delete(account);
}

export function useGoals(account: string | undefined, { demo, started }: { demo: boolean; started: boolean }) {
  const [list, setList] = useState<Goal[] | null>(() => (account ? (kept.get(account) ?? null) : null));
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
      void storage.get<Goal[]>(goalsKey(account)).then(stored => {
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

  const goals = list ?? seedGoals(demo, started);
  const keep = useCallback(
    (next: Goal[]) => {
      if (!account) return;
      kept.set(account, next);
      void storage.set(goalsKey(account), next);
      listeners.forEach(l => l(account));
    },
    [account],
  );
  const now = () => (account && kept.get(account)) || seedGoals(demo, started);
  const add = (goal: Goal) => keep([...now(), goal]);
  const update = (id: string, change: Partial<Goal>) => keep(now().map(g => (g.id === id ? { ...g, ...change } : g)));
  const remove = (id: string) => keep(now().filter(g => g.id !== id));
  return { goals, ready, add, update, remove };
}

/** The goal the payday slice, round ups and cash back go to, by its name, for the pages that say where they go. */
export function useFedName(account: { accountNumber: string; demo?: boolean } | undefined, started = false): string | null {
  const { goals } = useGoals(account?.accountNumber, { demo: !!account?.demo, started });
  return goals[0]?.name ?? null;
}

/** Holiday, in a line the frames wrote for it, as the first goal's name, or "your goal" where there is none. */
export const fedWords = (text: string, fed: string | null) => (fed ? text.replace(/Holiday/g, fed) : text.replace(/(the|your) Holiday goal/g, 'your goal').replace(/Holiday/g, 'your goal'));
