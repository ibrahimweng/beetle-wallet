import { describe, expect, it } from 'vitest';

import { HOUR, carriesOn, toCarryOn } from '@/features/agent/hour';
import type { Chat } from '@/features/agent/chats';

const chat = (over: Partial<Chat>): Chat => ({
  id: 'c',
  startedBy: 'you',
  title: 'Send 20k to Sarah',
  detail: 'Done.',
  time: '14:22',
  day: 'today',
  turns: [],
  pending: null,
  ...over,
});

describe('a chat carries on for an hour', () => {
  const now = 1_700_000_000_000;

  it('within the hour of its last message, and not after', () => {
    expect(carriesOn(chat({ lastAt: now - 10 * 60 * 1000 }), now)).toBe(true);
    expect(carriesOn(chat({ lastAt: now - HOUR + 1000 }), now)).toBe(true);
    expect(carriesOn(chat({ lastAt: now - HOUR }), now)).toBe(false);
    expect(carriesOn(chat({ lastAt: now - 2 * HOUR }), now)).toBe(false);
  });

  it('never, once a new chat was started after it, or when it was never touched', () => {
    expect(carriesOn(chat({ lastAt: now - 1000, ended: true }), now)).toBe(false);
    expect(carriesOn(chat({}), now)).toBe(false);
  });

  it("never takes the pull down while it is a prompt of Beetle's still unread", () => {
    expect(carriesOn(chat({ startedBy: 'beetle', unread: true, lastAt: now - 1000 }), now)).toBe(false);
    expect(carriesOn(chat({ startedBy: 'beetle', unread: false, lastAt: now - 1000 }), now)).toBe(true);
  });

  it('is the one touched last, whatever order the day keeps them in', () => {
    const older = chat({ id: 'a', lastAt: now - 30 * 60 * 1000 });
    const newer = chat({ id: 'b', lastAt: now - 5 * 60 * 1000 });
    const stale = chat({ id: 'c', lastAt: now - 3 * HOUR });
    expect(toCarryOn([older, newer, stale], now)?.id).toBe('b');
    expect(toCarryOn([newer, older], now)?.id).toBe('b');
    expect(toCarryOn([stale], now)).toBeNull();
    expect(toCarryOn([], now)).toBeNull();
  });
});
