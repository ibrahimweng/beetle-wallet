/* Add dollars with USDC or USDT (Round 33, the owner's word: start testing
   the stablecoins). The coin, then the network the other side sends on,
   then this account's own address for it, as a QR and as words to copy or
   share, with the one rule that keeps the coins from being lost: only that
   coin, only on that network. Coins that arrive become dollars here, one
   for one. This build is on test networks, so the page can send test coins
   to the address itself, as a wallet would, and they arrive as a line on the
   record with its receipt. Holding dollars is one of the things finishing
   setting up turns on, so until then the page says so instead. */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Aside, Body, Button, Head, Meta, PageHead, Picker, Qr, Row, Screen, Segments, colour, toast } from '../../design';
import type { Move } from '../../services';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { holdingsFor } from '../home/account';
import { balanceOf, rowFrom, useMoves } from '../home/moves';
import { useSetup } from '../setup';
import { SetupOffer } from '../setup/Offer';
import { copyText } from '../receive/clipboard';
import { shareDetails } from '../receive/share';
import { clock } from '../../lib/clock';
import { nairaOf, usdFull } from './dollars';
import { TEST_WALLET, arrivesIn, isCoin, isNetwork, networkOf, networksFor, testAddressFor, testHash, type Coin, type NetworkId } from './chains';

/** What the test wallet sends in, a tap at a time. */
const TEST_SENDS = [50, 100, 250];

export function CoinsIn() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ coin?: string; network?: string }>();
  const account = app.session?.account;
  const { moves, add } = useMoves(account?.accountNumber);
  const { setup } = useSetup(account?.accountNumber, !!account?.demo);
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  const rate = h?.rate ?? 1_552;
  const [coin, setCoin] = useState<Coin>(isCoin(asked.coin) ? asked.coin : 'USDC');
  const nets = networksFor(coin);
  const [picked, setPicked] = useState<NetworkId>(isNetwork(asked.network) ? asked.network : 'base');
  /* a coin the network does not carry falls back to the coin's cheapest */
  const network = nets.some(n => n.id === picked) ? picked : (nets[0]?.id ?? 'base');
  const net = networkOf(network);
  const [sending, setSending] = useState<number | null>(null);
  /** the test coins' moment on the network, called off if the page is closed first (the analysis after Round 34: $50
      and then Back put a receipt up over Dollars a moment later) */
  const landing = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(landing.current), []);
  useFoot({ kind: 'back' });
  if (!ok || !account) return null;
  const address = testAddressFor(account.accountNumber, network);

  /* the test wallet sends coins to the address: a moment on the network, then they land as dollars, with the receipt */
  const sendTest = (usd: number) => {
    if (sending) return;
    setSending(usd);
    landing.current = setTimeout(() => {
      const move: Move = {
        name: `${coin} on ${net.name}`,
        detail: `From ${TEST_WALLET} · ${clock()}`,
        amount: nairaOf(usd, rate),
        icon: 'down',
        kind: 'coin',
        usd,
        coin: { coin, network, address: testAddressFor('beetle-test-wallet', network), hash: testHash(network), fee: 0 },
      };
      const row = rowFrom(move, (h?.everyday ?? 0) + balanceOf(moves), 17 + moves.length);
      add(row);
      setSending(null);
      router.push(`/receipt/${row.id}?paid=1`);
    }, 1200);
  };

  return (
    <Screen head={<PageHead lead title="Add with USDC or USDT" sub="Digital dollars from any wallet or exchange. They arrive here as dollars, one for one." />}>
      <Aside glyph="globe">This build is on test networks. No real coin moves, and nothing sent from a real wallet arrives.</Aside>
      {setup.done ? (
        <>
          <View style={{ gap: 12 }}>
            <Head>The coin</Head>
            <Segments options={['USDC', 'USDT']} value={coin} onChange={v => isCoin(v) && setCoin(v)} />
          </View>
          <View style={{ gap: 12 }}>
            <Head>The network it comes on</Head>
            <Picker
              options={nets.map(n => ({ id: n.id, label: n.name, sub: `Arrives in ${arrivesIn(n)} · nothing to pay to receive` }))}
              value={network}
              onChange={id => isNetwork(id) && setPicked(id)}
            />
          </View>
          <View style={s.card} testID="coin-address">
            <Qr value={address} size={184} testID="coin-qr" />
            <View style={{ gap: 4, alignSelf: 'stretch' }}>
              <Meta tone="secondary">{`Your ${coin} address on ${net.name}`}</Meta>
              <Row selectable style={s.address} testID="coin-address-text">
                {address}
              </Row>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'stretch' }}>
              <Button
                label="Copy"
                leading="copy"
                size={48}
                onPress={() => void copyText(address).then(done => toast(done ? 'The address is copied. Paste it where you send from.' : 'This build cannot reach the clipboard. Share it instead.'))}
                style={{ flex: 1 }}
              />
              <Button
                label="Share"
                leading="share"
                size={48}
                tone="white"
                onPress={() => void shareDetails(`My ${coin} address on ${net.name}: ${address}`, 'sheet')}
                style={[{ flex: 1 }, s.outlined]}
              />
            </View>
          </View>
          <View style={s.warn} testID="coin-rule">
            <Body>{`Only ${coin}, and only on ${net.name}.`}</Body>
            <Meta tone="secondary">Another coin, or this one on another network, cannot be got back once it is sent. Check both where you send from.</Meta>
          </View>
          <View style={{ gap: 12 }} testID="coin-test">
            <Head>Try it</Head>
            <Body tone="secondary">{`Send test ${coin} to this address from ${TEST_WALLET}, as a wallet would. It lands in your dollars with a receipt.`}</Body>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {TEST_SENDS.map(usd => (
                <Button
                  key={usd}
                  label={sending === usd ? 'Sending…' : usdFull(usd).replace('.00', '')}
                  accessibilityLabel={`Send ${usdFull(usd).replace('.00', '')} of test ${coin}`}
                  size={48}
                  tone="white"
                  disabled={sending !== null}
                  onPress={() => sendTest(usd)}
                  style={[{ flex: 1 }, s.outlined]}
                />
              ))}
            </View>
          </View>
        </>
      ) : (
        <SetupOffer sub="Two minutes, and you can hold dollars and add them with USDC or USDT" />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colour.surface2, borderRadius: 24, padding: 16, alignItems: 'center', gap: 16 },
  /* an address is read a character at a time: broken anywhere, never hyphenated */
  address: { fontSize: 14, lineHeight: 20 },
  outlined: { borderWidth: 1, borderColor: colour.rule },
  warn: { borderRadius: 16, borderWidth: 1, borderColor: colour.warn, padding: 14, gap: 4 },
});
