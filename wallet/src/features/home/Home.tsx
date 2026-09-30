/* Home, the first of the three pages. The black card at the top, and under
   it four cards two by two: Savings, Loan, Card and Services (see Grid).
   The record is Activities' now, the next page along. Pull the card down
   and it becomes the chat, nearly the whole screen, with the row of
   shortcuts still showing below it as the way back. The ask bar lives at
   the card's foot. The first time on this phone, the card dips on its own
   so the pull is found. Nothing here leaves anyone stuck: the header pulls
   back up, a tap below the open card closes the chat, and so does the
   phone's own back.

   The chats live in the chat: a soft light down the left edge while it is
   open, and a swipe from there brings in the drawer with New chat and the
   chats (see Drawer). Closing the card files the chat; a pull down within
   the hour carries it on, after the hour a new one starts. A receipt in
   the chat opens where it is, a little larger (see ChatReceipt). Send on
   the card opens the Send money page. */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Keyboard, Platform, TextInput, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Caption, Icon, Pane, Tap, colour, frame, keys, settle, useStill } from '../../design';
import type { IconName } from '../../icons';
import { DEMO_SAVED, beneficiariesOf, ownLine, type AskPanel, type Beneficiary, type Move, type Panel } from '../../services';
import { useApp } from '../onboarding/store';
import { Chat } from '../agent/Chat';
import { ChatReceipt } from '../agent/ChatReceipt';
import { ChatsDrawer, ChatsEdge, EDGE } from '../agent/Drawer';
import { isPanel, transcriptOf, turn, useConversation, type Turn } from '../agent/conversation';
import { clock, detailOf, titleOf, toCarryOn, useChats, type Chat as ChatRecord } from '../agent/chats';
import { transferPanel, PEOPLE } from '../../services/agent';
import { handoff } from '../scan/handoff';
import { samplePhoto } from '../scan/sample';
import { PasscodeSheet, lockedFor } from '../passcode';
import { ReceiveSheet, SAMPLE_ARRIVAL, arrivalChat, arrivalLine, arrivalMove, type Arrival } from '../receive';
import { pageFor } from '../request/intent';
import { LAB } from '../../lab/enabled';
import { holdingsFor } from './account';
import { balanceOf, rowFrom, useMoves } from './moves';
import { AskBar } from './AskBar';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { CLOSED_H, FOOT_BAND, WalletCard, useCardDrag, useCardTop } from './WalletCard';
import { BAR_H, foot, useFoot } from '../more/Foot';
import { moreTo, type MoreItem } from '../more/More';
import { useOnline } from '../offline';
import { SavedPeek } from '../agent/SavedPeek';
import type { SavedKind } from '../agent/AskPanel';
import { JourneyProvider, useRecession, type Rect } from '../../design/journey';
import type { ReceiptCard as Card } from '../agent/conversation';
import { chatPointedOut, markChatPointedOut } from './first';
import { useSetup } from '../setup/store';
import { tabs, useHoldPages, usePage } from '../tabs';
import { Grid } from './Grid';
import { groupAccount, kobo, naira } from '../../lib/format';

/** What stays showing under the open card: the row of shortcuts, 20 under
    it, and the phone's own foot under them. */
const SHORTCUTS_TOP = 20;
const SHORTCUTS_H = 64;
/** The grid, this far under the closed card. */
const GRID_TOP = 24;
/** The chats drawer: most of the width, the chat showing beside it. */
const drawerWidth = (W: number) => Math.min(340, Math.round(W * 0.82));

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
  const { closedH, haze } = useCardTop();
  const asked = useLocalSearchParams<{ chat?: string; receive?: string; say?: string; about?: string; more?: string; face?: string; typing?: string; kb?: string }>();
  const receding = useRecession();

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
  /* what stays showing under the open card: the shortcuts, and the phone's own foot */
  const below = SHORTCUTS_TOP + SHORTCUTS_H + Math.max(16, insets.bottom);
  /* what is visible above the keyboard: the window if it shrank for it, else the window less the keyboard */
  const visible = useDerivedValue(() => Math.min(H, full - kb.value));
  const openH = useDerivedValue(() => Math.min(full - below, visible.value - 8));
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
  /** a receipt in the chat, opened where it is */
  const [chatPeek, setChatPeek] = useState<{ card: Card; at: Rect } | null>(null);
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
  const talk = useConversation(context, onMove);
  turnsRef.current = talk.turns;
  const pendingRef = useRef(talk.pending);
  pendingRef.current = talk.pending;
  const { chats, file, read } = useChats(account?.accountNumber, !!account?.demo);
  const chatsRef = useRef(chats);
  chatsRef.current = chats;
  /** the chat the card holds, if it came from the drawer */
  const current = useRef<ChatRecord | null>(null);
  /** the last chat was filed; the next opening starts afresh */
  const stale = useRef(false);
  /** a panel's move waiting on the passcode */
  const [guard, setGuard] = useState<{ panelId: string; panel: Panel } | null>(null);
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
     ended by New chat is filed too, and never carries on */
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
    stale.current = false;
    talk.open(greeting());
  }, [fileCurrent, talk, greeting]);

  /* a chat picked in the drawer: this one is filed, and that one picks up where it was left */
  const switchTo = useCallback(
    (chat: ChatRecord) => {
      if (current.current?.id === chat.id) return;
      fileCurrent();
      talk.load(chat.turns, chat.pending);
      current.current = chat;
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
      stale.current = false;
      read(chat.id);
      show(true, { greet: false });
    },
    [talk, read, show],
  );

  /* the phone's own back puts the drawer away, then closes the chat, before it leaves the screen */
  useEffect(() => {
    if (!opened) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (guard) setGuard(null);
      else if (receive) setReceive(false);
      else if (drawer) closeDrawer();
      else show(false);
      return true;
    });
    return () => sub.remove();
  }, [opened, show, guard, receive, drawer, closeDrawer]);

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

  /* a photo the camera took comes straight into the chat, on Home */
  useFocusEffect(
    useCallback(() => {
      const photo = handoff.take();
      if (!photo) return;
      tabs.go('home');
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
    tabs.go('home');
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
  /* the foot is the bar, while this page is the one showing: it goes down as the card opens, and More comes up out of its plus */
  useFoot({ kind: 'bar', open, hidden: opened, onPick: pickMore }, active);

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
  /* the shortcuts arrive under the card with the rest of it opening, and
     the grid goes as it opens, so what stays is the row and nothing else */
  const shortcutsStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, (open.value - 0.6) / 0.4)),
  }));
  const gridStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, Math.max(0, (open.value - 0.25) / 0.35)),
  }));
  /* the chats' edge runs down the chat, between its header and its ask bar, shows as the chat does, and goes as the drawer comes in over it */
  const edgeStyle = useAnimatedStyle(() => ({
    top: haze,
    height: Math.max(0, openH.value - haze - FOOT_BAND),
    opacity: Math.min(1, Math.max(0, (open.value - 0.6) / 0.4)) * (1 - drawerIn.value),
  }));
  /* below the open card: a tap on it, or a push up on it, brings the card back up */
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
  /* a tap below the card closes it — except on the shortcuts row, whose
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
  const DW = drawerWidth(W);

  return (
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
                  onSaved={(ask, kind, at) => setPick({ ask, kind, at })}
                  onReceipt={(card, at) => {
                    /* only while the chat is open: the card may have closed while the line was being measured */
                    if (!openedRef.current) return;
                    Keyboard.dismiss();
                    setChatPeek({ card, at });
                  }}
                />
              }
              foot={<AskBar ref={input} value={draft} onChange={setDraft} onSubmit={send} onCamera={toCamera} />}
            />
            {/* the four cards, going as the card opens */}
            <Animated.View style={[{ paddingTop: GRID_TOP }, gridStyle]} pointerEvents={opened ? 'none' : 'auto'}>
              <Grid width={W} accountNumber={account.accountNumber} demo={!!account.demo} moves={moves} borrowing={setup.done} />
            </Animated.View>
          </Pane>
        </Animated.ScrollView>

        {/* below the open card: a tap on it, or a push up, brings the card back up */}
        {opened ? (
          <Animated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0 }, veilStyle]}>
            <GestureDetector gesture={veilGesture}>
              {/* a screen reader's activate lands at the middle, on the shortcuts' row, so it closes the card by name */}
              <View
                accessibilityRole="button"
                accessibilityLabel="Back to home"
                accessibilityActions={[{ name: 'activate' }]}
                onAccessibilityAction={e => e.nativeEvent.actionName === 'activate' && close()}
                style={{ flex: 1 }}
              >
                {/* the shortcuts: each opens a page of its own; a push up that starts on one still closes the card */}
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
      {/* the chats: the soft edge down the open chat, and the drawer it brings in */}
      {opened ? <ChatsEdge d={drawerIn} width={DW} style={edgeStyle} onOpen={() => setDrawer(true)} /> : null}
      {opened ? <ChatsDrawer d={drawerIn} open={drawer} width={DW} chats={chats} currentId={current.current?.id} onNew={startNew} onPick={switchTo} onClose={() => setDrawer(false)} /> : null}
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
      {chatPeek ? <ChatReceipt card={chatPeek.card} at={chatPeek.at} onClose={() => setChatPeek(null)} /> : null}
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

export { CLOSED_H, EDGE };
