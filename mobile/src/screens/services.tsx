/* The services drawer and what sits behind it — data, borrowing, the card,
   the record, and the answer to a question about spending.

   Frames 215:2, 215:170, 217:181, 218:2, 501:14267 and 218:84. */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  ActionButton,
  ActionRow,
  AgentCard,
  Aside,
  Avatar,
  Banner,
  Bubble,
  Button,
  Card,
  CardFace,
  Caption,
  Chip,
  ChipRow,
  Between,
  Display,
  Divider,
  Dock,
  Empty,
  Filters,
  Grid,
  Head,
  Icon,
  Label,
  LedgerRow,
  Meta,
  Meter,
  PageHead,
  Row,
  Said,
  Screen,
  SlideToSend,
  Slider,
  colour,
  naira,
  radius,
  signed,
  space,
  toast,
} from '../design';
import { Nav, asked, dock } from './nav';
import { Ledger, useStore } from '../state/live';
import { Route } from '../routes';
import { setPlan } from './buy';
import { card as seedCard, contacts, ledgerFooter, loan, me } from '../state/data.js';
import { byDay } from '../state/store.js';
import * as act from '../state/actions.js';

/* ---- everything you can do ---- */

const BILL_ROWS: [string, string, string][] = [
  ['globe', 'Internet', 'Spectranet, Smile, Starlink'],
  ['water', 'Water', 'State water boards'],
  ['waste', 'Waste', 'LAWMA and others'],
  ['school', 'School fees', 'WAEC, JAMB, tuition'],
];

const SAVE_ROWS: [string, string, string, Route][] = [
  ['pot', 'Savings pot', 'Put money aside', 'goal'],
  ['lock', 'Fixed savings', 'Lock it for a set time', 'saverule'],
];

function Rows({ rows, nav }: { rows: [string, string, string, Route][]; nav: Nav }) {
  return (
    <Card style={{ gap: space.s3 }}>
      {rows.map(([glyph, title, sub, to], i) => (
        <View key={title}>
          {i ? (
            <View style={{ paddingBottom: space.s3 }}>
              <Divider />
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => nav.go(to)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.s3,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Icon name={glyph as 'globe'} size={20} />
            <View style={{ flex: 1, gap: 2 }}>
              <Row>{title}</Row>
              <Meta tone="secondary">{sub}</Meta>
            </View>
            <Icon name="chevron" size={18} colour={colour.textTertiary} />
          </Pressable>
        </View>
      ))}
    </Card>
  );
}

export const Services = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Search, or say what you need', nav, 'home')}>
    <PageHead lead title="All services" sub="Everything you can pay for from here" />
    <Head>You use these most</Head>
    <Grid
      items={[
        { glyph: 'airtime', label: 'Airtime', onPress: () => nav.go('airtime') },
        { glyph: 'data', label: 'Data', onPress: () => nav.go('airtime') },
        { glyph: 'power', label: 'Power', onPress: () => nav.go('bills') },
        { glyph: 'send', label: 'Send', onPress: () => nav.go('pay') },
      ]}
    />
    <Grid
      items={[
        { glyph: 'tv', label: 'Cable TV', onPress: () => nav.go('bills') },
        { glyph: 'bet', label: 'Betting', onPress: () => nav.go('bills') },
        { glyph: 'loan', label: 'Loan', onPress: () => nav.go('loan') },
        { glyph: 'card', label: 'Cards', onPress: () => nav.go('card') },
      ]}
    />
    <Head>Bills</Head>
    <Rows nav={nav} rows={BILL_ROWS.map(([g, t, s]) => [g, t, s, 'bills' as Route])} />
    <Head>Save and borrow</Head>
    <Rows nav={nav} rows={SAVE_ROWS} />
    <Head>Money</Head>
    <MoneyRows nav={nav} />
  </Screen>
);

/* The dollar line reads the balance, so it is drawn where the store can be
   read rather than in a table above. */
function MoneyRows({ nav }: { nav: Nav }) {
  const s = useStore();
  return (
    <Rows
      nav={nav}
      rows={[
        ['dollar', 'Dollars', `$${s.dollars.toFixed(2)}, holding steady`, 'dollars'],
        ['request', 'Request money', 'Ask someone to pay you', 'askreq'],
        ['globe', 'Send abroad', 'Pounds, dollars and euros', 'convert'],
      ]}
    />
  );
}

/* ---- buying data the ordinary way ---- */

const BUNDLES: [string, number][] = [
  ['1GB', 800],
  ['2GB', 2000],
  ['10GB', 4000],
];

export const Airtime = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask for a plan', nav, 'services')}>
    <PageHead lead title="Buy data" sub="Check the parts I filled in before it goes" />
    <Caption tone="secondary">You said</Caption>
    <Said onPress={() => nav.go('asksvc')}>2k data for mum</Said>
    <AgentCard>5GB for 30 days, on Mum’s MTN line.</AgentCard>
    <Card style={{ gap: space.s3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
        <Avatar initials={contacts.mum.initials} />
        <View style={{ flex: 1, gap: 2 }}>
          <Row>Mum</Row>
          <Meta tone="secondary">{`${contacts.mum.account} · MTN`}</Meta>
        </View>
      </View>
      <Caption tone="tertiary">The number you top up most</Caption>
    </Card>
    <Card style={{ gap: space.s3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Row>5GB for 30 days</Row>
          <Caption tone="tertiary">It will not renew on its own</Caption>
        </View>
        <Label>{naira(2500)}</Label>
      </View>
      <Caption tone="tertiary">The bundle you bought last month</Caption>
    </Card>
    <Card style={{ gap: space.s3 }}>
      <Between label="From" value={`Everyday · ${me.account}`} />
      <Between label="Goes to your Holiday goal" value={naira(25)} />
    </Card>
    <Head>Other bundles</Head>
    <View style={{ flexDirection: 'row', gap: space.s2 }}>
      {BUNDLES.map(([t, v]) => (
        <Pressable
          key={t}
          accessibilityRole="button"
          onPress={() => {
            setPlan(v === 800 ? 1000 : v === 2000 ? 2500 : 4000);
            nav.go('buy');
          }}
          style={({ pressed }) => ({
            flex: 1,
            padding: 12,
            borderRadius: radius.md,
            backgroundColor: colour.surface2,
            gap: 2,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Row>{t}</Row>
          <Caption tone="tertiary">{naira(v)}</Caption>
        </Pressable>
      ))}
    </View>
    <Caption tone="tertiary">You also top up</Caption>
    <SlideToSend
      label={`Slide to buy ${naira(2500)}`}
      onDone={() => {
        setPlan(2500);
        nav.go('confirmbuy');
      }}
    />
  </Screen>
);

/* ---- borrowing, priced honestly ---- */

export const Loan = ({ nav }: { nav: Nav }) => {
  const [want, setWant] = useState(loan.principal as number);
  const [term, setTerm] = useState('90 days');
  const interest = Math.round(want * 0.04 * 3);
  const fee = 1500;
  const total = want + interest + fee;
  const per = Math.round(total / 3);
  const facts: [string, string][] = [
    ['You get today', naira(want)],
    ['Interest, 4% a month', naira(interest)],
    ['One off fee', naira(fee)],
    ['You pay back in all', naira(total)],
    ['Three payments of', naira(per)],
    ['First payment', loan.firstPayment],
  ];
  return (
    <Screen dock={dock('Ask what this really costs', nav, 'services')}>
      <PageHead lead title="Borrow" sub="The whole cost, before you decide" />
      <AgentCard>You asked what you could borrow. Here is the whole cost.</AgentCard>
      <Card style={{ gap: space.s3 }}>
        <Meta tone="secondary">How much you want</Meta>
        <Display>{naira(want)}</Display>
        <Slider value={want} min={10000} max={loan.ceiling} step={10000} onChange={setWant} />
        <View style={{ flexDirection: 'row' }}>
          <Caption tone="tertiary" style={{ flex: 1 }}>
            {naira(10000)}
          </Caption>
          <Caption tone="tertiary">{`${naira(loan.ceiling)} is your limit`}</Caption>
        </View>
        <ChipRow>
          {['30 days', '60 days', '90 days'].map(t => (
            <Chip key={t} label={t} on={t === term} onPress={() => setTerm(t)} />
          ))}
        </ChipRow>
      </Card>
      <Card style={{ gap: space.s3 }}>
        {facts.map(([k, v], i) => (
          <View key={k}>
            {i ? (
              <View style={{ paddingBottom: space.s3 }}>
                <Divider />
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Meta tone="secondary" style={{ flex: 1, fontSize: 16, lineHeight: 24 }}>
                {k}
              </Meta>
              <Row>{v}</Row>
            </View>
          </View>
        ))}
      </Card>
      {/* Four per cent a month is not the rate people hear. The frames do not
          say this; it was added when the pricing was made honest. */}
      <View style={{ backgroundColor: '#fdf2dd', borderRadius: radius.card, padding: space.s5, gap: 4 }}>
        <Label style={{ color: '#7a5b12' }}>What that is, as a rate</Label>
        <View style={{ flexDirection: 'row' }}>
          <Meta style={{ flex: 1, color: '#7a5b12', fontSize: 16, lineHeight: 24 }}>Nominal APR</Meta>
          <Row style={{ color: '#7a5b12' }}>{`${loan.nominalApr}%`}</Row>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Meta style={{ flex: 1, color: '#7a5b12', fontSize: 16, lineHeight: 24 }}>Compounded</Meta>
          <Row style={{ color: '#7a5b12' }}>{`${loan.effectiveApr}%`}</Row>
        </View>
        <Caption style={{ color: '#7a5b12' }}>
          Four per cent a month sounds small. Because you repay in three parts while interest is charged on
          the whole amount, the real rate is the one above.
        </Caption>
      </View>
      <SlideToSend
        label={`Slide to take ${naira(want)}`}
        onDone={() => {
          act.borrow({ principal: want, total, instalments: 3, perInstalment: per });
          toast(`${naira(want)} is in Everyday. First payment on ${loan.firstPayment}.`);
        }}
      />
      <Aside glyph="alert">{loan.lateFee}</Aside>
    </Screen>
  );
};

/* ---- the card ---- */

export const CardScreen = ({ nav }: { nav: Nav }) => {
  const s = useStore();
  const c = s.card;
  const left = seedCard.ceiling - c.spent;
  /* Reveal and Rules are ink; freezing is the cold blue and funding the green,
     which is how the frame tells the four apart. */
  const tool = (glyph: string, label: string, tint: string, onPress: () => void) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 6, opacity: pressed ? 0.6 : 1 })}
    >
      <Icon name={glyph as 'eye'} size={22} colour={tint} />
      <Caption tone="secondary">{label}</Caption>
    </Pressable>
  );
  return (
    <Screen
      dock={
        <Dock
          placeholder="Ask about this card"
          onBack={() => nav.go('services')}
          onAsk={q => asked(nav, q)}
          onScan={() => nav.go('scan')}
          action={<ActionButton onPress={() => nav.go('actions')} />}
        />
      }
    >
      <PageHead title="Virtual card" sub="Made for one merchant, with its own limit" />
      <CardFace only={seedCard.only} number={seedCard.number} name={seedCard.name} expiry={seedCard.expiry} />
      <Card style={{ flexDirection: 'row', gap: space.s2, paddingVertical: 12 }}>
        {tool('search', 'Reveal', colour.ink, () =>
          toast('Held down to show. It hides again in ten seconds.'),
        )}
        {tool('freeze', c.frozen ? 'Unfreeze' : 'Freeze', '#22b8e8', () => {
          const now = !c.frozen;
          act.freezeCard(now);
          toast(now ? 'Card frozen. Nothing can be charged to it.' : 'Card is live again.');
        })}
        {tool('plus', 'Fund', colour.good, () =>
          toast('Moved from Everyday. It only ever holds what you put on it.'),
        )}
        {tool('list', 'Rules', colour.ink, () => nav.go('rules'))}
      </Card>
      {c.frozen ? <Banner text="This card is frozen. Nothing can be charged to it." /> : null}
      <AgentCard>This card has paid Netflix four times, ₦21,000 in all.</AgentCard>
      <Card style={{ gap: space.s3 }}>
        <Between label="Spent this month" value={`${naira(c.spent)} of ${naira(seedCard.ceiling)}`} />
        <Meter pct={(c.spent / seedCard.ceiling) * 100} />
        <Caption tone="tertiary">{`${naira(left)} left before it stops working`}</Caption>
      </Card>
      <Button
        label="Make another card"
        tone="grey"
        leading="plus"
        onPress={() => toast('A second card, with its own ceiling and its own rules.')}
      />
    </Screen>
  );
};

/* ---- the record ---- */

export const History = ({ nav }: { nav: Nav }) => {
  const s = useStore();
  const [filter, setFilter] = useState('All');
  const pick = (rows: Ledger[]) =>
    filter === 'In'
      ? rows.filter(r => r.amount > 0)
      : filter === 'Out'
        ? rows.filter(r => r.amount < 0)
        : rows;
  const today = pick(byDay('today') as Ledger[]);
  const yesterday = pick(byDay('yesterday') as Ledger[]);
  const line = (r: Ledger) => (
    <LedgerRow
      key={r.id}
      glyph={r.icon as 'send'}
      name={r.name}
      detail={`${r.detail} · ${r.time}`}
      amount={signed(r.amount)}
      good={r.amount > 0}
      onPress={() => nav.go(r.to as Route)}
    />
  );
  return (
    <Screen dock={dock('Ask about any of these', nav, 'home')}>
      <PageHead lead title="History" sub="Everything that moved, newest first" />
      <Filters options={['All', 'In', 'Out']} value={filter} onChange={setFilter} />
      {today.length ? <Meta tone="tertiary">Today</Meta> : null}
      {today.map(line)}
      {yesterday.length ? <Meta tone="tertiary">Yesterday</Meta> : null}
      {yesterday.map(line)}
      {!today.length && !yesterday.length ? (
        <Empty glyph="wait-filled" body="Nothing here under that filter" />
      ) : null}
      <Card>
        <Bubble>{ledgerFooter}</Bubble>
      </Card>
      <Meta tone="tertiary">{`₦${s.everyday.toLocaleString('en-NG', { minimumFractionDigits: 2 })} in Everyday right now.`}</Meta>
    </Screen>
  );
};

/* ---- the answer to a question about spending ---- */

const MONTHS: [string, number][] = [
  ['Feb', 34],
  ['Mar', 41],
  ['Apr', 38],
  ['May', 52],
  ['Jun', 59],
  ['Jul', 100],
];

const WENT: [string, string, number][] = [
  ['MTN data', '5 top ups', 12500],
  ['MTN airtime', '7 top ups', 4400],
  ['Glo airtime', '2 top ups', 2000],
];

export const Answer = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask about this', nav, 'history')}>
    <PageHead lead title="Airtime and data" sub="You asked how much you spend on staying connected" />
    <AgentCard>₦18,900 on airtime and data last month. That is your highest month this year.</AgentCard>
    <View style={{ gap: 4 }}>
      <Display>{naira(18900)}</Display>
      <Meta tone="secondary">Airtime and data</Meta>
      <Meta tone="secondary">Last month</Meta>
      <Meta tone="tertiary">Added up from 14 top ups, 1 to 31 July</Meta>
    </View>
    <Card style={{ gap: space.s3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: space.s2 }}>
        {MONTHS.map(([m, pct]) => (
          <View key={m} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: '100%',
                height: Math.max(6, pct),
                borderRadius: 6,
                backgroundColor: pct === 100 ? colour.accent : colour.rule,
              }}
            />
            <Caption tone="secondary">{m}</Caption>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row' }}>
        <Caption tone="tertiary" style={{ flex: 1 }}>
          {naira(4200)}
        </Caption>
        <Caption tone="tertiary">{naira(18900)}</Caption>
      </View>
    </Card>
    <Head>Where it went</Head>
    <Card style={{ gap: space.s3 }}>
      {WENT.map(([what, howMany, amount], i) => (
        <View key={what}>
          {i ? (
            <View style={{ paddingBottom: space.s3 }}>
              <Divider />
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Row>{what}</Row>
              <Meta tone="secondary">{howMany}</Meta>
            </View>
            <Label>{naira(amount)}</Label>
          </View>
        </View>
      ))}
    </Card>
    <Bubble>
      That is your highest month this year. Three of the four top ups were the same 5GB plan bought
      separately. The 10GB plan covers the same use for ₦2,000 less a month.
    </Bubble>
    <ActionRow
      icon="data"
      title="Move to the 10GB plan"
      sub="Saves about ₦2,000 a month"
      onPress={() => nav.go('airtime')}
    />
    <ActionRow
      icon="power"
      title="Let me top up automatically"
      sub="Only when the data actually runs out"
      onPress={() => nav.go('rule')}
    />
    <AgentCard>A 10GB monthly plan is ₦4,000 and would save about ₦1,800.</AgentCard>
  </Screen>
);
