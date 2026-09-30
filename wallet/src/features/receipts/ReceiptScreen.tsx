/* The receipt on its own page, from the frames: the head with the day and
   the time, the amount on its tick, the slip, a button to share it, what
   Beetle offers about it, and the way to say something is wrong, which for
   a transfer opens What went wrong?. The dock is the way back, the ask bar
   to ask about it, and the camera. A bill's token sits above the slip with
   a button to copy it. */
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Body, Button, Caption, Card, Head, Icon, Label, Meta, Receipt, Screen, Tap, colour, toast, Arrive, useDeparture } from '../../design';
import { useFoot } from '../more/Foot';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { holdingsFor } from '../home/account';
import { useMoves } from '../home/moves';
import { copyText } from '../receive/clipboard';
import { naira } from '../../lib/format';
import { receiptFor, shareLine } from './receipts';
import { ShareSheet } from './ShareSheet';

export function ReceiptScreen({ id }: { id: string }) {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ share?: string }>();
  const account = app.session?.account;
  const { moves, ready } = useMoves(account?.accountNumber);
  const [sharing, setSharing] = useState(asked.share === '1');

  const receipt = useMemo(() => {
    if (!account || !ready) return null;
    const h = holdingsFor(account);
    const rows = [...moves, ...h.ledger];
    const row = rows.find(r => r.id === id);
    if (!row) return null;
    const balanceNow = h.everyday + moves.reduce((a, r) => a + r.amount, 0);
    return receiptFor(row, { account, balanceNow, rows });
  }, [account, ready, moves, id]);

  const askAbout = (q: string) => {
    if (receipt) router.push({ pathname: '/home', params: { say: q, about: `${naira(receipt.amount)} ${receipt.line.replace(/^Sent to /, 'to ')}, ${receipt.when}` } });
  };
  /* the foot: Back, and the ask bar with the receipt's own question */
  useFoot({ kind: 'ask', placeholder: receipt?.ask ?? 'Ask about this', onAsk: askAbout, onScan: () => router.push('/scan'), veil: sharing ? 'away' : undefined });
  /* something wrong with a transfer: What went wrong? arrives from the line */
  const wrong = useDeparture({ id: 'wrong', to: `/wrong/${id}`, words: receipt?.wrong });
  if (!ok || !account) return null;
  const copy = async (text: string, what: string) => {
    toast((await copyText(text)) ? `${what} copied. Paste it anywhere.` : 'This build cannot reach the clipboard.');
  };
  if (!ready)
    return (
      <Screen still>
        <View />
      </Screen>
    );
  if (!receipt)
    return (
      <Screen>
        <Head>No receipt for that</Head>
        <Body tone="tertiary">The line it belonged to is not in this day.</Body>
      </Screen>
    );
  const later = (what: string) => () => toast(`${what} comes with round 7.`);
  return (
    <>
      <Screen
        head={
          /* the frame's head: the title, 8, the day and the time, and 24 to the amount; the amount is what travels here, so the head only fades in */
          <Arrive carry={false} style={{ gap: 8, marginBottom: 4 }}>
            <Head>{receipt.head}</Head>
            <Body tone="tertiary">{receipt.when}</Body>
          </Arrive>
        }
      >
        <Receipt
          amount={naira(receipt.amount)}
          line={receipt.line}
          status={receipt.status}
          fields={receipt.fields}
          session={receipt.session}
          sessionLabel={receipt.sessionLabel}
          good={receipt.kind === 'in'}
          onCopy={() => void copy(receipt.session, 'The session id')}
          tail={receipt.tail}
          head={receipt.token ? <Token token={receipt.token} onCopy={() => void copy(receipt.token ?? '', 'The token')} /> : undefined}
        />
        <Button label="Share receipt" leading="share" badge onPress={() => setSharing(true)} />
        <Nudge text={receipt.nudge.text} action={receipt.nudge.action} to={`/rule?offer=${receipt.kind === 'in' ? 'salary' : 'ikeja'}`} />
        <Tap
          ref={wrong.ref}
          accessibilityRole="button"
          accessibilityLabel={receipt.wrong}
          onPress={receipt.kind === 'transfer' ? wrong.onPress : later('What went wrong')}
          style={[s.wrong, wrong.style]}
        >
          <Label tone="accent">{receipt.wrong}</Label>
          <Icon name="chevron" size={12} colour={colour.accent} />
        </Tap>
      </Screen>
      {sharing ? <ShareSheet line={shareLine(receipt)} message={`${shareLine(receipt)}. ${receipt.sessionLabel} ${receipt.session}. Sent with Beetle.`} onDismiss={() => setSharing(false)} /> : null}
    </>
  );
}

/* A bill's token above the slip: the number, and a button to copy it, as
   the Bill paid frame draws it. */
function Token({ token, onCopy }: { token: string; onCopy: () => void }) {
  return (
    <Card style={s.token} testID="token">
      <Caption tone="secondary">Meter token</Caption>
      <Head>{token}</Head>
      <Button label="Copy the token" tone="white" size={48} leading="copy" onPress={onCopy} />
    </Card>
  );
}

/* What Beetle offers under the slip: its mark, a line, and a chip to take it up. */
function Nudge({ text, action, to }: { text: string; action: string; to: string }) {
  const j = useDeparture({ id: 'nudge', to, words: action });
  return (
    <Card style={s.nudge} testID="nudge">
      <Icon name="mark" size={32} colour={colour.accent} />
      <Meta style={{ flex: 1 }}>{text}</Meta>
      <Tap ref={j.ref} accessibilityRole="button" accessibilityLabel={action} onPress={j.onPress} style={s.chip}>
        <Label>{action}</Label>
        <Icon name="chevron" size={12} colour={colour.ink} />
      </Tap>
    </Card>
  );
}

const s = StyleSheet.create({
  token: { paddingVertical: 16, paddingHorizontal: 16, gap: 12 },
  nudge: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 72, paddingVertical: 0, paddingLeft: 16, paddingRight: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 38,
    borderRadius: 19,
    paddingLeft: 16,
    paddingRight: 10,
    backgroundColor: colour.surface,
    borderWidth: 1,
    borderColor: colour.rule,
  },
  wrong: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44 },
});
