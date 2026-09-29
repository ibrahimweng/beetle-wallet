/* Home. The black card at the top, and under it the day: what the agent
   noticed, every naira that moved, and every chat — the ones you started
   and the ones Beetle did. Pull the card down and it becomes the chat,
   nearly the whole screen, with the head of the day and its chips still
   showing below as the way back. The ask bar lives at the card's foot. The
   first time on this phone, the card dips on its own so the pull is found.
   Nothing here leaves anyone stuck: the header pulls back up, a tap on the
   day below closes the chat, and so does the phone's own back. Closing the
   card files the chat in the day; opening it again starts a new one, and
   a chat's row in the day picks it back up where it was. */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Keyboard, Platform, Pressable, TextInput, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { useAnimatedScrollHandler, useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Button, Filters, Head, Icon, Insight, Label, LedgerRow, Mark, Meta, Pane, Row as RowText, ScoreRow, Tap, Tile, colour, frame, keys, settle, space, toast, useStill } from '../../design';
import type { Move } from '../../services';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { Chat } from '../agent/Chat';
import { turn, useConversation, type Turn } from '../agent/conversation';
import { clock, detailOf, titleOf, useChats, type Chat as ChatRecord } from '../agent/chats';
import { transferPanel, PEOPLE } from '../../services/agent';
import { handoff } from '../scan/handoff';
import { samplePhoto } from '../scan/sample';
import { LAB } from '../../lab/enabled';
import { glance, holdingsFor, type LedgerRow as Row } from './account';
import { AskBar } from './AskBar';
import { CLOSED_H, WalletCard, useCardTop } from './WalletCard';
import { chatPointedOut, markChatPointedOut } from './first';
import { kobo, naira, signed } from '../../lib/format';

const next = (what: string) => () => toast(`${what} is the next flow to build.`);

/** What stays showing under the open card: the gap, the head of the day, and its chips. */
const BELOW = 32 + 56 + 12 + 34 + 20;

type Filter = 'All' | 'Insights' | 'In' | 'Out' | 'Chats';
const FILTERS: Filter[] = ['All', 'Insights', 'In', 'Out', 'Chats'];

export function Home() {
  const router = useRouter();
  const app = useApp();
  const ok = useSessionGuard();
  const still = useStill();
  const { height: H } = useWindowDimensions();
  const { headBand } = useCardTop();
  const asked = useLocalSearchParams<{ chat?: string }>();

  const [filter, setFilter] = useState<Filter>('All');
  const [put, setPut] = useState<string[]>([]);
  const [moves, setMoves] = useState<Row[]>([]);
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
      kb.value = withTiming(e.endCoordinates.height, { duration: 220, easing: settle });
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
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  const balance = (h?.everyday ?? 0) + moves.reduce((a, r) => a + r.amount, 0);
  const rate = h?.rate ?? 1552;

  /* ---- the conversation, and the chats it becomes ---- */
  const context = useCallback(() => ({ account: account!, balance, rate }), [account, balance, rate]);
  const onMove = useCallback((m: Move) => {
    const id = `m${Date.now()}`;
    const time = m.detail.slice(-5);
    setMoves(list => [{ id, day: 'today', time, icon: m.icon, name: m.name, detail: m.detail, amount: m.amount, status: 'done', kind: m.kind }, ...list]);
  }, []);
  const talk = useConversation(context, onMove);
  const turnsRef = useRef(talk.turns);
  turnsRef.current = talk.turns;
  const pendingRef = useRef(talk.pending);
  pendingRef.current = talk.pending;
  const { chats, file, read } = useChats(account?.accountNumber, !!account?.demo);
  /** the chat the card holds, if it came from the day */
  const current = useRef<ChatRecord | null>(null);
  /** the last chat was filed; the next opening starts afresh */
  const stale = useRef(false);

  /* Beetle opens a fresh chat: with something it noticed, taking turns, or
     for a new account with what it can do */
  const greeting = useCallback(() => {
    const list = h?.insights ?? [];
    const noticed = list.length ? list[chats.length % list.length]?.body : undefined;
    return noticed ?? `Hello ${account?.firstName ?? 'there'}. I can send money, top up, buy data, and read an account number off a photo. What do you need?`;
  }, [h, chats.length, account]);

  const begin = useCallback(
    (opening?: string) => {
      let empty = turnsRef.current.length === 0;
      if (stale.current) {
        talk.reset();
        current.current = null;
        stale.current = false;
        empty = true;
      }
      if (empty) talk.open(opening ?? greeting());
      else if (opening) talk.open(opening);
    },
    [talk, greeting],
  );

  /* the card closing files the chat, if anything was said in it */
  const fileCurrent = useCallback(() => {
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
      });
    }
    stale.current = true;
  }, [file]);

  const show = useCallback(
    (to: boolean, opts: { greet?: boolean; opening?: string } = {}) => {
      setOpened(to);
      if (to) {
        page.current?.scrollTo({ y: 0, animated: true });
        if (opts.greet !== false) begin(opts.opening);
      } else {
        Keyboard.dismiss();
        fileCurrent();
      }
      open.value = withSpring(to ? 1 : 0, keys);
    },
    [open, begin, fileCurrent],
  );

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
      show(false);
      return true;
    });
    return () => sub.remove();
  }, [opened, show]);

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
  }, [ok, asked.chat, show, talk, chats, reopen]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    void talk.ask({ text });
  };
  const toCamera = () => router.push('/scan');

  const veilStyle = useAnimatedStyle(() => ({ top: openH.value }));

  if (!ok || !app.session || !h || !account) return null;
  const ledger = [...moves, ...h.ledger];
  const away = (k: string) => setPut(p => [...p, k]);
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
              onPress={next('The receipt')}
            />
          ));
  const insight = (id: string, extra?: { onDismiss?: boolean }) => {
    const i = h.insights.find(x => x.id === id);
    if (!i || put.includes(id) || filter === 'In' || filter === 'Out' || filter === 'Chats') return null;
    return <Insight kicker={i.kicker} body={i.body} action={i.action} onAction={() => askFor(i.action)} onDismiss={extra?.onDismiss ? () => away(id) : undefined} />;
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
        <Pressable accessibilityRole="button" onPress={next('History')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Label style={{ color: colour.accentDeep }}>See all</Label>
          <Icon name="chevron" size={12} colour={colour.accentDeep} />
        </Pressable>
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
      <Animated.ScrollView
        ref={page}
        onScroll={onScroll}
        scrollEventThrottle={16}
        scrollEnabled={!opened}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
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
            dollars={`~ ${Math.round(balance / rate).toLocaleString('en-NG')} USD`}
            hint={hint}
            onSend={() => {
              show(true, { opening: 'Who should I send to, and how much? A name I know, or an account number — or show me a photo of one.' });
              setTimeout(() => input.current?.focus(), 380);
            }}
            onReceive={next('Receiving')}
            onDollars={() => askFor('What about dollars?')}
            chat={<Chat talk={talk} active={opened} top={headBand + 20} />}
            foot={<AskBar ref={input} value={draft} onChange={setDraft} onSubmit={send} onCamera={toCamera} />}
          />
          <View style={{ paddingHorizontal: frame.sidePad, paddingTop: 32, gap: frame.columnGap }}>
            {empty ? (
              <>
                {dayHead('Nothing to notice yet.')}
                {chips}
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
                      onPress={next('Ways to be paid')}
                      lead={
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colour.ink, alignItems: 'center', justifyContent: 'center' }}>
                          <Head tone="inverse">₦</Head>
                        </View>
                      }
                      title="Nothing has moved yet"
                      sub="Your first transfer shows up here"
                    />
                    <View style={{ alignSelf: 'center', marginTop: 4 }}>
                      <Button label="Receive" leading="receive-filled" badge size={40} full={false} onPress={next('Receiving')} />
                    </View>
                  </>
                )}
              </>
            ) : (
              <>
                {dayHead('What I noticed, and every naira that moved.')}
                {chips}
                <View style={{ gap: 8 }}>
                  <Meta tone="secondary" style={{ fontSize: 16, lineHeight: 24 }}>
                    Today
                  </Meta>
                  {h.health !== null && filter !== 'Chats' ? <ScoreRow score={h.health} title="Money health" sub={h.healthMove} onPress={next('Money health')} /> : null}
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
                    <Tile onPress={next('The card')} plain go lead={<Mark glyph="card" />} title="Your card is ready" sub="Spend online anywhere" />
                    <View style={{ gap: 34 }}>{rows('yesterday', 0, 2)}</View>
                    {insight('spend')}
                    <View style={{ gap: 34 }}>{rows('yesterday', 2)}</View>
                  </>
                ) : null}
                {h.footer && filter !== 'Chats' ? <Meta tone="tertiary">{h.footer}</Meta> : null}
              </>
            )}
            <Pressable accessibilityRole="button" onPress={() => app.signOut().then(() => router.replace('/way-in'))} style={{ alignSelf: 'center', paddingVertical: 8 }}>
              <Label tone="secondary">Sign out</Label>
            </Pressable>
          </View>
        </Pane>
      </Animated.ScrollView>

      {/* the day below the open card: a tap on it brings the card back up */}
      {opened ? (
        <Animated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0 }, veilStyle]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to the day" onPress={() => show(false)} style={{ flex: 1 }} />
        </Animated.View>
      ) : null}
    </View>
  );
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
        {chat.unread ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colour.accent }} /> : null}
        <Label tone="secondary">{chat.time}</Label>
      </View>
    </Tap>
  );
}

export { CLOSED_H };
