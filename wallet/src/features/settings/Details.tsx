/* Your details, on a sheet over Settings: what the account is in the name
   of, the number it was opened with, the account number to copy, and when
   it was opened. */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Body, Button, Caption, Head, Icon, Row, Sheet, Tap, colour, toast } from '../../design';
import type { Account } from '../../services';
import { groupAccount, groupPhone, initialsOf, longDate } from '../../lib/format';
import { copyText } from '../receive/clipboard';

export function Details({ account, onDismiss }: { account: Account; onDismiss: () => void }) {
  const name = `${account.firstName} ${account.lastName}`;
  const copy = async () => {
    toast((await copyText(account.accountNumber)) ? 'Your account number is copied. Paste it anywhere.' : 'This build cannot reach the clipboard.');
  };
  const line = (label: string, value: string, copyable = false) => (
    <View key={label} style={s.line}>
      <View style={{ flex: 1, gap: 4 }}>
        <Caption tone="secondary">{label}</Caption>
        <Row>{value}</Row>
      </View>
      {copyable ? (
        <Tap accessibilityRole="button" accessibilityLabel="Copy it" onPress={() => void copy()} style={s.copy}>
          <Icon name="copy" size={16} colour={colour.textSecondary} />
        </Tap>
      ) : null}
    </View>
  );
  return (
    <Sheet onDismiss={onDismiss} testID="details">
      <View style={{ alignItems: 'center', paddingTop: 4 }}>
        <Avatar initials={initialsOf(name)} size={64} />
        <Head style={{ marginTop: 16, textAlign: 'center' }}>Your details</Head>
        <Body tone="tertiary" style={{ marginTop: 12, textAlign: 'center' }}>
          What the account is in the name of
        </Body>
      </View>
      <View style={{ marginTop: 12 }}>
        {line('Name', name)}
        {line('Number', groupPhone(account.phone))}
        {line('Account number', groupAccount(account.accountNumber), true)}
        {line('Member since', longDate(account.createdAt.slice(0, 10)))}
      </View>
      <Button label="Done" tone="grey" size={48} full={false} style={{ alignSelf: 'center', paddingHorizontal: 40, marginTop: 8 }} onPress={onDismiss} />
    </Sheet>
  );
}

const s = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 64 },
  copy: { width: 32, height: 32, borderRadius: 16, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
});
