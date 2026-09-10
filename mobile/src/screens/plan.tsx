/* Habits, saving and dollars — the score, the pot, the rule that feeds it,
   what happens when money is tight, and holding or converting dollars.

   Frames 223:2, 219:2, 224:122, 204:2, 279:8211, 279:8299 and 296:8850. */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  ActionRow,
  AmountPad,
  AgentAsk,
  AgentCard,
  Aside,
  Banner,
  Bubble,
  Button,
  Card,
  Caption,
  Between,
  Display,
  Divider,
  Ghost,
  Head,
  Icon,
  Label,
  Meta,
  PageHead,
  Ring,
  Row,
  Screen,
  Sheet,
  SlideToSend,
  StatusPill,
  colour,
  naira,
  nairaFull,
  radius,
  space,
  toast,
} from '../design';
import { Nav, dock } from './nav';
import { still } from './send';
import { useStore } from '../state/live';
import { goal as seedGoal } from '../state/data.js';
import { dollarsInNaira } from '../state/store.js';
import * as act from '../state/actions.js';

/* ---- how you are handling it ---- */

const MOVES: [string, string, string, string, boolean][] = [
  ['check', 'You check before you send', 'Every transfer read before it left', '9 of 9', true],
  ['pot', 'You save on payday', 'Before it can go anywhere else', '3 months', false],
  ['eye', 'Your balance stays covered', 'Dots in public, figures at home', 'On', true],
  ['lock', 'Only you can open this', 'Face ID, a passcode, and a limit', 'On', true],
  ['chart', 'You watch where it goes', 'Against what you planned to spend', '18% over', false],
];

export const Health = ({ nav }: { nav: Nav }) => {
  const s = useStore();
  return (
    <Screen dock={dock('Ask me how to move it', nav, 'home')}>
      <PageHead lead title="Money health" sub="One number for how you are handling it" />
      <Card>
        <View style={{ alignItems: 'center', gap: space.s2 }}>
          <Ring pct={s.health} size={150}>
            <Head style={{ fontSize: 32, lineHeight: 40, fontWeight: '700' }}>{String(s.health)}</Head>
            <Caption tone="secondary">out of 100</Caption>
          </Ring>
          <Label tone="good">Up 4 since July</Label>
        </View>
      </Card>
      <Head>What moves it</Head>
      <Card style={{ gap: space.s3 }}>
        {MOVES.map(([glyph, title, sub, right, good], i) => (
          <View key={title}>
            {i ? (
              <View style={{ paddingBottom: space.s3 }}>
                <Divider />
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
              <Icon name={glyph as 'check'} size={20} colour={good ? colour.goodText : colour.ink} />
              <View style={{ flex: 1, gap: 2 }}>
                <Row>{title}</Row>
                <Meta tone="secondary">{sub}</Meta>
              </View>
              <Label tone={good ? 'good' : 'ink'}>{right}</Label>
            </View>
          </View>
        ))}
      </Card>
      <Bubble>
        Steadier than you were. The one thing holding it down is spending, which is up 18% on last month.
        Everything else is going the right way.
      </Bubble>
      <AgentAsk
        question="Holding ₦5,000 back on payday would take this to 76 by October. Want me to set it up?"
        answer="Set it up"
        onAnswer={() => nav.go('rule')}
      />
      <Head>This is not a credit score</Head>
      <Meta tone="secondary">
        It never leaves this phone. No lender sees it, no bank is sent it, and it changes nothing about what
        you can borrow. It is here so you can watch your own habits, and for no other reason.
      </Meta>
      <ActionRow
        icon="chart"
        title="Where the money went"
        sub="Last month, by category"
        onPress={() => nav.go('answer')}
      />
    </Screen>
  );
};

/* ---- the pot ---- */

export const Goal = ({ nav }: { nav: Nav }) => {
  const s = useStore();
  const g = s.goal;
  const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
  const [sheet, setSheet] = useState<null | 'add' | 'take'>(null);
  const [amount, setAmount] = useState(5000);
  const close = () => setSheet(null);

  const base = (
    <Screen dock={dock('Ask about this goal', nav, 'home')}>
      <PageHead lead title={g.name} sub={`${naira(g.target)} by ${g.by}`} />
      <Card>
        <View style={{ alignItems: 'center', gap: space.s3 }}>
          <Ring pct={pct} size={132} tone={g.paused ? colour.warn : colour.accent}>
            <Head>{`${pct}%`}</Head>
            <Caption tone="secondary">of the way</Caption>
          </Ring>
          <Head>{naira(g.saved)}</Head>
          <Meta tone="tertiary">{`of ${naira(g.target)} put aside`}</Meta>
          {g.paused ? <StatusPill label="Paused" tone={colour.warn} /> : null}
        </View>
      </Card>
      <Bubble>
        {pct >= 100
          ? 'You are there. Take it whenever you want it, and I will stop feeding this one.'
          : seedGoal.ahead}
      </Bubble>
      <Head>What is feeding it</Head>
      <Card style={{ gap: space.s3 }}>
        {(seedGoal.feeders as { name: string; sub: string; amount: number }[]).map((f, i) => (
          <View key={f.name}>
            {i ? (
              <View style={{ paddingBottom: space.s3 }}>
                <Divider />
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => nav.go('saverule')}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.s3,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Row>{f.name}</Row>
                <Meta tone="secondary">{f.sub}</Meta>
              </View>
              <Label>{naira(f.amount)}</Label>
            </Pressable>
          </View>
        ))}
      </Card>
      <View style={{ flexDirection: 'row', gap: space.s2 }}>
        <View style={{ flex: 1 }}>
          <Button
            label="Add money"
            onPress={() => {
              setAmount(5000);
              setSheet('add');
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Feed it more" tone="grey" onPress={() => nav.go('saverule')} />
        </View>
      </View>
      <Button
        label={g.paused ? 'Start feeding it again' : 'Pause feeding it'}
        tone="grey"
        onPress={() => {
          act.pauseGoal(!g.paused);
          toast(
            g.paused
              ? 'Feeding it again from your next salary.'
              : 'Paused. Nothing already saved was touched.',
          );
        }}
      />
      <Aside>{seedGoal.unlocked}</Aside>
      <Ghost label="What happens if money gets tight?" onPress={() => nav.go('paused')} />
    </Screen>
  );

  if (!sheet) return base;
  const taking = sheet === 'take';
  return (
    <Sheet onClose={close} behind={base}>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Head>{taking ? 'Take how much back?' : 'Put how much away?'}</Head>
        <Meta tone="tertiary">
          {taking ? `${naira(g.saved)} is in ${g.name}` : `${naira(s.everyday)} in Everyday`}
        </Meta>
      </View>
      <AmountPad value={amount} onChange={setAmount} />
      <Button
        label={taking ? 'Take it back' : 'Put it away'}
        onPress={() => {
          if (!amount) {
            toast('Put a figure in first.');
            return;
          }
          if (taking && amount > g.saved) {
            toast(`Only ${naira(g.saved)} is in there.`);
            return;
          }
          if (!taking && amount > s.everyday) {
            toast('Not enough in Everyday for that.');
            return;
          }
          if (taking) act.takeFromGoal(amount);
          else act.saveToGoal(amount);
          close();
          toast(
            taking
              ? `${naira(amount)} is back in Everyday.`
              : `${naira(amount)} put away. Nothing is locked.`,
          );
        }}
      />
      <Button label="Never mind" tone="grey" onPress={close} />
    </Sheet>
  );
};

/* ---- the rule that feeds it ---- */

const FEEDERS: [string, string, string, string][] = [
  ['A slice of payday', '10% the day your salary lands', '₦20,000 a month', 'Payday transfer'],
  ['Round ups', 'The change from every card payment', '₦2,280 a month', 'Round ups'],
  ['Money back on top ups', 'Cash back comes here instead of out', '₦120 a month', 'Money back on top ups'],
];

export const SaveRule = ({ nav }: { nav: Nav }) => {
  const s = useStore();
  const g = s.goal;
  return (
    <Sheet onClose={() => nav.go('goal')} behind={<Goal nav={still} />}>
      <PageHead
        title={`Feed the ${g.name} goal`}
        sub="Pick something that runs without you thinking about it"
      />
      <View style={{ gap: space.s2 }}>
        {FEEDERS.map(([title, sub, amt, rule]) => (
          <Pressable
            key={title}
            accessibilityRole="button"
            onPress={() => {
              act.setStanding(rule, true);
              toast(`${title} is feeding ${g.name}.`);
              nav.go('goal');
            }}
            style={({ pressed }) => ({
              backgroundColor: colour.surface2,
              borderRadius: radius.card,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.s3,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Row>{title}</Row>
              <Caption tone="tertiary">{sub}</Caption>
            </View>
            <Label>{amt}</Label>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => nav.go('goal')}
          style={({ pressed }) => ({
            backgroundColor: colour.surface2,
            borderRadius: radius.card,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.s3,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Row>A fixed amount</Row>
            <Caption tone="tertiary">You pick the day and the sum</Caption>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 2 }}>
            <Label>You choose</Label>
            <Caption tone="accent">Set it</Caption>
          </View>
        </Pressable>
      </View>
      <Head>None of this is locked away</Head>
      <Meta tone="secondary">
        Take any of it back the same day. No fee, no notice, and no question from me about why.
      </Meta>
      <Button label="Done" tone="grey" onPress={() => nav.go('goal')} />
    </Sheet>
  );
};

/* ---- when money is tight ---- */

export const Paused = ({ nav }: { nav: Nav }) => {
  const s = useStore();
  const g = s.goal;
  const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
  return (
    <Screen dock={dock('Ask about this goal', nav, 'goal')}>
      <PageHead lead title={g.name} sub="Paused while things are tight" />
      <Card>
        <View style={{ alignItems: 'center', gap: space.s2 }}>
          <Display>{`${pct}%`}</Display>
          <Caption tone="tertiary">of the way</Caption>
          <Head>{naira(g.saved)}</Head>
          <Meta tone="tertiary">{`of ${naira(g.target)}, holding steady`}</Meta>
        </View>
      </Card>
      <Head>Waiting for you</Head>
      <Card style={{ gap: space.s3 }}>
        {(
          [
            ['Payday transfer', 'Paused since 3 August', null],
            ['Round ups', 'Paused since 3 August', null],
            ['Money back on top ups', 'Still going in', '₦120'],
          ] as [string, string, string | null][]
        ).map(([t, when, amount], i) => (
          <View key={t}>
            {i ? (
              <View style={{ paddingBottom: space.s3 }}>
                <Divider />
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Row>{t}</Row>
                <Meta tone="secondary">{when}</Meta>
              </View>
              {amount ? <Label>{amount}</Label> : <StatusPill label="Paused" tone={colour.warn} />}
            </View>
          </View>
        ))}
      </Card>
      <AgentCard>
        You told me money is tight, so I have stopped moving it. Your date moves from 12 March to 9 April.
        Nothing has been taken and nothing has been charged.
      </AgentCard>
      <Button label="Add money anyway" tone="grey" onPress={() => nav.go('goal')} />
      <Button
        label="Start again"
        onPress={() => {
          act.pauseGoal(false);
          toast('Feeding it again.');
          nav.go('goal');
        }}
      />
      <Aside>I will not ask you about this again until you tell me to.</Aside>
    </Screen>
  );
};

/* ---- dollars ---- */

const CAME: [string, string, string][] = [
  ['Converted from naira', '+$180.00', '12 August · at ₦1,534'],
  ['From Musa Danjuma', '+$120.00', '28 July · for the generator'],
  ['Converted from naira', '+$112.60', '3 March · at ₦1,410'],
];

export const Dollars = ({ nav }: { nav: Nav }) => {
  const s = useStore();
  return (
    <Screen dock={dock('Ask me about your dollars', nav, 'home')}>
      <PageHead lead title="Dollars" sub="Steady when the naira is not, and yours to turn back any day" />
      <View style={{ gap: 4 }}>
        <Display>{`$${s.dollars.toFixed(2)}`}</Display>
        <Meta tone="tertiary">{`${naira(dollarsInNaira())} at today’s rate`}</Meta>
      </View>
      <View style={{ flexDirection: 'row', gap: space.s2 }}>
        <View style={{ flex: 1 }}>
          <Button label="Convert" onPress={() => nav.go('convert')} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Send" tone="grey" onPress={() => nav.go('paydollars')} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
        <Meta tone="secondary" style={{ flex: 1 }}>{`${naira(s.rate)} to the dollar today`}</Meta>
        <Label tone="good">Up ₦18</Label>
      </View>
      <AgentCard>
        You put these away in March at ₦1,410. Held in naira that same money would be worth ₦58,200 less than
        it is now.
      </AgentCard>
      <Head>Where they came from</Head>
      <Card style={{ gap: space.s3 }}>
        {CAME.map(([title, amt, when], i) => (
          <View key={title + when}>
            {i ? (
              <View style={{ paddingBottom: space.s3 }}>
                <Divider />
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
              <Icon name="dollar" size={20} />
              <View style={{ flex: 1, gap: 2 }}>
                <Row>{title}</Row>
                <Meta tone="secondary">{when}</Meta>
              </View>
              <Label tone="good">{amt}</Label>
            </View>
          </View>
        ))}
      </Card>
      <Head>Nobody here holds a key</Head>
      <Meta tone="secondary">
        Your dollars sit in a domiciliary account at our partner bank, under CBN rules. Beetle moves them when
        you say so and cannot move them when you do not.
      </Meta>
      <Aside glyph="clock">Turn any of it back to naira the same day. There is no notice and no lock.</Aside>
      <View style={{ gap: space.s2 }}>
        <Label>Where these actually sit</Label>
        <Caption tone="secondary">
          Your dollars sit in a domiciliary account at our partner bank, under CBN rules. Beetle moves them
          when you say so and cannot move them when you do not.
        </Caption>
      </View>
    </Screen>
  );
};

/* What was last converted, so the receipt reads the real figures. */
let fx = {
  direction: 'to-dollars' as 'to-dollars' | 'to-naira',
  amount: 155200,
  gave: 0,
  got: 0,
  rate: 0,
  unit: '$',
  at: '',
};

export const Convert = ({ nav }: { nav: Nav }) => {
  const s = useStore();
  const [, tick] = useState(0);
  const [editing, setEditing] = useState(false);
  const toDollars = fx.direction === 'to-dollars';
  const gets = toDollars ? fx.amount / s.rate : Math.round(fx.amount * s.rate);
  const enough = toDollars ? s.everyday >= fx.amount : s.dollars >= fx.amount;
  const redraw = () => tick(n => n + 1);

  const base = (
    <Screen dock={dock('Ask about the rate', nav, 'dollars')}>
      <PageHead lead title="Convert" sub="Naira into dollars, at the rate on this screen" />
      <Card style={{ gap: space.s3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Caption tone="secondary">From</Caption>
            <Row>{toDollars ? 'Everyday' : 'Dollars'}</Row>
          </View>
          <Caption tone="tertiary">
            {toDollars ? `${naira(s.everyday)} there` : `$${s.dollars.toFixed(2)} there`}
          </Caption>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Swap"
          onPress={() => {
            fx.direction = toDollars ? 'to-naira' : 'to-dollars';
            fx.amount = toDollars ? 100 : 155200;
            redraw();
          }}
          style={{
            alignSelf: 'center',
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colour.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="swap" size={18} />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Caption tone="secondary">To</Caption>
            <Row>{toDollars ? 'Dollars' : 'Everyday'}</Row>
          </View>
          <Caption tone="tertiary">
            {toDollars ? `$${s.dollars.toFixed(2)} there` : `${naira(s.everyday)} there`}
          </Caption>
        </View>
      </Card>
      <View style={{ gap: 4 }}>
        <Caption tone="secondary">You are converting</Caption>
        <Pressable
          accessibilityRole="button"
          onPress={() => setEditing(true)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.s2,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Display>{toDollars ? naira(fx.amount) : `$${fx.amount.toFixed(2)}`}</Display>
          <Label tone="accent">Change</Label>
        </Pressable>
        <Meta tone="tertiary">{`You get about ${toDollars ? '$' + gets.toFixed(2) : naira(gets)}`}</Meta>
      </View>
      <Card style={{ gap: space.s3 }}>
        <Between label="Rate" value={`₦${s.rate.toLocaleString('en-NG')} to $1`} />
        <Between label="Our fee" value="Free under $500" tone="good" />
        <Divider />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Caption tone="secondary" style={{ flex: 1 }}>
            You get
          </Caption>
          <Row>{toDollars ? `$${gets.toFixed(2)}` : nairaFull(gets)}</Row>
        </View>
      </Card>
      <AgentCard>
        The rate moved ₦18 your way this week. If you were waiting for a better day, this is one of them.
      </AgentCard>
      <Aside glyph="clock">The rate is held for sixty seconds once you slide.</Aside>
      {enough ? (
        <SlideToSend
          label="Slide to convert"
          onDone={() => {
            const r = act.convert({ direction: fx.direction, amount: fx.amount });
            fx = { ...fx, ...r };
            nav.go('converted');
          }}
        />
      ) : (
        <Banner
          text={toDollars ? 'Not enough in Everyday for that.' : 'You do not hold that many dollars.'}
        />
      )}
    </Screen>
  );

  if (!editing) return base;
  return (
    <Sheet onClose={() => setEditing(false)} behind={base}>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Head>How much?</Head>
        <Meta tone="tertiary">
          {toDollars ? `${naira(s.everyday)} in Everyday` : `$${s.dollars.toFixed(2)} held`}
        </Meta>
      </View>
      <AmountPad
        value={fx.amount}
        onChange={v => {
          fx.amount = v;
          redraw();
        }}
      />
      <Button label="Use this" onPress={() => setEditing(false)} />
    </Sheet>
  );
};

export const Converted = ({ nav }: { nav: Nav }) => {
  const s = useStore();
  const r = fx.at
    ? fx
    : { gave: 155200, got: 100, rate: s.rate, unit: '$', at: '9 September 2026 at 4:23 PM' };
  const toDollars = r.unit === '$';
  /* The frame keeps this one short: the tick, the figure, three lines about
     the rate, and the one thing worth doing next. No slip, no session line. */
  return (
    <Screen dock={dock('Ask me about this', nav, 'dollars')}>
      <PageHead title="Converted" sub="It is in your dollars already" />
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colour.good,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="check" size={26} colour={colour.textInverse} />
      </View>
      <View style={{ gap: 4 }}>
        <Display>{toDollars ? `$${r.got.toFixed(2)}` : nairaFull(r.got)}</Display>
        <Meta tone="secondary">
          {toDollars ? `From ${naira(r.gave)} in Everyday` : `From $${r.gave.toFixed(2)} in Dollars`}
        </Meta>
      </View>
      <View style={{ gap: space.s6 }}>
        <Between label="Rate you got" value={`₦${r.rate.toLocaleString('en-NG')} to $1`} />
        <Between label="Fee" value="Free" tone="good" />
        <Between label="Dollars now" value={`$${(fx.at ? s.dollars : s.dollars + r.got).toFixed(2)}`} />
      </View>
      <AgentAsk
        question="Dollars sitting still do nothing. Move ₦20,000 across on payday and you never have to think about it again."
        answer="Set it up"
        onAnswer={() => nav.go('rule')}
      />
      <Ghost label="See your dollars" onPress={() => nav.go('dollars')} />
      <Ghost label="Something wrong with this?" onPress={() => nav.go('wrong')} />
    </Screen>
  );
};
