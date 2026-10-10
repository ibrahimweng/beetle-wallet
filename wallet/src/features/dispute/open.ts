/* Opening a dispute on a line, from What went wrong? or Asking for it back:
   one is made and kept, the card is frozen first where the payment was not
   yours, a chat from Beetle carries its card, and the page opens. A line
   that already has one opens it instead. */
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import type { LedgerRow } from '../home/account';
import { clock, useChats } from '../agent/chats';
import { turn } from '../agent/turns';
import { useCards } from '../settings/cards';
import { naira } from '../../lib/format';
import { DAYS, newDispute, type DisputeKind } from './dispute';
import { useDisputes } from './store';

export function useOpenDispute(account: string | undefined, demo: boolean) {
  const router = useRouter();
  const { disputes, add } = useDisputes(account, demo);
  const { file } = useChats(account, demo);
  const { freezeAll } = useCards(account, demo);
  return useCallback(
    (row: LedgerRow, kind: DisputeKind) => {
      const have = disputes.find(d => d.rowId === row.id);
      if (have) {
        router.push(`/dispute/${have.id}`);
        return;
      }
      const d = newDispute(row, kind);
      add(d);
      /* not the owner's doing: every card stops at once (Round 37: there can be more than one) */
      if (kind === 'fraud') freezeAll();
      const at = clock();
      const words =
        kind === 'fraud'
          ? `Your card is frozen, and I have filed the ${naira(d.amount)} to ${d.name} with ${d.bank} as not yours. I check every morning and tell you the day it moves; their answer is due by ${d.decisionBy}.`
          : kind === 'recall'
            ? `${d.name} has been asked to approve the return of the ${naira(d.amount)}, and ${d.bank} has it on file. I check every morning and tell you the day it moves; their answer is due by ${d.decisionBy}.`
            : `I have filed the ${naira(d.amount)} to ${d.name} with ${d.bank}. I check every morning and tell you the day it moves; their answer is due by ${d.decisionBy}.`;
      file({
        id: `dispute-${d.id}`,
        startedBy: 'beetle',
        title: `Your dispute, day 1 of ${DAYS}`,
        detail: `${naira(d.amount)} to ${d.name} · filed with ${d.bank}`,
        time: at,
        day: 'today',
        turns: [turn.say(words), turn.receipt({ rowId: row.id, amount: naira(d.amount), line: `Your dispute, day 1 of ${DAYS}`, status: 'Filed', time: at, to: `/dispute/${d.id}`, kind: 'request' })],
        pending: null,
        unread: true,
      });
      router.push(`/dispute/${d.id}`);
    },
    [disputes, add, file, freezeAll, router],
  );
}
