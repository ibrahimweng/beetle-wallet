/* A sheet over a screen. The design keeps the screen behind visible and dim,
   and the sheet is a white panel from the bottom with the page's own radius.
   Tapping the dimmed part closes it, because a sheet you cannot leave is how
   people get stuck. */
import React, { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { colour, space } from './tokens';

export function Sheet({
  children,
  onClose,
  behind,
}: {
  children: ReactNode;
  onClose?: () => void;
  behind?: ReactNode;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: colour.surface }}>
      {behind ? (
        <View
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0.35 }}
          pointerEvents="none"
        >
          {behind}
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={onClose}
        style={{ flex: 1 }}
      />
      <View
        style={{
          backgroundColor: colour.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingHorizontal: 20,
          paddingTop: space.s4,
          paddingBottom: 32,
          gap: space.s5,
        }}
      >
        <View
          style={{
            width: 44,
            height: 4,
            borderRadius: 2,
            backgroundColor: colour.ruleStrong,
            alignSelf: 'center',
          }}
        />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: space.s5 }}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}
