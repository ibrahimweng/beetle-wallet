/* A receipt by its address: the receipt sheet (ReceiptSheet), up over
   whatever it came from (Round 19, the owner's word; from Round 13 to Round
   18 it was a line opened in place over the page). The stack keeps the page
   it came from under it (app/(app)/_layout.tsx); the sheet brings its own
   blur over that page.

   Right after paying (`paid=1`) the page under it is the one paid from, so
   Done goes back past that page too, to where the payment started. Opened
   from anywhere else, Done goes back one. See in Activities goes to the
   record from wherever it is. A line the day does not have yet (it is being
   written) waits a moment for it. */
import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ReceiptSheet } from './ReceiptSheet';

export function ReceiptOver({ id }: { id: string }) {
  const router = useRouter();
  const asked = useLocalSearchParams<{ paid?: string; share?: string }>();
  const close = () => {
    if (asked.paid === '1' && router.canDismiss()) router.dismiss(2);
    else if (router.canGoBack()) router.back();
    else router.replace('/home');
  };
  return <ReceiptSheet id={id} onDone={close} share={asked.share === '1'} />;
}
