/* Activities, the second of the three pages, from the History frame: all
   of the record lives here now, none of it on home. Money health at the
   top; All / Insights / In / Out to narrow it; today and yesterday, what is
   still on its way, did not go or came back first with its status glyph
   and a chevron, what settled after on the grey square; what Beetle
   noticed set among the lines; and its word at the foot. Every line opens
   where it is, the line itself: what it does not say grows in under it in
   the list, the lines below going down to make room, and the rest of the
   page goes soft where it is under a frost of white (see OpenLine; Round
   17, the owner's word: nothing drawn over the line). One still on its way,
   that did not go or that came back says so there, with its next step. The
   foot is the bar, as on home and Settings, out of the way while a line is
   open. */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { runOnJS, withDelay, withTiming } from 'react-native-reanimated';
import { Body, GlyphHead, HistoryRow, Insight, JourneyProvider, SayCard, ScoreRow, Screen, Segments, away, measure, settle, useStill, type Rect } from '../../design';
import { useApp } from '../onboarding/store';
import { holdingsFor, type LedgerRow } from '../home/account';
import { useMoves } from '../home/moves';
import { naira, signed } from '../../lib/format';
import { askHome } from '../more/More';
import { useFoot } from '../more/Foot';
import { usePage, useHoldPages } from '../tabs';
import { FROST_OUT, OPEN_MS, ROWS_OUT, STATUS_TONE, type Opened } from './InPlace';
import { LineDetails, LineMenu, LineShare, PageFrost, useOpenCtl } from './OpenLine';
import { SEGMENTS, activityAmount, activityRows, detailOf, type Segment } from './rows';

export function Activities() {
  const app = useApp();
  const router = useRouter();
  const { active } = usePage();
  const account = app.session?.account;
  const { moves, ready } = useMoves(account?.accountNumber);
  const [segment, setSegment] = useState<Segment>('All');
  const still = useStill();
  /** the line open where it is, its numbers, its rows as drawn (for the picture the share sheet hands out), and its own place in the list */
  const [over, setOver] = useState<Opened | null>(null);
  const ctl = useOpenCtl();
  const slip = useRef<View>(null);
  const openRow = useRef<View>(null);
  const [session, setSession] = useState(false);
  const [sharing, setSharing] = useState(false);
  const going = useRef(false);
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
  const openedFor = (r: LedgerRow, at: Rect | null, head: Rect | null = null): Opened => ({
    id: r.id,
    glyph: r.icon,
    name: r.name,
    detail: detailOf(r),
    amount: activityAmount(r, signed, naira),
    at,
    head,
    state: r.status === 'done' ? undefined : r.status,
  });
  /* opening: once the line and what grows in under it are measured, the rows come in, the frost grows and the lines below go down */
  const begin = useCallback(() => {
    ctl.p.value = still ? 1 : withTiming(1, { duration: OPEN_MS, easing: settle });
  }, [ctl, still]);
  const finish = useCallback(() => {
    going.current = false;
    setSharing(false);
    setOver(null);
  }, []);
  /* closing: what grew in goes first while the frost stays whole, then it folds away as the frost clears */
  const close = useCallback(() => {
    if (going.current) return;
    going.current = true;
    if (still) return finish();
    ctl.shown.value = withTiming(0, { duration: ROWS_OUT, easing: away });
    ctl.p.value = withDelay(
      ROWS_OUT - 40,
      withTiming(0, { duration: FROST_OUT + 40, easing: away }, done => {
        if (done) runOnJS(finish)();
      }),
    );
  }, [ctl, still, finish]);
  /* leading somewhere from the open line: it closes first, then goes */
  const leave = (go: () => void) => {
    close();
    setTimeout(go, ROWS_OUT + FROST_OUT);
  };
  const openLine = (r: LedgerRow) => {
    if (over) return close();
    void measure(headRow).then(head => {
      ctl.p.value = 0;
      ctl.shown.value = 1;
      ctl.top.value = 0;
      ctl.rowH.value = 0;
      ctl.grown.value = 0;
      going.current = false;
      setSession(false);
      setOver(openedFor(r, null, head.h ? head : null));
    });
  };
  useEffect(() => {
    if (!over) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sharing) setSharing(false);
      else close();
      return true;
    });
    return () => sub.remove();
  }, [over, sharing, close]);
  useEffect(() => {
    if (!asked.receipt || !ready || !h) return;
    const r = [...moves, ...h.ledger].find(x => x.id === asked.receipt);
    if (r) openLine(r);
  }, [asked.receipt, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!app.ready || !account || !h) return null;
  if (!ready)
    return (
      <Screen still>
        <View />
      </Screen>
    );

  /* every line opens where it is, the line itself: a settled one with its receipt, one still on its way, that did not go
     or came back with that and its next step; a tap on the open line closes it */
  const rows = (day: LedgerRow['day']) =>
    activityRows(ledger, day, segment).map(r => {
      const isOpen = over?.id === r.id;
      return (
        <View key={r.id} ref={isOpen ? openRow : undefined} collapsable={false} testID={isOpen ? 'in-place-line' : undefined}>
          <HistoryRow
            status={r.status !== 'done'}
            glyph={r.icon}
            tone={STATUS_TONE[r.status]}
            name={r.name}
            detail={detailOf(r)}
            amount={activityAmount(r, signed, naira)}
            journey={`row:${r.id}`}
            onOpen={() => openLine(r)}
          />
          {isOpen && over ? (
            <LineDetails
              key={over.id}
              line={over}
              ctl={ctl}
              row={openRow}
              slip={slip}
              session={session}
              onSession={() => setSession(true)}
              onShare={() => setSharing(true)}
              onLeave={leave}
              onReady={begin}
            />
          ) : null}
        </View>
      );
    });
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
        <Screen head={<GlyphHead glyph="clock" title="Activities" sub={nothing ? 'Nothing has moved yet' : 'Everything that moved, newest first'} rowRef={headRow} />} scrollEnabled={!over}>
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
          {/* the frost round the open line, over the column above it and below what grew in under it */}
          {over ? <PageFrost key={over.id} ctl={ctl} onClose={close} /> : null}
        </Screen>
        {over ? <LineMenu line={over} ctl={ctl} onLeave={leave} /> : null}
        {sharing && over ? <LineShare line={over} slip={slip} onDismiss={() => setSharing(false)} /> : null}
      </View>
    </JourneyProvider>
  );
}
