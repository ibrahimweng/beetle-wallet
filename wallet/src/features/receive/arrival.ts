/* Money arriving. A real account service will say when it does; this build
   has a sample arrival the lab and the details pane can set off. Whatever
   the source, an arrival lands in three places: the balance on the card,
   a line in the day, and a chat Beetle starts to say so. */
import type { Move } from '../../services';
import { naira } from '../../lib/format';
import { clock, type Chat } from '../agent/chats';
import { turn } from '../agent/conversation';

export type Arrival = { from: string; bank: string; amount: number; note?: string };

export const SAMPLE_ARRIVAL: Arrival = {
  from: 'Sarah Adeyemi',
  bank: 'GTBank',
  amount: 50_000,
  note: 'Rent, my half',
};

/** The line the day gets. */
export function arrivalMove(a: Arrival, time = clock()): Move {
  return {
    name: a.from,
    detail: `${a.bank} · received · ${time}`,
    amount: a.amount,
    icon: 'bank',
    kind: 'in',
  };
}

/** What Beetle says about it. */
export function arrivalLine(a: Arrival, balanceAfter: number): string {
  const note = a.note ? ` They wrote "${a.note}".` : '';
  return `${naira(a.amount)} just came in from ${a.from} at ${a.bank}.${note} It is in your balance now: ${naira(balanceAfter)}.`;
}

/** The chat Beetle starts about it, waiting in the day. */
export function arrivalChat(a: Arrival, balanceAfter: number, time = clock()): Chat {
  return {
    id: `in-${Date.now().toString(36)}`,
    startedBy: 'beetle',
    title: `${naira(a.amount)} came in`,
    detail: `From ${a.from} at ${a.bank}`,
    time,
    day: 'today',
    turns: [turn.say(arrivalLine(a, balanceAfter))],
    pending: null,
    unread: true,
  };
}
