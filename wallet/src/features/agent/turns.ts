/* A turn in the conversation, and the helpers that make one: plain, with
   nothing of the screen in them, so a chat can be put together anywhere —
   money arriving, a request sent — and the tests can read it. */
import { withAmount, type AskPanel, type Block, type Panel, type Photo } from '../../services/agent';
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
  | { id: string; who: 'beetle'; block: { kind: 'receipt'; card: ReceiptCard } }
  /** the account's own details, to copy and share */
  | { id: string; who: 'beetle'; block: { kind: 'receive' } }
  /** what can be borrowed: open to pick, done once it is taken */
  | { id: string; who: 'beetle'; block: { kind: 'loan' }; state: 'open' | 'done'; taken?: { amount: number; days: number } }
  /** money put into a goal: open to pick, done once it is in */
  | { id: string; who: 'beetle'; block: { kind: 'save'; amount?: number; goalId?: string }; state: 'open' | 'done'; saved?: { amount: number; goalId: string; name: string } };

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
  receive: (): Turn => ({ id: id(), who: 'beetle', block: { kind: 'receive' } }),
  loan: (): Turn => ({ id: id(), who: 'beetle', block: { kind: 'loan' }, state: 'open' }),
  save: (amount?: number, goalId?: string): Turn => ({ id: id(), who: 'beetle', block: { kind: 'save', amount, goalId }, state: 'open' }),
};

export type AskTurn = Extract<Turn, { who: 'beetle'; block: { kind: 'ask' } }>;
export const isAsk = (t: Turn): t is AskTurn => t.who === 'beetle' && t.block.kind === 'ask';
export type PanelTurn = Extract<Turn, { who: 'beetle'; block: { kind: 'panel' } }>;
export const isPanel = (t: Turn): t is PanelTurn => t.who === 'beetle' && t.block.kind === 'panel';

/** A block of an answer, put into the turns: most are added, a fill fills
    its ask panel, and an amend draws its panel again for the new amount (the
    fee, a bill's units and its token follow it). */
export function withBlock(list: Turn[], block: Block): Turn[] {
  switch (block.kind) {
    case 'amend':
      return list.map(x => (isPanel(x) && x.block.panel.id === block.panelId ? { ...x, block: { kind: 'panel', panel: withAmount(x.block.panel, block.amount) } } : x));
    case 'fill':
      return list.map(x =>
        isAsk(x) && x.block.ask.id === block.askId
          ? {
              ...x,
              state: block.done ? 'done' : 'open',
              block: {
                kind: 'ask',
                ask: {
                  ...x.block.ask,
                  values: block.values,
                  found: block.found ?? x.block.ask.found,
                  note: block.note,
                  confirmWho: block.confirmWho ?? x.block.ask.confirmWho,
                  hint: block.hint ?? x.block.ask.hint,
                },
              },
            }
          : x,
      );
    case 'ask':
      return [...list, { id: id(), who: 'beetle', block, state: 'open' }];
    case 'panel':
      return [...list, { id: id(), who: 'beetle', block, state: 'running' }];
    case 'loan':
      return [...list, { id: id(), who: 'beetle', block, state: 'open' }];
    case 'save':
      return [...list, { id: id(), who: 'beetle', block, state: 'open' }];
    case 'receive':
      return [...list, { id: id(), who: 'beetle', block }];
    default:
      return [...list, { id: id(), who: 'beetle', block }];
  }
}
