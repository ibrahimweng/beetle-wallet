/* Your code, from its frame: a real QR on a white card with the account's
   name and number under it, Share it and Save it side by side, and the
   lock line that says anyone can pay you with it and nobody can take
   anything. Reached from Show it on Three ways to be paid. The code is
   made here, on the phone, from the account's own number; a bank app's
   camera reads it. */
import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, Button, Icon, Meta, PageHead, Row, Screen, colour, toast } from '../../design';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { askHome } from '../more/More';
import { groupAccount, initialsOf } from '../../lib/format';
import { Code } from './Code';
import { payload } from './qr';
import { saveCode, shareCode } from './picture';

export function MyCode() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const account = app.session?.account;
  const card = useRef<View>(null);
  useFoot({ kind: 'ask', placeholder: 'Ask about your code', onAsk: q => askHome(router, q), onScan: () => router.push('/scan'), more: true });
  if (!ok || !account) return null;
  const name = `${account.firstName} ${account.lastName}`;
  const number = groupAccount(account.accountNumber);
  const words = `Pay me at Beetle: ${number}, ${name}.`;
  return (
    <Screen head={<PageHead lead title="Your code" sub="Point their camera at this and the money reaches you" />}>
      {/* the card the picture is taken of: the code 24 down, the name row 20 under it, 26 under that */}
      <View ref={card} collapsable={false} style={s.card} testID="code-card">
        <Code text={payload(account.accountNumber, name)} size={190} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, height: 44, width: 201 }} testID="code-name">
          <Avatar initials={initialsOf(name)} size={44} tone={colour.accent} ink={colour.textInverse} />
          <View style={{ gap: 4, flex: 1 }}>
            <Row>{name}</Row>
            <Meta tone="secondary">Beetle · {number}</Meta>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: -6 }}>
        <Button label="Share it" onPress={() => void shareCode(card, words).then(toast)} style={{ width: 176 }} />
        <Button label="Save it" tone="grey" leading="down" onPress={() => void saveCode(card).then(toast)} style={{ width: 169 }} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: -8 }} testID="lock-line">
        <View style={{ marginTop: 2 }}>
          <Icon name="lock" size={16} colour={colour.textTertiary} />
        </View>
        <Meta tone="secondary" style={{ maxWidth: 280 }}>
          Anyone can pay you with this. Nobody can take anything with it, and it does not carry your balance.
        </Meta>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colour.surface, borderWidth: 1, borderColor: colour.rule, borderRadius: 24, alignItems: 'center', paddingTop: 24, paddingBottom: 26 },
});
