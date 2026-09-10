/* Top bar — the set's two variants. title=Beetle puts the mark beside the
   name, centred, with back on the left. 16 semibold. */
import React from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from './Icon';
import { Row } from './text';
import { colour } from './tokens';

export function TopBar({
  title,
  mark = true,
  onBack,
}: {
  title: string;
  mark?: boolean;
  onBack?: () => void;
}) {
  return (
    <View style={{ height: 44, justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {mark ? <Icon name="mark" size={24} colour={colour.accent} /> : null}
        <Row>{title}</Row>
      </View>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={{
            position: 'absolute',
            left: 0,
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="back" size={22} />
        </Pressable>
      ) : null}
    </View>
  );
}
