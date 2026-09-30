/* What is handed to the Request page: the pieces of a request, by whoever
   put them together — the words typed at home, a photo read on the camera,
   the keypad page handing an amount back, a row on the Receive sheet with
   nothing yet. The page takes it the moment it is in front. */
import type { Payer } from './people';

export type RequestDraft = {
  who?: Payer | null;
  amount?: number;
  /** what it is for */
  note?: string;
  /** the pieces were read off a photo */
  read?: 'photo';
  /** the words that brought it: shown as the first thing said */
  said?: string;
};

let waiting: RequestDraft | null = null;

export const requestDraft = {
  put(d: RequestDraft) {
    waiting = { ...(waiting ?? {}), ...d };
  },
  take(): RequestDraft | null {
    const d = waiting;
    waiting = null;
    return d;
  },
};
