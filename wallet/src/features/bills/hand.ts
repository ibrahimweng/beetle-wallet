/* What is handed to the pages that pay a bill: the meter or the biller's
   account, the figure, and where they came from — the camera reading a
   bill, the keypad handing a figure back, the Bills page opening the page
   for one of its rows. The page takes it the moment it is in front. */
import type { BillReading } from '../../services/reader';
import type { MeterPaid } from '../../services/nigeria';

export type BillDraft = {
  meter?: MeterPaid | null;
  amount?: number;
  /** the biller the page is for, where it is not a meter */
  biller?: string;
  read?: 'photo';
  /** what the camera read, for What I found */
  reading?: BillReading;
  said?: string;
};

let waiting: BillDraft | null = null;

export const billDraft = {
  put(d: BillDraft) {
    waiting = { ...(waiting ?? {}), ...d };
  },
  take(): BillDraft | null {
    const d = waiting;
    waiting = null;
    return d;
  },
};
