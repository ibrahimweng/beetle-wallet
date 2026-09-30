/* The chat inside the card: every turn so far, the newest at the foot, each
   arriving out of a blur; the dots while Beetle thinks. It keeps the foot in
   view as the conversation grows. */
import React, { useContext, useEffect, useMemo, useRef } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Pane, type Rect } from '../../design';
import type { ReceiptCard as Card } from './conversation';
import type { AskPanel, Beneficiaries } from '../../services';
import { CardGesturesContext } from '../home/WalletCard';
import { AskPanelView, type SavedKind } from './AskPanel';
import { AsideLine, Said, Thinking, Thoughts, ToolPanel, Yours } from './Dark';
import { ReceiptCard } from './ReceiptCard';
import { isAsk, isPanel, type Conversation } from './conversation';

/** A panel stops short of the right edge, as the frame draws it. */
const PANEL_INSET = 60;
/** An ask panel, with fields to fill, keeps more of the width. */
const ASK_INSET = 32;

export function Chat({
  talk,
  active,
  top = 0,
  bottom = 8,
  confirm,
  saved,
  onSaved,
  onReceipt,
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
  /** an ask panel's line under its fields: the list of them, grown from the line */
  onSaved?: (ask: AskPanel, kind: SavedKind, at: Rect) => void;
  /** a receipt card, opened where it is */
  onReceipt?: (card: Card, at: Rect) => void;
}) {
  const list = useRef<ScrollView>(null);
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
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!card) return;
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    card.atEnd.value = contentOffset.y + layoutMeasurement.height >= contentSize.height - 2;
  };
  const sized = (_w: number, h: number) => {
    if (card) card.atEnd.value = h <= viewH.current + 1 || card.atEnd.value;
    if (active) list.current?.scrollToEnd({ animated: true });
  };
  const native = useMemo(() => Gesture.Native(), []);
  const together = useMemo(() => (card ? Gesture.Simultaneous(native, card.pan) : native), [card, native]);

  const body = (
    <ScrollView
      ref={list}
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 24, paddingBottom: bottom, paddingTop: top }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={active}
      bounces={false}
      overScrollMode="never"
      onScroll={onScroll}
      scrollEventThrottle={32}
      onLayout={e => {
        viewH.current = e.nativeEvent.layout.height;
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
          body = (
            <View style={{ marginRight: PANEL_INSET }}>
              <ReceiptCard card={card} to={card.to ?? `/receipt/${card.rowId}`} onOpen={onReceipt && card.kind !== 'request' ? at => onReceipt(card, at) : undefined} />
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
                onFill={(values, found) => talk.fill(ask.id, values, found)}
                onContinue={() => void talk.answer(ask.id)}
                onSaved={onSaved ? (kind, at) => onSaved(ask, kind, at) : undefined}
                onFocus={() => setTimeout(() => list.current?.scrollToEnd({ animated: true }), 350)}
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
    </ScrollView>
  );
  return (
    <GestureDetector gesture={together} touchAction="pan-y">
      {body}
    </GestureDetector>
  );
}
