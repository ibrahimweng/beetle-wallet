/* Request sent, from its frame: the tick on its blue disc, the figure and
   who was asked, what for, when it lapses and the reference, Beetle's word
   that it will say the moment the money lands, and its offer to remind
   them if nothing comes — Set that up leads to the standing instruction.
   Reached the moment a request goes, and again from the card in the chat
   Beetle files about it. */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BigStatus, Body, Facts, Head, Icon, Label, PageHead, Say, Screen, Tap, colour, useDeparture } from '../../design';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { askHome } from '../more/More';
import { LAB } from '../../lab/enabled';
import { naira } from '../../lib/format';
import { firstOf, objectOf } from './people';
import { DEMO_REQUEST, useRequests } from './requests';

export function Asked({ id }: { id: string }) {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ when?: string }>();
  const account = app.session?.account;
  const { requests, ready } = useRequests(account?.accountNumber);
  const r = requests.find(x => x.id === id) ?? (LAB && id === 'demo' ? DEMO_REQUEST : null);
  const about = r ? `${naira(r.amount)} asked of ${r.who.name}, ${r.reference}` : undefined;
  useFoot({ kind: 'back' });
  const remind = useDeparture({ id: 'remind', to: '/rule?offer=remind', words: 'Set that up' });
  if (!ok || !account) return null;
  if (!ready && !r)
    return (
      <Screen still>
        <View />
      </Screen>
    );
  if (!r)
    return (
      <Screen>
        <Head>No such request</Head>
        <Body tone="tertiary">Nothing was asked under that reference.</Body>
      </Screen>
    );
  const first = firstOf(r.who.name);
  const by = asked.when ?? 'Friday';
  return (
    <Screen head={<PageHead title="Request sent" sub={`${first} has it on WhatsApp and in a text`} />}>
      <BigStatus
        lead={
          <View style={s.disc} testID="sent-disc">
            <Icon name="check" size={24} colour={colour.textInverse} />
          </View>
        }
        amount={naira(r.amount)}
        line={`Asked ${r.who.name}`}
      />
      <View style={{ marginTop: -4 }}>
        <Facts
          testID="facts"
          rows={[
            { label: 'For', value: r.note ?? 'Nothing said', quiet: !r.note },
            { label: 'Expires', value: r.expires },
            { label: 'Reference', value: r.reference },
          ]}
        />
      </View>
      <View style={{ marginTop: -4 }}>
        <Say testID="say">I will tell you the moment it lands. You do not have to watch for it.</Say>
      </View>
      {/* the frame's card: 16 round the bubble's row, the button 12 under it, 46 tall */}
      <View style={[s.offer, { marginTop: -4 }]} testID="offer">
        <Say>{`Want me to remind ${objectOf(r.who.pronoun)} if nothing comes by ${by}?`}</Say>
        <Tap ref={remind.ref} accessibilityRole="button" accessibilityLabel="Set that up" onPress={remind.onPress} style={[s.setUp]}>
          {remind.wash}
          <Label>Set that up</Label>
          <Icon name="chevron" size={12} colour={colour.ink} />
        </Tap>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  disc: { width: 56, height: 56, borderRadius: 28, backgroundColor: colour.accent, alignItems: 'center', justifyContent: 'center' },
  offer: { backgroundColor: colour.surface, borderWidth: 1, borderColor: colour.rule, borderRadius: 24, padding: 16, gap: 12 },
  setUp: { height: 46, borderRadius: 23, backgroundColor: colour.surface2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
