/* Send dollars, from the Dollar account (Round 36, the owner's word:
   stablecoins are part of sending; to a Solana address or a Beetle $tag).
   Two ways: to another Beetle account by its $tag, dollars as they are,
   free and at once; or to any Solana wallet, as the stablecoin they pick
   (USDC, USDT or PayPal USD), the address pasted or read off a QR by Scan,
   and checked before anything moves: Solana's shape alone, its own check
   letters, never a coin's own address nor this account's. The first and the
   last four characters are said, to check against where it came from, and
   an address never sent to before carries the word to try a little first.
   Then the amount in dollars, stopping hard at what is held, what they get,
   the slide to the passcode, the line in Activities and its receipt. The
   day's cap, a freeze and the day after a recovery all hold it. This build
   is on Solana's test network: nothing reaches a real wallet. */
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AmountPicker, Aside, Caption, Facts, Head, Meta, PageHead, Row, Screen, Segments, Tap, colour, toast } from '../../design';
import { TextBox } from '../../design/TextBox';
import { auth, tagged, type Move } from '../../services';
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
import { sessionId } from '../home/moves';
import { dollarsOf, nairaOf, usdFull } from './dollars';
import { DOLLAR_NETWORK, LEAST_OUT, LISTED, arrivesIn, checkSolana, feeLine, isListed, networkOf, sendOut, shortAddress, testAddressFor, testHash, type Stablecoin } from './chains';

type Way = 'tag' | 'wallet';
const WAYS: Record<Way, string> = { tag: 'Beetle $tag', wallet: 'Solana wallet' };
/** The least a $tag is sent: a cent; out to a wallet, LEAST_OUT. */
const LEAST_TAG = 0.01;

export function CoinsOut() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ coin?: string; to?: string; tag?: string }>();
  const account = app.session?.account;
  const { moves, add } = useMoves(account?.accountNumber);
  const { setup } = useSetup(account?.accountNumber, !!account?.demo);
  const sendGate = useSendGate(account);
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  const rate = h?.rate ?? 1_552;
  const dollars = dollarsOf(h?.dollars ?? 0, moves);
  const [way, setWay] = useState<Way>(typeof asked.to === 'string' ? 'wallet' : 'tag');
  const [coin, setCoin] = useState<Stablecoin>(isListed(asked.coin) ? asked.coin : 'USDC');
  const [to, setTo] = useState(typeof asked.to === 'string' ? asked.to : '');
  const [tag, setTag] = useState(typeof asked.tag === 'string' ? asked.tag.replace(/^\$/, '') : '');
  /** who the tag is: Beetle's directory, or an account opened on this phone */
  const [who, setWho] = useState<{ name: string; tag: string } | null>(null);
  const [usd, setUsd] = useState(0);
  const [guard, setGuard] = useState(false);
  const net = networkOf(DOLLAR_NETWORK);
  const own = account ? testAddressFor(account.accountNumber, DOLLAR_NETWORK) : undefined;
  const check = checkSolana(to, own);
  const { fee, arrives } = way === 'wallet' ? sendOut(usd, DOLLAR_NETWORK) : { fee: 0, arrives: usd };
  const nairaEq = nairaOf(usd, rate);
  /* an address this account has sent to before needs no word of warning; a new one does */
  const sentBefore = check.ok && moves.some(m => m.kind === 'coin' && m.coin?.address === check.address && (m.usd ?? 0) < 0);
  const ownTag = (account?.username ?? '').toLowerCase();

  /* the tag, looked up as it is typed: the directory at once, an account on this phone a moment later */
  useEffect(() => {
    const t = tag.trim().replace(/^\$/, '').toLowerCase();
    let live = true;
    const known = t.length >= 2 ? tagged(t) : null;
    setWho(known && known.tag ? { name: known.name, tag: known.tag } : null);
    if (t.length >= 2 && !known && t !== ownTag)
      void auth.findAccount(t).then(a => {
        if (live && a?.username === t) setWho({ name: `${a.firstName} ${a.lastName}`, tag: t });
      });
    return () => {
      live = false;
    };
  }, [tag, ownTag]);
  const tagWhy = !tag.trim() ? '' : tag.trim().replace(/^\$/, '').toLowerCase() === ownTag ? 'That is your own tag.' : who ? '' : 'No Beetle account has this tag yet.';
  const ready = way === 'tag' ? !!who : check.ok;

  const slide = () => {
    if (!setup.done) {
      toast('Finish setting up first, and you can send dollars. It takes two minutes.');
      return;
    }
    if (!ready) {
      toast(way === 'tag' ? tagWhy || 'Type their Beetle tag first.' : check.ok ? '' : check.why || 'Paste their Solana address first.');
      return;
    }
    if (usd < (way === 'tag' ? LEAST_TAG : LEAST_OUT)) {
      toast(`The least that can go to a wallet is ${usdFull(LEAST_OUT)}.`);
      return;
    }
    if (usd > dollars) {
      toast(`That is more than the ${usdFull(dollars)} in your Dollar account.`);
      return;
    }
    const stopped = sendGate.stopped(nairaEq);
    if (stopped) {
      toast(stopped);
      return;
    }
    /* the day after a recovery nobody new is paid, and a wallet is nobody paid before (the analysis after Round 34) */
    if (sendGate.holding) {
      toast('The account was recovered today, so for a day no dollars go out. Money still comes in.');
      return;
    }
    const shut = lockedFor();
    if (shut) {
      toast(`That was three wrong tries. Give it ${waitWords(shut)} and slide again.`);
      return;
    }
    setGuard(true);
  };
  /* the passcode landed: the dollars go, the line goes into the day, and the receipt comes up */
  const done = () => {
    if (!account) return;
    const at = clock();
    const move: Move =
      way === 'tag' && who
        ? {
            name: who.name,
            detail: `$${who.tag} · Dollar account · ${at}`,
            amount: -nairaEq,
            icon: 'send',
            kind: 'coin',
            usd: -usd,
            coin: { coin: 'USD', network: 'beetle', address: `$${who.tag}`, hash: sessionId(new Date(), 17 + moves.length), fee: 0 },
          }
        : {
            name: check.ok ? shortAddress(check.address) : 'A Solana wallet',
            detail: `${coin} on ${net.name} · ${at}`,
            amount: -nairaEq,
            icon: 'up',
            kind: 'coin',
            usd: -usd,
            coin: { coin, network: DOLLAR_NETWORK, address: check.ok ? check.address : to, hash: testHash(DOLLAR_NETWORK), fee },
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

  useFoot({ kind: 'slide', label: 'Slide to send', amount: usd ? usdFull(usd) : '', disabled: !usd || !ready, onSlide: slide, veil: guard ? 'away' : undefined });
  if (!ok || !account) return null;
  return (
    <>
      <Screen head={<PageHead lead title="Send dollars" sub="From your Dollar account, to a Beetle $tag or any Solana wallet" />}>
        {setup.done ? null : <SetupOffer sub="Two minutes, and you can send dollars" />}
        <Segments options={[WAYS.tag, WAYS.wallet]} value={WAYS[way]} onChange={v => setWay(v === WAYS.wallet ? 'wallet' : 'tag')} />
        {way === 'tag' ? (
          <View style={{ gap: 8 }} testID="dollar-tag-block">
            <TextBox
              label="Their Beetle tag"
              prefix="$"
              value={tag}
              onChangeText={t => setTag(t.replace(/^\$/, '').replace(/\s/g, ''))}
              placeholder="amaka"
              autoCapitalize="none"
              autoCorrect={false}
              note={tagWhy || (who ? `${who.name} · Dollar account` : undefined)}
              bad={!!tagWhy}
              testID="dollar-tag"
            />
            <Meta tone="tertiary">Dollars as they are, into their Dollar account. Free, and there at once.</Meta>
          </View>
        ) : (
          <>
            <View style={{ gap: 12 }}>
              <Head>The coin they get</Head>
              <Segments options={LISTED.map(c => c.id)} value={coin} onChange={v => isListed(v) && setCoin(v)} />
            </View>
            <View style={{ gap: 8 }} testID="coin-to-block">
              <TextBox
                label={`Their ${coin} address on Solana`}
                value={to}
                onChangeText={setTo}
                placeholder="Their Solana address"
                autoCapitalize="none"
                autoCorrect={false}
                note={!check.ok && check.why ? check.why : check.ok ? `A Solana address, starting ${check.address.slice(0, 4)} and ending ${check.address.slice(-4)}: check both` : undefined}
                bad={!check.ok && !!check.why}
                right={
                  <Tap accessibilityRole="button" accessibilityLabel="Paste" onPress={() => void paste()} hitSlop={10} testID="coin-paste">
                    <Caption style={{ color: colour.accent }}>Paste</Caption>
                  </Tap>
                }
                testID="coin-to"
              />
              {check.ok && !sentBefore ? (
                <Aside glyph="alert">A new address. Send a little first, and the rest once they have it: coins sent to a wrong address cannot be got back.</Aside>
              ) : (
                <Meta tone="tertiary">Copy it from their wallet or exchange, on Solana. Coins sent to a wrong address cannot be got back.</Meta>
              )}
            </View>
          </>
        )}
        <View style={s.figure} testID="coin-amount">
          <View style={s.from}>
            <Row>From your Dollar account</Row>
            <Meta tone="secondary">{`${usdFull(dollars)} there`}</Meta>
          </View>
          <View style={s.picker}>
            <AmountPicker
              unit="dollars"
              value={usd}
              onChange={v => setUsd(v)}
              max={dollars}
              note={usd ? `They get ${usdFull(arrives)}` : way === 'wallet' ? `At least ${usdFull(LEAST_OUT)}` : 'Any amount'}
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
            rows={
              way === 'tag'
                ? [
                    { label: 'Fee', value: 'Free' },
                    { label: 'They get', value: usdFull(arrives) },
                    { label: 'Arrives', value: 'At once' },
                  ]
                : [
                    { label: 'Network fee', value: feeLine(net) },
                    { label: 'They get', value: `${usdFull(arrives)} ${coin}` },
                    { label: 'Arrives in', value: arrivesIn(net) },
                  ]
            }
          />
        </View>
        <Aside glyph="globe">This build is on Solana’s test network. Nothing reaches a real wallet.</Aside>
      </Screen>
      {guard && ready ? (
        <PasscodeSheet
          amount={usdFull(usd)}
          name={way === 'tag' && who ? who.name : check.ok ? shortAddress(check.address) : ''}
          detail={way === 'tag' && who ? `$${who.tag} · Dollar account` : `${coin} on Solana`}
          glyph={way === 'tag' ? 'send' : 'up'}
          rows={
            way === 'tag'
              ? [
                  { label: 'Fee', value: 'Free' },
                  { label: 'They get', value: usdFull(arrives) },
                  { label: 'Leaves Dollar account', value: usdFull(usd), strong: true },
                ]
              : [
                  { label: 'To', value: check.ok ? `${check.address.slice(0, 4)}…${check.address.slice(-4)}` : '' },
                  { label: 'Network fee', value: feeLine(net) },
                  { label: 'They get', value: `${usdFull(arrives)} ${coin}` },
                  { label: 'Leaves Dollar account', value: usdFull(usd), strong: true },
                ]
          }
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
