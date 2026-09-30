/* Home. The black card at the top, and under it the day: what the agent
   noticed, every naira that moved, and every chat — the ones you started
   and the ones Beetle did. Pull the card down and it becomes the chat,
   nearly the whole screen, with the head of the day and its chips still
   showing below as the way back. The ask bar lives at the card's foot. The
   first time on this phone, the card dips on its own so the pull is found.
   Nothing here leaves anyone stuck: the header pulls back up, a tap on the
   day below closes the chat, and so does the phone's own back. Closing the
   card files the chat in the day; a pull down within the hour carries it
   on, after the hour a new one starts, New at the top right starts one at
   once, and a chat's row in the day picks it back up where it was. The
   gear on the bar opens Settings; a line in the day opens its receipt;
   Send on the card opens the Send money page. */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Keyboard, Platform, Pressable, TextInput, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import {
  Button,
  Caption,
  Filters,
  Head,
  Icon,
  Insight,
  Label,
  LedgerRow,
  Mark,
  Meta,
  Pane,
  Row as RowText,
  ScoreRow,
  Tap,
  Tile,
  colour,
  frame,
  keys,
  settle,
  space,
  toast,
  useStill,
} from '../../design';
import type { IconName } from '../../icons';
import { DEMO_SAVED, beneficiariesOf, ownLine, type AskPanel, type Beneficiary, type Move, type Panel } from '../../services';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { Chat } from '../agent/Chat';
import { isPanel, transcriptOf, turn, useConversation, type Turn } from '../agent/conversation';
import { clock, detailOf, titleOf, toCarryOn, useChats, type Chat as ChatRecord } from '../agent/chats';
import { transferPanel, PEOPLE } from '../../services/agent';
import { handoff } from '../scan/handoff';
import { samplePhoto } from '../scan/sample';
import { PasscodeSheet, lockedFor } from '../passcode';
import { ReceiveSheet, SAMPLE_ARRIVAL, arrivalChat, arrivalLine, arrivalMove, type Arrival } from '../receive';
import { pageFor } from '../request/intent';
import { LAB } from '../../lab/enabled';
import { glance, holdingsFor } from './account';
import { balanceOf, rowFrom, useMoves } from './moves';
import { AskBar } from './AskBar';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { CLOSED_H, FOOT_BAND, WalletCard, useCardDrag, useCardTop } from './WalletCard';
import { BAR_H, foot, useFoot } from '../more/Foot';
import { moreTo, type MoreItem } from '../more/More';
import { ReceiptPeek } from '../receipts/Peek';
import { useOnline } from '../offline';
import { SavedPeek } from '../agent/SavedPeek';
import type { SavedKind } from '../agent/AskPanel';
import { receiptFor } from '../receipts/receipts';
import { JourneyProvider, useDeparture, useRecession, type Rect } from '../../design/journey';
import type { ReceiptCard as Card } from '../agent/conversation';
import { chatPointedOut, markChatPointedOut } from './first';
import { useSetup } from '../setup/store';
import { groupAccount, kobo, naira, signed } from '../../lib/format';

/** What stays showing under the open card: the gap, the head of the day, its
    chips, and the row of shortcuts under them. */
const SHORTCUTS_TOP = 32 + 56 + 12 + 34 + 12;
const SHORTCUTS_H = 64;
const BELOW = SHORTCUTS_TOP + SHORTCUTS_H + 16;

type Filter = 'All' | 'Insights' | 'In' | 'Out' | 'Chats';
const FILTERS: Filter[] = ['All', 'Insights', 'In', 'Out', 'Chats'];

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
  const ok = useSessionGuard();
  const still = useStill();
  const { height: H } = useWindowDimensions();
  const { closedH, haze } = useCardTop();
  const asked = useLocalSearchParams<{ chat?: string; receive?: string; say?: string; about?: string; more?: string; face?: string; typing?: string; kb?: string }>();
  /** a line's receipt in a few words, grown out of the line */
  const [peek, setPeek] = useState<{ card: Card; at: Rect } | null>(null);
  const receding = useRecession();
  const seeAll = useDeparture({ id: 'see-all', to: '/activities', words: 'Activities' });
  /* back from a receipt: the peek it was opened from has done its job */
  useFocusEffect(useCallback(() => setPeek(null), []));

  const [filter, setFilter] = useState<Filter>('All');
  const [put, setPut] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [hint, setHint] = useState('Pull down');
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
  /* what is visible above the keyboard: the window if it shrank for it, else the window less the keyboard */
  const visible = useDerivedValue(() => Math.min(H, full - kb.value));
  const openH = useDerivedValue(() => Math.min(full - BELOW, visible.value - 8));
  const onScroll = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y;
  });

  const account = app.session?.account;
  const { moves, add: addMove } = useMoves(account?.accountNumber);
  /* finishing setting up: until it is done the chip reads New account and opens it */
  const { setup } = useSetup(account?.accountNumber, !!account?.demo);
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  const balance = (h?.everyday ?? 0) + balanceOf(moves);
  const rate = h?.rate ?? 1552;
  /* everyone and everything paid before: what moved on this phone, the day, and what was saved from earlier */
  const saved = useMemo(
    () => beneficiariesOf([...moves, ...(h?.ledger ?? [])], account?.demo ? DEMO_SAVED : { lines: [], meters: [] }, PEOPLE, account ? ownLine(account.phone) : null),
    [moves, h, account],
  );
  /** an ask panel's list of them, grown from the line under its fields */
  const [pick, setPick] = useState<{ ask: AskPanel; kind: SavedKind; at: Rect } | null>(null);

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
  const talk = useConversation(context, onMove);
  turnsRef.current = talk.turns;
  const pendingRef = useRef(talk.pending);
  pendingRef.current = talk.pending;
  const { chats, file, read } = useChats(account?.accountNumber, !!account?.demo);
  const chatsRef = useRef(chats);
  chatsRef.current = chats;
  /** the chat the card holds, if it came from the day */
  const current = useRef<ChatRecord | null>(null);
  /** the last chat was filed; the next opening starts afresh */
  const stale = useRef(false);
  /** a panel's move waiting on the passcode */
  const [guard, setGuard] = useState<{ panelId: string; panel: Panel } | null>(null);
  /** the Receive sheet, over everything */
  const [receive, setReceive] = useState(false);
  /** money that just arrived, for the card to show */
  const [flash, setFlash] = useState<{ text: string; at: number } | undefined>(undefined);

  /* Beetle opens a fresh chat: with something it noticed, taking turns, or
     for a new account with what it can do */
  const greeting = useCallback(() => {
    const list = h?.insights ?? [];
    const noticed = list.length ? list[chats.length % list.length]?.body : undefined;
    return noticed ?? `Hello ${account?.firstName ?? 'there'}. I can send money, top up, buy data, and read an account number off a photo. What do you need?`;
  }, [h, chats.length, account]);

  /* a fresh chat, or the one within the hour picked up where it was left */
  const begin = useCallback(
    (opening?: string) => {
      let empty = turnsRef.current.length === 0;
      if (stale.current) {
        talk.reset();
        current.current = null;
        stale.current = false;
        empty = true;
      }
      if (empty) {
        const again = toCarryOn(chatsRef.current);
        if (again) {
          talk.load(again.turns, again.pending);
          current.current = again;
          if (opening) talk.open(opening);
        } else talk.open(opening ?? greeting());
      } else if (opening) talk.open(opening);
    },
    [talk, greeting],
  );

  /* the card closing files the chat, if anything was said in it; a chat
     ended by New is filed too, and never carries on */
  const fileCurrent = useCallback(
    (opts: { ended?: boolean } = {}) => {
      const turns = turnsRef.current;
      const cur = current.current;
      const asked = turns.some(t => t.who === 'you');
      if (cur || asked) {
        file({
          id: cur?.id ?? `chat-${Date.now().toString(36)}`,
          startedBy: cur?.startedBy ?? 'you',
          title: cur?.title ?? titleOf(turns),
          detail: detailOf(turns),
          time: clock(),
          day: 'today',
          turns,
          pending: pendingRef.current,
          unread: false,
          lastAt: Date.now(),
          ended: opts.ended,
        });
      }
      stale.current = true;
    },
    [file],
  );

  const show = useCallback(
    (to: boolean, opts: { greet?: boolean; opening?: string } = {}) => {
      setOpened(to);
      if (to) {
        page.current?.scrollTo({ y: 0, animated: true });
        if (opts.greet !== false) begin(opts.opening);
      } else {
        Keyboard.dismiss();
        setGuard(null);
        fileCurrent();
      }
      open.value = withSpring(to ? 1 : 0, keys);
    },
    [open, begin, fileCurrent],
  );

  /* New, at the top right of the open card: the chat so far is filed and
     ended, and Beetle opens a fresh one */
  const startNew = useCallback(() => {
    fileCurrent({ ended: true });
    talk.reset();
    current.current = null;
    stale.current = false;
    talk.open(greeting());
  }, [fileCurrent, talk, greeting]);

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
      const shut = lockedFor();
      if (shut) {
        talk.open(`That was three wrong tries. Give it ${shut} seconds and press it again.`);
        return;
      }
      Keyboard.dismiss();
      setGuard({ panelId, panel });
    },
    [talk],
  );
  const guardDone = useCallback(() => {
    if (!guard) return;
    const id = guard.panelId;
    setGuard(null);
    talk.confirm(id);
  }, [guard, talk]);

  /* Receive: the sheet with the four ways money can come, over everything */
  const openReceive = useCallback(() => {
    setGuard(null);
    Keyboard.dismiss();
    setReceive(true);
  }, []);

  /* money arriving lands in three places at once: the card, the day, and a
     chat from Beetle — said in the open chat too, if one is open */
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

  /** a chat from the day, picked up where it was left */
  const reopen = useCallback(
    (chat: ChatRecord) => {
      talk.load(chat.turns, chat.pending);
      current.current = chat;
      stale.current = false;
      read(chat.id);
      show(true, { greet: false });
    },
    [talk, read, show],
  );

  /* the phone's own back closes the chat before it leaves the screen */
  useEffect(() => {
    if (!opened) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (guard) setGuard(null);
      else if (receive) setReceive(false);
      else show(false);
      return true;
    });
    return () => sub.remove();
  }, [opened, show, guard, receive]);

  /* the first time: once the balance has resolved, the card dips and springs
     back with the words that say what it is for */
  const pointed = useRef(false);
  useEffect(() => {
    if (!ok || pointed.current) return;
    let cancelled = false;
    chatPointedOut().then(seen => {
      if (cancelled || seen || pointed.current || openedRef.current) return;
      pointed.current = true;
      const t = setTimeout(() => {
        if (openedRef.current) return;
        setHint('Pull down to ask Beetle');
        if (!still) open.value = withSequence(withTiming(0.14, { duration: 600, easing: settle }), withDelay(1100, withSpring(0, keys)));
        setTimeout(() => setHint('Pull down'), 3200);
        void markChatPointedOut();
      }, 1500);
      return () => clearTimeout(t);
    });
    return () => {
      cancelled = true;
    };
  }, [ok, still, open]);

  /* a photo the camera took comes straight into the chat */
  useFocusEffect(
    useCallback(() => {
      const photo = handoff.take();
      if (!photo) return;
      if (!openedRef.current) show(true, { greet: false });
      void talk.ask({ photo, text: draft.trim() || undefined });
      setDraft('');
    }, [show, talk, draft]),
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
    if (asked.chat === 'confirm') {
      const panel = transferPanel(PEOPLE[0]!, 20_000);
      talk.preload([turn.you('Send 20k to Sarah'), turn.say('₦20,000 to Sarah Adeyemi at GTBank. Here is what I have; the amount is yours to change.'), turn.panel(panel, 'ready')]);
      show(true, { greet: false });
      setTimeout(() => setGuard({ panelId: panel.id, panel }), 700);
    }
  }, [ok, asked.chat, show, talk, chats, reopen, file, onMove]);

  /* a question brought from a receipt, or from a Settings row: the chat
     opens, with the receipt named where there is one, and asks it. Once per
     asking: the same words brought again carry a fresh stamp. */
  const said = useRef('');
  useEffect(() => {
    if (!ok || !asked.say) return;
    const stamp = `${asked.say}|${asked.about ?? ''}`;
    if (said.current === stamp) return;
    said.current = stamp;
    const q = asked.say.replace(/ #\d+$/, '');
    const about = asked.about;
    /* words that are a page of their own: asking somebody, or how to be paid */
    const page = pageFor(q);
    if (page) {
      router.push(page as never);
      return;
    }
    show(true);
    setTimeout(() => {
      if (about) talk.note('About this receipt', about);
      void talk.ask({ text: q });
    }, 300);
  }, [ok, asked.say, asked.about, show, talk, router]);

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
  /* the foot is the bar here: it goes down as the card opens, and More comes up out of its plus */
  useFoot({ kind: 'bar', open, hidden: opened, onPick: pickMore, veil: peek ? 'recede' : undefined });

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    /* asking somebody for money, or how to be paid, is a page of its own */
    const page = pageFor(text);
    if (page) {
      Keyboard.dismiss();
      router.push(page as never);
      return;
    }
    void talk.ask({ text });
  };
  const toCamera = () => router.push('/scan');

  const veilStyle = useAnimatedStyle(() => ({ top: openH.value }));
  /* the shortcuts under the chips arrive with the rest of the open card, and
     the day below the chips goes as the card opens, so the strip that stays
     is the head, the chips and the shortcuts and nothing else */
  const shortcutsStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, (open.value - 0.6) / 0.4)),
  }));
  const dayStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, Math.max(0, (open.value - 0.25) / 0.35)),
  }));
  /* the day below the open card: a tap on it, or a push up on it, brings the card back up */
  const showRef = useRef(show);
  showRef.current = show;
  const close = useCallback(() => showRef.current(false), []);
  const veilPan = useCardDrag({
    open,
    openH,
    closedH,
    only: 'close',
    settle: to => !to && close(),
  });
  /* a tap on the day closes the card — except on the shortcuts row, whose
     buttons answer their own taps */
  const veilTap = useMemo(
    () =>
      Gesture.Tap().onEnd(e => {
        if (e.y >= SHORTCUTS_TOP && e.y <= SHORTCUTS_TOP + SHORTCUTS_H) return;
        runOnJS(close)();
      }),
    [close],
  );
  const veilGesture = useMemo(() => Gesture.Exclusive(veilPan, veilTap), [veilPan, veilTap]);

  if (!ok || !app.session || !h || !account) return null;
  const ledger = [...moves, ...h.ledger];
  const away = (k: string) => setPut(p => [...p, k]);
  const cardFor = (r: (typeof ledger)[number]): Card => {
    const rc = receiptFor(r, { account, balanceNow: balance, rows: ledger });
    return { rowId: r.id, to: r.kind === 'convert' ? `/converted/${r.id}` : undefined, amount: naira(rc.amount), line: rc.line, status: rc.status, time: r.time };
  };
  const rows = (day: 'today' | 'yesterday', from = 0, to = 99) =>
    filter === 'Chats'
      ? []
      : glance(ledger, day, filter)
          .slice(from, to)
          .map(r => (
            <LedgerRow
              key={r.id}
              glyph={r.icon}
              name={r.name}
              detail={`${r.detail}${r.detail.includes(':') ? '' : ` · ${r.time}`}`}
              amount={signed(r.amount)}
              good={r.amount > 0}
              journey={`row:${r.id}`}
              onOpen={at => setPeek({ card: cardFor(r), at })}
            />
          ));
  const insight = (id: string, extra?: { onDismiss?: boolean }) => {
    const i = h.insights.find(x => x.id === id);
    if (!i || put.includes(id) || filter === 'In' || filter === 'Out' || filter === 'Chats') return null;
    /* where the money went has its own page; the others hand their thing to Beetle */
    return (
      <Insight
        kicker={i.kicker}
        body={i.body}
        action={i.action}
        to={id === 'spend' ? '/answer' : undefined}
        onAction={() => askFor(i.action)}
        onDismiss={extra?.onDismiss ? () => away(id) : undefined}
      />
    );
  };
  /* an insight's button hands the thing to Beetle */
  const askFor = (action: string) => {
    show(true, { greet: false });
    if (stale.current) {
      talk.reset();
      current.current = null;
      stale.current = false;
    }
    void talk.ask({ text: action });
  };
  /* the chats, newest first, in All and under their own chip */
  const chatRows = (day: 'today' | 'yesterday') => (filter === 'All' || filter === 'Chats' ? chats.filter(c => c.day === day).map(c => <ChatRow key={c.id} chat={c} onPress={() => reopen(c)} />) : []);
  const todayChats = chatRows('today');

  const empty = !ledger.length;
  const dayHead = (sub: string) => (
    <View style={{ gap: space.s2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 28 }}>
        <Head style={{ flex: 1 }}>Activities</Head>
        <Tap ref={seeAll.ref} accessibilityRole="button" onPress={seeAll.onPress} style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8 }, seeAll.style]}>
          <Label style={{ color: colour.accentDeep }}>See all</Label>
          <Icon name="chevron" size={12} colour={colour.accentDeep} />
        </Tap>
      </View>
      <Meta tone={empty ? 'tertiary' : 'secondary'}>{sub}</Meta>
    </View>
  );
  const chips = (
    <View style={{ marginTop: -8 }}>
      <Filters options={FILTERS} value={filter} onChange={v => setFilter(v as Filter)} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colour.surface }}>
      {/* the card at the top is black, so the clock and the battery go light here */}
      <StatusBar style="light" />
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
          contentContainerStyle={{ paddingBottom: BAR_H + 16 }}
        >
          <Pane style={{ gap: 0 }}>
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
              whole={naira(balance)}
              kobo={kobo(balance)}
              dollars={setup.done ? `~ ${Math.round(balance / rate).toLocaleString('en-NG')} USD` : 'New account'}
              hint={hint}
              onReceive={openReceive}
              onNew={startNew}
              flash={flash}
              onDollars={() => router.push(setup.done ? '/dollars' : '/way-in?setup=1')}
              chipLabel={setup.done ? undefined : 'New account'}
              chat={<Chat talk={talk} active={opened} top={haze + 8} bottom={FOOT_BAND - 8} confirm={confirmWithPasscode} saved={saved} onSaved={(ask, kind, at) => setPick({ ask, kind, at })} />}
              foot={<AskBar ref={input} value={draft} onChange={setDraft} onSubmit={send} onCamera={toCamera} />}
            />
            <View
              style={{
                paddingHorizontal: frame.sidePad,
                paddingTop: 32,
                gap: frame.columnGap,
              }}
            >
              {empty ? (
                <>
                  {dayHead('Nothing to notice yet.')}
                  {chips}
                  <Animated.View style={[{ gap: frame.columnGap }, dayStyle]}>
                    {todayChats.length ? (
                      <>
                        <Meta tone="secondary" style={{ fontSize: 16, lineHeight: 24 }}>
                          Today
                        </Meta>
                        <View style={{ gap: 34 }}>{todayChats}</View>
                      </>
                    ) : filter === 'Chats' ? (
                      <Meta tone="tertiary">No chats yet. Pull the card down to start one.</Meta>
                    ) : null}
                    {filter === 'Chats' ? null : (
                      <>
                        <Tile
                          onPress={() => router.push('/ways')}
                          lead={
                            <View
                              style={{
                                width: 48,
                                height: 48,
                                borderRadius: 24,
                                backgroundColor: colour.ink,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Head tone="inverse">₦</Head>
                            </View>
                          }
                          title="Nothing has moved yet"
                          sub="Your first transfer shows up here"
                        />
                        <View style={{ alignSelf: 'center', marginTop: 4 }}>
                          <Button label="Receive" leading="receive-filled" badge size={40} full={false} onPress={openReceive} />
                        </View>
                      </>
                    )}
                  </Animated.View>
                </>
              ) : (
                <>
                  {dayHead('What I noticed, and every naira that moved.')}
                  {chips}
                  <Animated.View style={[{ gap: frame.columnGap }, dayStyle]}>
                    <View style={{ gap: 8 }}>
                      <Meta tone="secondary" style={{ fontSize: 16, lineHeight: 24 }}>
                        Today
                      </Meta>
                      {h.health !== null && filter !== 'Chats' ? <ScoreRow score={h.health} title="Money health" sub={h.healthMove} onPress={() => router.push('/health')} /> : null}
                    </View>
                    {todayChats.length ? <View style={{ gap: 34 }}>{todayChats}</View> : filter === 'Chats' ? <Meta tone="tertiary">No chats yet. Pull the card down to start one.</Meta> : null}
                    {insight('topup', { onDismiss: true })}
                    <View style={{ gap: 34 }}>{rows('today', 0, 4)}</View>
                    {insight('data')}
                    <View style={{ gap: 34 }}>{rows('today', 4)}</View>
                    {insight('changes')}
                    {h.ledger.length && filter !== 'Chats' ? (
                      <>
                        <Meta tone="secondary">Yesterday</Meta>
                        <Tile to="/card" plain go lead={<Mark glyph="card" />} title="Your card is ready" sub="Spend online anywhere" />
                        <View style={{ gap: 34 }}>{rows('yesterday', 0, 2)}</View>
                        {insight('spend')}
                        <View style={{ gap: 34 }}>{rows('yesterday', 2)}</View>
                      </>
                    ) : null}
                    {h.footer && filter !== 'Chats' ? <Meta tone="tertiary">{h.footer}</Meta> : null}
                  </Animated.View>
                </>
              )}
            </View>
          </Pane>
        </Animated.ScrollView>

        {/* the day below the open card: a tap on it, or a push up, brings the card back up */}
        {opened ? (
          <Animated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0 }, veilStyle]}>
            <GestureDetector gesture={veilGesture}>
              <View accessibilityRole="button" accessibilityLabel="Back to the day" style={{ flex: 1 }}>
                {/* the shortcuts under the chips: each hands its thing to the chat
                  above; a push up that starts on one still closes the card */}
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      left: frame.sidePad,
                      right: frame.sidePad,
                      top: SHORTCUTS_TOP,
                      height: SHORTCUTS_H,
                    },
                    shortcutsStyle,
                  ]}
                >
                  <Shortcuts
                    items={[
                      { glyph: 'power', label: 'Bills', onPress: () => router.push('/bills') },
                      { glyph: 'data', label: 'Data', onPress: () => router.push('/buy') },
                      { glyph: 'grid', label: 'Services', onPress: () => router.push('/services') },
                      { glyph: 'camera', label: 'Photo', onPress: toCamera },
                    ]}
                  />
                </Animated.View>
              </View>
            </GestureDetector>
          </Animated.View>
        ) : null}
      </Animated.View>
      {/* the passcode, on its sheet over everything, before money moves */}
      {guard ? (
        <PasscodeSheet
          key={guard.panelId}
          amount={naira(Math.abs(guard.panel.move?.amount ?? guard.panel.action?.amount ?? 0))}
          name={whoFor(guard.panel).name}
          detail={whoFor(guard.panel).detail}
          verify={app.checkPasscode}
          onDone={guardDone}
          onCancel={() => setGuard(null)}
          faceMissed={LAB && asked.face === 'missed'}
        />
      ) : null}
      {receive && account ? <ReceiveSheet account={account} onDismiss={() => setReceive(false)} /> : null}
      {peek ? <ReceiptPeek card={peek.card} at={peek.at} onClose={() => setPeek(null)} /> : null}
      {pick ? (
        <SavedPeek
          kind={pick.kind}
          list={pick.kind === 'person' ? saved.people : pick.kind === 'line' ? saved.lines.filter(l => !l.own) : saved.meters}
          at={pick.at}
          onPick={b => {
            const { values, found } = pickedValues(b, pick.ask);
            talk.fill(pick.ask.id, values, found);
            setPick(null);
          }}
          onClose={() => setPick(null)}
        />
      ) : null}
    </View>
  );
}

/* The row of shortcuts under the open card: a glyph on a disc and a word,
   four across, each a quick way into what the chat above can do. */
function Shortcuts({ items }: { items: { glyph: IconName; label: string; onPress: () => void }[] }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {items.map(i => (
        <Tap key={i.label} accessibilityRole="button" accessibilityLabel={i.label} onPress={i.onPress} style={{ width: 72, alignItems: 'center', gap: 4 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colour.surface2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={i.glyph} size={20} colour={colour.ink} />
          </View>
          <Caption tone="secondary">{i.label}</Caption>
        </Tap>
      ))}
    </View>
  );
}

/** What a pick from the list puts into the ask panel. */
function pickedValues(b: Beneficiary, ask: AskPanel): { values: Parameters<ReturnType<typeof useConversation>['fill']>[1]; found?: Parameters<ReturnType<typeof useConversation>['fill']>[2] } {
  if (b.kind === 'person') return { values: { who: b.name }, found: { person: { name: b.name, bank: b.bank, number: b.number } } };
  if (b.kind === 'line') return { values: { number: b.number, plan: ask.tool === 'data' ? b.plan : undefined, amount: ask.tool === 'airtime' ? (b.amount ?? ask.values.amount) : ask.values.amount } };
  return { values: { disco: b.disco, meterKind: b.meterKind, meter: b.meter, amount: ask.values.amount ?? b.amount }, found: { meter: { name: b.name, address: '' } } };
}

/** Who the money is going to, for the row on the passcode sheet: the person
    with their bank and account for a transfer, what it is for otherwise. */
function whoFor(panel: Panel): { name: string; detail?: string } {
  if (panel.person) return { name: panel.person.name, detail: `${panel.person.bank} · ${groupAccount(panel.person.number)}` };
  if (panel.move) return { name: panel.move.name, detail: panel.move.detail };
  return { name: panel.title };
}

/* A chat in the day: the mark, what it was about, what it came to, and
   when. One Beetle started and you have not opened yet carries a dot. */
function ChatRow({ chat, onPress }: { chat: ChatRecord; onPress: () => void }) {
  return (
    <Tap accessibilityRole="button" accessibilityLabel={chat.title} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: space.s5 }}>
      <Icon name="mark" size={20} colour={colour.accent} />
      <View style={{ flex: 1, gap: 2 }}>
        <RowText numberOfLines={1}>{chat.title}</RowText>
        <Meta tone="secondary" numberOfLines={1}>
          {chat.startedBy === 'beetle' ? 'Beetle' : 'You'} · {chat.detail}
        </Meta>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {chat.unread ? (
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colour.accent,
            }}
          />
        ) : null}
        <Label tone="secondary">{chat.time}</Label>
      </View>
    </Tap>
  );
}

export { CLOSED_H };
