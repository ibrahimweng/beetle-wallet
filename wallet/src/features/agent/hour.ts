/* The hour a chat carries on for. Kept apart from the chats themselves so
   the rule can be held to on its own, without the device the chats live on. */
import type { Chat } from './chats';

/** How long a chat carries on for after its last message. */
export const HOUR = 60 * 60 * 1000;

/** A chat the next pull down should pick up: touched within the hour, not
    ended by a new one, and not a prompt of Beetle's still waiting unread. */
export function carriesOn(chat: Chat, now = Date.now()): boolean {
  if (chat.ended || !chat.lastAt) return false;
  if (chat.startedBy === 'beetle' && chat.unread) return false;
  return now - chat.lastAt < HOUR;
}

/** The chat to carry on with, if any: the one touched last. */
export function toCarryOn(chats: Chat[], now = Date.now()): Chat | null {
  return [...chats].filter(c => carriesOn(c, now)).sort((a, b) => (b.lastAt ?? 0) - (a.lastAt ?? 0))[0] ?? null;
}
