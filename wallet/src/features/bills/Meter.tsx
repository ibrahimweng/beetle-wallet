/* What I found, from its frame: the bill the camera read, drawn back as
   Beetle read it — the company, the meter, the figure, the address on it
   — then the question that matters before a token is bought for a meter,
   Is this your meter?, with what the bill says beside what the company
   says the meter is, and Yes, that is mine or No; under them the three
   pieces the payment needs, each ticked. Continue at the foot beside
   Back leads to the passcode, and the receipt with the token after it.
   Reached from the camera when the photo is a bill. */
import React, { useEffect, useState } from 'react';
import { unitsFor } from '../../services/nigeria';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Body, Button, Caption, Head, Icon, Label, Logo, Meta, PageHead, Screen, Tap, colour, font, logoOf, toast } from '../../design';
import { BILL_READING, billPanelFor, discoById, groupMeter, meters, type BillReading, type MeterRecord } from '../../services';
import { useApp } from '../onboarding/store';
import { useSendGate } from '../settings/sendGate';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { holdingsFor } from '../home/account';
import { balanceOf, rowFrom, useMoves } from '../home/moves';
import { clock } from '../../lib/clock';
import { clock12 } from '../receipts/receipts';
import { ReadRows } from '../scan/ReadRows';
import { PasscodeSheet, lockedFor, waitWords } from '../passcode';
import { LAB } from '../../lab/enabled';
import { initialsOf, naira } from '../../lib/format';
import { billDraft } from './hand';

export function Meter() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ demo?: string; guard?: string }>();
  const demo = LAB && asked.demo === '1';
  const account = app.session?.account;
  const { moves, add: addMove } = useMoves(account?.accountNumber);
  const sendGate = useSendGate(account);
  const balance = (account ? holdingsFor(account).everyday : 0) + balanceOf(moves);

  /* what the camera handed here, taken once; the lab has the frame's bill */
  const [reading] = useState<BillReading | null>(() => {
    const d = billDraft.take();
    return d?.reading ?? (demo ? BILL_READING.bill! : null);
  });
  const [time] = useState(() => (demo ? '16:02' : clock()));
  const [record, setRecord] = useState<MeterRecord | null | undefined>(undefined);
  const [mine, setMine] = useState(!!(LAB && asked.guard === '1'));
  const [raw, setRaw] = useState(false);
  const [guard, setGuard] = useState(!!(LAB && asked.guard === '1'));
  const [amount, setAmount] = useState(reading?.amount ?? 0);

  /* whose the company says the meter is */
  useEffect(() => {
    if (!reading) return;
    let live = true;
    meters
      .lookup(reading.disco, reading.meterKind, reading.meter)
      .then(r => live && setRecord(r))
      .catch(() => live && setRecord(null));
    return () => {
      live = false;
    };
  }, [reading]);

  const go = () => {
    /* frozen, or the twelve hours after a new passcode: nothing leaves (see settings/gate) */
    const stopped = sendGate.stopped(amount);
    if (stopped) {
      toast(stopped);
      return;
    }
    /* more than Everyday holds: the ways to close it, and back here to pay */
    if (amount > balance) {
      router.push(`/short?asked=${amount}&for=bill`);
      return;
    }
    const shut = lockedFor();
    if (shut) {
      toast(`That was three wrong tries. Give it ${waitWords(shut)} and try again.`);
      return;
    }
    setGuard(true);
  };
  /* the passcode landed: the token is bought, the line goes into the day, and its receipt opens */
  const done = () => {
    if (!account || !reading) return;
    const at = clock();
    const disco = discoById(reading.disco);
    const move = billPanelFor({ disco: reading.disco, meterKind: reading.meterKind, meter: reading.meter, name: record?.name ?? `${account.firstName} ${account.lastName}`, label: 'Home' }, amount)
      .move ?? {
      name: disco?.name ?? 'The electricity company',
      detail: `Meter ${groupMeter(reading.meter)}`,
      amount: -amount,
      icon: 'power' as const,
      kind: 'bill' as const,
    };
    const row = rowFrom({ ...move, detail: `${move.detail} · ${at}`, read: 'photo' }, balance, 17 + moves.length);
    addMove(row);
    setGuard(false);
    router.push(`/receipt/${row.id}?paid=1`);
  };
  const no = () => {
    toast('Then it is not paid. Point the camera at the right bill, or pick a meter you have paid on Pay a bill.');
    router.back();
  };

  useFoot({ kind: 'button', label: 'Continue', disabled: !mine || !amount, onPress: go, veil: guard ? 'away' : undefined });
  if (!ok || !account) return null;
  if (!reading)
    return (
      <Screen head={<PageHead lead title="What I found" sub="Nothing yet" />}>
        <Body tone="secondary">Point the camera at a bill and I read the company, the meter and what is owed off it.</Body>
      </Screen>
    );
  const disco = discoById(reading.disco);
  const name = disco?.name ?? 'The electricity company';
  const kind = reading.meterKind === 'prepaid' ? 'Prepaid' : 'Postpaid';
  return (
    <>
      <Screen head={<PageHead lead title="What I found" sub={`Read from your photo, ${clock12(time)}`} />}>
        {/* the bill, as read: the frame draws the photo back as a slip, with the pieces Beetle read boxed */}
        <View style={s.photoCard} testID="photo-card">
          <View style={s.photoHead}>
            {/* the company the bill is from: its logo, where the frame had its initials (Round 38) */}
            {logoOf(reading.disco) ? (
              <Logo name={logoOf(reading.disco)!} size={24} round />
            ) : (
              <View style={s.chip24}>
                <Caption style={{ color: colour.textInverse, ...font('700') }}>{initialsOf(name)}</Caption>
              </View>
            )}
            <Caption style={{ flex: 1, ...font('600') }}>Bill photo</Caption>
            <Caption tone="secondary">{clock12(time)}</Caption>
          </View>
          <View style={s.slip} testID="slip">
            {raw ? (
              <Meta tone="secondary">
                {reading.address
                  ? `${name.toUpperCase()} · ${kind}\nMeter ${groupMeter(reading.meter)}\n${amount ? naira(amount) : ''}\n${reading.address}`
                  : `${name.toUpperCase()} · ${kind}\nMeter ${groupMeter(reading.meter)}`}
              </Meta>
            ) : (
              <>
                <Caption tone="secondary">{`${name.toUpperCase()} · ${kind}`}</Caption>
                <View style={s.box}>
                  <Label>{`Meter ${groupMeter(reading.meter)}`}</Label>
                </View>
                {amount ? (
                  <View style={s.box}>
                    <Label>{naira(amount)}</Label>
                  </View>
                ) : null}
                {reading.address ? (
                  <View style={s.tag}>
                    <Caption style={{ ...font('600') }}>{reading.address}</Caption>
                  </View>
                ) : null}
                <Caption tone="tertiary">Keep this slip for your records</Caption>
              </>
            )}
          </View>
          <Tap accessibilityRole="button" accessibilityLabel="What I read" accessibilityState={{ checked: raw }} onPress={() => setRaw(r => !r)} style={s.readRow} hitSlop={8}>
            <View style={[s.box14, raw ? s.box14On : null]}>{raw ? <Icon name="check" size={9} colour={colour.textInverse} /> : null}</View>
            <Caption tone="secondary">What I read</Caption>
          </Tap>
        </View>
        {/* whose it is: the bill against the company */}
        <View style={s.askCard} testID="ask-card">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="alert" size={18} colour={colour.ink} />
            <Head>Is this your meter?</Head>
          </View>
          <View style={s.saysCard}>
            <View style={s.saysRow}>
              <Meta tone="secondary">On the bill</Meta>
              <Label>{`Meter ${groupMeter(reading.meter)}`}</Label>
            </View>
            <View style={s.saysRow}>
              <Meta tone="secondary">{`${disco?.name ?? 'The company'} says`}</Meta>
              <Label>{record === undefined ? 'Looking…' : record ? record.address : 'No such meter'}</Label>
            </View>
          </View>
          {mine ? (
            <View style={s.mineRow} testID="mine">
              <Icon name="step-done" size={18} colour={colour.good} />
              <Label>{record ? `Yours, at ${record.address}` : 'Yours'}</Label>
            </View>
          ) : (
            <>
              {/* a meter the company does not have is nobody's to pay: only No, until the digits are checked (the analysis after Round 21) */}
              {record === null ? (
                <Meta tone="secondary" style={{ marginTop: 12 }} testID="no-such-meter">
                  {`${disco?.name ?? 'The company'} has no such meter. Check the number on the bill, or type it on Pay a bill.`}
                </Meta>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Button label="Yes, that is mine" size={48} disabled={!record} onPress={() => setMine(true)} style={{ flex: 1 }} />
                <Button label="No" size={48} tone="grey" full={false} onPress={no} style={{ width: 62 }} />
              </View>
            </>
          )}
        </View>
        {/* the three pieces the payment needs */}
        <ReadRows
          style={{ marginTop: -8 }}
          rows={[
            { label: 'Amount', value: amount ? naira(amount) : 'Not on the bill', note: amount ? 'from the photo' : undefined },
            { label: 'Meter', value: groupMeter(reading.meter) },
            { label: 'Disco', value: name },
          ]}
          testID="read-rows"
        />
        {!amount ? (
          <Tap accessibilityRole="button" accessibilityLabel="Pay the usual ₦8,000" onPress={() => setAmount(8_000)} style={{ alignSelf: 'center', marginTop: -8 }} hitSlop={8}>
            <Label tone="accent">Pay the usual ₦8,000</Label>
          </Tap>
        ) : null}
      </Screen>
      {guard ? (
        <PasscodeSheet
          amount={naira(amount)}
          pastLimit={sendGate.past(amount)}
          name={name}
          detail={`${reading.meterKind === 'prepaid' ? 'Prepaid' : 'Postpaid'} · ${groupMeter(reading.meter)}`}
          glyph="power"
          logo={logoOf(reading.disco)}
          rows={[
            { label: 'Name on the meter', value: record?.name ?? 'Looked up' },
            reading.meterKind === 'prepaid' ? { label: 'Units', value: `About ${unitsFor(amount)} kWh` } : { label: 'Settles', value: 'The account, at once' },
            { label: 'Fee', value: 'Free' },
            { label: 'Leaves Everyday', value: naira(amount), strong: true },
          ]}
          verify={app.checkPasscode}
          onDone={done}
          onCancel={() => setGuard(false)}
        />
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  photoCard: { backgroundColor: colour.surface2, borderRadius: 24, padding: 12 },
  photoHead: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 24 },
  chip24: { width: 24, height: 24, borderRadius: 12, backgroundColor: colour.warn, alignItems: 'center', justifyContent: 'center' },
  /* the frame's slip: 12 around, 8 between its lines, and 6 under the last */
  slip: { marginTop: 8, backgroundColor: colour.surface, borderRadius: 16, paddingTop: 12, paddingHorizontal: 12, paddingBottom: 6, gap: 8, minHeight: 148 },
  box: { alignSelf: 'flex-start', height: 24, paddingHorizontal: 9, borderRadius: 8, backgroundColor: colour.accentWash, justifyContent: 'center' },
  tag: { alignSelf: 'flex-start', height: 18, paddingHorizontal: 9, borderRadius: 6, backgroundColor: colour.accentWash, justifyContent: 'center' },
  readRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, height: 15 },
  box14: { width: 14, height: 14, borderRadius: 4, borderWidth: 1, borderColor: colour.accent, backgroundColor: colour.surface, alignItems: 'center', justifyContent: 'center' },
  box14On: { backgroundColor: colour.accent },
  /* the frame's 16 around includes its hairline */
  askCard: { marginTop: -8, backgroundColor: colour.surface, borderWidth: 1, borderColor: colour.rule, borderRadius: 24, paddingTop: 15, paddingHorizontal: 16, paddingBottom: 16 },
  saysCard: { marginTop: 12, backgroundColor: colour.surface2, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  saysRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 28 },
  mineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, marginTop: 12 },
});
