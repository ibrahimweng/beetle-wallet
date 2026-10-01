/* You are offline, from its frame: the red warning, the balance as of the
   last time it was live, the green word that nothing done here gets lost,
   Beetle's line that it will not send against a balance it cannot check,
   and the ways — queue it for the moment the network is back, or pay by
   USSD with no data at all — with lite mode offered. Reached from Slide to
   send when the network is not there, and from the lab. */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Banner, BigStatus, ChoiceList, PageHead, Say, SayCard, Screen, colour, toast } from '../../design';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { askHome } from '../more/More';
import { holdingsFor } from '../home/account';
import { balanceOf, useMoves } from '../home/moves';
import { clock, useChats } from '../agent/chats';
import { turn } from '../agent/turns';
import { usePrefs } from '../settings/prefs';
import { LAB } from '../../lab/enabled';
import { naira } from '../../lib/format';
import { lastCheckedLine, minutesOffline } from './online';
import { openTab } from '../tabs/tabs';

export function Offline() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ asked?: string; name?: string; demo?: string }>();
  const account = app.session?.account;
  const { moves } = useMoves(account?.accountNumber);
  const { file } = useChats(account?.accountNumber, !!account?.demo);
  const { prefs, set } = usePrefs(account?.accountNumber);
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  const demo = LAB && asked.demo === '1';
  const balance = (h?.everyday ?? 0) + balanceOf(moves);
  const minutes = demo ? 12 : minutesOffline();
  const [asOf] = useState(() => (demo ? '14:10' : clock(new Date(Date.now() - minutes * 60_000))));
  const [lite, setLite] = useState(false);
  const amount = Number(asked.asked ?? 0) || 0;
  const who = asked.name ?? '';
  useFoot({ kind: 'back' });
  if (!ok || !account) return null;
  const queue = () => {
    const at = clock();
    const what = amount ? `${naira(amount)}${who ? ` to ${who}` : ''}` : 'What you asked for';
    file({
      id: `queued-${Date.now().toString(36)}`,
      startedBy: 'beetle',
      title: `${what}, queued`,
      detail: 'Goes the second the network is back',
      time: at,
      day: 'today',
      turns: [turn.say(`${what} is queued. Nothing has left; it goes the second the network is back, and you get a message when it does.`)],
      pending: null,
      unread: true,
    });
    toast('Queued. It goes the second the network is back.');
    openTab(router, 'home');
  };
  const ussd = () => toast('Dial *737# on the line this account is on. It goes through the network’s own channel, with no data.');
  const liteMode = () => {
    setLite(true);
    set({ lite: true });
    toast('Lite mode is on: no pictures and no motion until data is back. Turn it off in Settings.');
  };
  return (
    <Screen head={<PageHead title="You are offline" sub={lastCheckedLine(minutes)} />}>
      {/* the frame: the figures 12 under the status, the banner 12 under its line, the bubble 12 under that, the ways 12 under the bubble, the offer 12 under them */}
      <View style={{ marginTop: -2 }}>
        <BigStatus glyph="warn-filled" tone={colour.alert} amount={naira(balance)} line={`as of ${asOf}, not live`} />
      </View>
      <View style={{ marginTop: -8 }}>
        <Banner tight tone={colour.good} text="Nothing you do here gets lost." testID="banner" />
      </View>
      <View style={{ marginTop: -8 }}>
        <Say testID="say">I will not send money against a balance I cannot check. Tell me what you want, I hold it, and it goes the second the network is back.</Say>
      </View>
      <View style={{ marginTop: -12 }}>
        <ChoiceList
          testID="ways"
          items={[
            { glyph: 'up', title: 'Queue it for later', sub: 'Waits here until I can check', onPress: queue },
            { glyph: 'bank', title: 'Pay by USSD instead', sub: 'Works with no data at all', onPress: ussd },
          ]}
        />
      </View>
      <View style={{ marginTop: -8 }}>
        <SayCard testID="offer" row={80} tight action={lite || prefs.lite ? 'Lite mode is on' : 'Do that'} disabled={lite || prefs.lite} onAction={liteMode}>
          Turn on lite mode while data is short?
        </SayCard>
      </View>
    </Screen>
  );
}
