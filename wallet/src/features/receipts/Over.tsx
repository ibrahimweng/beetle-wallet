/* A receipt by its address, opened in place over whatever it came from
   (Round 13, the owner's word: every transaction the way the MTN data line
   opens on Activities). The stack keeps the page it came from under it
   (app/(app)/_layout.tsx), the frost grows over that page, and the line
   sits a little above the middle with its facts coming in under it, Share
   receipt and Set it up at the end: the same view as a line opened on
   Activities (activities/InPlace.tsx).

   Right after paying (`paid=1`) the page under it is the one paid from, so
   closing the receipt goes back past that page too, to where the payment
   started. Opened from anywhere else, closing it goes back one. A line the
   day does not have yet (it is being written) waits a moment for it. */
import React from 'react';
import { useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { frame } from '../../design';
import { naira, signed } from '../../lib/format';
import { activityAmount, detailOf } from '../activities/rows';
import { InPlace, type Opened } from '../activities/InPlace';
import { useLine } from '../transfers/use';

/** Where the line sits: a little above the middle, so what comes in under it is near the thumb. */
const LINE_AT = 0.42;

export function ReceiptOver({ id }: { id: string }) {
  const router = useRouter();
  const asked = useLocalSearchParams<{ paid?: string; share?: string }>();
  const { width: W, height: H } = useWindowDimensions();
  const { ok, ready, row } = useLine(id);
  if (!ok || !ready || !row) return null;
  const line: Opened = {
    id,
    glyph: row.icon,
    name: row.name,
    detail: detailOf(row),
    amount: activityAmount(row, signed, naira),
    at: { x: frame.sidePad, y: Math.round(H * LINE_AT), w: W - frame.sidePad * 2, h: 72 },
    state: row.status === 'done' ? undefined : row.status,
  };
  const close = () => {
    if (asked.paid === '1' && router.canDismiss()) router.dismiss(2);
    else if (router.canGoBack()) router.back();
    else router.replace('/home');
  };
  return <InPlace line={line} onClose={close} share={asked.share === '1'} stay />;
}
