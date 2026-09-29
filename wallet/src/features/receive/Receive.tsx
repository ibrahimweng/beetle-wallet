/* Being paid. Over the chat, inside the card: the account number, big, and
   whose it is; a way to copy it and a way to share it; and the line that
   says these can only be paid into. Money that arrives lands on the card,
   in the day and in a chat from Beetle — this build can have some arrive
   from here, so the moment can be seen. */
import React, { useState } from 'react';
import { Platform, ScrollView, Share, StyleSheet, View } from 'react-native';
import { Caption, Icon, Label, Meta, Pane, Row, Swap, Tap, colour, dark, motion, useStill } from '../../design';
import type { IconName } from '../../icons';
import { MOCK, type Account } from '../../services';
import { groupAccount, naira } from '../../lib/format';
import { copyText } from './clipboard';
import { SAMPLE_ARRIVAL } from './arrival';

export function ReceivePane({ account, onDone, onPretend }: { account: Account; onDone: () => void; /** this build: have the sample arrival happen */ onPretend?: () => void }) {
  const still = useStill();
  const [note, setNote] = useState('They can only be paid into. Neither carries your balance.');
  const [leaving, setLeaving] = useState(false);
  const name = `${account.firstName} ${account.lastName}`;
  const number = groupAccount(account.accountNumber);
  const words = `Pay me at Beetle: ${number}, ${name}.`;

  const copy = async () => {
    const ok = await copyText(account.accountNumber);
    setNote(ok ? `${number} copied. Paste it anywhere.` : 'This build cannot reach the clipboard. Read it off the screen.');
  };
  const share = async () => {
    try {
      await Share.share(Platform.OS === 'ios' ? { message: words } : { message: words, title: 'Pay me at Beetle' });
    } catch {
      /* the web without a share sheet, or a share put away: the number is still there */
      const ok = await copyText(words);
      setNote(ok ? 'No share sheet here, so it is on your clipboard instead.' : 'No share sheet here. Read it off the screen.');
    }
  };
  const go = (then: () => void) => {
    setLeaving(true);
    setTimeout(then, still ? 0 : motion.leave);
  };

  return (
    <Pane leaving={leaving} style={StyleSheet.absoluteFill}>
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={{ gap: 4 }}>
          <Label style={{ color: '#ffffff' }}>Being paid</Label>
          <Meta style={{ color: dark.textSoft }}>Hand these out to anyone who owes you.</Meta>
        </View>
        <View style={s.block}>
          <Caption style={{ color: dark.label }}>Your account number</Caption>
          <Row style={s.number} accessibilityLabel={`Account number ${number}`}>
            {number}
          </Row>
          <Row style={{ color: dark.text }}>Beetle · {name}</Row>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pill icon="copy" label="Copy the number" onPress={() => void copy()} />
          <Pill icon="share" label="Share" onPress={() => void share()} />
        </View>
        <View style={{ minHeight: 40 }}>
          <Swap value={note}>{shown => <Meta style={{ color: dark.textSoft }}>{shown}</Meta>}</Swap>
        </View>
        <Meta style={{ color: dark.label }}>Money that arrives shows on the card and in the day, and Beetle tells you.</Meta>
        {MOCK && onPretend ? (
          <Tap accessibilityRole="button" accessibilityLabel="Have money arrive" onPress={() => go(onPretend)} style={{ alignSelf: 'flex-start', paddingVertical: 4 }}>
            <Caption style={{ color: colour.cyan }}>
              This build: have {naira(SAMPLE_ARRIVAL.amount)} arrive from {SAMPLE_ARRIVAL.from.split(' ')[0]}
            </Caption>
          </Tap>
        ) : null}
        <Tap accessibilityRole="button" accessibilityLabel="Done" onPress={() => go(onDone)} style={s.done}>
          <Row style={{ color: '#ffffff' }}>Done</Row>
        </Tap>
      </ScrollView>
    </Pane>
  );
}

function Pill({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Tap accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={s.pill}>
      <Icon name={icon} size={16} colour="#ffffff" />
      <Label style={{ color: '#ffffff' }}>{label}</Label>
    </Tap>
  );
}

const s = StyleSheet.create({
  body: { flexGrow: 1, justifyContent: 'center', gap: 20, paddingVertical: 12 },
  block: {
    backgroundColor: dark.panel,
    borderWidth: 1,
    borderColor: dark.edge,
    borderRadius: 24,
    padding: 20,
    gap: 6,
  },
  number: { color: '#ffffff', fontWeight: '700', fontSize: 32, lineHeight: 40, letterSpacing: -1.06 },
  pill: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: dark.edge,
    borderWidth: 1,
    borderColor: dark.edgeStrong,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  done: {
    height: 52,
    borderRadius: 26,
    backgroundColor: dark.edge,
    borderWidth: 1,
    borderColor: dark.edgeStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
