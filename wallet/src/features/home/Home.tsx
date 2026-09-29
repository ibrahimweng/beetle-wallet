/* Home. The black card at the top, and under it the day: what the agent
   noticed and every naira that moved. Pull the card down and it becomes the
   chat, two thirds of the screen, with the head of the day still showing
   below as the way back; the ask bar rises out of the dock into the card's
   foot as it opens. The first time on this phone, the card dips on its own
   so the pull is found. Nothing here leaves anyone stuck: the header pulls
   back up, a tap on the day below closes the chat, and so does the phone's
   own back. */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Keyboard, Platform, Pressable, TextInput, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { ActionButton, Button, Dock, Filters, Head, Icon, Insight, Label, LedgerRow, Mark, Meta, Pane, ScoreRow, Tile, colour, frame, keys, settle, space, toast, useStill } from '../../design';
import type { Move } from '../../services';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { Chat } from '../agent/Chat';
import { turn, useConversation, type Turn } from '../agent/conversation';
import { transferPanel, PEOPLE } from '../../services/agent';
import { handoff } from '../scan/handoff';
import { samplePhoto } from '../scan/sample';
import { LAB } from '../../lab/enabled';
import { glance, holdingsFor, type LedgerRow as Row } from './account';
import { AskBar } from './AskBar';
import { CLOSED_H, FOOT_BAND, WalletCard } from './WalletCard';
import { chatPointedOut, markChatPointedOut } from './first';
import { kobo, naira, signed } from '../../lib/format';

const next = (what: string) => () => toast(`${what} is the next flow to build.`);

/** How much of the screen the open card takes. */
const SHARE = 0.66;

export function Home() {
  const router = useRouter();
  const app = useApp();
  const ok = useSessionGuard();
  const still = useStill();
  const { width: W, height: H } = useWindowDimensions();
  const asked = useLocalSearchParams<{ chat?: string }>();

  const [filter, setFilter] = useState<'All' | 'Insights' | 'In' | 'Out'>('All');
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
  const openH = useDerivedValue(() => Math.min(Math.round(full * SHARE), visible.value - 8));
  const onScroll = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y;
  });

  const account = app.session?.account;
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  const balance = (h?.everyday ?? 0) + moves.reduce((a, r) => a + r.amount, 0);
  const rate = h?.rate ?? 1552;

  /* ---- the conversation ---- */
  const context = useCallback(() => ({ account: account!, balance, rate }), [account, balance, rate]);
  const onMove = useCallback((m: Move) => {
    const id = `m${Date.now()}`;
    const time = m.detail.slice(-5);
    setMoves(list => [{ id, day: 'today', time, icon: m.icon, name: m.name, detail: m.detail, amount: m.amount, status: 'done', kind: m.kind }, ...list]);
  }, []);
  const talk = useConversation(context, onMove);

  /* the first time the chat opens with nothing said, Beetle opens it: with
     what it noticed today, or, for a new account, with what it can do */
  const greeted = useRef(false);
  const greet = useCallback(() => {
    if (greeted.current || talk.turns.length) return;
    greeted.current = true;
    const noticed = h?.insights[0]?.body;
    talk.open(noticed ?? `Hello ${account?.firstName ?? 'there'}. I can send money, top up, buy data, and read an account number off a photo. What do you need?`);
  }, [talk, h, account]);
  const show = useCallback(
    (to: boolean) => {
      setOpened(to);
      if (to) {
        page.current?.scrollTo({ y: 0, animated: true });
        greet();
      }
      open.value = withSpring(to ? 1 : 0, keys);
      if (!to) Keyboard.dismiss();
    },
    [open, greet],
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
      if (!openedRef.current) show(true);
      void talk.ask({ photo, text: draft.trim() || undefined });
      setDraft('');
    }, [show, talk, draft]),
  );

  /* the lab opens it somewhere along the way */
  const staged = useRef(false);
  useEffect(() => {
    if (!LAB || !ok || staged.current || !asked.chat) return;
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
      show(true);
    }
    if (asked.chat === 'photo') {
      show(true);
      samplePhoto().then(photo => talk.ask({ photo }));
    }
  }, [ok, asked.chat, show, talk]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    void talk.ask({ text });
  };
  const toCamera = () => router.push('/scan');

  /* ---- what moves with the card ---- */
  const barStyle = useAnimatedStyle(() => ({
    top: interpolate(open.value, [0, 1], [visible.value - frame.dockPad - 56 + 4, openH.value - FOOT_BAND + 20]),
    left: interpolate(open.value, [0, 1], [frame.sidePad, 16]),
    width: interpolate(open.value, [0, 1], [W - frame.sidePad * 2 - space.s2 - 56, W - 32]),
  }));
  const dockStyle = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, Math.max(0, (open.value - 0.2) / 0.4)) }));
  const veilStyle = useAnimatedStyle(() => ({ top: openH.value }));

  if (!ok || !app.session || !h || !account) return null;
  const ledger = [...moves, ...h.ledger];
  const away = (k: string) => setPut(p => [...p, k]);
  const rows = (day: 'today' | 'yesterday', from = 0, to = 99) =>
    glance(ledger, day, filter)
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
    if (!i || put.includes(id) || filter === 'In' || filter === 'Out') return null;
    return <Insight kicker={i.kicker} body={i.body} action={i.action} onAction={() => askFor(i.action)} onDismiss={extra?.onDismiss ? () => away(id) : undefined} />;
  };
  /* an insight's button hands the thing to Beetle */
  const askFor = (action: string) => {
    show(true);
    void talk.ask({ text: action });
  };

  const empty = !ledger.length;
  return (
    <View style={{ flex: 1, backgroundColor: colour.surface }}>
      <Animated.ScrollView
        ref={page}
        onScroll={onScroll}
        scrollEventThrottle={16}
        scrollEnabled={!opened}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: frame.bottomPad }}
      >
        <Pane style={{ gap: 0 }}>
          <WalletCard
            open={open}
            openH={openH}
            scrollY={scrollY}
            onSettle={to => {
              setOpened(to);
              if (to) greet();
            }}
            whole={naira(balance)}
            kobo={kobo(balance)}
            dollars={`~ ${Math.round(balance / rate).toLocaleString('en-NG')} USD`}
            hint={hint}
            onSend={() => {
              greeted.current = true;
              show(true);
              talk.open('Who should I send to, and how much? A name I know, or an account number — or show me a photo of one.');
              setTimeout(() => input.current?.focus(), 380);
            }}
            onReceive={next('Receiving')}
            onDollars={() => askFor('What about dollars?')}
            chat={<Chat talk={talk} active={opened} />}
          />
          <View style={{ paddingHorizontal: frame.sidePad, paddingTop: 32, gap: frame.columnGap }}>
            {empty ? (
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
                <View style={{ gap: space.s2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', height: 28 }}>
                    <Head style={{ flex: 1 }}>Activities</Head>
                    <Pressable accessibilityRole="button" onPress={next('History')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Label style={{ color: colour.accentDeep }}>See all</Label>
                      <Icon name="chevron" size={12} colour={colour.accentDeep} />
                    </Pressable>
                  </View>
                  <Meta tone="tertiary">Nothing to notice yet.</Meta>
                </View>
                <View style={{ marginTop: -8 }}>
                  <Filters options={['All', 'Insights', 'In', 'Out']} value={filter} onChange={v => setFilter(v as typeof filter)} />
                </View>
                <View style={{ alignSelf: 'center', marginTop: 4 }}>
                  <Button label="Receive" leading="receive-filled" badge size={40} full={false} onPress={next('Receiving')} />
                </View>
              </>
            ) : (
              <>
                <View style={{ gap: space.s2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', height: 28 }}>
                    <Head style={{ flex: 1 }}>Activities</Head>
                    <Pressable accessibilityRole="button" onPress={next('History')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Label style={{ color: colour.accentDeep }}>See all</Label>
                      <Icon name="chevron" size={12} colour={colour.accentDeep} />
                    </Pressable>
                  </View>
                  <Meta tone="secondary">What I noticed, and every naira that moved.</Meta>
                </View>
                <View style={{ marginTop: -8 }}>
                  <Filters options={['All', 'Insights', 'In', 'Out']} value={filter} onChange={v => setFilter(v as typeof filter)} />
                </View>
                <View style={{ gap: 8 }}>
                  <Meta tone="secondary" style={{ fontSize: 16, lineHeight: 24 }}>
                    Today
                  </Meta>
                  {h.health !== null ? <ScoreRow score={h.health} title="Money health" sub={h.healthMove} onPress={next('Money health')} /> : null}
                </View>
                {insight('topup', { onDismiss: true })}
                <View style={{ gap: 34 }}>{rows('today', 0, 4)}</View>
                {insight('data')}
                <View style={{ gap: 34 }}>{rows('today', 4)}</View>
                {insight('changes')}
                {h.ledger.length ? (
                  <>
                    <Meta tone="secondary">Yesterday</Meta>
                    <Tile onPress={next('The card')} plain go lead={<Mark glyph="card" />} title="Your card is ready" sub="Spend online anywhere" />
                    <View style={{ gap: 34 }}>{rows('yesterday', 0, 2)}</View>
                    {insight('spend')}
                    <View style={{ gap: 34 }}>{rows('yesterday', 2)}</View>
                  </>
                ) : null}
                {h.footer ? <Meta tone="tertiary">{h.footer}</Meta> : null}
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

      <Animated.View style={dockStyle} pointerEvents={opened ? 'none' : 'auto'}>
        <Dock hole action={<ActionButton onPress={next('The actions menu')} />} />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', zIndex: 5 }, barStyle]}>
        <AskBar
          ref={input}
          value={draft}
          onChange={setDraft}
          onSubmit={send}
          onFocus={() => {
            if (!openedRef.current) show(true);
          }}
          onCamera={toCamera}
        />
      </Animated.View>
    </View>
  );
}

export { CLOSED_H };
