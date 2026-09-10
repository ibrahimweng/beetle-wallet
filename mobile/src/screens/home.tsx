/* Home, and the chat the ask bar opens. Home is built from frame 225:3 and
   reads the shared store, so a transfer made anywhere in the app shows up in
   this list and in this balance without anything being told to refresh. */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  ActionButton,
  Balance,
  Bubble,
  Button,
  Dial,
  Dock,
  Filters,
  Head,
  Icon,
  Insight,
  LedgerRow,
  Meta,
  Row,
  Screen,
  Shortcuts,
  Tile,
  WalletHeader,
  colour,
  radius,
  space,
} from '../design';
import { Route } from '../routes';
import { Nav, asked } from './nav';
import { useStore } from '../state/live';
import { answer, takeQuestion } from '../state/agent';
import { filtered, dollarsInNaira } from '../state/store.js';
import { insights, ledgerFooter } from '../state/data.js';

export { useStore };

const money = (n: number) => (n < 0 ? '−' : n > 0 ? '+' : '') + '₦' + Math.abs(n).toLocaleString('en-NG');

export const Home = ({ nav }: { nav: Nav }) => {
  const s = useStore();
  const [filter, setFilter] = useState('All');
  const [put, setPut] = useState<string[]>([]);
  const away = (k: string) => setPut(p => [...p, k]);
  const whole = '₦' + Math.floor(s.everyday).toLocaleString('en-NG');
  const kobo = '.' + s.everyday.toFixed(2).split('.')[1];

  /* The home feed carries what settled, once per name. A transfer still on its
     way, one that did not go and one that came back each have a screen of
     their own and a line in the history; so does a second payment to somebody
     already in the day's list. This is the day at a glance, which is what the
     frame draws — the history is where every line lives. */
  const day = (which: string) => {
    const seen = new Set<string>();
    return filtered(which)
      .filter((r: { status?: string }) => r.status === undefined || r.status === 'done')
      .filter((r: { name: string }) => !seen.has(r.name) && seen.add(r.name))
      .filter((r: { kind: string; amount: number }) =>
        filter === 'All' ? true : filter === 'In' ? r.amount > 0 : filter === 'Out' ? r.amount < 0 : false,
      );
  };

  const rows = (which: string, from = 0, to = 99) =>
    day(which)
      .slice(from, to)
      .map(
        (r: {
          id: string;
          icon: string;
          name: string;
          detail: string;
          time: string;
          amount: number;
          to: Route;
        }) => (
          <LedgerRow
            key={r.id}
            glyph={r.icon as never}
            name={r.name}
            detail={`${r.detail} · ${r.time}`}
            amount={money(r.amount)}
            good={r.amount > 0}
            onPress={() => nav.go(r.to)}
          />
        ),
      );

  return (
    <Screen
      dock={
        <Dock
          onAsk={q => asked(nav, q)}
          onScan={() => nav.go('scan')}
          action={<ActionButton onPress={() => nav.go('actions')} />}
        />
      }
    >
      <WalletHeader onSettings={() => nav.go('settings')} onAlerts={() => nav.go('history')} />
      <Balance whole={whole} kobo={kobo} change="+9% this month" />
      <View style={{ alignSelf: 'center' }}>
        <Button
          label="Receive"
          leading="receive-filled"
          size={44}
          full={false}
          onPress={() => nav.go('receive')}
        />
      </View>
      <Shortcuts
        items={[
          { glyph: 'airtime-tone', label: 'Airtime', onPress: () => nav.go('airtime') },
          { glyph: 'power-tone', label: 'Bills', onPress: () => nav.go('bills') },
          { glyph: 'pot-tone', label: 'Savings', onPress: () => nav.go('goal') },
          { glyph: 'grid-tone', label: 'Services', onPress: () => nav.go('services') },
        ]}
      />
      <Tile
        onPress={() => nav.go('dollars')}
        lead={
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colour.surface3,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Head>$</Head>
          </View>
        }
        title="Dollars"
        sub={`₦${dollarsInNaira().toLocaleString('en-NG')} today`}
        value={`$${s.dollars.toFixed(2)}`}
      />
      <Tile
        onPress={() => nav.go('health')}
        lead={<Dial score={s.health ?? 72} />}
        title="Money health"
        sub="Up 4 since July"
      />

      <View style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Head style={{ flex: 1 }}>Activities</Head>
          <Pressable accessibilityRole="button" onPress={() => nav.go('history')}>
            <Row>See all</Row>
          </Pressable>
        </View>
        <Meta tone="secondary">What I noticed, and every naira that moved.</Meta>
      </View>
      <Filters options={['All', 'Insights', 'In', 'Out']} value={filter} onChange={setFilter} />

      <Meta tone="secondary">Today</Meta>
      {!put.includes('topup') && filter !== 'In' && filter !== 'Out' ? (
        <Insight {...insights.topup} onAction={() => nav.go('powerpay')} onDismiss={() => away('topup')} />
      ) : null}
      {rows('today', 0, 4)}
      {!put.includes('data') && filter !== 'In' && filter !== 'Out' ? (
        <Insight
          kicker={insights.data.kicker}
          body={insights.data.body}
          action={insights.data.action}
          onAction={() => nav.go('airtime')}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.s3,
              backgroundColor: colour.surface,
              borderRadius: radius.md,
              padding: space.s3,
            }}
          >
            <Icon name="data" size={20} />
            <View style={{ flex: 1 }}>
              <Row>{insights.data.offer.title}</Row>
              <Meta tone="secondary">{insights.data.offer.sub}</Meta>
            </View>
            <Row>{insights.data.offer.price}</Row>
          </View>
        </Insight>
      ) : null}
      {rows('today', 4)}
      {!put.includes('changes') && filter !== 'In' && filter !== 'Out' ? (
        <Insight {...insights.changes} onAction={() => nav.go('health')} />
      ) : null}

      <Meta tone="secondary">Yesterday</Meta>
      <Tile
        onPress={() => nav.go('card')}
        lead={<Icon name="card" size={24} />}
        title={insights.card.kicker}
        sub={insights.card.sub}
      />
      {rows('yesterday', 0, 2)}
      {!put.includes('spend') && filter !== 'In' && filter !== 'Out' ? (
        <Insight {...insights.spend} onAction={() => nav.go('answer')} />
      ) : null}
      {rows('yesterday', 2)}
      <Meta tone="tertiary">{ledgerFooter}</Meta>
    </Screen>
  );
};

/* The chat the ask bar opens. It answers from the wording in the design
   rather than from a model, because nothing here reaches a network. A
   question asked on another screen is waiting when this one opens. */
export const AgentChat = ({ nav }: { nav: Nav }) => {
  const [thread, setThread] = useState<{ me: boolean; text: string }[]>(() => {
    const q = takeQuestion();
    return q
      ? [
          { me: true, text: q },
          { me: false, text: answer(q) },
        ]
      : [];
  });
  const say = (q: string) => setThread(t => [...t, { me: true, text: q }, { me: false, text: answer(q) }]);
  return (
    <Screen dock={<Dock placeholder="Reply, or just keep talking" onBack={nav.back} onAsk={say} />}>
      <View style={{ gap: 8 }}>
        <Head>Beetle</Head>
        <Meta tone="tertiary" style={{ fontSize: 16, lineHeight: 24 }}>
          Ask about anything in your money
        </Meta>
      </View>
      {thread.length === 0 ? (
        <>
          <Bubble>
            Ask me anything about your money. I only answer from what I can actually see in your account.
          </Bubble>
          <View style={{ gap: space.s2 }}>
            {[
              'What did I spend on today?',
              'Why did the transfer to Chidi fail?',
              'What is my limit today?',
              'Should I borrow ₦150,000?',
            ].map(s => (
              <Button key={s} label={s} tone="grey" size={48} onPress={() => say(s)} />
            ))}
          </View>
        </>
      ) : null}
      {thread.map((m, i) => (
        <View key={i} style={m.me ? { alignSelf: 'flex-end' } : { flexDirection: 'row', gap: space.s2 }}>
          {m.me ? (
            <Bubble who="You">{m.text}</Bubble>
          ) : (
            <>
              <Icon name="mark" size={32} colour={colour.accent} />
              <View style={{ flex: 1 }}>
                <Bubble>{m.text}</Bubble>
              </View>
            </>
          )}
        </View>
      ))}
    </Screen>
  );
};
