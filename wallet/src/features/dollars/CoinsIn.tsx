/* Receive dollars (Round 36, the owner's word: stablecoins are part of
   receiving, on Solana, and anyone can send any stablecoin Beetle lists to
   the Dollar account's address, safely and with clear instructions). The
   Dollar account has one Solana address. USDC, USDT or PayPal USD sent to it
   from any wallet or exchange lands as dollars, one for one, with a line in
   Activities and a word from Beetle.

   Before the address is shown the first time, how receiving works, step by
   step, and the three things that lose coins: another network, a coin not
   on the list, a wrong or mistyped address. A yes to having read it, kept,
   and then the address, as a QR and as words to copy or share. How it works
   stays a tap away under it. This build is on Solana's test network, so the
   page can send test coins to the address itself, as a wallet would. Holding
   dollars is one of the things finishing setting up turns on. */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePageScroll } from '../../design/collapse';
import { Aside, Body, Button, Head, Icon, Label, Logo, Meta, PageHead, Qr, Row, Screen, Tap, colour, logoOf, toast, type LogoName } from '../../design';
import type { Move } from '../../services';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { holdingsFor } from '../home/account';
import { balanceOf, rowFrom, useMoves } from '../home/moves';
import { useSetup } from '../setup';
import { SetupOffer } from '../setup/Offer';
import { usePrefs } from '../settings/prefs';
import { clock, useChats } from '../agent/chats';
import { turn } from '../agent/turns';
import { copyText } from '../receive/clipboard';
import { shareDetails } from '../receive/share';
import { dollarsOf, nairaOf, usdFull } from './dollars';
import { DOLLAR_NETWORK, LEAST_IN, LISTED, TEST_WALLET, listedWords, testAddressFor, testHash, type Stablecoin } from './chains';

/** How receiving works, in the order it happens. */
export const HOW_IT_WORKS = [
  { title: 'Copy your address', body: 'Or show the QR code. It is your Dollar account’s own, on Solana, and it stays the same.' },
  { title: 'Pick Solana where you send from', body: 'In the wallet or the exchange, choose the Solana network. It may say SOL or SPL. Not Ethereum, Tron or BNB Chain.' },
  { title: `Send ${listedWords()}`, body: `Any of them, from $${LEAST_IN} up. Paste the address and check its first and last four characters.` },
  { title: 'It lands as dollars', body: 'In about a minute, one coin to the dollar, with a line in Activities and a word from me.' },
] as const;

/** The three ways coins are lost, said before the address and kept beside it. */
export const LOSES = [
  'Coins on any network but Solana do not arrive.',
  `Only ${listedWords()} land. SOL, other tokens and NFTs do not, and cannot be sent back.`,
  'Beetle never asks you to send coins to get a loan, unlock your account or claim a prize.',
] as const;

/** What the test wallet sends in, a tap at a time: a different coin each. */
const TEST_SENDS: { usd: number; coin: Stablecoin }[] = [
  { usd: 50, coin: 'USDC' },
  { usd: 100, coin: 'USDT' },
  { usd: 250, coin: 'PYUSD' },
];

export function CoinsIn() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const account = app.session?.account;
  const { moves, add } = useMoves(account?.accountNumber);
  const { setup } = useSetup(account?.accountNumber, !!account?.demo);
  const { prefs, ready, set } = usePrefs(account?.accountNumber);
  const { file } = useChats(account?.accountNumber, !!account?.demo);
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  const rate = h?.rate ?? 1_552;
  const asked = useLocalSearchParams<{ how?: string }>();
  const [agreed, setAgreed] = useState(false);
  /** how it works, opened again under the address; open from the start when that is what was asked for */
  const [how, setHow] = useState(asked.how === '1');
  const [sending, setSending] = useState<number | null>(null);
  /** the test coins' moment on the network, called off if the page is closed first (the analysis after Round 34: $50
      and then Back put a receipt up over Dollars a moment later) */
  const landing = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(landing.current), []);
  useFoot({ kind: 'back' });
  if (!ok || !account || !ready) return null;
  const address = testAddressFor(account.accountNumber, DOLLAR_NETWORK);
  const understood = prefs.coinsUnderstood;

  /* the test wallet sends coins to the address: a moment on the network, then they land as dollars, with a word from
     Beetle in the day and the receipt */
  const sendTest = ({ usd, coin }: { usd: number; coin: Stablecoin }) => {
    if (sending) return;
    setSending(usd);
    landing.current = setTimeout(() => {
      const at = clock();
      const move: Move = {
        name: `${coin} in`,
        detail: `From ${TEST_WALLET} · ${at}`,
        amount: nairaOf(usd, rate),
        icon: 'down',
        kind: 'coin',
        usd,
        coin: { coin, network: DOLLAR_NETWORK, address: testAddressFor('beetle-test-wallet', DOLLAR_NETWORK), hash: testHash(DOLLAR_NETWORK), fee: 0 },
      };
      const row = rowFrom(move, (h?.everyday ?? 0) + balanceOf(moves), 17 + moves.length);
      add(row);
      const held = dollarsOf(h?.dollars ?? 0, [...moves, row]);
      file({
        id: `coins-${row.id}`,
        startedBy: 'beetle',
        title: `${usdFull(usd)} in ${coin}`,
        detail: 'Into your Dollar account',
        time: at,
        day: 'today',
        turns: [
          turn.say(`${usdFull(usd)} in ${coin} just landed in your Dollar account, one coin to the dollar. You hold ${usdFull(held)} now.`),
          turn.receipt({ rowId: row.id, amount: usdFull(usd), line: `${coin} on Solana`, status: 'Arrived', time: at }),
        ],
        pending: null,
        unread: true,
      });
      setSending(null);
      router.push(`/receipt/${row.id}?paid=1`);
    }, 1200);
  };

  const steps = (
    <View style={s.card} testID="coins-how">
      {HOW_IT_WORKS.map((step, i) => (
        <View key={step.title} style={s.step}>
          <View style={s.n}>
            <Label>{String(i + 1)}</Label>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Row>{step.title}</Row>
            <Meta tone="secondary">{step.body}</Meta>
          </View>
        </View>
      ))}
    </View>
  );
  const warnings = (
    <View style={s.warn} testID="coins-rules">
      <Row>What loses coins</Row>
      {LOSES.map(line => (
        <View key={line} style={{ flexDirection: 'row', gap: 8 }}>
          <Icon name="alert" size={16} colour={colour.alert} />
          <Meta tone="secondary" style={{ flex: 1 }}>
            {line}
          </Meta>
        </View>
      ))}
    </View>
  );

  return (
    <Screen head={<PageHead lead title="Receive dollars" sub="Stablecoins on Solana land in your Dollar account as dollars, one for one" />}>
      <Aside glyph="globe">This build is on Solana’s test network. No real coin moves, and nothing sent from a real wallet arrives.</Aside>
      {!setup.done ? (
        <SetupOffer sub="Two minutes, and you can hold dollars and receive stablecoins" />
      ) : !understood ? (
        /* the first time: how it works and what loses coins, read and said yes to, before the address */
        <>
          <View style={{ gap: 12 }}>
            <Head>How receiving works</Head>
            {steps}
          </View>
          {warnings}
          <Tap accessibilityRole="checkbox" accessibilityState={{ checked: agreed }} onPress={() => setAgreed(a => !a)} style={s.agree} testID="coins-agree">
            <View style={[s.box, agreed ? s.boxOn : null]}>{agreed ? <Icon name="check-small" size={14} colour={colour.textInverse} /> : null}</View>
            <Body style={{ flex: 1 }}>{`I will send only ${listedWords()}, and only on Solana.`}</Body>
          </Tap>
          <Button label="Show my address" disabled={!agreed} onPress={() => set({ coinsUnderstood: true })} />
        </>
      ) : (
        <>
          <ToTop />
          <View style={s.address} testID="coin-address">
            <Qr value={address} size={184} testID="coin-qr" />
            <View style={{ gap: 4, alignSelf: 'stretch' }}>
              <Meta tone="secondary">Your Dollar account’s address on Solana</Meta>
              <Row selectable style={s.words} testID="coin-address-text">
                {address}
              </Row>
              <Meta tone="tertiary">{`Starts ${address.slice(0, 4)} and ends ${address.slice(-4)}: check both where you paste it.`}</Meta>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'stretch' }}>
              <Button
                label="Copy"
                leading="copy"
                size={48}
                onPress={() =>
                  void copyText(address).then(done => toast(done ? 'Your address is copied. Pick Solana where you paste it.' : 'This build cannot reach the clipboard. Share it instead.'))
                }
                style={{ flex: 1 }}
              />
              <Button
                label="Share"
                leading="share"
                size={48}
                tone="white"
                onPress={() => void shareDetails(`My Beetle Dollar account on Solana: ${address}\nSend ${listedWords()} on the Solana network only.`, 'sheet')}
                style={[{ flex: 1 }, s.outlined]}
              />
            </View>
          </View>
          <View style={s.facts} testID="coins-facts">
            <Fact label="Network" value="Solana only" logos={['solana']} />
            <Fact label="Coins that land" value={LISTED.map(c => c.id).join(' · ')} logos={LISTED.map(c => logoOf(c.id)).filter((l): l is LogoName => !!l)} />
            <Fact label="Least that lands" value={usdFull(LEAST_IN)} />
            <Fact label="Arrives" value="In about a minute" />
          </View>
          {warnings}
          <Tap accessibilityRole="button" accessibilityLabel="How receiving works" accessibilityState={{ expanded: how }} onPress={() => setHow(v => !v)} style={s.more} testID="coins-how-toggle">
            <Label tone="accent">{how ? 'Hide how it works' : 'How receiving works'}</Label>
          </Tap>
          {how ? steps : null}
          <View style={{ gap: 12 }} testID="coin-test">
            <Head>Try it</Head>
            <Body tone="secondary">{`Send test coins to your address from ${TEST_WALLET}, as a wallet would. They land as dollars with a receipt.`}</Body>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {TEST_SENDS.map(t => (
                <Button
                  key={t.coin}
                  label={sending === t.usd ? 'Sending…' : `${usdFull(t.usd).replace('.00', '')} ${t.coin}`}
                  accessibilityLabel={`Send ${usdFull(t.usd).replace('.00', '')} of test ${t.coin}`}
                  size={48}
                  tone="white"
                  disabled={sending !== null}
                  onPress={() => sendTest(t)}
                  style={[{ flex: 1 }, s.outlined]}
                />
              ))}
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}

/** The address comes in at the top of the page: the yes under the steps is far down, and the column would stay there. */
function ToTop() {
  const column = usePageScroll();
  useEffect(() => {
    column?.current?.scrollTo({ y: 0, animated: false });
  }, [column]);
  return null;
}

function Fact({ label, value, logos }: { label: string; value: string; /** the coins or the chain it names, their logos before it (Round 38) */ logos?: LogoName[] }) {
  return (
    <View style={s.fact}>
      <Meta tone="secondary">{label}</Meta>
      {logos?.length ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ flexDirection: 'row', gap: 2 }}>
            {logos.map(l => (
              <Logo key={l} name={l} size={18} round />
            ))}
          </View>
          <Label>{value}</Label>
        </View>
      ) : (
        <Label>{value}</Label>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colour.surface2, borderRadius: 24, padding: 16, gap: 16 },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  n: { width: 28, height: 28, borderRadius: 14, backgroundColor: colour.surface, alignItems: 'center', justifyContent: 'center' },
  warn: { borderRadius: 16, borderWidth: 1, borderColor: colour.warn, padding: 14, gap: 8 },
  agree: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, minHeight: 44 },
  box: { width: 22, height: 22, borderRadius: 6, marginTop: 1, borderWidth: 1.5, borderColor: colour.rule, alignItems: 'center', justifyContent: 'center' },
  boxOn: { borderWidth: 0, backgroundColor: colour.accent },
  address: { backgroundColor: colour.surface2, borderRadius: 24, padding: 16, alignItems: 'center', gap: 16 },
  /* an address is read a character at a time: broken anywhere, never hyphenated */
  words: { fontSize: 14, lineHeight: 20 },
  outlined: { borderWidth: 1, borderColor: colour.rule },
  facts: { backgroundColor: colour.surface2, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4 },
  fact: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 40, gap: 12 },
  more: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
});
