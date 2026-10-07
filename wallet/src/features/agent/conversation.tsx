/* The conversation: what was said, in order, and what Beetle is still
   waiting for. Asking adds your turn, then Beetle's answer arrives a block at
   a time, the way somebody says one thing and then the next. An ask panel
   is Beetle's question with the fields in it: what you fill goes into it,
   and Continue hands it back. Confirming a panel moves the money — through
   whoever is told about the move — and Beetle says so.

   An answer belongs to the chat it was asked in. If that chat is put away
   while the answer is on its way (a new chat, another picked, the card
   closed), the rest of it goes to that chat where it is filed, whole, and
   never into the one now showing (the analysis after Round 21). */
import { useCallback, useMemo, useRef, useState } from 'react';
import { agent, type Ask, type AskFound, type AskPanel, type AskValues, type Block, type Context, type Move, type Panel, type PanelRow, type Pending, type Photo } from '../../services';
import { askMissing } from '../../services/agent';
import { naira } from '../../lib/format';
import { useStill } from '../../design';
import { isAsk, isPanel, newId as id, turn, withBlock, type AskState, type AskTurn, type PanelTurn, type ReceiptCard, type Turn } from './turns';

export { isAsk, isPanel, turn, withBlock, type AskState, type ReceiptCard, type Turn };

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
  /** an ask panel's fields, as they are filled; `extra` changes whether it asks about the person, and what the To field holds */
  fill(askId: string, values: AskValues, found?: AskFound, extra?: Partial<Pick<AskPanel, 'confirmWho' | 'hint'>>): void;
  /** an ask card's own button went through the passcode: what it stands for moves */
  settleAsk(askId: string, panel: Panel): void;
  /** the loan card taken through the passcode */
  takeLoan(turnId: string, panel: Panel, taken: { amount: number; days: number }): void;
  /** the Save card's money put away through the passcode */
  putAway(turnId: string, panel: Panel, saved: { amount: number; goalId: string; name: string }): void;
  /** Beetle puts a card up without being asked: a chip's, with what you tapped and Beetle's one line */
  offer(you: string, text: string, block: Offer): void;
  /** an ask panel's Continue: what is in it goes to Beetle */
  answer(askId: string): Promise<void>;
  /** a conversation already under way, for the lab */
  preload(turns: Turn[], pending?: Pending): void;
  /** Beetle opening, before anything has been asked */
  open(text: string): void;
  /** something Beetle is told, as a note in the chat: a receipt a question is about */
  note(title: string, body: string): void;
  /** a line of small print in the chat, beside a lock */
  aside(text: string): void;
  /** a chat from the day, picked up where it was left */
  load(turns: Turn[], pending: Pending): void;
  /** the slate wiped for a new chat */
  reset(): void;
  /** the chat filed as the card closes: what is still on its way goes to it where it is filed */
  shelve(): void;
  /** what arrived for this chat while it was filed, now it is on the card again */
  take(change: (turns: Turn[]) => Turn[], pending?: Pending): void;
};

/** Who holds the chats: the one on the card, and where an answer goes when its chat is no longer there. */
export type Holder = {
  /** the id the chat on the card is filed under */
  whose(): string;
  /** what arrived for a chat put away: how its turns change, and what Beetle now waits for in it */
  arrive(chatId: string, change: (turns: Turn[]) => Turn[], pending?: Pending): void;
};

const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/** The cards a chip puts up. */
export type Offer = { kind: 'ask'; ask: AskPanel } | { kind: 'receive' } | { kind: 'loan' } | { kind: 'save'; amount?: number; goalId?: string };

/** Between one block of an answer and the next. */
const BEAT = 260;

const clock = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** How long a word takes to arrive: reading speed, and no sentence longer
    than a couple of seconds however much it says. */
const wordPace = (words: number) => Math.min(60, Math.max(26, 2200 / Math.max(1, words)));

export function useConversation(context: () => Omit<Context, 'pending'>, onMove: (move: Move) => string | void, opening?: string, holder?: Holder): Conversation {
  const still = useStill();
  const [turns, setTurns] = useState<Turn[]>(() => (opening ? [{ id: id(), who: 'beetle', block: { kind: 'say', text: opening } }] : []));
  const [thinking, setThinking] = useState<Thinking>(null);
  const [pending, setPending] = useState<Pending>(null);
  const pendingRef = useRef<Pending>(null);
  const turnsRef = useRef<Turn[]>([]);
  turnsRef.current = turns;
  const keep = useCallback((p: Pending) => {
    pendingRef.current = p;
    setPending(p);
  }, []);
  /** which chat the card holds: moved on when another is loaded, the slate is wiped, or the chat is filed */
  const epoch = useRef(0);
  const moveOn = useCallback(() => {
    epoch.current++;
    setThinking(null);
  }, []);
  const holderRef = useRef(holder);
  holderRef.current = holder;
  /** where what is said now goes: here while the chat is on the card, else to it where it is filed */
  const mark = useCallback(() => {
    const at = epoch.current;
    const chatId = holderRef.current?.whose();
    return {
      here: () => epoch.current === at,
      away: (change: (turns: Turn[]) => Turn[], p?: Pending) => {
        if (chatId !== undefined) holderRef.current?.arrive(chatId, change, p);
      },
    };
  }, []);

  const add = useCallback((turn: Turn) => setTurns(t => [...t, turn]), []);
  const patchPanel = useCallback((panelId: string, change: (turn: PanelTurn) => Turn) => {
    setTurns(t => t.map(x => (isPanel(x) && x.block.panel.id === panelId ? change(x) : x)));
  }, []);
  const patchAsk = useCallback((askId: string, change: (turn: AskTurn) => AskTurn) => {
    setTurns(t => t.map(x => (isAsk(x) && x.block.ask.id === askId ? change(x) : x)));
    turnsRef.current = turnsRef.current.map(x => (isAsk(x) && x.block.ask.id === askId ? change(x) : x));
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

  /* what Beetle is waiting for, with an ask panel's fields as they are now */
  const pendingNow = useCallback((): Pending => {
    const p = pendingRef.current;
    if (p?.need !== 'ask') return p;
    const t = turnsRef.current.find(x => isAsk(x) && x.block.ask.id === p.ask.id);
    return t && isAsk(t) ? { need: 'ask', ask: t.block.ask } : p;
  }, []);

  /* the ask goes to Beetle, and its answer arrives a block at a time; once
     its chat is put away, the rest goes to that chat, whole. `finish` is
     what the asking leaves behind it, wherever the answer lands. Says
     whether the answer landed here. */
  const deliver = useCallback(
    async (a: Ask, finish?: (list: Turn[]) => Turn[]): Promise<boolean> => {
      const to = mark();
      setThinking({ lines: [] });
      const lines: string[] = [];
      const onStep = (line: string) => {
        lines.push(line);
        if (to.here()) setThinking({ lines: [...lines] });
      };
      const elsewhere = (blocks: Block[], p: Pending, thought: boolean) => {
        to.away(list => {
          let out = thought && lines.length ? [...list, turn.thought([...lines])] : list;
          for (const block of blocks) out = withBlock(out, block);
          return finish ? finish(out) : out;
        }, p);
        return false;
      };
      try {
        const reply = await agent.ask(a, { ...context(), pending: pendingNow() }, onStep);
        if (!to.here()) return elsewhere(reply.blocks, reply.pending, true);
        /* the steps stay, dimmed, above what they led to */
        if (lines.length) {
          setThinking({ lines: [...lines] });
          await wait(still ? 0 : 360);
          if (!to.here()) return elsewhere(reply.blocks, reply.pending, true);
          add(turn.thought([...lines]));
        }
        setThinking(null);
        for (const [i, block] of reply.blocks.entries()) {
          if (i && block.kind !== 'fill') await wait(BEAT);
          if (!to.here()) return elsewhere(reply.blocks.slice(i), reply.pending, false);
          if (block.kind === 'say' && !still) {
            const turnId = id();
            add({ id: turnId, who: 'beetle', block, shown: '' });
            await stream(turnId, block.text);
            continue;
          }
          /* a fill is read back at once (what Beetle waits for is the card as it is now) */
          if (block.kind === 'fill') turnsRef.current = withBlock(turnsRef.current, block);
          setTurns(t => withBlock(t, block));
        }
        if (!to.here()) return elsewhere([], reply.pending, false);
        keep(reply.pending);
        if (finish) setTurns(finish);
        return true;
      } catch {
        const sorry: Block = { kind: 'say', text: 'I could not answer that just now. Check the network and ask again.' };
        if (!to.here()) return elsewhere([sorry], pendingNow(), false);
        setThinking(null);
        add({ id: id(), who: 'beetle', block: sorry });
        if (finish) setTurns(finish);
        return true;
      }
    },
    [add, context, keep, mark, pendingNow, stream, still],
  );

  const ask = useCallback(
    async (a: Ask) => {
      const text = (a.text ?? '').trim();
      add({ id: id(), who: 'you', text: text || (a.photo ? 'A photo' : ''), photo: a.photo });
      await deliver({ text: text || undefined, photo: a.photo });
    },
    [add, deliver],
  );

  const fill = useCallback(
    (askId: string, values: AskValues, found?: AskFound, extra: Partial<Pick<AskPanel, 'confirmWho' | 'hint'>> = {}) => {
      patchAsk(askId, turn => ({
        ...turn,
        block: {
          kind: 'ask',
          ask: { ...turn.block.ask, values: { ...turn.block.ask.values, ...values }, found: found ? { ...turn.block.ask.found, ...found } : turn.block.ask.found, note: undefined, ...extra },
        },
      }));
      /* what Beetle is waiting for is the card as it is now */
      const p = pendingRef.current;
      if (p?.need === 'ask' && p.ask.id === askId) {
        const t = turnsRef.current.find(x => isAsk(x) && x.block.ask.id === askId);
        if (t && isAsk(t)) keep({ need: 'ask', ask: t.block.ask });
      }
    },
    [patchAsk, keep],
  );

  const answer = useCallback(
    async (askId: string) => {
      const t = turnsRef.current.find(x => isAsk(x) && x.block.ask.id === askId);
      if (!t || !isAsk(t) || t.state !== 'open') return;
      const asked = t.block.ask;
      if (askMissing(asked).length) return;
      patchAsk(askId, turn => ({ ...turn, state: 'busy' }));
      /* still waiting on something: back to filling */
      await deliver({ answers: { askId, values: asked.values } }, list => list.map(x => (isAsk(x) && x.block.ask.id === askId && x.state === 'busy' ? { ...x, state: 'open' } : x)));
    },
    [deliver, patchAsk],
  );

  const ready = useCallback((panelId: string) => patchPanel(panelId, t => (t.state === 'running' ? { ...t, state: 'ready' } : t)), [patchPanel]);

  /* what a panel stands for moves: the line in the day, its receipt, and Beetle's word on it */
  const land = useCallback(
    (panel: Panel) => {
      const at = clock();
      const move = panel.move;
      const rowId = move ? onMove({ ...move, detail: `${move.detail} · ${at}` }) : undefined;
      keep(null);
      const to = panel.person;
      const what =
        panel.done ??
        (panel.tool === 'transfer'
          ? `Done. ${naira(-(panel.move?.amount ?? 0))} is with ${to?.name ?? panel.rows[0]?.value ?? 'them'}${to ? ` at ${to.bank}` : ''}. It left your account at ${at}.`
          : panel.tool === 'pay'
            ? panel.move?.reference
              ? `Paid. The token is ${panel.move.reference}; it is on the receipt too, and in your messages.`
              : 'Paid. It is on the account already.'
            : panel.tool === 'airtime'
              ? 'Done. The airtime is on the line.'
              : 'Done. The data is on the line.');
      /* the receipt lands first, then the word about it, in the chat it was confirmed in */
      const where = mark();
      const later = (t: Turn, ms: number) => setTimeout(() => (where.here() ? add(t) : where.away(list => [...list, t])), ms);
      if (move && rowId) {
        const card: ReceiptCard = { rowId, amount: naira(Math.abs(move.amount)), line: receiptLine(move), status: move.kind === 'in' ? 'Received' : 'Successful', time: at };
        later(turn.receipt(card), BEAT);
        later(turn.say(what), BEAT * 2);
      } else later(turn.say(what), BEAT);
    },
    [onMove, keep, add, mark],
  );

  const confirm = useCallback(
    (panelId: string) => {
      const turn = turns.find(t => isPanel(t) && t.block.panel.id === panelId);
      if (!turn || !isPanel(turn) || turn.state === 'done') return;
      patchPanel(panelId, t => ({ ...t, state: 'done' }));
      land(turn.block.panel);
    },
    [turns, patchPanel, land],
  );

  const settleAsk = useCallback(
    (askId: string, panel: Panel) => {
      const t = turnsRef.current.find(x => isAsk(x) && x.block.ask.id === askId);
      if (!t || !isAsk(t) || t.state === 'done') return;
      patchAsk(askId, turn => ({ ...turn, state: 'done' }));
      land(panel);
    },
    [patchAsk, land],
  );

  const takeLoan = useCallback(
    (turnId: string, panel: Panel, taken: { amount: number; days: number }) => {
      setTurns(list => list.map(x => (x.id === turnId && x.who === 'beetle' && x.block.kind === 'loan' ? { ...x, state: 'done' as const, taken } : x)));
      land(panel);
    },
    [land],
  );

  const putAway = useCallback(
    (turnId: string, panel: Panel, saved: { amount: number; goalId: string; name: string }) => {
      setTurns(list => list.map(x => (x.id === turnId && x.who === 'beetle' && x.block.kind === 'save' ? { ...x, state: 'done' as const, saved } : x)));
      land(panel);
    },
    [land],
  );

  const offer = useCallback(
    (you: string, text: string, block: Offer) => {
      add({ id: id(), who: 'you', text: you });
      const to = mark();
      setTimeout(
        () => {
          const change = (list: Turn[]) => withBlock(withBlock(list, { kind: 'say', text }), block);
          const p: Pending | undefined = block.kind === 'ask' ? { need: 'ask', ask: block.ask } : undefined;
          if (!to.here()) return to.away(change, p);
          setTurns(change);
          if (p) keep(p);
        },
        still ? 0 : BEAT,
      );
    },
    [add, keep, mark, still],
  );

  const edit = useCallback(
    (panelId: string, row: PanelRow) => {
      const turn = turns.find(t => isPanel(t) && t.block.panel.id === panelId);
      if (!turn || !isPanel(turn)) return;
      keep({ need: 'amount-for', panel: turn.block.panel });
      add({ id: id(), who: 'beetle', block: { kind: 'say', text: `${row.label} is ${row.value}. What should it be?` } });
    },
    [turns, keep, add],
  );

  const preload = useCallback(
    (list: Turn[], p: Pending = null) => {
      moveOn();
      /* drawn whole: a panel without its rows landing one by one, words without streaming in, and an ask filed while Beetle looked at it open again */
      const next = list.map(t =>
        isPanel(t)
          ? { ...t, quick: true }
          : isAsk(t) && t.state === 'busy'
            ? { ...t, state: 'open' as const }
            : t.who === 'beetle' && t.block.kind !== 'thought' && 'shown' in t && t.shown !== undefined
              ? { ...t, shown: undefined }
              : t,
      );
      turnsRef.current = next;
      setTurns(next);
      keep(p);
    },
    [keep, moveOn],
  );

  const open = useCallback((text: string) => add({ id: id(), who: 'beetle', block: { kind: 'say', text } }), [add]);
  const note = useCallback((title: string, body: string) => add({ id: id(), who: 'beetle', block: { kind: 'note', title, body } }), [add]);
  const aside = useCallback((text: string) => add(turn.aside(text)), [add]);
  const load = useCallback((list: Turn[], p: Pending) => preload(list, p), [preload]);
  const reset = useCallback(() => {
    moveOn();
    turnsRef.current = [];
    setTurns([]);
    keep(null);
  }, [keep, moveOn]);
  const shelve = moveOn;
  const take = useCallback(
    (change: (turns: Turn[]) => Turn[], p?: Pending) => {
      setTurns(change);
      if (p !== undefined) keep(p);
    },
    [keep],
  );

  return useMemo(
    () => ({ turns, thinking, pending, ask, ready, confirm, edit, fill, settleAsk, takeLoan, putAway, offer, answer, preload, open, note, aside, load, reset, shelve, take }),
    [turns, thinking, pending, ask, ready, confirm, edit, fill, settleAsk, takeLoan, putAway, offer, answer, preload, open, note, aside, load, reset, shelve, take],
  );
}

/** The line on a receipt card: who it went to, or came from. */
export const receiptLine = (move: Move) =>
  move.kind === 'transfer'
    ? `To ${move.name}`
    : move.kind === 'in'
      ? `From ${move.name}`
      : move.kind === 'airtime' && move.target?.kind === 'line'
        ? `${move.name} · ${move.target.label ?? move.detail}`
        : move.name;

/** The conversation as lines, for a Beetle with a memory of its own: what
    you said, what it said, and what each panel was and came to. */
export function transcriptOf(turns: Turn[]): { who: 'you' | 'beetle'; text: string }[] {
  const out: { who: 'you' | 'beetle'; text: string }[] = [];
  for (const t of turns) {
    if (t.who === 'you') out.push({ who: 'you', text: t.photo && t.text === 'A photo' ? '[a photo]' : t.text });
    else if (t.block.kind === 'say') out.push({ who: 'beetle', text: t.block.text });
    else if (t.block.kind === 'note') out.push({ who: 'beetle', text: `${t.block.title}. ${t.block.body}` });
    else if (t.block.kind === 'aside') out.push({ who: 'beetle', text: t.block.text });
    else if (t.block.kind === 'receipt') out.push({ who: 'beetle', text: `[Receipt: ${t.block.card.amount} ${t.block.card.line}, ${t.block.card.status} at ${t.block.card.time}]` });
    else if (t.block.kind === 'ask') {
      const a = t.block.ask;
      const filled = Object.entries(a.values)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      const state = 'state' in t && t.state === 'done' ? 'answered' : 'waiting to be filled';
      out.push({ who: 'beetle', text: `[Ask panel ${a.id} for ${a.tool}: ${filled || 'nothing filled'}; missing ${askMissing(a).join(', ') || 'nothing'} — ${state}]` });
    } else if (t.block.kind === 'receive') out.push({ who: 'beetle', text: "[The owner's account details card: name, Beetle, the account number and the $tag, to copy or share]" });
    else if (t.block.kind === 'loan') out.push({ who: 'beetle', text: `[Loan card: ${'state' in t && t.state === 'done' ? 'taken' : 'up, the owner picking how much and for how long'}]` });
    else if (t.block.kind === 'save')
      out.push({ who: 'beetle', text: `[Save card: ${'saved' in t && t.saved ? `${naira(t.saved.amount)} put into ${t.saved.name}` : 'up, the owner picking a goal and how much to put in it'}]` });
    else if (t.block.kind === 'panel') {
      const p = t.block.panel;
      const state = 'state' in t && t.state === 'done' ? 'confirmed by the owner' : 'up, waiting for the owner';
      out.push({ who: 'beetle', text: `[Panel ${p.id}: ${p.title} — ${p.rows.map(r => `${r.label}: ${r.value}`).join(', ')} — ${state}]` });
    }
  }
  return out;
}
