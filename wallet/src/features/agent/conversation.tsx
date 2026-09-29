/* The conversation: what was said, in order, and what Beetle is still
   waiting for. Asking adds your turn, then Beetle's answer arrives a block at
   a time, the way somebody says one thing and then the next. Confirming a
   panel moves the money — through whoever is told about the move — and
   Beetle says so. */
import { useCallback, useMemo, useRef, useState } from 'react';
import { agent, type Ask, type Block, type Context, type Move, type Panel, type PanelRow, type Pending, type Photo } from '../../services';
import { naira } from '../../lib/format';
import type { PanelState } from './Dark';

export type Turn =
  | { id: string; who: 'you'; text: string; photo?: Photo }
  | { id: string; who: 'beetle'; block: Extract<Block, { kind: 'say' | 'note' }> }
  | { id: string; who: 'beetle'; block: { kind: 'panel'; panel: Panel }; state: PanelState; quick?: boolean };

export type Conversation = {
  turns: Turn[];
  thinking: boolean;
  pending: Pending;
  ask(ask: Ask): Promise<void>;
  /** the panel's rows have all landed */
  ready(panelId: string): void;
  /** the panel's button */
  confirm(panelId: string): void;
  /** a row that can be corrected was tapped */
  edit(panelId: string, row: PanelRow): void;
  /** a conversation already under way, for the lab */
  preload(turns: Turn[], pending?: Pending): void;
  /** Beetle opening, before anything has been asked */
  open(text: string): void;
};

let n = 0;
const id = () => `t${++n}-${Date.now().toString(36)}`;
const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/** Between one block of an answer and the next. */
const BEAT = 260;

const clock = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export function useConversation(context: () => Omit<Context, 'pending'>, onMove: (move: Move) => void, opening?: string): Conversation {
  const [turns, setTurns] = useState<Turn[]>(() => (opening ? [{ id: id(), who: 'beetle', block: { kind: 'say', text: opening } }] : []));
  const [thinking, setThinking] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const pendingRef = useRef<Pending>(null);
  const keep = useCallback((p: Pending) => {
    pendingRef.current = p;
    setPending(p);
  }, []);

  const add = useCallback((turn: Turn) => setTurns(t => [...t, turn]), []);
  const patchPanel = useCallback((panelId: string, change: (turn: Extract<Turn, { who: 'beetle'; state: PanelState }>) => Turn) => {
    setTurns(t => t.map(x => (x.who === 'beetle' && 'state' in x && x.block.panel.id === panelId ? change(x) : x)));
  }, []);

  const ask = useCallback(
    async (a: Ask) => {
      const text = (a.text ?? '').trim();
      add({ id: id(), who: 'you', text: text || (a.photo ? 'A photo' : ''), photo: a.photo });
      setThinking(true);
      try {
        const reply = await agent.ask({ text: text || undefined, photo: a.photo }, { ...context(), pending: pendingRef.current });
        setThinking(false);
        for (const [i, block] of reply.blocks.entries()) {
          if (i) await wait(BEAT);
          if (block.kind === 'amend') {
            patchPanel(block.panelId, turn => {
              const panel = turn.block.panel;
              const rows = panel.rows.map(r => (r.label === 'Amount' ? { ...r, value: naira(block.amount) } : r));
              const action = panel.action
                ? {
                    ...panel.action,
                    label: panel.action.label.replace(/₦[\d,]+/, naira(block.amount)),
                    amount: block.amount + (panel.action.amount - Number(panel.rows.find(r => r.label === 'Amount')?.value.replace(/[^\d]/g, '') ?? 0)),
                  }
                : undefined;
              const move = panel.move ? { ...panel.move, amount: -block.amount } : undefined;
              return { ...turn, block: { kind: 'panel', panel: { ...panel, rows, action, move } } };
            });
          } else if (block.kind === 'panel') add({ id: id(), who: 'beetle', block, state: 'running' });
          else add({ id: id(), who: 'beetle', block });
        }
        keep(reply.pending);
      } catch {
        setThinking(false);
        add({ id: id(), who: 'beetle', block: { kind: 'say', text: 'I could not answer that just now. Check the network and ask again.' } });
      }
    },
    [add, context, keep, patchPanel],
  );

  const ready = useCallback((panelId: string) => patchPanel(panelId, t => (t.state === 'running' ? { ...t, state: 'ready' } : t)), [patchPanel]);

  const confirm = useCallback(
    (panelId: string) => {
      const turn = turns.find(t => t.who === 'beetle' && 'state' in t && t.block.panel.id === panelId);
      if (!turn || turn.who !== 'beetle' || !('state' in turn) || turn.state === 'done') return;
      const panel = turn.block.panel;
      patchPanel(panelId, t => ({ ...t, state: 'done' }));
      if (panel.move) onMove({ ...panel.move, detail: `${panel.move.detail} · ${clock()}` });
      keep(null);
      const what =
        panel.tool === 'transfer'
          ? `Done. ${naira(-(panel.move?.amount ?? 0))} is with ${panel.rows[0]?.value ?? 'them'}. It left your account at ${clock()}.`
          : panel.tool === 'pay'
            ? `Paid. The units land on the meter in a moment.`
            : `Done. The data is on your line.`;
      setTimeout(() => add({ id: id(), who: 'beetle', block: { kind: 'say', text: what } }), BEAT);
    },
    [turns, patchPanel, onMove, keep, add],
  );

  const edit = useCallback(
    (panelId: string, row: PanelRow) => {
      const turn = turns.find(t => t.who === 'beetle' && 'state' in t && t.block.panel.id === panelId);
      if (!turn || turn.who !== 'beetle' || !('state' in turn)) return;
      keep({ need: 'amount-for', panel: turn.block.panel });
      add({ id: id(), who: 'beetle', block: { kind: 'say', text: `${row.label} is ${row.value}. What should it be?` } });
    },
    [turns, keep, add],
  );

  const preload = useCallback(
    (list: Turn[], p: Pending = null) => {
      setTurns(list.map(t => (t.who === 'beetle' && 'state' in t ? { ...t, quick: true } : t)));
      keep(p);
    },
    [keep],
  );

  const open = useCallback((text: string) => add({ id: id(), who: 'beetle', block: { kind: 'say', text } }), [add]);

  return useMemo(() => ({ turns, thinking, pending, ask, ready, confirm, edit, preload, open }), [turns, thinking, pending, ask, ready, confirm, edit, preload, open]);
}

export const turn = {
  you: (text: string, photo?: Photo): Turn => ({ id: id(), who: 'you', text, photo }),
  say: (text: string): Turn => ({ id: id(), who: 'beetle', block: { kind: 'say', text } }),
  note: (title: string, body: string): Turn => ({ id: id(), who: 'beetle', block: { kind: 'note', title, body } }),
  panel: (panel: Panel, state: PanelState = 'ready'): Turn => ({ id: id(), who: 'beetle', block: { kind: 'panel', panel }, state }),
};
