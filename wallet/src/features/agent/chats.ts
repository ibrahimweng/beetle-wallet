/* The chats: every conversation, whoever started it. One you start is filed
   when the card closes; one Beetle starts is there already, waiting, and is
   how it prompts you when something needs handling. They live in the day
   with everything else, and under their own chip. */
import { useCallback, useEffect, useState } from 'react';
import { powerPanel, storage, type Pending } from '../../services';
import { turn, type Turn } from './conversation';

export type Chat = {
  id: string;
  startedBy: 'you' | 'beetle';
  title: string;
  /** what it came to, in a few words */
  detail: string;
  /** HH:MM, when it was last touched */
  time: string;
  day: 'today' | 'yesterday';
  turns: Turn[];
  pending: Pending;
  /** started by Beetle and not yet opened */
  unread?: boolean;
};

const key = (account: string) => `beetle.chats.${account}.v1`;

export const clock = (d = new Date()) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

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
  if (yours && yours.who === 'you') return yours.text.length > 40 ? yours.text.slice(0, 38).trimEnd() + '…' : yours.text;
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
    if ('state' in t) return `${t.block.panel.title} · ${t.state === 'done' ? 'done' : 'waiting'}`;
  }
  return '';
}

export function useChats(account: string | undefined, demo: boolean) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!account) return;
    let live = true;
    storage.get<Chat[]>(key(account)).then(kept => {
      if (!live) return;
      setChats(kept ?? (demo ? [beetlePrompt()] : []));
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, [account, demo]);

  const put = useCallback(
    (next: Chat[]) => {
      setChats(next);
      if (account) void storage.set(key(account), next);
    },
    [account],
  );

  /** A chat filed, or filed again with what was added to it. It goes to the top. */
  const file = useCallback(
    (chat: Chat) => {
      put([chat, ...chats.filter(c => c.id !== chat.id)]);
    },
    [chats, put],
  );

  const read = useCallback(
    (id: string) => {
      if (!chats.some(c => c.id === id && c.unread)) return;
      put(chats.map(c => (c.id === id ? { ...c, unread: false } : c)));
    },
    [chats, put],
  );

  return { chats, ready, file, read };
}
