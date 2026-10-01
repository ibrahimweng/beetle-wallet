/* Three ways to be paid, from its frame: Beetle's word that there is
   nothing to photograph when money is coming in, then the three things it
   can hand you — the account number with Copy it, the code with Show it,
   and asking somebody with Ask for money — each on a grey card with its
   glyph, its name, a line under it and the thing itself in bold, and a
   note at the foot that none of these can take anything out. Reached from
   Bank transfer on the Receive sheet, and from asking Beetle how to get
   paid; the code and the request are pages of their own. */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Caption, Head, Icon, Label, Meta, PageHead, Row, Say, Screen, Tap, colour, toast, useDeparture } from '../../design';
import type { IconName } from '../../icons';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { askHome } from '../more/More';
import { groupAccount } from '../../lib/format';
import { copyText } from './clipboard';

export function Ways() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const account = app.session?.account;
  useFoot({ kind: 'back' });
  if (!ok || !account) return null;
  const number = groupAccount(account.accountNumber);
  const name = `${account.firstName} ${account.lastName}`;
  const copy = async () => {
    toast((await copyText(account.accountNumber)) ? `${number} copied. Paste it anywhere.` : 'This build cannot reach the clipboard. Read it off the screen.');
  };
  return (
    <Screen head={<PageHead lead title="Three ways to be paid" sub="All of them safe to hand out" />}>
      <Say testID="say">There is nothing to photograph when money is coming to you. What I can do is hand you the two things money reaches you by, and write the message that asks.</Say>
      <View style={{ gap: 12 }} testID="ways">
        <WayCard glyph="bank" title="Your account number" sub={`Beetle · ${name}`} big={number} action="Copy it" onPress={() => void copy()} testID="way-number" />
        <WayCard glyph="qr" title="Your code" sub="Works with any bank app" big="Point a camera at it" action="Show it" to="/mycode" testID="way-code" />
        <WayCard glyph="request" title="Ask somebody" sub="I write it, you check it" big="On WhatsApp and SMS" action="Ask for money" to="/request" testID="way-ask" />
        {/* the frame's note: Beetle's mark, the line, and the words under it, on a card 321 wide */}
        <View style={s.note} testID="note">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="mark" size={24} colour={colour.accent} />
            <Label style={{ flex: 1 }}>None of these can take anything out</Label>
          </View>
          <Caption tone="secondary">A number and a code can only be paid into. Nothing here carries your balance.</Caption>
        </View>
      </View>
    </Screen>
  );
}

/* A way on its card: the glyph on a white square, the name over its line,
   the thing itself in bold under them, and a white button with a chevron. */
function WayCard({
  glyph,
  title,
  sub,
  big,
  action,
  onPress,
  to,
  testID,
}: {
  glyph: IconName;
  title: string;
  sub: string;
  big: string;
  action: string;
  onPress?: () => void;
  to?: string;
  testID?: string;
}) {
  return (
    <View style={s.card} testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 40 }}>
        <View style={s.box}>
          <Icon name={glyph} size={20} colour={colour.ink} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Row>{title}</Row>
          <Caption tone="secondary">{sub}</Caption>
        </View>
      </View>
      <Head style={{ marginTop: 12 }}>{big}</Head>
      <View style={{ marginTop: 12 }}>
        <Pill label={action} onPress={onPress} to={to} />
      </View>
    </View>
  );
}

/* The frame's white button: 44 tall with a hairline, the word in the middle
   and a small chevron after it; it leads to its page the way a button does. */
export function Pill({ label, onPress, to }: { label: string; onPress?: () => void; to?: string }) {
  const j = useDeparture({ id: `pill:${label}`, to, words: label });
  return (
    <Tap ref={j.ref} accessibilityRole="button" accessibilityLabel={label} onPress={to ? j.onPress : onPress} style={[s.pill]}>
      {j.wash}
      <Label>{label}</Label>
      <Icon name="chevron" size={12} colour={colour.textSecondary} />
    </Tap>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colour.surface2, borderRadius: 20, padding: 16 },
  box: { width: 40, height: 40, borderRadius: 12, backgroundColor: colour.surface, alignItems: 'center', justifyContent: 'center' },
  pill: { height: 44, borderRadius: 22, backgroundColor: colour.surface, borderWidth: 1, borderColor: colour.rule, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  note: { width: 321, backgroundColor: colour.surface, borderWidth: 1, borderColor: colour.rule, borderRadius: 20, paddingTop: 12, paddingBottom: 12, paddingHorizontal: 16 },
});
