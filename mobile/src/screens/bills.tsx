/* Bills — from a photo of a meter, and the ordinary way through the list.

   Frames 222:97 (the camera), 210:2 (what it read), 210:71 (the passcode),
   490:13497 (the token), 490:13595 (sharing it), 217:67 (the list) and
   217:2 (paying one). */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  Aside,
  Badge,
  Banner,
  AgentAsk,
  Bubble,
  Button,
  Card,
  CameraScreen,
  Caption,
  Between,
  Divider,
  Ghost,
  Head,
  Icon,
  Label,
  Meta,
  PageHead,
  PassSheet,
  ReadCard,
  Receipt,
  Row,
  Told,
  FormBlock,
  Slip,
  AgentSay,
  BottomBar,
  Screen,
  ShareSheet,
  SlideToSend,
  Title,
  colour,
  naira,
  nairaFull,
  radius,
  space,
  toast,
} from '../design';
import { Nav, dock } from './nav';
import { still } from './send';
import { useStore, Receipt as Paid } from '../state/live';
import { bills, me, meterBill } from '../state/data.js';
import * as act from '../state/actions.js';

type Bill = { biller: string; meter: string; amount: number; icon: string };

/* The bill being paid, whichever way you came in. */
let bill: Bill = { biller: meterBill.disco, meter: meterBill.meter, amount: meterBill.amount, icon: 'power' };
let slip: Paid | null = null;

export const startBill = (b: { name: string; sub: string; icon: string }, amount: number) => {
  bill = { biller: b.name, meter: b.sub.split('· ')[1] ?? meterBill.meter, amount, icon: b.icon };
  slip = null;
};

/* ---- pointing a camera at a bill ---- */

export const ScanBill = ({ nav }: { nav: Nav }) => (
  <CameraScreen
    title="Point at a bill or a meter"
    sub="The number on the card works too."
    foot="Or the meter number, typed, if the light is bad."
    onClose={nav.back}
    onShutter={() => nav.go('meter')}
    read={
      <ReadCard
        who="Bill photo"
        glyph="power"
        tone={colour.warn}
        when="4:02 PM"
        kind={meterBill.kind}
        lines={[`Meter ${meterBill.meter}`, naira(meterBill.amount), meterBill.address]}
        slip={meterBill.slip}
      />
    }
  >
    {/* what it took the meter number to be, on the same dark pill as the scan */}
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#2d2d2f',
        borderRadius: 999,
        paddingLeft: 8,
        paddingRight: 18,
        paddingVertical: 7,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: colour.good,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="check" size={13} colour={colour.textInverse} />
      </View>
      <Label tone="inverse">{meterBill.meter}</Label>
    </View>
  </CameraScreen>
);

/* ---- what it read off the photo ---- */

export const MeterRead = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask about this bill', nav, 'scanbill')}>
    <PageHead
      lead
      title="What I found"
      sub={`Read from your photo, ${meterBill.readAt.split(', ')[1] ?? '4:02 PM'}`}
    />
    <Card style={{ gap: space.s3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <Badge glyph="power" size={28} tone={colour.warn} ink={colour.textInverse} />
          <Label>Bill photo</Label>
        </View>
        <Caption tone="tertiary">{meterBill.readAt.split(', ')[1] ?? '4:02 PM'}</Caption>
      </View>
      <Caption tone="secondary">{meterBill.kind}</Caption>
      <View style={{ gap: space.s2, alignItems: 'flex-start' }}>
        {[`Meter ${meterBill.meter}`, naira(meterBill.amount), meterBill.address].map(t => (
          <View
            key={t}
            style={{
              backgroundColor: colour.accentWash,
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Label tone="accent">{t}</Label>
          </View>
        ))}
      </View>
      <Caption tone="tertiary">{meterBill.slip}</Caption>
    </Card>

    <Head>What I read</Head>
    <Card style={{ gap: space.s3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Caption tone="secondary">Amount</Caption>
          <Caption tone="tertiary">from the photo</Caption>
        </View>
        <Row>{naira(meterBill.amount)}</Row>
      </View>
      <Divider />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Caption tone="secondary" style={{ flex: 1 }}>
          Meter
        </Caption>
        <Row>{meterBill.meter}</Row>
      </View>
      <Divider />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Caption tone="secondary" style={{ flex: 1 }}>
          Disco
        </Caption>
        <Row>{meterBill.disco}</Row>
      </View>
    </Card>

    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
      <Icon name="alert" size={20} colour={colour.warn} />
      <Row>Is this your meter?</Row>
    </View>
    <Card style={{ gap: space.s3 }}>
      <Between label="On the bill" value={`Meter ${meterBill.meter}`} />
      <Between label="Ikeja Electric says" value={meterBill.address} />
    </Card>
    <View style={{ flexDirection: 'row', gap: space.s2 }}>
      <View style={{ flex: 1 }}>
        <Button
          label="Yes, that is mine"
          onPress={() => {
            bill = {
              biller: meterBill.disco,
              meter: meterBill.meter,
              amount: meterBill.amount,
              icon: 'power',
            };
            slip = null;
            nav.go('confirmmeter');
          }}
        />
      </View>
      <Button label="No" tone="grey" onPress={() => nav.go('bills')} />
    </View>
    <Card style={{ gap: space.s3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Meta tone="secondary">Amount</Meta>
          <Caption tone="tertiary">from the photo</Caption>
        </View>
        <Row>{naira(meterBill.amount)}</Row>
      </View>
      <Divider />
      <Between label="Meter" value={meterBill.meter} />
      <Divider />
      <Between label="Disco" value={meterBill.disco} />
    </Card>
    <Button
      label="Continue"
      onPress={() => {
        bill = {
          biller: meterBill.disco,
          meter: meterBill.meter,
          amount: meterBill.amount,
          icon: 'power',
        };
        slip = null;
        nav.go('confirmmeter');
      }}
    />
  </Screen>
);

/* ---- the passcode over it ---- */

export const ConfirmMeter = ({ nav }: { nav: Nav }) => (
  <PassSheet
    amount={naira(bill.amount)}
    title={bill.biller}
    sub={`Meter ${bill.meter}`}
    hint="Nothing moves until the fourth number lands."
    onClose={nav.back}
    onDone={() => {
      slip = act.payBill(bill);
      nav.go('power');
    }}
    behind={<MeterRead nav={still} />}
  />
);

/* ---- the token ---- */

export const Power = ({ nav }: { nav: Nav }) => {
  const s = useStore();
  const r = slip ?? {
    biller: bill.biller,
    meter: bill.meter,
    amount: bill.amount,
    token: meterBill.token,
    at: '27 August 2026 at 11:22 AM',
    session: 'IKJ 4457 8891 2208',
    balanceAfter: s.everyday,
  };
  return (
    <Screen dock={dock('Ask about this payment', nav, 'home')}>
      <View style={{ gap: 8 }}>
        <Head>Bill paid</Head>
        <Meta tone="tertiary" style={{ fontSize: 16, lineHeight: 24 }}>
          {r.at}
        </Meta>
      </View>
      <Receipt
        amount={naira(r.amount)}
        line={r.biller ?? bill.biller}
        fields={[
          ['To', r.biller ?? bill.biller, `Meter ${r.meter ?? bill.meter}`],
          ['From', 'Everyday', me.account],
          ['Amount', nairaFull(r.amount)],
          ['Fee', 'Free'],
          ['Total charged', nairaFull(r.amount)],
          ['Balance after', nairaFull(r.balanceAfter ?? s.everyday)],
        ]}
        session={r.session}
        sessionLabel="Ikeja reference"
      />
      <Card style={{ gap: space.s2 }}>
        <Caption tone="secondary">Meter token</Caption>
        <Title style={{ letterSpacing: 1.3 }}>{r.token ?? meterBill.token}</Title>
        <Pressable
          accessibilityRole="button"
          onPress={() => toast('Token copied. Type it into the meter.')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Label tone="accent">Copy the token</Label>
          <Icon name="copy" size={14} colour={colour.accent} />
        </Pressable>
      </Card>
      <Button label="Share receipt" leading="share" onPress={() => nav.go('sharepower')} />
      <Bubble>Pay this every month, without asking?</Bubble>
      <Button label="Set it up" tone="grey" onPress={() => nav.go('rule')} />
      <Ghost label="The token did not work?" onPress={() => nav.go('agentchat')} />
    </Screen>
  );
};

export const SharePower = ({ nav }: { nav: Nav }) => (
  <ShareSheet
    line={`${naira(bill.amount)} to ${bill.biller}, ${(slip?.at ?? '27 August 2026 at 11:22 AM').split(' at ')[1]}`}
    onClose={() => nav.go('power')}
    behind={<Power nav={still} />}
  />
);

/* ---- the list ---- */

type BillRow = { name: string; sub: string; icon: string; last: number; when: string; covered: boolean };

export const Bills = ({ nav }: { nav: Nav }) => {
  const rows = bills as BillRow[];
  const covered = rows.filter(b => b.covered).length;
  return (
    <Screen dock={dock('Ask about your bills', nav, 'services')}>
      <PageHead lead title="Bills" sub="Everything that repeats each month" />
      <View
        style={{
          gap: space.s4,
          borderWidth: 1,
          borderColor: colour.rule,
          borderRadius: radius.card,
          padding: space.s4,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.s3 }}>
          <Icon name="mark" size={32} colour={colour.accent} />
          <View style={{ flex: 1 }}>
            <Bubble>{`${naira(34500)} of bills this month. Three of the five are covered.`}</Bubble>
          </View>
        </View>
        {/* one block per bill, filled for the ones I already pay */}
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {rows.map((b, i) => (
            <View
              key={b.name}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: i < covered ? colour.accent : colour.surface3,
              }}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Label tone="accent" style={{ flex: 1 }}>{`${covered} of ${rows.length} covered`}</Label>
          <Caption tone="tertiary">{`${rows.length - covered} still to sort`}</Caption>
        </View>
      </View>
      <Meta tone="tertiary">This month</Meta>
      <Card style={{ gap: space.s3 }}>
        {rows.map((b, i) => (
          <View key={b.name}>
            {i ? (
              <View style={{ paddingBottom: space.s3 }}>
                <Divider />
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                startBill(b, b.last);
                nav.go('powerpay');
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.s3,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Icon name={b.icon as 'power'} size={20} />
              <View style={{ flex: 1, gap: 2 }}>
                <Row>{b.name}</Row>
                <Meta tone="secondary">
                  {b.when +
                    (b.covered && b.when.startsWith('Due')
                      ? ' · I pay it'
                      : b.covered
                        ? ''
                        : ' · Not covered')}
                </Meta>
              </View>
              <Label>{naira(b.last)}</Label>
              <Icon name="chevron" size={18} colour={colour.textTertiary} />
            </Pressable>
          </View>
        ))}
      </Card>
      <Button
        label="Add a bill"
        tone="grey"
        leading="plus"
        onPress={() => toast('Point the camera at it, or type the number.')}
      />
      <AgentAsk
        question="DStv and Spectranet are not covered. Shall I pay them?"
        answer="Set both up"
        onAnswer={() => nav.go('rules')}
      />
    </Screen>
  );
};

/* ---- paying one ---- */

export const PowerPay = ({ nav }: { nav: Nav }) => {
  const s = useStore();
  const [, tick] = useState(0);
  const enough = s.everyday >= bill.amount;
  /* what the frame says each of its three figures buys */
  const UNITS: Record<number, number> = { 3000: 14, 8000: 38, 15000: 72 };
  const kwh = (a: number) => `About ${UNITS[a] ?? Math.round(a / 210)} kWh`;
  return (
    <Screen
      dock={
        <BottomBar onBack={() => nav.go('bills')}>
          {enough ? (
            <SlideToSend label={`Slide to pay ${naira(bill.amount)}`} onDone={() => nav.go('confirmmeter')} />
          ) : (
            <Banner text="Not enough in Everyday for that." />
          )}
        </BottomBar>
      }
    >
      <PageHead lead title="Pay a bill" sub="Ikeja Electric, on your saved meter" />
      <Told onPress={() => nav.go('scanbill')}>pay my light bill</Told>
      <AgentSay>Ikeja Electric, the meter you always use.</AgentSay>
      <FormBlock>
        <Slip>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
            <Icon name="power" size={20} />
            <View style={{ flex: 1, gap: 2 }}>
              <Row>{bill.biller}</Row>
              <Meta tone="secondary">{`Prepaid · ${bill.meter}`}</Meta>
            </View>
            <Icon name="chevron" size={18} colour={colour.textTertiary} />
          </View>
          <Caption tone="tertiary">The meter you paid last month</Caption>
        </Slip>
        <Slip>
          <Head style={{ fontSize: 32, lineHeight: 40, fontWeight: '700' }}>{naira(bill.amount)}</Head>
          <Meta tone="tertiary">About what you used last month</Meta>
        </Slip>
        <View style={{ paddingHorizontal: space.s3, gap: space.s3, paddingVertical: space.s3 }}>
          <Between label="From" value={`Everyday · ${me.account}`} />
          <Between label="Token arrives" value="In a few seconds" />
        </View>
      </FormBlock>
      <Meta tone="secondary">Or pick an amount</Meta>
      <View style={{ flexDirection: 'row', gap: space.s2 }}>
        {[3000, 8000, 15000].map(v => (
          <Pressable
            key={v}
            accessibilityRole="button"
            accessibilityState={{ selected: v === bill.amount }}
            onPress={() => {
              bill = { ...bill, amount: v };
              slip = null;
              tick(n => n + 1);
            }}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: radius.md,
              backgroundColor: colour.surface,
              borderWidth: v === bill.amount ? 2 : 1,
              borderColor: v === bill.amount ? colour.accent : colour.rule,
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Row>{naira(v)}</Row>
            <Caption tone="tertiary">{kwh(v)}</Caption>
          </Pressable>
        ))}
      </View>
      <Aside>The token appears here and in your messages.</Aside>
    </Screen>
  );
};
