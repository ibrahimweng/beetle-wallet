/* Finish setting up, offered where a limit it lifts is in the way: the
   ready screen's card, on any page. It opens the way in at the first step
   still to answer, and Back there comes back here. */
import React from 'react';
import { View } from 'react-native';
import { Caption, Card, Icon, Label, Tap, colour, space, useDeparture } from '../../design';

export function SetupOffer({ sub, testID = 'setup-offer' }: { sub: string; testID?: string }) {
  const j = useDeparture({ id: 'setup-offer', to: '/way-in?setup=1', words: 'Finish setting up' });
  return (
    <Tap ref={j.ref} accessibilityRole="button" accessibilityLabel="Finish setting up" onPress={j.onPress} testID={testID}>
      {j.wash}
      <Card outline style={{ flexDirection: 'row', alignItems: 'center', gap: space.s4, paddingVertical: space.s3, paddingHorizontal: space.s4, borderRadius: 16 }}>
        <Icon name="shield-filled" size={24} colour={colour.ink} />
        <View style={{ flex: 1 }}>
          <Label>Finish setting up</Label>
          <Caption tone="tertiary">{sub}</Caption>
        </View>
        <Icon name="chevron" size={16} colour={colour.textTertiary} />
      </Card>
    </Tap>
  );
}
