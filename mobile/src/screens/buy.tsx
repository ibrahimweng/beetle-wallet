/* Buying something — the voice sheet, the typed way in, the plan the agent
   put together, the passcode, the receipt and its share sheet.

   Frames 225:2620, 225:2973, 221:165, 239:8474, 239:8418 and 472:11590. */
import React, { useState } from 'react';
import { View } from 'react-native';
import {
  Aside,
  Banner,
  Bubble,
  Button,
  Ghost,
  Head,
  Icon,
  Meta,
  PassSheet,
  Receipt,
  Said,
  Dock,
  SendButton,
  Screen,
  TypeOver,
  ShareSheet,
  ToolPanel,
  TopBar,
  colour,
  naira,
  nairaFull,
  space,
  toast,
  VoiceSheet,
} from '../design';
import { Nav, asked, dock } from './nav';
import { still } from './send';
import { Home } from './home';
import { useStore, Receipt as Slip } from '../state/live';
import { contacts, me } from '../state/data.js';
import * as act from '../state/actions.js';

export type Plan = { id: string; label: string; price: number };

export const PLANS: Plan[] = [
  { id: '1gb', label: '1.5GB for 30 days', price: 1000 },
  { id: '5gb', label: '5GB for 30 days', price: 2500 },
  { id: '10gb', label: '10GB for 30 days', price: 4000 },
  { id: 'air', label: 'Airtime, no plan', price: 1000 },
];

/* Which plan is being bought. The services drawer sets it too, so the two
   screens never disagree about what is in the basket. */
let plan: Plan = PLANS[1] as Plan;
export const setPlan = (price: number) => {
  plan = PLANS.find(x => x.price === price) ?? plan;
};
export const currentPlan = () => plan;

let slip: Slip | null = null;

/* ---- asking for it out loud ---- */

export const AskSvc = ({ nav }: { nav: Nav }) => (
  <VoiceSheet
    said="2k data for "
    tail="mum"
    seed={23}
    offers={['Pay my light bill', 'How much did I spend on data?', 'Top up my own line']}
    onOffer={(t: string) => asked(nav, t)}
    onNotThis={() => nav.go('typedbuy')}
    onStop={() => nav.go('home')}
    onSend={() => nav.go('buy')}
    onClose={nav.back}
    behind={<Home nav={still} />}
  />
);

/* ---- typing it ---- */

export const TypedBuy = ({ nav }: { nav: Nav }) => {
  const [text, setText] = useState('2k data for mum');
  const key = (k: string) => {
    if (k === 'send') return nav.go('buy');
    if (k === 'del') return setText(t => t.slice(0, -1));
    if (k === 'shift' || k === '123') return;
    setText(t => t + k);
  };
  return <TypeOver behind={<Home nav={still} />} value={text} onKey={key} onSend={() => key('send')} />;
};

/* ---- what it put together ---- */

export const Buy = ({ nav }: { nav: Nav }) => {
  const s = useStore();
  const enough = s.everyday >= plan.price;
  return (
    <Screen
      dock={
        <Dock
          placeholder="Reply, or just keep talking"
          onAsk={q => asked(nav, q)}
          action={<SendButton onPress={() => nav.go('confirmbuy')} />}
        />
      }
    >
      <TopBar title="Beetle" onBack={nav.back} />
      <Said>2k data for mum</Said>
      <View style={{ flexDirection: 'row', gap: space.s2 }}>
        <Icon name="mark" size={32} colour={colour.accent} />
        <View style={{ flex: 1 }}>
          <Bubble>
            Mum’s MTN line, the one ending 4471. She ran dry eleven days early last month, so I have priced
            the bigger bundle too.
          </Bubble>
        </View>
      </View>
      <ToolPanel
        tool="Beetle Airtime"
        state="Running"
        rows={[
          { k: 'Line', v: `MTN · ${contacts.mum.account}` },
          { k: 'Whose', v: 'Mum' },
          { k: 'Plan', v: plan.label },
          { k: 'Price', v: naira(plan.price) },
          { k: 'Cheaper?', v: 'Checking MTN plans', done: 'work' as const },
        ]}
      >
        <View style={{ padding: 12 }}>
          {enough ? (
            <Button label={`Confirm ${naira(plan.price)}`} onPress={() => nav.go('confirmbuy')} />
          ) : (
            <Banner text="Not enough in Everyday for that plan." />
          )}
        </View>
      </ToolPanel>
      <Aside>Face ID first. Nothing leaves your account until then.</Aside>
    </Screen>
  );
};

/* ---- the passcode over it ---- */

export const ConfirmBuy = ({ nav }: { nav: Nav }) => (
  <PassSheet
    amount={naira(plan.price)}
    title={`MTN · ${plan.label.split(' for ')[0] ?? plan.label}`}
    sub={`Mum · ${contacts.mum.account}`}
    hint="Nothing moves until the fourth number lands."
    onClose={nav.back}
    onDone={() => {
      slip = act.buy({ network: 'MTN', line: contacts.mum.account, amount: plan.price, label: plan.label });
      nav.go('done');
    }}
    behind={<Buy nav={still} />}
  />
);

/* ---- the receipt ---- */

export const Done = ({ nav }: { nav: Nav }) => {
  const s = useStore();
  const r = slip ?? {
    amount: plan.price,
    label: plan.label,
    at: '28 August 2026 at 8:02 AM',
    session: 'MTN 88231 4471 0392',
    balanceAfter: s.everyday,
  };
  const what = r.label ?? plan.label;
  return (
    <Screen dock={dock('Ask about this', nav, 'home')}>
      <View style={{ gap: 8 }}>
        <Head>All done</Head>
        <Meta tone="tertiary" style={{ fontSize: 16, lineHeight: 24 }}>
          {r.at}
        </Meta>
      </View>
      <Receipt
        amount={naira(r.amount)}
        line={`${what.split(' for ')[0] ?? what} sent to Mum`}
        fields={[
          ['To', 'Mum', `${contacts.mum.account} · MTN`],
          ['From', 'Everyday', me.account],
          ['What', what, 'Valid until 27 September'],
          ['Amount', nairaFull(r.amount)],
          ['Fee', 'Free'],
          ['Total charged', nairaFull(r.amount)],
          ['Balance after', nairaFull(r.balanceAfter ?? s.everyday)],
        ]}
        session={r.session}
        sessionLabel="MTN reference"
      />
      <Button label="Share receipt" leading="share" onPress={() => nav.go('sharebuy')} />
      <Bubble>Mum has it. Every month, without asking?</Bubble>
      <Button
        label="Set it up"
        tone="grey"
        onPress={() => {
          act.setStanding('Round ups', true);
          toast('Set. The same bundle, the day her data runs out.');
          nav.go('rules');
        }}
      />
      <Ghost label="Something wrong with this?" onPress={() => nav.go('wrong')} />
    </Screen>
  );
};

export const ShareBuy = ({ nav }: { nav: Nav }) => (
  <ShareSheet
    line={`${naira(plan.price)} of data for Mum, ${(slip?.at ?? '28 August 2026 at 8:02 AM').split(' at ')[1]}`}
    onClose={() => nav.go('done')}
    behind={<Done nav={still} />}
  />
);
