/* Activities, the second of the three pages, from the History frame: all
   of the record lives here now, none of it on home. Money health at the
   top; All / Insights / In / Out to narrow it; today and yesterday, what is
   still on its way, did not go or came back first with its status glyph
   and a chevron, what settled after on the grey square; what Beetle
   noticed set among the lines; and its word at the foot. A settled line
   opens where it is: the line stays, the page goes soft under a frost of
   white, and what the line does not say grows in under it (see InPlace).
   One still on its way, that did not go or that came back opens its own
   page. The foot is the bar, as on home and Settings, out of the way
   while a line is open. */
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Body, GlyphHead, HistoryRow, Insight, JourneyProvider, SayCard, ScoreRow, Screen, Segments, colour, measure, type Rect } from '../../design';
import { useApp } from '../onboarding/store';
import { holdingsFor, type LedgerRow } from '../home/account';
import { useMoves } from '../home/moves';
import { naira, signed } from '../../lib/format';
import { askHome } from '../more/More';
import { useFoot } from '../more/Foot';
import { usePage, useHoldPages } from '../tabs';
import { InPlace, type Opened } from './InPlace';
import { SEGMENTS, activityAmount, activityRows, type Segment } from './rows';

const TONE: Record<LedgerRow['status'], string> = { pending: colour.accent, failed: colour.alert, reversed: colour.ink, done: colour.ink };

export function Activities() {
  const app = useApp();
  const router = useRouter();
  const { active } = usePage();
  const account = app.session?.account;
  const { moves, ready } = useMoves(account?.accountNumber);
  const [segment, setSegment] = useState<Segment>('All');
  /** the line open in place */
  const [over, setOver] = useState<Opened | null>(null);
  /* the head's title row, which stays sharp beside the ··· while a line is open */
  const headRow = useRef<View>(null);
  /* a line asked for by a link opens in place too, under the head */
  const asked = useLocalSearchParams<{ receipt?: string }>();
  /** what Beetle noticed and was told not now */
  const [put, setPut] = useState<string[]>([]);
  const h = account ? holdingsFor(account) : null;
  const ledger = [...moves, ...(h?.ledger ?? [])];
  /* a new account's record, from the Nothing yet frame: nothing has moved */
  const nothing = ready && ledger.length === 0;
  /* the foot: the bar, which goes down out of the way while a line is open */
  useFoot({ kind: 'bar', veil: over ? 'away' : undefined }, active);
  /* the pages stand still while a line is open */
  useHoldPages('receipt', !!over);
  const detailOf = (r: LedgerRow) => (r.detail.includes(':') ? r.detail : `${r.detail} · ${r.time}`);
  const openedFor = (r: LedgerRow, at: Rect | null, head: Rect | null = null): Opened => ({
    id: r.id,
    glyph: r.icon,
    name: r.name,
    detail: detailOf(r),
    amount: activityAmount(r, signed, naira),
    at,
    head,
  });
  useEffect(() => {
    if (!asked.receipt || !ready || !h) return;
    const r = [...moves, ...h.ledger].find(x => x.id === asked.receipt);
    if (r) setOver(openedFor(r, null));
  }, [asked.receipt, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!app.ready || !account || !h) return null;
  if (!ready)
    return (
      <Screen still>
        <View />
      </Screen>
    );

  /* a settled line opens where it is */
  const open = (r: LedgerRow, at: Rect) => void measure(headRow).then(head => setOver(openedFor(r, at, head.h ? head : null)));
  const rows = (day: LedgerRow['day']) =>
    activityRows(ledger, day, segment).map(r => (
      <HistoryRow
        key={r.id}
        status={r.status !== 'done'}
        glyph={r.icon}
        tone={TONE[r.status]}
        name={r.name}
        detail={detailOf(r)}
        amount={activityAmount(r, signed, naira)}
        journey={`row:${r.id}`}
        onOpen={r.status === 'done' ? at => open(r, at) : undefined}
        to={r.status === 'done' ? undefined : `/transfer/${r.id}`}
      />
    ));
  /* what Beetle noticed, among the lines: where the money went has its own page; the others hand their thing to the chat on home */
  const insight = (id: string, opts: { dismiss?: boolean } = {}) => {
    const i = h.insights.find(x => x.id === id);
    if (!i || put.includes(id) || segment === 'In' || segment === 'Out') return null;
    return (
      <Insight
        key={id}
        inline
        kicker={i.kicker}
        body={i.body}
        action={i.action}
        to={id === 'spend' ? '/answer' : undefined}
        onAction={() => askHome(router, i.action)}
        onDismiss={opts.dismiss ? () => setPut(p => [...p, id]) : undefined}
      />
    );
  };
  const today = rows('today');
  const yesterday = rows('yesterday');
  const noticedToday = [insight('topup', { dismiss: true }), insight('data'), insight('changes')].filter(Boolean);
  const noticedYesterday = [insight('spend')].filter(Boolean);
  /* the first of what was noticed comes after the day's first three lines, as the day on home had it */
  const cut = 3;
  const health = h.health !== null && segment !== 'In' && segment !== 'Out';
  return (
    <JourneyProvider>
      <View style={{ flex: 1 }}>
        <Screen head={<GlyphHead glyph="clock" title="Activities" sub={nothing ? 'Nothing has moved yet' : 'Everything that moved, newest first'} rowRef={headRow} />}>
          {health ? <ScoreRow score={h.health!} title="Money health" sub={h.healthMove} onPress={() => router.push('/health')} /> : null}
          {/* the frame puts 16 between the segments and the record, and 10 between a day's name and its lines, and between one day and the next */}
          <View style={{ gap: 16 }}>
            <Segments options={SEGMENTS} value={segment} onChange={v => setSegment(v as Segment)} />
            <View style={{ gap: 10 }}>
              {today.length || noticedToday.length ? <Body tone="secondary">Today</Body> : null}
              {today.length || noticedToday.length ? (
                <View>
                  {today.slice(0, cut)}
                  {noticedToday[0]}
                  {today.slice(cut)}
                  {noticedToday.slice(1)}
                </View>
              ) : null}
              {yesterday.length || noticedYesterday.length ? <Body tone="secondary">Yesterday</Body> : null}
              {yesterday.length || noticedYesterday.length ? (
                <View>
                  {yesterday.slice(0, 2)}
                  {noticedYesterday}
                  {yesterday.slice(2)}
                </View>
              ) : null}
              {!today.length && !yesterday.length && !nothing && segment !== 'Insights' ? (
                <Body tone="tertiary">Nothing {segment === 'In' ? 'came in' : segment === 'Out' ? 'went out' : 'moved'} yet.</Body>
              ) : null}
              {segment === 'Insights' && !noticedToday.length && !noticedYesterday.length ? <Body tone="tertiary">Nothing to notice yet.</Body> : null}
              {nothing ? (
                <SayCard testID="foot-line">Every line here will open a receipt you can keep, send on, or dispute.</SayCard>
              ) : h.footer ? (
                <SayCard testID="foot-line">{h.footer}</SayCard>
              ) : null}
            </View>
          </View>
        </Screen>
        {over ? <InPlace key={over.id} line={over} onClose={() => setOver(null)} /> : null}
      </View>
    </JourneyProvider>
  );
}
