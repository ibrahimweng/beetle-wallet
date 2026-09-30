/* What is handed to the pages that buy data and airtime: the line, the
   plan or the figure, and where they came from — the camera reading Mum's
   message, the keypad handing a figure back, Services opening the page
   with nothing yet. The page takes it the moment it is in front. */
import type { LinePaid, Plan } from '../../services/nigeria';

export type TopupDraft = {
  line?: LinePaid | null;
  plan?: Plan | null;
  /** airtime, rather than a plan */
  amount?: number;
  /** what was asked for, as the photo or the words said it */
  asked?: number;
  read?: 'photo';
  said?: string;
};

let waiting: TopupDraft | null = null;

export const topupDraft = {
  put(d: TopupDraft) {
    waiting = { ...(waiting ?? {}), ...d };
  },
  take(): TopupDraft | null {
    const d = waiting;
    waiting = null;
    return d;
  },
};
