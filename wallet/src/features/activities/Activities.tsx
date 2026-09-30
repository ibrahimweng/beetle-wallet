/* Activities, from the History frame: everything that moved, newest first,
   All / In / Out to narrow it, today and yesterday, and what Beetle makes of
   it at the foot. What is still on its way, did not go or came back stands
   first, with its status glyph and a chevron; what settled follows on the
   grey square. A settled line opens its receipt; one still on its way, that
   did not go or that came back opens its own page. The dock is the way
   back, the ask bar, and the plus for More. */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, GlyphHead, HistoryRow, JourneyProvider, SayCard, Screen, Segments, colour, type Rect } from '../../design';
import { ReceiptPeek } from '../receipts/Peek';
import { receiptFor } from '../receipts/receipts';
import type { ReceiptCard as Card } from '../agent/conversation';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { holdingsFor, type LedgerRow } from '../home/account';
import { balanceOf, useMoves } from '../home/moves';
import { naira, signed } from '../../lib/format';
import { askHome } from '../more/More';
import { useFoot } from '../more/Foot';
import { activityAmount, activityRows, type Segment } from './rows';

const TONE: Record<LedgerRow['status'], string> = { pending: colour.accent, failed: colour.alert, reversed: colour.ink, done: colour.ink };

export function Activities() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const account = app.session?.account;
  const { moves, ready } = useMoves(account?.accountNumber);
  const [segment, setSegment] = useState<Segment>('All');
  const [peek, setPeek] = useState<{ card: Card; at: Rect } | null>(null);
  const h = account ? holdingsFor(account) : null;
  const ledger = [...moves, ...(h?.ledger ?? [])];
  /* a new account's day, from the Nothing yet frame: nothing has moved, and the bar asks what shows up here */
  const nothing = ready && ledger.length === 0;
  /* the foot: Back, the ask bar with this page's question, and the plus the frame draws */
  useFoot({
    kind: 'ask',
    placeholder: nothing ? 'Ask what shows up here' : 'Ask about any of these',
    onAsk: q => askHome(router, q),
    onScan: () => router.push('/scan'),
    more: true,
    veil: peek ? 'recede' : undefined,
  });
  if (!ok || !account || !h) return null;
  const balanceNow = h.everyday + balanceOf(moves);
  const cardFor = (r: LedgerRow): Card => {
    const rc = receiptFor(r, { account, balanceNow, rows: ledger });
    return { rowId: r.id, to: r.kind === 'convert' ? `/converted/${r.id}` : undefined, amount: naira(rc.amount), line: rc.line, status: rc.status, time: r.time };
  };
  if (!ready)
    return (
      <Screen still>
        <View />
      </Screen>
    );
  const rows = (day: LedgerRow['day']) =>
    activityRows(ledger, day, segment).map(r => (
      <HistoryRow
        key={r.id}
        status={r.status !== 'done'}
        glyph={r.icon}
        tone={TONE[r.status]}
        name={r.name}
        detail={`${r.detail} · ${r.time}`}
        amount={activityAmount(r, signed, naira)}
        journey={`row:${r.id}`}
        onOpen={r.status === 'done' ? at => setPeek({ card: cardFor(r), at }) : undefined}
        to={r.status === 'done' ? undefined : `/transfer/${r.id}`}
      />
    ));
  const today = rows('today');
  const yesterday = rows('yesterday');
  return (
    <JourneyProvider>
      <View style={{ flex: 1 }}>
        <Screen head={<GlyphHead glyph="clock" title="Activities" sub={nothing ? 'Nothing has moved yet' : 'Everything that moved, newest first'} />}>
          {/* the frame puts 16 between the segments and the record, and 10 between a day's name and its lines, and between one day and the next */}
          <View style={{ gap: 16 }}>
            <Segments options={['All', 'In', 'Out']} value={segment} onChange={v => setSegment(v as Segment)} />
            <View style={{ gap: 10 }}>
              {today.length ? <Body tone="secondary">Today</Body> : null}
              {today.length ? <View>{today}</View> : null}
              {yesterday.length ? <Body tone="secondary">Yesterday</Body> : null}
              {yesterday.length ? <View>{yesterday}</View> : null}
              {!today.length && !yesterday.length && !nothing ? <Body tone="tertiary">Nothing {segment === 'In' ? 'came in' : segment === 'Out' ? 'went out' : 'moved'} yet.</Body> : null}
              {nothing ? <SayCard testID="footer">Every line here will open a receipt you can keep, send on, or dispute.</SayCard> : h.footer ? <SayCard testID="footer">{h.footer}</SayCard> : null}
            </View>
          </View>
        </Screen>
        {peek ? <ReceiptPeek card={peek.card} at={peek.at} onClose={() => setPeek(null)} /> : null}
      </View>
    </JourneyProvider>
  );
}
