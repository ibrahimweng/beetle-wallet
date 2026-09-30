/* The receipt on its own page, from the frames: the head with the day and
   the time, the amount on its tick, the slip, a button to share it, what
   Beetle offers about it, and the way to say something is wrong, which for
   a transfer opens What went wrong?. The dock is the way back, the ask bar
   to ask about it, and the camera. A bill's token sits above the slip with
   a button to copy it. The same receipt opens over the page it came from
   (see ReceiptOver): the pieces here are shared by both. */
import React, { RefObject, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Body, Button, Caption, Card, Head, Icon, Label, Meta, Receipt, Screen, Tap, colour, frame, toast, Arrive, useDeparture } from '../../design';
import { useFoot } from '../more/Foot';
import { askHome } from '../more/More';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { holdingsFor } from '../home/account';
import { balanceOf, useMoves } from '../home/moves';
import { copyText } from '../receive/clipboard';
import { naira } from '../../lib/format';
import { receiptFor, shareLine, type Receipt as ReceiptModel } from './receipts';
import { ShareSheet } from './ShareSheet';

/** The receipt for a line of the day, by the line's id, once the day has loaded. */
export function useReceipt(id: string) {
  const app = useApp();
  const account = app.session?.account;
  const { moves, ready } = useMoves(account?.accountNumber);
  const receipt = useMemo(() => {
    if (!account || !ready) return null;
    const h = holdingsFor(account);
    const rows = [...moves, ...h.ledger];
    const row = rows.find(r => r.id === id);
    if (!row) return null;
    const balanceNow = h.everyday + balanceOf(moves);
    return receiptFor(row, { account, balanceNow, rows });
  }, [account, ready, moves, id]);
  return { account, ready, receipt };
}

/** What a question about the receipt carries to the chat: the money, who, and when. */
export const aboutOf = (r: ReceiptModel) => `${naira(r.amount)} ${r.line.replace(/^Sent to /, 'to ')}, ${r.when}`;

export function ReceiptScreen({ id }: { id: string }) {
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ share?: string }>();
  const { account, ready, receipt } = useReceipt(id);
  const [sharing, setSharing] = useState(asked.share === '1');
  /* the receipt as drawn, for the picture the share sheet hands out */
  const slip = useRef<View>(null);

  const askAbout = (q: string) => {
    if (receipt) askHome(router, q, aboutOf(receipt));
  };
  /* the foot: Back, and the ask bar with the receipt's own question */
  useFoot({ kind: 'ask', placeholder: receipt?.ask ?? 'Ask about this', onAsk: askAbout, onScan: () => router.push('/scan'), veil: sharing ? 'away' : undefined });
  if (!ok || !account) return null;
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
  return (
    <>
      <Screen head={<ReceiptHead receipt={receipt} />}>
        <ReceiptBody id={id} receipt={receipt} slip={slip} onShare={() => setSharing(true)} />
      </Screen>
      {sharing ? <ReceiptShare receipt={receipt} slip={slip} onDismiss={() => setSharing(false)} /> : null}
    </>
  );
}

/* The frame's head: the title, 8, the day and the time, and 24 to the
   amount; the amount is what travels here, so the head only fades in. */
export function ReceiptHead({ receipt }: { receipt: ReceiptModel }) {
  return (
    <Arrive carry={false} style={{ gap: 8, marginBottom: 4 }}>
      <Head>{receipt.head}</Head>
      <Body tone="tertiary">{receipt.when}</Body>
    </Arrive>
  );
}

/* The column under the head: the amount and the slip, Share receipt, what
   Beetle offers, and the way to say something is wrong. The top and the
   slip keep the column's own gap inside the view the picture is taken of,
   white under them for the picture's sake (`white`); over a page, only
   while the picture is being taken. */
export function ReceiptBody({ id, receipt, slip, onShare, white = true }: { id: string; receipt: ReceiptModel; slip: RefObject<View | null>; onShare: () => void; white?: boolean }) {
  const router = useRouter();
  /* something wrong with a transfer: What went wrong? arrives from the line */
  const wrong = useDeparture({ id: 'wrong', to: `/wrong/${id}`, words: receipt.wrong });
  const copy = async (text: string, what: string) => {
    toast((await copyText(text)) ? `${what} copied. Paste it anywhere.` : 'This build cannot reach the clipboard.');
  };
  return (
    <>
      <View ref={slip} collapsable={false} style={{ gap: frame.columnGap, backgroundColor: white ? colour.surface : 'transparent' }}>
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
      </View>
      <Button label="Share receipt" leading="share" badge onPress={onShare} />
      <Nudge
        text={receipt.nudge.text}
        action={receipt.nudge.action}
        to={
          receipt.kind === 'transfer'
            ? `/rule?offer=again&row=${id}`
            : `/rule?offer=${receipt.kind === 'in' ? 'salary' : receipt.kind === 'convert' ? 'dollars' : receipt.kind === 'saving' ? 'salary' : 'ikeja'}`
        }
      />
      <Tap
        ref={wrong.ref}
        accessibilityRole="button"
        accessibilityLabel={receipt.wrong}
        onPress={receipt.kind === 'transfer' ? wrong.onPress : () => askHome(router, receipt.wrong, `${naira(receipt.amount)} ${receipt.line.toLowerCase()}`)}
        style={[s.wrong, wrong.style]}
      >
        <Label tone="accent">{receipt.wrong}</Label>
        <Icon name="chevron" size={12} colour={colour.accent} />
      </Tap>
    </>
  );
}

/** The share sheet, with the receipt's line, its message, and the slip as drawn for the picture. */
export function ReceiptShare({ receipt, slip, onDismiss }: { receipt: ReceiptModel; slip: RefObject<View | null>; onDismiss: () => void }) {
  return <ShareSheet line={shareLine(receipt)} message={`${shareLine(receipt)}. ${receipt.sessionLabel} ${receipt.session}. Sent with Beetle.`} capture={slip} onDismiss={onDismiss} />;
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
