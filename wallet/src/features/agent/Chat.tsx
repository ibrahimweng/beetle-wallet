/* The chat inside the card: every turn so far, the newest at the foot, each
   arriving out of a blur; the dots while Beetle thinks. It keeps the foot in
   view as the conversation grows. A receipt in it opens where it is, the
   way a line opens on Activities (ChatOpen.tsx): the chat holds still while
   it is open, scrolled up in step if the receipt would run under the chips
   and the ask bar. */
import React, { useContext, useEffect, useMemo, useRef, type RefObject } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { scrollTo, useAnimatedReaction, useAnimatedRef, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { Pane, measure, type Rect } from '../../design';
import type { OpenCtl } from '../activities/OpenLine';
import { ChatDetails } from './ChatOpen';
import type { ReceiptCard as Card } from './conversation';
import type { Account, AskPanel, Beneficiaries } from '../../services';
import { CardGesturesContext } from '../home/WalletCard';
import { AskPanelView } from './AskPanel';
import { LoanCard, ReceiveCard, SaveCard } from './Cards';
import type { Standing } from '../goal/goals';
import type { Term } from '../loan/loan';
import { AsideLine, Said, Thinking, Thoughts, ToolPanel, Yours } from './Dark';
import { ReceiptCard } from './ReceiptCard';
import { isAsk, isPanel, type Conversation } from './conversation';

/** A panel stops short of the right edge, as the frame draws it. */
const PANEL_INSET = 60;
/** A card with fields to fill keeps nearly all of the width: the picker's ruler needs it. */
const ASK_INSET = 12;

/** The receipt open in the chat, and what it needs: whose it is, its numbers, how far the chat scrolls for it, the
    picture's box, the session id asked for, and its ways on. */
export type ChatOpened = {
  id: string;
  ctl: OpenCtl;
  shift: SharedValue<number>;
  slip: RefObject<View | null>;
  session: boolean;
  onSession: () => void;
  onShare: () => void;
  onRecord: () => void;
  onReady: () => void;
};

export function Chat({
  talk,
  active,
  top = 0,
  bottom = 8,
  confirm,
  saved,
  balance,
  account,
  tag,
  canBorrow = false,
  loanLeft,
  onConfirmAsk,
  onBorrow,
  onSetUp,
  goals = [],
  onSave,
  onStartGoal,
  onReceipt,
  opened = null,
}: {
  talk: Conversation;
  active: boolean;
  /** room left at the top, under the band the header sits on */
  top?: number;
  /** and at the foot, under the bar */
  bottom?: number;
  /** a panel's button, where something stands between it and the move —
      the passcode; the conversation's own confirm otherwise */
  confirm?: (panelId: string) => void;
  /** the people, lines and meters paid before, for the ask panels */
  saved?: Beneficiaries;
  /** what Everyday holds: a card's picker stops there */
  balance?: number;
  /** whose chat it is, for the Receive card */
  account?: Account;
  /** the account's own $tag */
  tag?: string;
  /** borrowing is turned on */
  canBorrow?: boolean;
  /** what is left of the borrowing limit */
  loanLeft?: number;
  /** a card's own button, with all it needs: on to the passcode */
  onConfirmAsk?: (ask: AskPanel) => void;
  /** the Loan card's Borrow */
  onBorrow?: (turnId: string, amount: number, days: Term) => void;
  /** the Loan card's way to finish setting up */
  onSetUp?: () => void;
  /** each goal and what it holds, for the Save card */
  goals?: Standing[];
  /** the Save card's Put away */
  onSave?: (turnId: string, goalId: string, amount: number) => void;
  /** the Save card with no goal yet: start one */
  onStartGoal?: () => void;
  /** a receipt card, opened where it is */
  onReceipt?: (card: Card, at: Rect) => void;
  /** the receipt open in the chat, if one is */
  opened?: ChatOpened | null;
}) {
  const list = useAnimatedRef<Animated.ScrollView>();
  const count = talk.turns.length + (talk.thinking ? 1 : 0);
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => list.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [count, active]);

  /* pushed up once it has scrolled to its end, the chat closes the card:
     the card's own drag, running alongside the list's scroll */
  const card = useContext(CardGesturesContext);
  const viewH = useRef(0);
  /* how far it has scrolled, how tall it is and where it is on the screen: what an open receipt is laid out against */
  const scrolled = useSharedValue(0);
  const tall = useSharedValue(0);
  const at = useSharedValue(0);
  const from = useSharedValue(0);
  const frame = useRef<View>(null);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrolled.value = e.nativeEvent.contentOffset.y;
    if (!card) return;
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    card.atEnd.value = contentOffset.y + layoutMeasurement.height >= contentSize.height - 2;
  };

  /* a receipt opening: where the chat stood, and where it is on the screen */
  const openId = opened?.id ?? null;
  useEffect(() => {
    if (!openId) return;
    from.value = scrolled.value;
    void measure(frame).then(r => (at.value = r.y));
  }, [openId]); // eslint-disable-line react-hooks/exhaustive-deps
  /* how far the chat has to move for the open receipt to stand clear of the header above and the chips and the ask bar
     below, once it is measured; then the chat moves that far in step with it */
  const ctl = opened?.ctl;
  const shift = opened?.shift;
  useAnimatedReaction(
    () => (ctl && ctl.rowH.value > 0 ? ctl.grown.value : 0),
    grown => {
      if (!ctl || !shift || !grown) return;
      const y = ctl.top.value - at.value;
      const over = y + ctl.rowH.value + grown - (tall.value - bottom);
      shift.value = y < top ? y - top : over > 0 ? Math.min(over, y - top) : 0;
    },
    [ctl, shift, top, bottom],
  );
  useAnimatedReaction(
    () => (ctl ? ctl.p.value : 0),
    p => {
      if (shift && shift.value) scrollTo(list, 0, Math.max(0, from.value + shift.value * p), false);
    },
    [shift],
  );
  /* the open receipt reaches out to the chat's right edge as it opens */
  const reach = useAnimatedStyle(() => ({ marginRight: PANEL_INSET * (1 - (ctl ? Math.max(0, Math.min(1, ctl.p.value)) : 0)) }), [ctl]);
  const openRow = useRef<View>(null);
  const sized = (_w: number, h: number) => {
    if (card) card.atEnd.value = h <= viewH.current + 1 || card.atEnd.value;
    /* not while a receipt is open: it grows, and the chat moves for it only as far as it needs */
    if (active && !opened) list.current?.scrollToEnd({ animated: true });
  };
  const native = useMemo(() => Gesture.Native(), []);
  const together = useMemo(() => (card ? Gesture.Simultaneous(native, card.pan) : native), [card, native]);

  const body = (
    <Animated.ScrollView
      ref={list}
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 24, paddingBottom: bottom, paddingTop: top }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={active && !opened}
      bounces={false}
      overScrollMode="never"
      onScroll={onScroll}
      scrollEventThrottle={32}
      onLayout={e => {
        viewH.current = e.nativeEvent.layout.height;
        tall.value = e.nativeEvent.layout.height;
      }}
      onContentSizeChange={sized}
    >
      {talk.turns.map(t => {
        let body: React.ReactNode;
        if (t.who === 'you') body = <Yours photo={!!t.photo}>{t.text}</Yours>;
        else if (t.block.kind === 'say') body = <Said>{'shown' in t && t.shown !== undefined ? t.shown : t.block.text}</Said>;
        else if (t.block.kind === 'note') body = <Said title={t.block.title}>{t.block.body}</Said>;
        else if (t.block.kind === 'aside') body = <AsideLine>{t.block.text}</AsideLine>;
        else if (t.block.kind === 'thought') body = <Thoughts lines={t.block.lines} live={false} />;
        else if (t.block.kind === 'receipt') {
          const card = t.block.card;
          const isOpen = !!opened && opened.id === card.rowId && card.kind !== 'request';
          const tap = onReceipt && card.kind !== 'request' ? (r: Rect) => onReceipt(card, r) : undefined;
          body =
            isOpen && opened ? (
              <Animated.View ref={openRow} collapsable={false} style={reach} testID="chat-receipt-open">
                <ReceiptCard card={card} to={card.to ?? `/receipt/${card.rowId}`} onOpen={tap} p={opened.ctl.p}>
                  <ChatDetails
                    key={card.rowId}
                    card={card}
                    ctl={opened.ctl}
                    row={openRow}
                    slip={opened.slip}
                    session={opened.session}
                    onSession={opened.onSession}
                    onShare={opened.onShare}
                    onRecord={opened.onRecord}
                    onReady={opened.onReady}
                  />
                </ReceiptCard>
              </Animated.View>
            ) : (
              <View style={{ marginRight: PANEL_INSET }}>
                <ReceiptCard card={card} to={card.to ?? `/receipt/${card.rowId}`} onOpen={tap} />
              </View>
            );
        } else if (isAsk(t)) {
          const ask = t.block.ask;
          body = (
            <View style={{ marginRight: ASK_INSET }}>
              <AskPanelView
                ask={ask}
                state={t.state}
                saved={saved}
                balance={balance}
                onFill={(values, found, extra) => talk.fill(ask.id, values, found, extra)}
                onConfirm={() => onConfirmAsk?.(ask)}
                onFocus={() => setTimeout(() => list.current?.scrollToEnd({ animated: true }), 350)}
              />
            </View>
          );
        } else if (t.block.kind === 'receive') {
          body = account ? (
            <View style={{ marginRight: PANEL_INSET }}>
              <ReceiveCard account={account} tag={tag ?? account.firstName.toLowerCase()} />
            </View>
          ) : null;
        } else if (t.block.kind === 'loan' && 'state' in t) {
          const turnId = t.id;
          body = (
            <View style={{ marginRight: ASK_INSET }}>
              <LoanCard
                state={t.state as 'open' | 'done'}
                taken={'taken' in t ? t.taken : undefined}
                canBorrow={canBorrow}
                left={loanLeft}
                onSetUp={() => onSetUp?.()}
                onBorrow={(amount, days) => onBorrow?.(turnId, amount, days)}
              />
            </View>
          );
        } else if (t.block.kind === 'save' && 'state' in t) {
          const turnId = t.id;
          const { amount, goalId } = t.block;
          body = (
            <View style={{ marginRight: ASK_INSET }}>
              <SaveCard
                state={t.state as 'open' | 'done'}
                saved={'saved' in t ? t.saved : undefined}
                goals={goals}
                balance={balance ?? 0}
                start={{ amount, goalId }}
                onSave={(goal, much) => onSave?.(turnId, goal, much)}
                onStart={() => onStartGoal?.()}
              />
            </View>
          );
        } else if (isPanel(t)) {
          const panel = t.block.panel;
          body = (
            <View style={{ marginRight: PANEL_INSET }}>
              <ToolPanel
                panel={panel}
                state={t.state}
                quick={!!t.quick}
                onReady={() => talk.ready(panel.id)}
                onAction={() => (confirm ?? talk.confirm)(panel.id)}
                onEdit={row => talk.edit(panel.id, row)}
              />
            </View>
          );
        }
        return <Pane key={t.id}>{body}</Pane>;
      })}
      {talk.thinking ? <Pane key="thinking">{talk.thinking.lines.length ? <Thoughts lines={talk.thinking.lines} live /> : <Thinking />}</Pane> : null}
      {!talk.turns.length && !talk.thinking ? <View style={{ height: 8 }} /> : null}
    </Animated.ScrollView>
  );
  return (
    <View ref={frame} collapsable={false} style={{ flex: 1 }}>
      <GestureDetector gesture={together} touchAction="pan-y">
        {body}
      </GestureDetector>
    </View>
  );
}
