/* Activities, from the History frame: everything that moved, newest first,
   All / In / Out to narrow it, today and yesterday, and what Beetle makes of
   it at the foot. What is still on its way, did not go or came back stands
   first, with its status glyph and a chevron; what settled follows on the
   grey square. A settled line opens its receipt; the other states have
   their own frames in round 3. The dock is the way back, the ask bar, and
   the plus for More. */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ActionButton, Body, Dock, GlyphHead, HistoryRow, SayCard, Screen, Segments, colour, toast } from '../../design';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { holdingsFor, type LedgerRow } from '../home/account';
import { useMoves } from '../home/moves';
import { naira, signed } from '../../lib/format';
import { askHome, useMore } from '../more/More';
import { activityAmount, activityRows, type Segment } from './rows';

const TONE: Record<LedgerRow['status'], string> = { pending: colour.accent, failed: colour.alert, reversed: colour.ink, done: colour.ink };
const ROUND: Record<LedgerRow['status'], string> = { pending: 'A transfer still on its way', failed: 'A transfer that did not go', reversed: 'A transfer that came back', done: '' };

export function Activities() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const account = app.session?.account;
  const { moves, ready } = useMoves(account?.accountNumber);
  const [segment, setSegment] = useState<Segment>('All');
  const { sheet, openMore } = useMore(router);
  if (!ok || !account) return null;
  const h = holdingsFor(account);
  const ledger = [...moves, ...h.ledger];
  const dock = (
    <Dock
      placeholder="Ask about any of these"
      onBack={() => router.back()}
      onAsk={q => askHome(router, q)}
      onScan={() => router.push('/scan')}
      action={<ActionButton onPress={openMore} label="More" />}
    />
  );
  if (!ready)
    return (
      <Screen dock={dock} still>
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
        onPress={() => (r.status === 'done' ? router.push(`/receipt/${r.id}`) : toast(`${ROUND[r.status]} has its screen in round 3.`))}
      />
    ));
  const today = rows('today');
  const yesterday = rows('yesterday');
  return (
    <View style={{ flex: 1 }}>
      <Screen dock={dock}>
        <GlyphHead glyph="clock" title="History" sub="Everything that moved, newest first" />
        {/* the frame puts 16 between the segments and the record, and 10 between a day's name and its lines, and between one day and the next */}
        <View style={{ gap: 16 }}>
          <Segments options={['All', 'In', 'Out']} value={segment} onChange={v => setSegment(v as Segment)} />
          <View style={{ gap: 10 }}>
            {today.length ? <Body tone="secondary">Today</Body> : null}
            {today.length ? <View>{today}</View> : null}
            {yesterday.length ? <Body tone="secondary">Yesterday</Body> : null}
            {yesterday.length ? <View>{yesterday}</View> : null}
            {!today.length && !yesterday.length ? <Body tone="tertiary">Nothing {segment === 'In' ? 'came in' : segment === 'Out' ? 'went out' : 'moved'} yet.</Body> : null}
            {h.footer ? <SayCard testID="footer">{h.footer}</SayCard> : null}
          </View>
        </View>
      </Screen>
      {sheet}
    </View>
  );
}
