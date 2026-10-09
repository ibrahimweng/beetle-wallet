/* Send dollars out as USDC or USDT (Round 33). The coin, the network the
   other side receives on, their address (pasted, or read off a QR by Scan),
   checked before anything moves: the shape of the network picked, its own
   check letters, and never this account's own address. Then the amount in
   dollars, stopping hard at what is held, with the network's fee taken out
   of it and what they get said plainly; the slide leads to the passcode,
   the line goes into the day, and its receipt comes up. The day's spending
   cap counts it like any other money leaving. This build is on test
   networks: nothing reaches a real wallet. */
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AmountPicker, Aside, Caption, Facts, Head, Meta, PageHead, Picker, Row, Screen, Segments, Tap, colour, toast } from '../../design';
import { TextBox } from '../../design/TextBox';
import type { Move } from '../../services';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { holdingsFor } from '../home/account';
import { balanceOf, rowFrom, useMoves } from '../home/moves';
import { useSetup } from '../setup';
import { SetupOffer } from '../setup/Offer';
import { useSendGate } from '../settings/sendGate';
import { PasscodeSheet, lockedFor, waitWords } from '../passcode';
import { pasteText } from '../receive/clipboard';
import { clock } from '../../lib/clock';
import { dollarsOf, nairaOf, usdFull } from './dollars';
import { LEAST_OUT, arrivesIn, checkAddress, feeLine, isCoin, isNetwork, networkOf, networksFor, sendOut, shortAddress, testAddressFor, testHash, type Coin, type NetworkId } from './chains';

export function CoinsOut() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ coin?: string; network?: string; to?: string }>();
  const account = app.session?.account;
  const { moves, add } = useMoves(account?.accountNumber);
  const { setup } = useSetup(account?.accountNumber, !!account?.demo);
  const sendGate = useSendGate(account);
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  const rate = h?.rate ?? 1_552;
  const dollars = dollarsOf(h?.dollars ?? 0, moves);
  const [coin, setCoin] = useState<Coin>(isCoin(asked.coin) ? asked.coin : 'USDC');
  const nets = networksFor(coin);
  const [picked, setPicked] = useState<NetworkId>(isNetwork(asked.network) ? asked.network : 'base');
  const network = nets.some(n => n.id === picked) ? picked : (nets[0]?.id ?? 'base');
  const net = networkOf(network);
  const [to, setTo] = useState(typeof asked.to === 'string' ? asked.to : '');
  const [usd, setUsd] = useState(0);
  const [guard, setGuard] = useState(false);
  const own = account ? testAddressFor(account.accountNumber, network) : undefined;
  const check = checkAddress(network, to, own);
  const { fee, arrives } = sendOut(usd, network);
  const nairaEq = nairaOf(usd, rate);

  const slide = () => {
    if (!setup.done) {
      toast('Finish setting up first, and you can send dollars out. It takes two minutes.');
      return;
    }
    if (!check.ok) {
      toast(check.why || `Paste their ${coin} address on ${net.name} first.`);
      return;
    }
    if (usd < LEAST_OUT) {
      toast(`The least that can go out is ${usdFull(LEAST_OUT)}.`);
      return;
    }
    if (usd > dollars) {
      toast(`That is more than the ${usdFull(dollars)} you hold.`);
      return;
    }
    const stopped = sendGate.stopped(nairaEq);
    if (stopped) {
      toast(stopped);
      return;
    }
    /* the day after a recovery nobody new is paid, and an address is nobody paid before (the analysis after Round 34) */
    if (sendGate.holding) {
      toast('The account was recovered today, so for a day no coins go out. Money still comes in.');
      return;
    }
    const shut = lockedFor();
    if (shut) {
      toast(`That was three wrong tries. Give it ${waitWords(shut)} and slide again.`);
      return;
    }
    setGuard(true);
  };
  /* the passcode landed: the coins go, the line goes into the day, and the receipt comes up */
  const done = () => {
    if (!account || !check.ok) return;
    const move: Move = {
      name: shortAddress(check.address),
      detail: `${coin} on ${net.name} · ${clock()}`,
      amount: -nairaEq,
      icon: 'up',
      kind: 'coin',
      usd: -usd,
      coin: { coin, network, address: check.address, hash: testHash(network), fee },
    };
    const row = rowFrom(move, (h?.everyday ?? 0) + balanceOf(moves), 17 + moves.length);
    add(row);
    setGuard(false);
    router.push(`/receipt/${row.id}?paid=1`);
  };
  const paste = async () => {
    const text = await pasteText();
    if (text) setTo(text.trim());
    else toast('Nothing to paste, or this build cannot read the clipboard. Type it in, or scan their code.');
  };

  useFoot({ kind: 'slide', label: 'Slide to send', amount: usd ? usdFull(usd) : '', disabled: !usd || !check.ok, onSlide: slide, veil: guard ? 'away' : undefined });
  if (!ok || !account) return null;
  return (
    <>
      <Screen head={<PageHead lead title="Send to a wallet" sub="Your dollars out as USDC or USDT, to an address on the network they use" />}>
        <Aside glyph="globe">This build is on test networks. Nothing reaches a real wallet.</Aside>
        {setup.done ? null : <SetupOffer sub="Two minutes, and you can send dollars out as USDC or USDT" />}
        <View style={{ gap: 12 }}>
          <Head>The coin</Head>
          <Segments options={['USDC', 'USDT']} value={coin} onChange={v => isCoin(v) && setCoin(v)} />
        </View>
        <View style={{ gap: 12 }}>
          <Head>The network they receive on</Head>
          <Picker
            options={nets.map(n => ({ id: n.id, label: n.name, sub: `Network fee ${feeLine(n)} · arrives in ${arrivesIn(n)}` }))}
            value={network}
            onChange={id => isNetwork(id) && setPicked(id)}
          />
        </View>
        <View style={{ gap: 8 }} testID="coin-to-block">
          <TextBox
            label={`Their ${coin} address on ${net.name}`}
            value={to}
            onChangeText={setTo}
            placeholder={net.family === 'evm' ? '0x…' : net.family === 'tron' ? 'T…' : 'Their Solana address'}
            autoCapitalize="none"
            autoCorrect={false}
            note={!check.ok && check.why ? check.why : check.ok ? `Checked: a ${net.name} address` : undefined}
            bad={!check.ok && !!check.why}
            right={
              <Tap accessibilityRole="button" accessibilityLabel="Paste" onPress={() => void paste()} hitSlop={10} testID="coin-paste">
                <Caption style={{ color: colour.accent }}>Paste</Caption>
              </Tap>
            }
            testID="coin-to"
          />
          <Meta tone="tertiary">Copy it from their wallet or exchange. Coins sent to a wrong address cannot be got back.</Meta>
        </View>
        <View style={s.figure} testID="coin-amount">
          <View style={s.from}>
            <Row>From Dollars</Row>
            <Meta tone="secondary">{`${usdFull(dollars)} there`}</Meta>
          </View>
          <View style={s.picker}>
            <AmountPicker
              unit="dollars"
              value={usd}
              onChange={v => setUsd(v)}
              max={dollars}
              note={usd ? `They get ${usdFull(arrives)}` : `At least ${usdFull(LEAST_OUT)}`}
              chips={[20, 100]}
              all="All of it"
            />
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, marginTop: -4 }}>
          <Facts
            inset={10}
            row={44}
            testID="coin-facts"
            rows={[
              { label: 'Network fee', value: feeLine(net) },
              { label: 'They get', value: usdFull(arrives) },
              { label: 'Arrives in', value: arrivesIn(net) },
            ]}
          />
        </View>
      </Screen>
      {guard && check.ok ? (
        <PasscodeSheet
          amount={usdFull(usd)}
          name={shortAddress(check.address)}
          detail={`${coin} on ${net.name}`}
          glyph="up"
          rows={[
            { label: 'Network fee', value: feeLine(net) },
            { label: 'They get', value: usdFull(arrives) },
            { label: 'Leaves Dollars', value: usdFull(usd), strong: true },
          ]}
          verify={app.checkPasscode}
          onDone={done}
          onCancel={() => setGuard(false)}
          pastLimit={sendGate.past(nairaEq)}
        />
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  figure: { backgroundColor: colour.surface2, borderRadius: 24, paddingTop: 14, paddingHorizontal: 12, paddingBottom: 12, gap: 12 },
  from: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  picker: { backgroundColor: colour.surface, borderRadius: 20, paddingTop: 20, paddingBottom: 16 },
});
