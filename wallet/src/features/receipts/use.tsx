/* What every receipt needs, wherever it opens: the receipt of a line by its
   id, what a question about it carries to the chat, the ··· for it (Ask
   Beetle about this, and Report a problem, which for a transfer opens What
   went wrong?), and the share sheet with the picture of it. A line on
   Activities opens in place (activities/OpenLine.tsx); a receipt right
   after paying, by its address or from the chat comes up as the receipt
   sheet (ReceiptSheet.tsx, Round 19); there is no receipt page of its own
   (Round 13). */
import { RefObject, useMemo } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { askAbout, askHome } from '../more/More';
import { useApp } from '../onboarding/store';
import { holdingsFor } from '../home/account';
import { balanceOf, useMoves } from '../home/moves';
import { naira } from '../../lib/format';
import { receiptFor, shareLine, type Receipt as ReceiptModel } from './receipts';
import { ShareSheet } from './ShareSheet';
import React from 'react';

/** The receipt of the line with this id, as the day has it now. */
export function useReceipt(id: string) {
  const app = useApp();
  const account = app.session?.account;
  const { moves, ready } = useMoves(account?.accountNumber);
  const receipt = useMemo(() => {
    if (!account || !ready) return null;
    const h = holdingsFor(account);
    const rows = [...moves, ...h.ledger];
    const row = rows.find(r => r.id === id);
    if (!row) return null;
    const balanceNow = h.everyday + balanceOf(moves);
    return receiptFor(row, { account, balanceNow, rows });
  }, [account, ready, moves, id]);
  return { account, ready, receipt };
}

/** What a question about the receipt carries to the chat: the money, who, and when. */
export const aboutOf = (r: ReceiptModel) => `${r.figure ?? naira(r.amount)} ${r.line.replace(/^Sent to /, 'to ')}, ${r.when}`;

/** The ··· for a receipt: Ask Beetle about this — a fresh chat on home, about this one transaction — and Report a problem. */
export function useReceiptMenu(receipt: ReceiptModel, id: string) {
  const router = useRouter();
  return [
    { glyph: 'chat' as const, label: 'Ask Beetle about this', onPress: () => askAbout(router, aboutOf(receipt)) },
    {
      glyph: 'alert' as const,
      label: 'Report a problem',
      onPress: () => (receipt.kind === 'transfer' ? router.push(`/wrong/${id}` as never) : askHome(router, receipt.wrong, `${receipt.figure ?? naira(receipt.amount)} ${receipt.line.toLowerCase()}`)),
    },
  ];
}

/** The share sheet for a receipt, with the picture of `slip`. */
export function ReceiptShare({ receipt, slip, onDismiss }: { receipt: ReceiptModel; slip: RefObject<View | null>; onDismiss: () => void }) {
  return <ShareSheet line={shareLine(receipt)} message={`${shareLine(receipt)}. ${receipt.sessionLabel} ${receipt.session}. Sent with Beetle.`} capture={slip} onDismiss={onDismiss} />;
}
