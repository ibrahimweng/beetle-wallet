/* Home, the first of the three pages. The black card at the top, and under
   it four cards two by two: Savings, Loan, Card and Services (see Grid).
   The record is Activities' now, the next page along. Pull the card down
   and it becomes the chat, the whole screen down to just over the bar,
   which stays: the same bar as everywhere, so the app is still there to go
   round. The ask bar lives at the card's foot, with Send, Bills, Data,
   Receive, Save and Loan as chips on top of it: each puts its card up in
   the chat, and none leaves it. The first time on this phone, the card
   dips on its own so the pull is found. Nothing here leaves anyone stuck:
   the header pulls back up, Home on the bar closes the chat, and so does
   the phone's own back. Activities or Settings on the bar turn the pages
   with the chat left open; Home once comes back to it just as it was, and
   Home again closes it.

   The chats live in the chat: a soft light down the left edge while it is
   open, and a swipe from there brings in the drawer with New chat and the
   chats (see Drawer). Closing the card files the chat; a pull down within
   the hour carries it on, after the hour a new one starts. A receipt in
   the chat opens where it is, the way a line opens on Activities, in the
   chat's dark, with every detail in it and the rest of the screen frosted
   (agent/ChatOpen.tsx; Round 20, the owner's word). Send on the card
   opens the Send money page. */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Keyboard, Platform, ScrollView, TextInput, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Meta, Tap, away, colour, dark, keys, settle, standard, useStill } from '../../design';
import type { IconName } from '../../icons';
import {
  DEMO_SAVED,
  OFFLINE_LINE,
  TRY_FIRST,
  beneficiariesOf,
  modelKey,
  newAsk,
  overLine,
  ownLine,
  ownTag,
  panelFromAsk,
  refusalLine,
  refuses,
  takesOut,
  type AskPanel,
  type Move,
  type Panel,
} from '../../services';
import { useApp } from '../onboarding/store';
import { useSendGate } from '../settings/sendGate';
import { Chat } from '../agent/Chat';
import { ChatFrost, ChatShare } from '../agent/ChatOpen';
import { useOpenCtl } from '../activities/OpenLine';
import { FROST_OUT, OPEN_MS, ROWS_OUT } from '../activities/InPlace';
import { ChatsDrawer, ChatsEdge, EDGE, drawerWidth, useChatsSwipe } from '../agent/Drawer';
import { isPanel, transcriptOf, turn, useConversation, type Holder, type Turn } from '../agent/conversation';
import { clock, detailOf, newChatId, titleOf, toCarryOn, useChats, type Chat as ChatRecord } from '../agent/chats';
import { lineOf, transferPanel, PEOPLE } from '../../services/agent';
import { handoff } from '../scan/handoff';
import { samplePhoto } from '../scan/sample';
import { PasscodeSheet, lockedFor, waitWords } from '../passcode';
import { sheetFor } from '../passcode/breakdown';
import { LOAN, costOf, countWord, dayOf, leftToBorrow, type Term } from '../loan/loan';
import { ReceiveSheet, SAMPLE_ARRIVAL, arrivalChat, arrivalLine, arrivalMove, type Arrival } from '../receive';
import { isLoan, isRequest, isWays, pageFor } from '../request/intent';
import { isSave, saveIn, standingOf, useGoals } from '../goal';
import { usePrefs } from '../settings/prefs';
import { LAB } from '../../lab/enabled';
import { holdingsFor } from './account';
import { balanceOf, rowFrom, useMoves } from './moves';
import { AskBar } from './AskBar';
import { CHIPS_GAP, CHIPS_H, CLOSED_H, FOOT_BAND, WalletCard, useCardTop } from './WalletCard';
import { BAR_ROW, barLift, foot, useFoot } from '../more/Foot';
import { moreTo, sentByApp, type MoreItem } from '../more/More';
import { useOnline } from '../offline';
import { JourneyProvider, useRecession } from '../../design/journey';
import type { ReceiptCard as Card } from '../agent/conversation';
import { chatPointedOut, markChatPointedOut } from './first';
import { useSetup } from '../setup/store';
import { tabs, useHoldPages, usePage, useTabAgain } from '../tabs';
import { Grid } from './Grid';
import { Promos, promosFor, quietFor } from './Promos';
import { kobo, moneyExact, naira } from '../../lib/format';

/** What stays showing under the open card: the bar's row of glyphs, 16
    under the card's edge, and what the bar keeps under the row (barLift).
    The bar's white goes bare as the card opens, so the card can come down
    over the top of it. */
const ROW_GAP = 16;
/** The grid, this far under the closed card. */
const GRID_TOP = 24;
/** The chats drawer stops this far above the card's foot: at the top of the ask bar, which stays clear; its blur runs down over the chips. */
const DRAWER_CLEAR = 20 + 48 + 4;

export function Home() {
  return (
    <JourneyProvider>
      <HomeScreen />
    </JourneyProvider>
  );
}

function HomeScreen() {
  const router = useRouter();
  const app = useApp();
  /* the pager keeps the way in's guard for all three pages; here it is enough to know the session is there */
  const ok = app.ready && !!app.session;
  const { active } = usePage();
  const still = useStill();
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const { haze } = useCardTop();
  const asked = useLocalSearchParams<{
    chat?: string;
    receive?: string;
    say?: string;
    about?: string;
    fresh?: string;
    /** the pass a question the app sent itself carries (see More's askHome) */
    pass?: string;
    more?: string;
    face?: string;
    typing?: string;
    kb?: string;
    offers?: string;
  }>();
  const receding = useRecession();

  const [draft, setDraft] = useState('');
  const [opened, setOpened] = useState(false);
  const openedRef = useRef(false);
  openedRef.current = opened;
  const input = useRef<TextInput>(null);
  const page = useRef<Animated.ScrollView>(null);

  /* ---- the card's one number, and the room it has ---- */
  const open = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const tallest = useRef(H);
  if (H > tallest.current) tallest.current = H;
  const kb = useSharedValue(0);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', e => {
      kb.value = withTiming(e.endCoordinates.height, {
        duration: 220,
        easing: settle,
      });
    });
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      kb.value = withTiming(0, { duration: 220, easing: settle });
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [kb]);
  const full = tallest.current;
  /* what is visible above the keyboard: the window if it shrank for it, else the window less the keyboard;
     with the keyboard down, the card stops just over the bar's glyphs */
  const visible = useDerivedValue(() => Math.min(H, full - kb.value));
  const under = barLift(insets.bottom) + BAR_ROW + ROW_GAP;
  const openH = useDerivedValue(() => Math.min(full - under, visible.value - 8));
  /* the chats drawer, inside the card: from under its header to just over the ask bar */
  const drawerTop = haze - 8;
  const drawerH = useDerivedValue(() => Math.max(0, openH.value - drawerTop - DRAWER_CLEAR));
  const onScroll = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y;
  });

  const account = app.session?.account;
  const { moves, add: addMove } = useMoves(account?.accountNumber);
  /* frozen, the twelve hours after a new passcode, and the caps (see settings/gate) */
  const sendGate = useSendGate(account);
  /* finishing setting up: until it is done the chip reads New account and opens it */
  const { setup } = useSetup(account?.accountNumber, !!account?.demo);
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  const balance = (h?.everyday ?? 0) + balanceOf(moves);
  /* what is left of the borrowing limit, once what is already borrowed is counted */
  const loanLeft = leftToBorrow([...moves, ...(h?.ledger ?? [])]);
  const rate = h?.rate ?? 1552;
  /* everyone and everything paid before: what moved on this phone, the day, and what was saved from earlier */
  const saved = useMemo(
    () => beneficiariesOf([...moves, ...(h?.ledger ?? [])], account?.demo ? DEMO_SAVED : { lines: [], meters: [] }, account?.demo ? PEOPLE : [], account ? ownLine(account.phone) : null),
    [moves, h, account],
  );
  /** a receipt in the chat, opened where it is */
  /* a receipt in the chat, open where it is (agent/ChatOpen.tsx): which, its numbers, how far the chat moves for it,
     the picture of its rows, the session id asked for, its share sheet */
  const [chatPeek, setChatPeek] = useState<Card | null>(null);
  const peek = useOpenCtl();
  const peekShift = useSharedValue(0);
  const peekSlip = useRef<View>(null);
  const [peekSession, setPeekSession] = useState(false);
  const [peekSharing, setPeekSharing] = useState(false);
  const peekGoing = useRef(false);
  const peekBegin = useCallback(() => {
    peek.p.value = still ? 1 : withTiming(1, { duration: OPEN_MS, easing: settle });
  }, [peek, still]);
  /* closing, as a line on Activities closes: the rows go first while the frost stays whole, then they fold away as it
     clears; `then` once it has */
  const peekClose = useCallback(
    (then?: () => void) => {
      if (peekGoing.current) return;
      peekGoing.current = true;
      const done = () => {
        peekGoing.current = false;
        setPeekSharing(false);
        setChatPeek(null);
        then?.();
      };
      if (still) return done();
      peek.shown.value = withTiming(0, { duration: ROWS_OUT, easing: away });
      peek.p.value = withDelay(
        ROWS_OUT - 40,
        withTiming(0, { duration: FROST_OUT + 40, easing: away }, f => {
          if (f) runOnJS(done)();
        }),
      );
    },
    [peek, still],
  );
  /** the chats drawer, in or out, and how far in */
  const [drawer, setDrawer] = useState(false);
  const drawerIn = useSharedValue(0);

  /* ---- the conversation, and the chats it becomes ---- */
  const turnsRef = useRef<Turn[]>([]);
  const online = useOnline();
  const context = useCallback(
    () => ({
      account: account!,
      balance,
      rate,
      transcript: transcriptOf(turnsRef.current),
      saved,
      online,
    }),
    [account, balance, rate, saved, online],
  );
  /* a line added to the day, by a panel or an arrival: it carries what its
     receipt needs, and its id is what the receipt is found by */
  const seq = useRef(16);
  const onMove = useCallback(
    (m: Move) => {
      const row = rowFrom(m, balance, ++seq.current);
      addMove(row);
      return row.id;
    },
    [balance, addMove],
  );
  /** the id the chat on the card is filed under, from its first word: the
      drawer's own for one picked up, a new one for a new chat. Filed again,
      it is filed in the same place (the analysis after Round 21: each
      filing used to make another, and an answer still on its way could not
      find the chat that asked). */
  const chatId = useRef(newChatId());
  /* an answer that arrives once its chat is put away goes to that chat:
     on the card, if it is the one on it again; else where it is filed,
     marked new in the drawer */
  const arriveIn = useRef<Holder['arrive']>(() => undefined);
  const holder = useMemo<Holder>(() => ({ whose: () => chatId.current, arrive: (...a) => arriveIn.current(...a) }), []);
  const talk = useConversation(context, onMove, undefined, holder);
  turnsRef.current = talk.turns;
  const pendingRef = useRef(talk.pending);
  pendingRef.current = talk.pending;
  const { chats, file, change, read } = useChats(account?.accountNumber, !!account?.demo);
  const chatsRef = useRef(chats);
  chatsRef.current = chats;
  /** the chat the card holds, if it came from the drawer */
  const current = useRef<ChatRecord | null>(null);
  /** the last chat was filed; the next opening starts afresh */
  const stale = useRef(false);
  arriveIn.current = (id, how, p) => {
    if (id === chatId.current && openedRef.current && !stale.current) {
      talk.take(how, p);
      return;
    }
    change(id, c => {
      const turns = how(c.turns);
      return { ...c, turns, pending: p === undefined ? c.pending : p, detail: detailOf(turns), time: clock(), day: 'today', lastAt: Date.now(), unread: true };
    });
  };
  /** a move waiting on the passcode: a panel's, a card's, the loan card's or the save card's */
  const [guard, setGuard] = useState<{
    panelId?: string;
    askId?: string;
    loanId?: string;
    taken?: { amount: number; days: number };
    saveId?: string;
    saved?: { amount: number; goalId: string; name: string };
    panel: Panel;
  } | null>(null);
  /* the goals, for the Save card: each with what it holds */
  const { prefs } = usePrefs(account?.accountNumber);
  const { goals } = useGoals(account?.accountNumber, { demo: !!account?.demo, started: prefs.goal });
  const standings = useMemo(() => goals.map(g => standingOf(g, { goals, demo: !!account?.demo, tight: prefs.tight, moves })), [goals, account, prefs.tight, moves]);
  /* what Beetle has to offer, in the black card; the lab can ask for none, to see the empty card that stands in */
  const noOffers = LAB && asked.offers === 'none';
  const promos = useMemo(() => (noOffers ? [] : promosFor({ setUp: setup.done, goal: goals[0]?.name ?? null })), [noOffers, setup.done, goals]);
  const first = standings[0];
  /* the empty card: where the offers were once the × has put them away, or when there are none */
  const quiet = useMemo(() => quietFor(first ? { name: first.goal.name, aside: first.aside } : null), [first]);
  /** the Receive sheet, over everything */
  const [receive, setReceive] = useState(false);
  /** money that just arrived, for the card to show */
  const [flash, setFlash] = useState<{ text: string; at: number } | undefined>(undefined);

  /* the pages stand still while the chat is open, or the Receive sheet is up */
  useHoldPages('chat', opened);
  useHoldPages('receive', receive);

  /* Beetle opens a fresh chat: with something it noticed, taking turns, or
     for a new account with what it can do */
  const greeting = useCallback(() => {
    const list = h?.insights ?? [];
    const noticed = list.length ? list[chats.length % list.length]?.body : undefined;
    return noticed ?? `Hello ${account?.firstName ?? 'there'}. I can send money, top up, buy data, and read an account number off a photo. What do you need?`;
  }, [h, chats.length, account]);

  /* where Claude answers (a key on this phone, or Beetle's own server), a
     new chat says so first, in small print: what is typed, and the words read
     off a photo, go to Anthropic to be answered (the analysis after Round
     21: nothing said so) */
  const [modelOn, setModelOn] = useState(false);
  useEffect(() => {
    let live = true;
    void modelKey.config().then(c => {
      if (live) setModelOn(!!c);
    });
    return () => {
      live = false;
    };
  }, []);
  const modelOnRef = useRef(modelOn);
  modelOnRef.current = modelOn;
  const aboutClaude = useCallback(() => {
    if (modelOnRef.current)
      talk.aside(
        'Beetle answers with Claude, from Anthropic. What you type here, and the words read off a photo, go there to be answered; the photo itself stays on this phone. Nothing moves without your passcode.',
      );
  }, [talk]);

  /* a fresh chat, or the one within the hour picked up where it was left;
     a photo coming in opens the chat without Beetle's hello */
  const begin = useCallback(
    (opening?: string, greet = true) => {
      let empty = turnsRef.current.length === 0;
      if (stale.current) {
        talk.reset();
        current.current = null;
        chatId.current = newChatId();
        stale.current = false;
        empty = true;
      }
      if (empty) {
        const again = toCarryOn(chatsRef.current);
        if (again) {
          talk.load(again.turns, again.pending);
          current.current = again;
          chatId.current = again.id;
          if (opening) talk.open(opening);
        } else {
          aboutClaude();
          if (greet) talk.open(opening ?? greeting());
        }
      } else if (opening) talk.open(opening);
    },
    [talk, greeting, aboutClaude],
  );

  /* the card closing files the chat, if anything was said in it; a chat
     ended by New chat is filed too, and never carries on */
  const fileCurrent = useCallback(
    (opts: { ended?: boolean } = {}) => {
      const turns = turnsRef.current;
      const cur = current.current;
      const asked = turns.some(t => t.who === 'you');
      if (cur || asked) {
        file({
          id: chatId.current,
          startedBy: cur?.startedBy ?? 'you',
          title: cur?.title ?? titleOf(turns),
          detail: detailOf(turns),
          time: clock(),
          day: 'today',
          /* words still streaming in are filed whole */
          turns: turns.map(t => (t.who === 'beetle' && 'shown' in t && t.shown !== undefined ? { ...t, shown: undefined } : t)),
          pending: pendingRef.current,
          unread: false,
          lastAt: Date.now(),
          ended: opts.ended,
        });
      }
      /* what is still on its way goes to it where it is filed */
      talk.shelve();
      stale.current = true;
    },
    [file, talk],
  );

  /* the drawer goes with the chat, and on a pick */
  const closeDrawer = useCallback(() => {
    setDrawer(false);
    drawerIn.value = still ? 0 : withSpring(0, keys);
  }, [drawerIn, still]);

  const show = useCallback(
    (to: boolean, opts: { greet?: boolean; opening?: string } = {}) => {
      setOpened(to);
      if (to) {
        page.current?.scrollTo({ y: 0, animated: true });
        if (opts.greet !== false) begin(opts.opening);
      } else {
        Keyboard.dismiss();
        setGuard(null);
        setChatPeek(null);
        setDrawer(false);
        drawerIn.value = 0;
        fileCurrent();
      }
      open.value = withSpring(to ? 1 : 0, keys);
    },
    [open, begin, fileCurrent, drawerIn],
  );

  /* New chat, at the top of the drawer: the chat so far is filed and
     ended, and Beetle opens a fresh one */
  const startNew = useCallback(() => {
    fileCurrent({ ended: true });
    talk.reset();
    current.current = null;
    chatId.current = newChatId();
    stale.current = false;
    aboutClaude();
    talk.open(greeting());
  }, [fileCurrent, talk, greeting, aboutClaude]);

  /* a chat picked in the drawer: this one is filed, and that one picks up where it was left */
  const switchTo = useCallback(
    (chat: ChatRecord) => {
      if (chatId.current === chat.id) return;
      fileCurrent();
      talk.load(chat.turns, chat.pending);
      current.current = chat;
      chatId.current = chat.id;
      stale.current = false;
      read(chat.id);
    },
    [fileCurrent, talk, read],
  );

  /* a panel's button: the passcode stands between it and the move, unless
     the gate is shut, in which case Beetle says how long for */
  const confirmWithPasscode = useCallback(
    (panelId: string) => {
      const t = turnsRef.current.find(x => isPanel(x) && x.block.panel.id === panelId);
      if (!t || !isPanel(t) || t.state === 'done') return;
      const panel = t.block.panel;
      if (!panel.action) {
        talk.confirm(panelId);
        return;
      }
      /* what it takes out is checked against what Everyday holds now, not when the card was filled */
      const out = takesOut(panel.move, panel.action.amount);
      if (out > balance) {
        talk.open(overLine(moneyExact(out), moneyExact(balance)));
        return;
      }
      const stopped = out > 0 ? sendGate.stopped() : null;
      if (stopped) {
        talk.open(stopped);
        return;
      }
      const shut = lockedFor();
      if (shut) {
        talk.open(`That was three wrong tries. Give it ${waitWords(shut)} and press it again.`);
        return;
      }
      Keyboard.dismiss();
      setGuard({ panelId, panel });
    },
    [talk, balance, sendGate],
  );
  /* a card with all it needs: what it stands for goes to the passcode, with the whole of it on the sheet */
  const confirmAsk = useCallback(
    (ask: AskPanel) => {
      const panel = panelFromAsk(ask, saved);
      if (!panel) return;
      if (!online && ask.tool === 'transfer') {
        talk.open(OFFLINE_LINE);
        return;
      }
      /* the whole balance to an account never paid stops here too, as it does on Send money and in words */
      const to = ask.tool === 'transfer' ? ask.found?.person : null;
      if (
        to &&
        refuses(
          ask.values.amount ?? 0,
          balance,
          saved.people.some(p => p.number === to.number),
          to.bank,
        )
      ) {
        talk.open(refusalLine(naira(balance), naira(TRY_FIRST)));
        return;
      }
      const out = takesOut(panel.move, panel.action?.amount);
      if (out > balance) {
        talk.open(overLine(moneyExact(out), moneyExact(balance)));
        return;
      }
      const stopped = sendGate.stopped();
      if (stopped) {
        talk.open(stopped);
        return;
      }
      const shut = lockedFor();
      if (shut) {
        talk.open(`That was three wrong tries. Give it ${waitWords(shut)} and press it again.`);
        return;
      }
      Keyboard.dismiss();
      setGuard({ askId: ask.id, panel });
    },
    [saved, online, talk, balance, sendGate],
  );
  /* the loan card's Borrow: what comes in, what is paid back and when, to the passcode */
  const borrow = useCallback(
    (turnId: string, amount: number, days: Term) => {
      if (amount > loanLeft || amount < LOAN.least) {
        talk.open(loanLeft < LOAN.least ? 'You have borrowed all of your limit. It frees up as you pay it back.' : `${naira(loanLeft)} is what is left of your limit.`);
        return;
      }
      const cost = costOf(amount, days);
      const panel: Panel = {
        id: `loan-${turnId}`,
        tool: 'loan',
        title: 'Beetle Loans',
        icon: 'loan',
        rows: [
          { label: 'Term', value: `${days} days` },
          { label: 'You get today', value: naira(amount) },
          { label: 'You pay back', value: naira(cost.total) },
          { label: 'First payment', value: `${naira(cost.each)} on ${dayOf(cost.first)}` },
        ],
        action: { label: `Borrow ${naira(amount)}`, amount },
        move: { name: 'Beetle Loans', detail: `Loan · ${days} days`, amount, icon: 'loan', kind: 'in', reference: `Paid back over ${days} days` },
        done: `${naira(amount)} is in Everyday now. The first of ${countWord(cost.payments).toLowerCase()} payment${cost.payments === 1 ? '' : 's'}, ${naira(cost.each)}, is on ${dayOf(cost.first)}; I tell you the day before.`,
      };
      const shut = lockedFor();
      if (shut) {
        talk.open(`That was three wrong tries. Give it ${waitWords(shut)} and press it again.`);
        return;
      }
      Keyboard.dismiss();
      setGuard({ loanId: turnId, panel, taken: { amount, days } });
    },
    [talk, loanLeft],
  );
  /* the save card's Put away: into the goal, from Everyday, to the passcode */
  const putAway = useCallback(
    (turnId: string, goalId: string, amount: number) => {
      const st = standings.find(x => x.goal.id === goalId);
      if (!st) return;
      const { goal } = st;
      const after = Math.min(100, Math.round(((st.aside + amount) / goal.target) * 100));
      const panel: Panel = {
        id: `save-${turnId}`,
        tool: 'save',
        title: goal.name,
        icon: 'pot',
        rows: [
          { label: 'Into', value: `${goal.name}, toward ${naira(goal.target)}` },
          { label: 'Taken out', value: 'Whenever you want, free' },
        ],
        action: { label: `Put ${naira(amount)} into ${goal.name}`, amount },
        move: { name: goal.name, detail: 'Put away', amount: -amount, icon: 'pot', kind: 'saving', goal: goal.id },
        done: `Done. ${naira(amount)} is in ${goal.name}, ${after}% of the way to ${naira(goal.target)}.`,
      };
      if (amount > balance) {
        talk.open(overLine(moneyExact(amount), moneyExact(balance)));
        return;
      }
      const shut = lockedFor();
      if (shut) {
        talk.open(`That was three wrong tries. Give it ${waitWords(shut)} and press it again.`);
        return;
      }
      Keyboard.dismiss();
      setGuard({ saveId: turnId, panel, saved: { amount, goalId: goal.id, name: goal.name } });
    },
    [standings, talk, balance],
  );
  const guardDone = useCallback(() => {
    if (!guard) return;
    const g = guard;
    setGuard(null);
    if (g.askId) talk.settleAsk(g.askId, g.panel);
    else if (g.loanId && g.taken) talk.takeLoan(g.loanId, g.panel, g.taken);
    else if (g.saveId && g.saved) talk.putAway(g.saveId, g.panel, g.saved);
    else if (g.panelId) talk.confirm(g.panelId);
  }, [guard, talk]);

  /* the chips over the input: each puts its card up in the chat, with what was tapped (or typed) and Beetle's one line */
  const offer = useCallback(
    (what: 'send' | 'bills' | 'data' | 'receive' | 'save' | 'loan', said?: string) => {
      if (!account) return;
      const c = { ...context(), pending: null };
      if (what === 'send')
        talk.offer(said ?? 'Send money', 'Who to? A $tag, a name, or an account number; the people you have paid are under Recent.', { kind: 'ask', ask: newAsk('transfer', {}, c) });
      if (what === 'bills')
        talk.offer(said ?? 'Pay for light', 'Your company, prepaid or postpaid, and the meter number. The meters you have paid are under Recent.', { kind: 'ask', ask: newAsk('pay', {}, c) });
      if (what === 'data')
        talk.offer(said ?? 'Buy data', 'Which line, and which plan? It is on your line unless you change it.', { kind: 'ask', ask: newAsk('data', { number: lineOf(account.phone)?.number }, c) });
      if (what === 'receive') talk.offer(said ?? 'Receive money', 'Here is how to pay you: your number from any bank, or your tag from Beetle, which is free.', { kind: 'receive' });
      if (what === 'loan') talk.offer(said ?? 'Borrow', 'Pick how much and for how long. Everything it costs is on the card before you take it.', { kind: 'loan' });
      if (what === 'save') {
        const { amount, goalId } = said ? saveIn(said, goals) : {};
        const into = goals.find(g => g.id === goalId) ?? goals[0];
        talk.offer(
          said ?? 'Put money away',
          !into
            ? 'You have no goal yet. Start one and I keep count of it for you.'
            : goals.length > 1
              ? `Into ${into.name}, or pick another. Nothing here is locked.`
              : `Into ${into.name}. Nothing here is locked: take it out whenever you need it.`,
          { kind: 'save', amount, goalId: into?.id },
        );
      }
    },
    [account, context, talk, goals],
  );

  /* Receive: the sheet with the four ways money can come, over everything */
  const openReceive = useCallback(() => {
    setGuard(null);
    Keyboard.dismiss();
    setReceive(true);
  }, []);

  /* money arriving lands in three places at once: the card, the record, and
     a chat from Beetle — said in the open chat too, if one is open */
  const arrive = useCallback(
    (a: Arrival) => {
      const after = balance + a.amount;
      const rowId = onMove(arrivalMove(a));
      file(arrivalChat(a, after, rowId));
      setFlash({
        text: `+${naira(a.amount)} from ${a.from.split(' ')[0]}`,
        at: Date.now(),
      });
      if (openedRef.current) talk.open(arrivalLine(a, after));
    },
    [balance, onMove, file, talk],
  );
  const arriveRef = useRef(arrive);
  arriveRef.current = arrive;

  /** a chat picked up where it was left, with the card opening on it */
  const reopen = useCallback(
    (chat: ChatRecord) => {
      talk.load(chat.turns, chat.pending);
      current.current = chat;
      chatId.current = chat.id;
      stale.current = false;
      read(chat.id);
      show(true, { greet: false });
    },
    [talk, read, show],
  );

  /* Home on the bar while the chat is open — or the second tap, coming back
     to it from another page — closes it */
  useTabAgain('home', () => {
    if (openedRef.current) show(false);
  });
  /* the pages turning away from the chat take the keyboard down with them */
  useEffect(() => {
    if (!active) Keyboard.dismiss();
  }, [active]);

  /* the phone's own back puts the drawer away, then closes the chat, before it leaves the screen */
  useEffect(() => {
    if (!opened || !active) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (guard) setGuard(null);
      else if (peekSharing) setPeekSharing(false);
      else if (chatPeek) peekClose();
      else if (receive) setReceive(false);
      else if (drawer) closeDrawer();
      else show(false);
      return true;
    });
    return () => sub.remove();
  }, [opened, active, show, guard, receive, drawer, closeDrawer, chatPeek, peekSharing, peekClose]);

  /* the first time: once the balance has resolved, the card dips and springs
     back, so the pull is seen (the grabber carries no words since Round 14) */
  const pointed = useRef(false);
  useEffect(() => {
    if (!ok || pointed.current) return;
    let cancelled = false;
    chatPointedOut().then(seen => {
      if (cancelled || seen || pointed.current || openedRef.current) return;
      pointed.current = true;
      const t = setTimeout(() => {
        if (openedRef.current) return;
        if (!still) open.value = withSequence(withTiming(0.14, { duration: 600, easing: settle }), withDelay(1100, withSpring(0, keys)));
        void markChatPointedOut();
      }, 1500);
      return () => clearTimeout(t);
    });
    return () => {
      cancelled = true;
    };
  }, [ok, still, open]);

  /* a photo the camera took comes straight into the chat, on Home */
  useFocusEffect(
    useCallback(() => {
      const photo = handoff.take();
      if (!photo) return;
      tabs.go('home');
      /* into the chat on the card; with the card closed, the chat within the hour or a new one, never the one already filed */
      if (!openedRef.current) {
        show(true, { greet: false });
        begin(undefined, false);
      }
      void talk.ask({ photo, text: draft.trim() || undefined });
      setDraft('');
    }, [show, begin, talk, draft]),
  );

  /* the lab opens it somewhere along the way */
  const staged = useRef(false);
  useEffect(() => {
    if (!ok || staged.current || !asked.receive) return;
    /* More, from a page: back here with the sheet up */
    if (asked.receive.startsWith('pick-')) {
      setTimeout(openReceive, 300);
      return;
    }
    if (!LAB) return;
    staged.current = true;
    if (asked.receive === 'pick') setTimeout(openReceive, 300);
    if (asked.receive === 'arrival') setTimeout(() => arriveRef.current(SAMPLE_ARRIVAL), 1400);
  }, [ok, asked.receive, openReceive]);
  /* the lab: the words typed and the keyboard up, as the frame draws them */
  useEffect(() => {
    if (!LAB || !ok || !asked.typing) return;
    show(true, { greet: false });
    setDraft(asked.typing);
    if (asked.kb) kb.value = Number(asked.kb) || 0;
  }, [ok, asked.typing, asked.kb]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!LAB || !ok || staged.current || !asked.chat) return;
    if (asked.chat === 'prompt') {
      const prompt = chats.find(c => c.startedBy === 'beetle');
      if (!prompt) return;
      staged.current = true;
      reopen(prompt);
      return;
    }
    staged.current = true;
    if (asked.chat === 'open') show(true);
    if (asked.chat === 'drawer') {
      /* the chat open with the drawer in, as a swipe from the left edge leaves it */
      show(true);
      setTimeout(() => {
        setDrawer(true);
        drawerIn.value = still ? 1 : withSpring(1, keys);
      }, 700);
    }
    if (asked.chat === 'carry') {
      /* a chat filed a quarter of an hour ago: the pull down picks it up */
      const panel = transferPanel(PEOPLE[0]!, 20_000);
      file({
        id: 'chat-carry',
        startedBy: 'you',
        title: 'Send 20k to Sarah',
        detail: 'Done. ₦20,000 is with Sarah Adeyemi.',
        time: clock(),
        day: 'today',
        turns: [
          turn.you('Send 20k to Sarah'),
          turn.say('₦20,000 to Sarah Adeyemi at GTBank. Here is what I have; the amount is yours to change.'),
          turn.panel(panel, 'done'),
          turn.say('Done. ₦20,000 is with Sarah Adeyemi.'),
        ],
        pending: null,
        unread: false,
        lastAt: Date.now() - 15 * 60 * 1000,
      });
      setTimeout(() => show(true), 250);
    }
    if (asked.chat === 'first') {
      /* the first question, from its frame: an account with no history, asked what Beetle can do */
      talk.preload([
        turn.you('What can you do?'),
        turn.say('Very little yet, and I would rather say so. I have no history to read.'),
        turn.aside('I only tell you things I have seen in your own money.'),
      ]);
      show(true, { greet: false });
    }
    if (asked.chat === 'sent') {
      /* a transfer just through the passcode: the panel done, the receipt, and Beetle's word */
      const panel = transferPanel(PEOPLE[0]!, 20_000);
      const at = clock();
      const rowId = onMove({ ...panel.move!, detail: `${panel.move!.detail} · ${at}` }) as string;
      talk.preload([
        turn.you('Send 20k to Sarah'),
        turn.say('₦20,000 to Sarah Adeyemi at GTBank. Here is what I have; the amount is yours to change.'),
        turn.panel(panel, 'done'),
        turn.receipt({ rowId, amount: naira(20_000), line: 'To Sarah Adeyemi', status: 'Successful', time: at }),
        turn.say(`Done. ₦20,000 is with Sarah Adeyemi. It left your account at ${at}.`),
      ]);
      show(true, { greet: false });
    }
    if (asked.chat === 'transfer') {
      const sarah = PEOPLE[0]!;
      const list: Turn[] = [
        turn.say('You top up Ikeja Electric about every three weeks. The last one was ₦8,000.'),
        turn.you('Send 20k to Sarah'),
        turn.say('₦20,000 to Sarah Adeyemi at GTBank. Here is what I have; the amount is yours to change.'),
        turn.panel(transferPanel(sarah, 20_000), 'running'),
      ];
      talk.preload(list);
      show(true, { greet: false });
    }
    if (asked.chat === 'photo') {
      show(true, { greet: false });
      samplePhoto().then(photo => talk.ask({ photo }));
    }
    if (asked.chat === 'thinking') {
      show(true, { greet: false });
      setTimeout(() => void talk.ask({ text: 'Send 20k to Sarah' }), 700);
    }
    /* the asks: a transfer with no amount, data for a number not topped up before, airtime with the slider, a bill from the meters paid */
    const asksFor: Record<string, string> = { 'ask-send': 'Send something to Sarah', 'ask-data': 'Data for 0812 345 6789', 'ask-airtime': 'Airtime', 'ask-bill': 'Pay a bill' };
    const asking = asksFor[asked.chat];
    if (asking) {
      show(true, { greet: false });
      setTimeout(() => void talk.ask({ text: asking }), 500);
    }
    /* the Save chip's card, up in the chat */
    if (asked.chat === 'save') {
      show(true, { greet: false });
      setTimeout(() => offer('save'), 500);
    }
    if (asked.chat === 'confirm') {
      const panel = transferPanel(PEOPLE[0]!, 20_000);
      talk.preload([turn.you('Send 20k to Sarah'), turn.say('₦20,000 to Sarah Adeyemi at GTBank. Here is what I have; the amount is yours to change.'), turn.panel(panel, 'ready')]);
      show(true, { greet: false });
      setTimeout(() => setGuard({ panelId: panel.id, panel }), 700);
    }
  }, [ok, asked.chat, show, talk, chats, reopen, file, onMove]); // eslint-disable-line react-hooks/exhaustive-deps

  /* a question brought from a receipt, from Activities or from a Settings
     row: the chat opens, with the receipt named where there is one, and
     asks it. Once per asking: the same words brought again carry a fresh
     stamp. */
  const said = useRef('');
  useEffect(() => {
    if (!ok || !asked.say) return;
    if (asked.fresh) return;
    const stamp = `${asked.say}|${asked.about ?? ''}`;
    if (said.current === stamp) return;
    said.current = stamp;
    /* only what the app itself sent: words from a link outside it are not asked */
    if (!sentByApp(asked.pass)) return;
    const q = asked.say.replace(/ #\d+$/, '');
    const about = asked.about;
    /* how to be paid, money to put away or to borrow, asked from a page, is the card in the chat, as it is typed here */
    if (
      !isRequest(q) &&
      (isWays(q) ||
        isLoan(q) ||
        isSave(
          q,
          goals.map(g => g.name),
        ))
    ) {
      tabs.go('home');
      show(true);
      setTimeout(() => offer(isLoan(q) ? 'loan' : isWays(q) ? 'receive' : 'save', q), 300);
      return;
    }
    /* words that are a page of their own: asking somebody, the month's bills */
    const page = pageFor(q);
    if (page) {
      router.push(page as never);
      return;
    }
    tabs.go('home');
    show(true);
    setTimeout(() => {
      if (about) talk.note('About this receipt', about);
      void talk.ask({ text: q });
    }, 300);
  }, [ok, asked.say, asked.about, show, talk, router, offer, goals]);

  /* Ask Beetle about this, from a transaction's ···: whatever chat there was
     is filed, and a fresh one opens about that one transaction — what it is
     about set down as a note Beetle reads, and Beetle asking what you want
     to know. Once per asking. */
  const freshly = useRef('');
  useEffect(() => {
    if (!ok || !asked.fresh || !asked.about) return;
    if (freshly.current === asked.fresh) return;
    freshly.current = asked.fresh;
    if (!sentByApp(asked.pass)) return;
    const about = asked.about;
    tabs.go('home');
    if (turnsRef.current.some(t => t.who === 'you') || current.current) fileCurrent();
    talk.reset();
    current.current = null;
    chatId.current = newChatId();
    stale.current = false;
    show(true, { greet: false });
    setTimeout(() => {
      talk.note('About this transaction', about);
      talk.open('What would you like to know about this one?');
    }, 300);
  }, [ok, asked.fresh, asked.about]); // eslint-disable-line react-hooks/exhaustive-deps

  /* the lab opens home with More already up */
  useEffect(() => {
    if (LAB && ok && asked.more === '1') setTimeout(() => foot.openMore(), 400);
  }, [ok, asked.more]);

  /* what More's three do from home: the camera and Send money on their own
     screens, receiving in the card */
  const pickMore = useCallback(
    (item: MoreItem) => {
      if (item === 'receive') openReceive();
      else moreTo(router, item);
    },
    [openReceive, router],
  );
  /* the foot is the bar, while this page is the one showing, and it stays
     under the open chat; More comes up out of its plus. A sheet or a peek
     over home sends it down out of the way. */
  useFoot({ kind: 'bar', open, onPick: pickMore, veil: guard || receive || chatPeek ? 'away' : undefined }, active);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    /* what the Loan, Receive and Save chips do, typed, is the same card in the chat */
    if (
      !isRequest(text) &&
      (isLoan(text) ||
        isWays(text) ||
        isSave(
          text,
          goals.map(g => g.name),
        ))
    ) {
      offer(isLoan(text) ? 'loan' : isWays(text) ? 'receive' : 'save', text);
      return;
    }
    /* asking somebody for money, the month's bills, the services: a page of its own */
    const page = pageFor(text);
    if (page) {
      Keyboard.dismiss();
      router.push(page as never);
      return;
    }
    void talk.ask({ text });
  };
  const toCamera = () => router.push('/scan');

  /* the grid goes as the card opens, so what stays under it is the bar and nothing else */
  const gridStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, Math.max(0, (open.value - 0.25) / 0.35)),
  }));
  /* the chats' edge runs down the chat, between its header and its ask bar, shows as the chat does, and goes as the drawer comes in over it */
  const edgeStyle = useAnimatedStyle(() => ({
    top: haze,
    height: Math.max(0, openH.value - haze - FOOT_BAND),
    opacity: Math.min(1, Math.max(0, (open.value - 0.6) / 0.4)) * (1 - drawerIn.value),
  }));
  const DW = drawerWidth(W);
  /* the chats drawer comes in from a swipe that starts near the left edge of the open chat, while nothing is over it */
  const openDrawer = useCallback(() => setDrawer(true), []);
  const chatsSwipe = useChatsSwipe(drawerIn, DW, openDrawer, opened && !drawer && !guard && !receive && !chatPeek);
  if (!ok || !app.session || !h || !account) return null;

  return (
    <GestureDetector gesture={chatsSwipe}>
      <View style={{ flex: 1, backgroundColor: colour.surface }}>
        {/* everything that recedes when something here leads away; the sheets over it stay sharp */}
        <Animated.View style={[{ flex: 1 }, receding]}>
          <Animated.ScrollView
            ref={page}
            onScroll={onScroll}
            scrollEventThrottle={16}
            scrollEnabled={!opened}
            bounces={false}
            overScrollMode="never"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: barLift(insets.bottom) + BAR_ROW + 16 }}
          >
            <View style={{ gap: 0 }}>
              <WalletCard
                open={open}
                openH={openH}
                scrollY={scrollY}
                onSettle={to => {
                  if (to === openedRef.current) return;
                  if (to) {
                    setOpened(true);
                    begin();
                  } else show(false);
                }}
                offers={<Promos width={W} promos={promos} quiet={quiet} />}
                whole={(balance < 0 ? '−' : '') + naira(balance)}
                kobo={kobo(balance)}
                dollars={setup.done ? `~ ${Math.round(balance / rate).toLocaleString('en-NG')} USD` : 'New account'}
                onReceive={openReceive}
                flash={flash}
                onDollars={() => router.push(setup.done ? '/dollars' : '/way-in?setup=1')}
                chipLabel={setup.done ? undefined : 'New account'}
                chat={
                  <Chat
                    talk={talk}
                    active={opened}
                    top={haze + 8}
                    bottom={FOOT_BAND - 8}
                    confirm={confirmWithPasscode}
                    saved={saved}
                    balance={balance}
                    account={account}
                    tag={ownTag(account.firstName)}
                    canBorrow={setup.done}
                    loanLeft={loanLeft}
                    onConfirmAsk={confirmAsk}
                    onBorrow={borrow}
                    onSetUp={() => router.push('/way-in?setup=1')}
                    goals={standings}
                    onSave={putAway}
                    onStartGoal={() => router.push('/goal?new=1')}
                    onReceipt={card => {
                      /* only while the chat is open: the card may have closed while the line was being measured */
                      if (!openedRef.current) return;
                      /* a tap on the open one puts it back */
                      if (chatPeek) return peekClose();
                      Keyboard.dismiss();
                      peek.p.value = 0;
                      peek.shown.value = 1;
                      peek.top.value = 0;
                      peek.rowH.value = 0;
                      peek.grown.value = 0;
                      peekShift.value = 0;
                      peekGoing.current = false;
                      setPeekSession(false);
                      setChatPeek(card);
                    }}
                    opened={
                      chatPeek
                        ? {
                            id: chatPeek.rowId,
                            ctl: peek,
                            shift: peekShift,
                            slip: peekSlip,
                            session: peekSession,
                            onSession: () => setPeekSession(true),
                            onShare: () => setPeekSharing(true),
                            onRecord: () => peekClose(() => tabs.go('activities')),
                            onReady: peekBegin,
                          }
                        : null
                    }
                  />
                }
                recede={drawerIn}
                foot={
                  <ChatFoot
                    typing={draft.trim().length > 0}
                    chips={[
                      { glyph: 'send', label: 'Send', onPress: () => offer('send') },
                      { glyph: 'power', label: 'Bills', onPress: () => offer('bills') },
                      { glyph: 'data', label: 'Data', onPress: () => offer('data') },
                      { glyph: 'down', label: 'Receive', onPress: () => offer('receive') },
                      { glyph: 'pot', label: 'Save', onPress: () => offer('save') },
                      { glyph: 'loan', label: 'Loan', onPress: () => offer('loan') },
                    ]}
                  >
                    {/* a tap on the ask bar puts the drawer away, and the bar is the chat's again */}
                    <AskBar ref={input} value={draft} onChange={setDraft} onSubmit={send} onCamera={toCamera} onFocus={() => drawer && closeDrawer()} />
                  </ChatFoot>
                }
              />
              {/* the four cards, going as the card opens (the offers are in the card since Round 15) */}
              <Animated.View style={[{ paddingTop: GRID_TOP }, gridStyle]} pointerEvents={opened ? 'none' : 'auto'}>
                <Grid width={W} accountNumber={account.accountNumber} demo={!!account.demo} moves={moves} borrowing={setup.done} />
              </Animated.View>
            </View>
          </Animated.ScrollView>
        </Animated.View>
        {/* the chats: the soft edge down the open chat, and the drawer it brings in */}
        {opened ? <ChatsEdge d={drawerIn} style={edgeStyle} onOpen={openDrawer} /> : null}
        {opened ? (
          <ChatsDrawer
            d={drawerIn}
            open={drawer}
            width={DW}
            top={drawerTop}
            height={drawerH}
            chats={chats}
            currentId={chatId.current}
            onNew={startNew}
            onPick={switchTo}
            onClose={() => setDrawer(false)}
          />
        ) : null}
        {/* the passcode, on its sheet over everything, before money moves */}
        {guard ? (
          <PasscodeSheet
            key={guard.panel.id}
            {...sheetFor(guard.panel)}
            pastLimit={guard.loanId || guard.saveId ? null : sendGate.past(takesOut(guard.panel.move, guard.panel.action?.amount))}
            verify={app.checkPasscode}
            onDone={guardDone}
            onCancel={() => setGuard(null)}
            faceMissed={LAB && asked.face === 'missed'}
          />
        ) : null}
        {receive && account ? <ReceiveSheet account={account} onDismiss={() => setReceive(false)} /> : null}
        {/* a receipt open in the chat: the frost round it, over everything, and its share sheet */}
        {chatPeek ? <ChatFrost ctl={peek} shift={peekShift} onClose={() => peekClose()} /> : null}
        {chatPeek && peekSharing ? <ChatShare card={chatPeek} slip={peekSlip} onDismiss={() => setPeekSharing(false)} /> : null}
      </View>
    </GestureDetector>
  );
}

/* The foot of the open chat: Send, Bills, Data, Receive, Save and Loan as
   quiet chips, left-aligned right on top of the ask bar, in the order they
   are most wanted — each puts its card up in the chat, and none leads away.
   They share the row's width; the row scrolls sideways on a phone too narrow
   for the six. They step out of the way
   while something is typed. The camera stays in the bar. */
function ChatFoot({ chips, typing, children }: { chips: { glyph: IconName; label: string; onPress: () => void }[]; typing: boolean; children: React.ReactNode }) {
  const still = useStill();
  const t = useSharedValue(typing ? 0 : 1);
  useEffect(() => {
    t.value = still ? (typing ? 0 : 1) : withTiming(typing ? 0 : 1, { duration: 200, easing: standard });
  }, [typing, still, t]);
  const row = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateY: 6 * (1 - t.value) }] }));
  return (
    <View testID="chat-foot">
      <Animated.View style={[{ height: CHIPS_H, marginBottom: CHIPS_GAP }, row]} pointerEvents={typing ? 'none' : 'auto'} testID="chat-chips">
        {/* the six share the row's width, each as wide as its word and the rest shared out; on a phone too narrow for them the row scrolls */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 6, flexGrow: 1 }}>
          {chips.map(c => (
            <Tap
              key={c.label}
              accessibilityRole="button"
              accessibilityLabel={c.label}
              onPress={c.onPress}
              scale={0.94}
              style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', height: CHIPS_H, borderRadius: CHIPS_H / 2, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,0.08)' }}
            >
              <Meta style={{ color: dark.pillText, fontWeight: '500' }}>{c.label}</Meta>
            </Tap>
          ))}
        </ScrollView>
      </Animated.View>
      {children}
    </View>
  );
}

export { CLOSED_H, EDGE };
