/* The chats: every conversation, whoever started it. One you start is filed
   when the card closes; one Beetle starts is there already, waiting, and is
   how it prompts you when something needs handling. They live in the day
   with everything else, and under their own chip. A chat carries on for an
   hour from its last message: a pull down within the hour picks it up, and
   after that the next pull down starts a new one. Every screen holding the
   list sees a chat the moment any of them files it: the Send money page
   files what it sent, and home's day has it. */
import { useCallback, useEffect, useState } from 'react';
import { powerPanel, storage, type Pending } from '../../services';
import { turn, type Turn } from './turns';

export type Chat = {
  id: string;
  startedBy: 'you' | 'beetle';
  title: string;
  /** what it came to, in a few words */
  detail: string;
  /** HH:MM, when it was last touched */
  time: string;
  /** the day it was filed on; one with `lastAt` is aged from that as it is shown */
  day: 'today' | 'yesterday' | 'earlier';
  turns: Turn[];
  pending: Pending;
  /** started by Beetle and not yet opened */
  unread?: boolean;
  /** when it was last touched, for the hour it carries on for */
  lastAt?: number;
  /** a new chat was started after it, so it never carries on */
  ended?: boolean;
};

const key = (account: string) => `beetle.chats.${account}.v1`;

/** The id a new chat is filed under, made as it begins. */
export const newChatId = () => `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/* one list per account, shared by every screen holding it */
const kept = new Map<string, Chat[]>();
const listeners = new Set<(account: string) => void>();

/** The list as this phone last had it, forgotten: the lab starts a place afresh. */
export function forgetChats(account: string) {
  kept.delete(account);
}

export { clock } from '../../lib/clock';

export { HOUR, carriesOn, toCarryOn } from './hour';

/** What Beetle has to say to the demo account this morning, before it is asked. */
export function beetlePrompt(): Chat {
  return {
    id: 'beetle-topup',
    startedBy: 'beetle',
    title: 'Your usual top up',
    detail: 'Ikeja Electric is about due. The last one was ₦8,000.',
    time: '08:05',
    day: 'today',
    turns: [turn.say('You top up Ikeja Electric about every three weeks. The last one was ₦8,000, and it is about due. Here it is, if you want it.'), turn.panel(powerPanel(), 'ready')],
    pending: null,
    unread: true,
  };
}

/** The title a chat gets: what you first asked, or what Beetle opened with. */
export function titleOf(turns: Turn[]): string {
  const yours = turns.find(t => t.who === 'you');
  if (yours && yours.who === 'you') {
    const text = yours.photo && yours.text === 'A photo' ? 'A photo of an account number' : yours.text;
    return text.length > 40 ? text.slice(0, 38).trimEnd() + '…' : text;
  }
  const first = turns.find(t => t.who === 'beetle');
  const text = first && first.who === 'beetle' && first.block.kind === 'say' ? first.block.text : 'A chat';
  return text.length > 40 ? text.slice(0, 38).trimEnd() + '…' : text;
}

/** The line under it: the last thing Beetle said, or a panel's state. */
export function detailOf(turns: Turn[]): string {
  for (let i = turns.length - 1; i >= 0; i--) {
    const t = turns[i]!;
    if (t.who !== 'beetle') continue;
    if (t.block.kind === 'say') return t.block.text.length > 56 ? t.block.text.slice(0, 54).trimEnd() + '…' : t.block.text;
    if (t.block.kind === 'note') return t.block.title;
    if (t.block.kind === 'thought') continue;
    if (t.block.kind === 'receipt') return `${t.block.card.amount} ${t.block.card.line.replace(/^To /, 'to ').replace(/^From /, 'from ')}, ${t.block.card.status.toLowerCase()}`;
    if (t.block.kind === 'ask') return 'state' in t && t.state === 'done' ? `${t.block.ask.title} · filled in` : `${t.block.ask.title}, waiting for you`;
    if (t.block.kind === 'panel' && 'state' in t) {
      const thing = t.block.panel.action?.label ?? t.block.panel.title;
      return t.state === 'done' ? `${thing} · done` : `${thing}, waiting for you`;
    }
  }
  return '';
}

export function useChats(account: string | undefined, demo: boolean) {
  const [chats, setChats] = useState<Chat[]>(() => (account && kept.get(account)) || []);
  const [ready, setReady] = useState(() => !!account && kept.has(account));
  useEffect(() => {
    if (!account) return;
    let live = true;
    const listen = (a: string) => {
      if (a === account && live) setChats(kept.get(a) ?? []);
    };
    listeners.add(listen);
    const have = kept.get(account);
    if (have) {
      setChats(have);
      setReady(true);
    } else {
      storage.get<Chat[]>(key(account)).then(list => {
        if (!live) return;
        if (!kept.has(account)) kept.set(account, list ?? (demo ? [beetlePrompt()] : []));
        setChats(kept.get(account) ?? []);
        setReady(true);
      });
    }
    return () => {
      live = false;
      listeners.delete(listen);
    };
  }, [account, demo]);

  const put = useCallback(
    (next: Chat[]) => {
      if (!account) return;
      kept.set(account, next);
      void storage.set(key(account), next);
      listeners.forEach(l => l(account));
    },
    [account],
  );

  /** A chat filed, or filed again with what was added to it. It goes to the top. */
  const file = useCallback(
    (chat: Chat) => {
      const now = (account && kept.get(account)) || [];
      put([chat, ...now.filter(c => c.id !== chat.id)]);
    },
    [account, put],
  );

  /** A chat already filed, changed: what arrived for it after it was put away. It goes to the top. */
  const change = useCallback(
    (id: string, how: (chat: Chat) => Chat) => {
      const now = (account && kept.get(account)) || [];
      const was = now.find(c => c.id === id);
      if (was) put([how(was), ...now.filter(c => c.id !== id)]);
    },
    [account, put],
  );

  const read = useCallback(
    (id: string) => {
      const now = (account && kept.get(account)) || [];
      if (!now.some(c => c.id === id && c.unread)) return;
      put(now.map(c => (c.id === id ? { ...c, unread: false } : c)));
    },
    [account, put],
  );

  return { chats, ready, file, change, read };
}
