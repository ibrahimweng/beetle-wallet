/* Home, built from frame 225:3, and for a brand new account from the first
   day's frame: the same head and balance, the tile that says nothing has
   moved, and the activities head over an empty day. It reads the session's
   account, so whoever signed in is who it shows. */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ActionButton,
  Button,
  Balance,
  Dock,
  Filters,
  Head,
  HomeCard,
  Icon,
  Insight,
  Label,
  LedgerRow,
  Mark,
  Meta,
  Screen,
  ScoreRow,
  Shortcuts,
  Tile,
  WalletHeader,
  colour,
  space,
  toast,
} from '../../src/design';
import { useApp } from '../../src/features/onboarding/store';
import { useSessionGuard } from '../../src/features/onboarding/useGuard';
import { glance, holdingsFor } from '../../src/features/home/account';
import { kobo, naira, signed } from '../../src/lib/format';

const next = (what: string) => () => toast(`${what} is the next flow to build.`);

export default function Home() {
  const router = useRouter();
  const app = useApp();
  const ok = useSessionGuard();
  const [filter, setFilter] = useState<'All' | 'Insights' | 'In' | 'Out'>('All');
  const [put, setPut] = useState<string[]>([]);
  if (!ok || !app.session) return null;
  const { account } = app.session;
  const h = holdingsFor(account);
  const away = (k: string) => setPut(p => [...p, k]);
  const shortcuts = [
    { glyph: 'airtime-tone', label: 'Airtime', onPress: next('Airtime') },
    { glyph: 'power-tone', label: 'Bills', onPress: next('Bills') },
    { glyph: 'pot-tone', label: 'Savings', onPress: next('Savings') },
    { glyph: 'grid-tone', label: 'Services', onPress: next('Services') },
  ] as const;
  const dock = <Dock onAsk={q => toast(`“${q}” — the agent is the next thing to wire in.`)} onScan={next('The camera')} action={<ActionButton onPress={next('The actions menu')} />} />;
  const rows = (day: 'today' | 'yesterday', from = 0, to = 99) =>
    glance(h.ledger, day, filter)
      .slice(from, to)
      .map(r => <LedgerRow key={r.id} glyph={r.icon} name={r.name} detail={`${r.detail} · ${r.time}`} amount={signed(r.amount)} good={r.amount > 0} onPress={next('The receipt')} />);
  const insight = (id: string, extra?: { onDismiss?: boolean }) => {
    const i = h.insights.find(x => x.id === id);
    if (!i || put.includes(id) || filter === 'In' || filter === 'Out') return null;
    return <Insight kicker={i.kicker} body={i.body} action={i.action} onAction={next(i.action)} onDismiss={extra?.onDismiss ? () => away(id) : undefined} />;
  };

  if (!h.ledger.length) {
    return (
      <Screen dock={dock}>
        <WalletHeader onSettings={() => app.signOut().then(() => router.replace('/way-in'))} onAlerts={next('Alerts')} />
        <Balance whole={naira(h.everyday)} kobo={kobo(h.everyday)} change="New account" />
        <View style={{ alignSelf: 'center', marginTop: 4 }}>
          <Button label="Receive" leading="receive-filled" badge size={40} full={false} onPress={next('Receiving')} />
        </View>
        <Shortcuts items={[...shortcuts]} />
        <Tile
          onPress={next('Ways to be paid')}
          lead={
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colour.ink, alignItems: 'center', justifyContent: 'center' }}>
              <Head tone="inverse">₦</Head>
            </View>
          }
          title="Nothing has moved yet"
          sub="Your first transfer shows up here"
        />
        <View style={{ gap: space.s2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', height: 28 }}>
            <Head style={{ flex: 1 }}>Activities</Head>
            <Pressable accessibilityRole="button" onPress={next('History')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Label style={{ color: colour.accentDeep }}>See all</Label>
              <Icon name="chevron" size={12} colour={colour.accentDeep} />
            </Pressable>
          </View>
          <Meta tone="tertiary">Nothing to notice yet.</Meta>
        </View>
        <View style={{ marginTop: -8 }}>
          <Filters options={['All', 'Insights', 'In', 'Out']} value={filter} onChange={v => setFilter(v as typeof filter)} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen dock={dock}>
      <HomeCard
        whole={naira(h.everyday)}
        kobo={kobo(h.everyday)}
        dollars={`~ ${Math.round(h.everyday / h.rate).toLocaleString('en-NG')} USD`}
        onDollars={next('Dollars')}
        onReceive={next('Receiving')}
        shortcuts={[...shortcuts]}
      />
      <View style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', height: 28 }}>
          <Head style={{ flex: 1 }}>Activities</Head>
          <Pressable accessibilityRole="button" onPress={next('History')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Label style={{ color: colour.accentDeep }}>See all</Label>
            <Icon name="chevron" size={12} colour={colour.accentDeep} />
          </Pressable>
        </View>
        <Meta tone="secondary">What I noticed, and every naira that moved.</Meta>
      </View>
      <View style={{ marginTop: -8 }}>
        <Filters options={['All', 'Insights', 'In', 'Out']} value={filter} onChange={v => setFilter(v as typeof filter)} />
      </View>
      <View style={{ gap: 8 }}>
        <Meta tone="secondary" style={{ fontSize: 16, lineHeight: 24 }}>
          Today
        </Meta>
        {h.health !== null ? <ScoreRow score={h.health} title="Money health" sub={h.healthMove} onPress={next('Money health')} /> : null}
      </View>
      {insight('topup', { onDismiss: true })}
      <View style={{ gap: 34 }}>{rows('today', 0, 4)}</View>
      {insight('data')}
      <View style={{ gap: 34 }}>{rows('today', 4)}</View>
      {insight('changes')}
      <Meta tone="secondary">Yesterday</Meta>
      <Tile onPress={next('The card')} plain go lead={<Mark glyph="card" />} title="Your card is ready" sub="Spend online anywhere" />
      <View style={{ gap: 34 }}>{rows('yesterday', 0, 2)}</View>
      {insight('spend')}
      <View style={{ gap: 34 }}>{rows('yesterday', 2)}</View>
      {h.footer ? <Meta tone="tertiary">{h.footer}</Meta> : null}
      <Pressable accessibilityRole="button" onPress={() => app.signOut().then(() => router.replace('/way-in'))} style={{ alignSelf: 'center', paddingVertical: 8 }}>
        <Label tone="secondary">Sign out</Label>
      </Pressable>
    </Screen>
  );
}
