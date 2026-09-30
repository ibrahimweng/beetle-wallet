/* A turn in the conversation, and the helpers that make one: plain, with
   nothing of the screen in them, so a chat can be put together anywhere —
   money arriving, a request sent — and the tests can read it. */
import type { AskPanel, Block, Panel, Photo } from '../../services/agent';
import type { PanelState } from './Dark';

/** An ask panel: open for filling, busy while Beetle looks at what was
    filled, done once the panel to confirm has followed. */
export type AskState = 'open' | 'busy' | 'done';

export type Turn =
  | { id: string; who: 'you'; text: string; photo?: Photo }
  | { id: string; who: 'beetle'; block: Extract<Block, { kind: 'say' | 'note' | 'aside' }>; /** the part said so far, while the words stream in */ shown?: string }
  | { id: string; who: 'beetle'; block: { kind: 'panel'; panel: Panel }; state: PanelState; quick?: boolean }
  /** the fields a thing still needs */
  | { id: string; who: 'beetle'; block: { kind: 'ask'; ask: AskPanel }; state: AskState }
  /** what Beetle said it was doing, kept above the answer once it is done */
  | { id: string; who: 'beetle'; block: { kind: 'thought'; lines: string[] } }
  /** the receipt for what a panel moved, in a few words; the full one is a tap away */
  | { id: string; who: 'beetle'; block: { kind: 'receipt'; card: ReceiptCard } };

export type ReceiptCard = {
  rowId: string;
  amount: string;
  line: string;
  status: string;
  time: string;
  /** the page it opens, where it is not the receipt for the line */
  to?: string;
  /** a request's card says Request, and opens the page that says it was sent */
  kind?: 'request';
};

let n = 0;
export const newId = () => `t${++n}-${Date.now().toString(36)}`;
const id = newId;

export const turn = {
  you: (text: string, photo?: Photo): Turn => ({ id: id(), who: 'you', text, photo }),
  say: (text: string): Turn => ({ id: id(), who: 'beetle', block: { kind: 'say', text } }),
  thought: (lines: string[]): Turn => ({ id: id(), who: 'beetle', block: { kind: 'thought', lines } }),
  note: (title: string, body: string): Turn => ({ id: id(), who: 'beetle', block: { kind: 'note', title, body } }),
  aside: (text: string): Turn => ({ id: id(), who: 'beetle', block: { kind: 'aside', text } }),
  panel: (panel: Panel, state: PanelState = 'ready'): Turn => ({ id: id(), who: 'beetle', block: { kind: 'panel', panel }, state }),
  ask: (ask: AskPanel, state: AskState = 'open'): Turn => ({ id: id(), who: 'beetle', block: { kind: 'ask', ask }, state }),
  receipt: (card: ReceiptCard): Turn => ({ id: id(), who: 'beetle', block: { kind: 'receipt', card } }),
};
