/* Pay a bill, from its frame: the biller and the account it is paid on,
   the figure, and from where and what lands, each on its own white card in
   one grey one, three figures to pick from under, the line about what
   lands, and Slide to pay at the foot beside Back. No bubble from Beetle
   over it (see DESIGN.md): each card says what matters on its own line. A row on Bills, a tile on All services and the lab open it; the
   account card opens the meters paid before with the camera under them,
   the amount is picked where it is (the ruler, stopping at what there is
   to pay from, or the figure typed), and the slide leads to the passcode
   and the receipt after it, with the line in the day. */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { AmountPicker, Body, Caption, Icon, Label, Meta, PageHead, Picks, Screen, Tap, YouTyped, colour, measure, toast, type Rect } from '../../design';
import { DEMO_SAVED, PEOPLE, beneficiariesOf, billPanelFor, discoById, groupMeter, ownLine, type MeterPaid, type Move } from '../../services';
import { useApp } from '../onboarding/store';
import { useSendGate } from '../settings/sendGate';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { holdingsFor } from '../home/account';
import { balanceOf, rowFrom, useMoves } from '../home/moves';
import { PayFromSheet, dollarsOf, usdCost, usdFull, type Source } from '../dollars';
import { clock } from '../../lib/clock';
import { SavedPeek } from '../agent/SavedPeek';
import { PasscodeSheet, lockedFor, waitWords } from '../passcode';
import { LAB } from '../../lab/enabled';
import { groupAccount, naira } from '../../lib/format';
import { billDraft } from './hand';
import { BILLERS, billerById, buysWords } from './billers';

/** The frame's words, for the lab. */
const SAID = 'pay my light bill';

export function PayBill() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ biller?: string; demo?: string }>();
  const demo = LAB && asked.demo === '1';
  const biller = billerById(asked.biller ?? '') ?? BILLERS[0]!;
  const power = biller.kind === 'power';
  const account = app.session?.account;
  const { moves, add: addMove } = useMoves(account?.accountNumber);
  const sendGate = useSendGate(account);
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  const balance = (h?.everyday ?? 0) + balanceOf(moves);
  const rate = h?.rate ?? 1_552;
  const dollars = dollarsOf(h?.dollars ?? 0, moves);
  /* where it leaves from: Everyday, or the dollars at today's rate */
  const [source, setSource] = useState<Source>('everyday');
  const [choosing, setChoosing] = useState(false);
  const fromDollars = source === 'dollars';
  const saved = useMemo(
    () => beneficiariesOf([...moves, ...(h?.ledger ?? [])], account?.demo ? DEMO_SAVED : { lines: [], meters: [] }, account?.demo ? PEOPLE : [], account ? ownLine(account.phone) : null),
    [moves, h, account],
  );

  /* the meter, where the bill is the light: the one paid most at this company */
  const [meter, setMeter] = useState<MeterPaid | null>(() => (power ? (saved.meters.find(m => m.disco === biller.id) ?? null) : null));
  const [meterNote, setMeterNote] = useState(power ? 'The meter you paid last month' : `The ${biller.accountLabel.toLowerCase()} you paid last month`);
  const [amount, setAmount] = useState(biller.usual);
  const [amountNote, setAmountNote] = useState(power ? 'About what you used last month' : 'The same as last month');
  const [said] = useState(demo ? SAID : '');
  const [pick, setPick] = useState<Rect | null>(null);
  const [guard, setGuard] = useState(false);
  const accountCard = useRef<View>(null);

  /* back in front: what the keypad or the camera handed back */
  useFocusEffect(
    useCallback(() => {
      const d = billDraft.take();
      if (!d) return;
      if (d.meter !== undefined) {
        setMeter(d.meter);
        setMeterNote(d.read === 'photo' ? 'Read off the photo' : 'The meter you picked');
      }
      if (d.amount !== undefined) {
        setAmount(d.amount);
        setAmountNote('You typed it');
      }
    }, []),
  );

  const slide = () => {
    if (!amount) return;
    /* frozen, or the twelve hours after a new passcode: nothing leaves (see settings/gate) */
    const stopped = sendGate.stopped(amount);
    if (stopped) {
      toast(stopped);
      return;
    }
    if (fromDollars && usdCost(amount, rate) > dollars) {
      toast(`That is more than the ${usdFull(dollars)} you hold. Pay from Everyday, or convert some first.`);
      return;
    }
    if (!fromDollars && amount > balance) {
      router.push(`/short?asked=${amount}&for=bill`);
      return;
    }
    const shut = lockedFor();
    if (shut) {
      toast(`That was three wrong tries. Give it ${waitWords(shut)} and slide again.`);
      return;
    }
    setGuard(true);
  };
  /* the passcode landed: the line goes into the day, and its receipt opens */
  const done = () => {
    if (!account) return;
    const at = clock();
    const base: Move = meter
      ? (billPanelFor({ disco: meter.disco, meterKind: meter.meterKind, meter: meter.meter, name: meter.name, label: meter.label }, amount).move ?? {
          name: biller.name,
          detail: `Meter ${groupMeter(meter.meter)}`,
          amount: -amount,
          icon: 'power',
          kind: 'bill',
        })
      : { name: biller.name, detail: `${biller.accountLabel} ${biller.account}`, amount: -amount, icon: biller.glyph, kind: 'bill' };
    const row = rowFrom({ ...base, detail: `${base.detail}${fromDollars ? ' · from dollars' : ''} · ${at}`, ...(fromDollars ? { usd: -usdCost(amount, rate) } : {}) }, balance, 17 + moves.length);
    addMove(row);
    setGuard(false);
    router.push(`/receipt/${row.id}?paid=1`);
  };

  useFoot({ kind: 'slide', label: 'Slide to pay', amount: naira(amount), disabled: !amount || (power && !meter), onSlide: slide, veil: guard || choosing ? 'away' : pick ? 'recede' : undefined });

  if (!ok || !account) return null;
  /* a meter at another company: the page is that company's */
  const name = (meter && discoById(meter.disco)?.name) || biller.name;
  /* over what Everyday holds (a pick can be): said under the figure, where it is about */
  const short = !fromDollars && amount > balance ? `${naira(amount - balance)} more than Everyday holds; slide and I show three ways to close it` : null;
  const openSaved = () => {
    if (!power) {
      toast(`Only the ${biller.accountLabel.toLowerCase()} you have paid is drawn yet.`);
      return;
    }
    void measure(accountCard).then(setPick);
  };
  const detail = meter ? `${meter.meterKind === 'prepaid' ? 'Prepaid' : 'Postpaid'} · ${groupMeter(meter.meter)}` : power ? 'No meter yet' : `${biller.plan} · ${biller.account}`;

  return (
    <>
      <Screen head={<PageHead lead title="Pay a bill" sub={`${name}, ${meter && meter.disco !== biller.id ? 'on the meter you picked' : biller.sub}`} />}>
        {said ? <YouTyped said={said} /> : null}
        {/* 12 around the white cards, 8 between them */}
        <View style={s.card} testID="pay-card">
          <Tap ref={accountCard} accessibilityRole="button" accessibilityLabel={meter ? `${name}, ${detail}` : name} onPress={openSaved} style={[s.sub, s.account]} testID="pay-account">
            <View style={s.accountRow}>
              <View style={{ marginTop: 8 }}>
                <Icon name={biller.glyph} size={22} colour={colour.ink} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Label>{name}</Label>
                <Meta tone="secondary">{detail}</Meta>
              </View>
              <View style={{ marginTop: 11 }}>
                <Icon name="chevron" size={16} colour={colour.textTertiary} />
              </View>
            </View>
            <Caption tone="secondary">{meter || !power ? meterNote : 'Meters you have paid, or a photo of the bill'}</Caption>
          </Tap>
          {/* the amount, picked where it is: the ruler stops at what the money it comes from holds; the picks with what each buys are under the card */}
          <View style={[s.sub, s.amount]} testID="pay-amount">
            <AmountPicker
              value={amount}
              onChange={v => {
                setAmount(v);
                setAmountNote('You picked it');
              }}
              max={fromDollars ? Math.floor(dollars * rate) : Math.max(0, Math.floor(balance))}
              note={short ?? amountNote}
              warn={!!short}
            />
          </View>
          <View style={[s.sub, s.rows]} testID="pay-rows">
            <Tap accessibilityRole="button" accessibilityLabel="From" onPress={() => setChoosing(true)} style={s.row}>
              <Body tone="secondary" style={{ flex: 1 }}>
                From
              </Body>
              <Label style={s.value}>{fromDollars ? `Dollars · ${usdFull(dollars)}` : `Everyday · ${groupAccount(account.accountNumber)}`}</Label>
              <Icon name="chevron" size={16} colour={colour.textTertiary} />
            </Tap>
            <View style={s.row}>
              <Body tone="secondary" style={{ flex: 1 }}>
                {biller.lands[0]}
              </Body>
              <Label style={s.value}>{biller.lands[1]}</Label>
            </View>
          </View>
        </View>
        <View style={{ marginTop: -4 }} testID="pick-block">
          <Body tone="secondary">Or pick an amount</Body>
          <View style={{ marginTop: 18 }}>
            <Picks
              items={biller.picks.map(n => ({ value: n, big: naira(n), small: buysWords(biller, n) }))}
              value={amount}
              onPick={n => {
                setAmount(n);
                setAmountNote(n === biller.usual ? amountNote.replace('You picked it', power ? 'About what you used last month' : 'The same as last month') : 'You picked it');
              }}
              testID="picks"
            />
          </View>
        </View>
        <View style={s.lock} testID="lock-line">
          <Icon name="lock" size={16} colour={colour.textTertiary} />
          <Meta tone="secondary">{biller.lock}</Meta>
        </View>
      </Screen>
      {pick ? (
        <SavedPeek
          kind="meter"
          list={saved.meters}
          at={pick}
          extras={[
            {
              glyph: 'camera',
              label: 'Point the camera at a bill',
              onPress: () => {
                setPick(null);
                router.push('/scan?for=bill');
              },
            },
          ]}
          onPick={b => {
            if (b.kind !== 'meter') return;
            setMeter(b);
            setMeterNote(b.times > 1 ? `Paid ${b.times} times, the last ${b.when.toLowerCase()}` : `Paid once, ${b.when.toLowerCase()}`);
            if (b.amount) {
              setAmount(b.amount);
              setAmountNote('What it was last time');
            }
            setPick(null);
          }}
          onClose={() => setPick(null)}
        />
      ) : null}
      {choosing ? <PayFromSheet everyday={balance} dollars={dollars} rate={rate} value={source} who="the light" onPick={setSource} onDismiss={() => setChoosing(false)} /> : null}
      {guard ? (
        <PasscodeSheet
          amount={naira(amount)}
          pastLimit={sendGate.past(amount)}
          name={name}
          detail={meter ? `Meter ${groupMeter(meter.meter)}` : `${biller.accountLabel} ${biller.account}`}
          glyph={biller.glyph}
          verify={app.checkPasscode}
          onDone={done}
          onCancel={() => setGuard(false)}
        />
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colour.surface2, borderRadius: 24, padding: 12, gap: 8 },
  sub: { backgroundColor: colour.surface, borderRadius: 20, paddingHorizontal: 16 },
  /* the frame boxes the biller's row at 38 — the glyph and the chevron sit on that — and lets the two lines beside them run to 44 */
  account: { paddingTop: 12, paddingBottom: 9, gap: 8 },
  accountRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, height: 38, overflow: 'visible' },
  amount: { paddingTop: 20, paddingBottom: 16, paddingHorizontal: 0 },
  rows: { paddingHorizontal: 16, paddingVertical: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 56 },
  value: { fontSize: 16, lineHeight: 24 },
  /* the frame's pick column is 7 shorter than what it holds, so its lock line is 9 under the picks */
  lock: { marginTop: -11, flexDirection: 'row', alignItems: 'center', gap: 8 },
});
