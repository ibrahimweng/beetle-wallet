/* The conversation: what was said, in order, and what Beetle is still
   waiting for. Asking adds your turn, then Beetle's answer arrives a block at
   a time, the way somebody says one thing and then the next. Confirming a
   panel moves the money — through whoever is told about the move — and
   Beetle says so. */
import { useCallback, useMemo, useRef, useState } from 'react';
import { agent, type Ask, type Block, type Context, type Move, type Panel, type PanelRow, type Pending, type Photo } from '../../services';
import { naira } from '../../lib/format';
import { useStill } from '../../design';
import type { PanelState } from './Dark';

export type Turn =
  | { id: string; who: 'you'; text: string; photo?: Photo }
  | { id: string; who: 'beetle'; block: Extract<Block, { kind: 'say' | 'note' }>; /** the part said so far, while the words stream in */ shown?: string }
  | { id: string; who: 'beetle'; block: { kind: 'panel'; panel: Panel }; state: PanelState; quick?: boolean }
  /** what Beetle said it was doing, kept above the answer once it is done */
  | { id: string; who: 'beetle'; block: { kind: 'thought'; lines: string[] } }
  /** the receipt for what a panel moved, in a few words; the full one is a tap away */
  | { id: string; who: 'beetle'; block: { kind: 'receipt'; card: ReceiptCard } };

export type ReceiptCard = { rowId: string; amount: string; line: string; status: string; time: string };

/** Beetle at work: the lines so far, the last one still going. */
export type Thinking = { lines: string[] } | null;

export type Conversation = {
  turns: Turn[];
  thinking: Thinking;
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
  /** something Beetle is told, as a note in the chat: a receipt a question is about */
  note(title: string, body: string): void;
  /** a chat from the day, picked up where it was left */
  load(turns: Turn[], pending: Pending): void;
  /** the slate wiped for a new chat */
  reset(): void;
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

/** How long a word takes to arrive: reading speed, and no sentence longer
    than a couple of seconds however much it says. */
const wordPace = (words: number) => Math.min(60, Math.max(26, 2200 / Math.max(1, words)));

export function useConversation(context: () => Omit<Context, 'pending'>, onMove: (move: Move) => string | void, opening?: string): Conversation {
  const still = useStill();
  const [turns, setTurns] = useState<Turn[]>(() => (opening ? [{ id: id(), who: 'beetle', block: { kind: 'say', text: opening } }] : []));
  const [thinking, setThinking] = useState<Thinking>(null);
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

  /* a sentence arriving a word at a time, at reading speed; the next block
     waits for the last word */
  const stream = useCallback(
    (turnId: string, text: string) =>
      new Promise<void>(resolve => {
        const words = text.split(' ');
        const pace = wordPace(words.length);
        let i = 0;
        const tick = () => {
          i++;
          const done = i >= words.length;
          setTurns(t => t.map(x => (x.id === turnId && x.who === 'beetle' && x.block.kind === 'say' ? { ...x, shown: done ? undefined : words.slice(0, i).join(' ') } : x)));
          if (done) resolve();
          else setTimeout(tick, pace);
        };
        setTimeout(tick, pace);
      }),
    [],
  );

  const ask = useCallback(
    async (a: Ask) => {
      const text = (a.text ?? '').trim();
      add({ id: id(), who: 'you', text: text || (a.photo ? 'A photo' : ''), photo: a.photo });
      setThinking({ lines: [] });
      const lines: string[] = [];
      const onStep = (line: string) => {
        lines.push(line);
        setThinking({ lines: [...lines] });
      };
      try {
        const reply = await agent.ask({ text: text || undefined, photo: a.photo }, { ...context(), pending: pendingRef.current }, onStep);
        /* the steps stay, dimmed, above what they led to */
        if (lines.length) {
          setThinking({ lines: [...lines] });
          await wait(still ? 0 : 360);
          add({ id: id(), who: 'beetle', block: { kind: 'thought', lines: [...lines] } });
        }
        setThinking(null);
        for (const [i, block] of reply.blocks.entries()) {
          if (i) await wait(BEAT);
          if (block.kind === 'say' && !still) {
            const turnId = id();
            add({ id: turnId, who: 'beetle', block, shown: '' });
            await stream(turnId, block.text);
            continue;
          }
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
        setThinking(null);
        add({ id: id(), who: 'beetle', block: { kind: 'say', text: 'I could not answer that just now. Check the network and ask again.' } });
      }
    },
    [add, context, keep, patchPanel, stream, still],
  );

  const ready = useCallback((panelId: string) => patchPanel(panelId, t => (t.state === 'running' ? { ...t, state: 'ready' } : t)), [patchPanel]);

  const confirm = useCallback(
    (panelId: string) => {
      const turn = turns.find(t => t.who === 'beetle' && 'state' in t && t.block.panel.id === panelId);
      if (!turn || turn.who !== 'beetle' || !('state' in turn) || turn.state === 'done') return;
      const panel = turn.block.panel;
      patchPanel(panelId, t => ({ ...t, state: 'done' }));
      const at = clock();
      const move = panel.move;
      const rowId = move ? onMove({ ...move, detail: `${move.detail} · ${at}` }) : undefined;
      keep(null);
      const what =
        panel.tool === 'transfer'
          ? `Done. ${naira(-(panel.move?.amount ?? 0))} is with ${panel.rows[0]?.value ?? 'them'}. It left your account at ${at}.`
          : panel.tool === 'pay'
            ? `Paid. The units land on the meter in a moment.`
            : `Done. The data is on your line.`;
      /* the receipt lands first, then the word about it */
      if (move && rowId) {
        const card: ReceiptCard = { rowId, amount: naira(Math.abs(move.amount)), line: receiptLine(move), status: 'Successful', time: at };
        setTimeout(() => add({ id: id(), who: 'beetle', block: { kind: 'receipt', card } }), BEAT);
        setTimeout(() => add({ id: id(), who: 'beetle', block: { kind: 'say', text: what } }), BEAT * 2);
      } else setTimeout(() => add({ id: id(), who: 'beetle', block: { kind: 'say', text: what } }), BEAT);
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
  const note = useCallback((title: string, body: string) => add({ id: id(), who: 'beetle', block: { kind: 'note', title, body } }), [add]);
  const load = useCallback((list: Turn[], p: Pending) => preload(list, p), [preload]);
  const reset = useCallback(() => {
    setTurns([]);
    setThinking(null);
    keep(null);
  }, [keep]);

  return useMemo(
    () => ({ turns, thinking, pending, ask, ready, confirm, edit, preload, open, note, load, reset }),
    [turns, thinking, pending, ask, ready, confirm, edit, preload, open, note, load, reset],
  );
}

/** The line on a receipt card: who it went to, or came from. */
export const receiptLine = (move: Move) => (move.kind === 'transfer' ? `To ${move.name}` : move.kind === 'in' ? `From ${move.name}` : move.name);

/** The conversation as lines, for a Beetle with a memory of its own: what
    you said, what it said, and what each panel was and came to. */
export function transcriptOf(turns: Turn[]): { who: 'you' | 'beetle'; text: string }[] {
  const out: { who: 'you' | 'beetle'; text: string }[] = [];
  for (const t of turns) {
    if (t.who === 'you') out.push({ who: 'you', text: t.photo && t.text === 'A photo' ? '[a photo]' : t.text });
    else if (t.block.kind === 'say') out.push({ who: 'beetle', text: t.block.text });
    else if (t.block.kind === 'note') out.push({ who: 'beetle', text: `${t.block.title}. ${t.block.body}` });
    else if (t.block.kind === 'receipt') out.push({ who: 'beetle', text: `[Receipt: ${t.block.card.amount} ${t.block.card.line}, ${t.block.card.status} at ${t.block.card.time}]` });
    else if (t.block.kind === 'panel') {
      const p = t.block.panel;
      const state = 'state' in t && t.state === 'done' ? 'confirmed by the owner' : 'up, waiting for the owner';
      out.push({ who: 'beetle', text: `[Panel ${p.id}: ${p.title} — ${p.rows.map(r => `${r.label}: ${r.value}`).join(', ')} — ${state}]` });
    }
  }
  return out;
}

export const turn = {
  you: (text: string, photo?: Photo): Turn => ({ id: id(), who: 'you', text, photo }),
  say: (text: string): Turn => ({ id: id(), who: 'beetle', block: { kind: 'say', text } }),
  thought: (lines: string[]): Turn => ({ id: id(), who: 'beetle', block: { kind: 'thought', lines } }),
  note: (title: string, body: string): Turn => ({ id: id(), who: 'beetle', block: { kind: 'note', title, body } }),
  panel: (panel: Panel, state: PanelState = 'ready'): Turn => ({ id: id(), who: 'beetle', block: { kind: 'panel', panel }, state }),
  receipt: (card: ReceiptCard): Turn => ({ id: id(), who: 'beetle', block: { kind: 'receipt', card } }),
};
