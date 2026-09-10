/* A sheet over a screen. The design keeps the screen behind visible and dim,
   and the sheet is a white panel from the bottom with the page's own radius.
   Tapping the dimmed part closes it, because a sheet you cannot leave is how
   people get stuck.

   It comes up from below its own height on a heavy spring, so it reads as
   something lifted rather than something switched on, and the dim behind it
   fades in over the same time. What is in it then arrives in sequence, the
   same way a screen's column does. */
import React, { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { colour, space } from './tokens';
import { Backdrop, Reveal, Rise, Scrim } from './motion';

const s = StyleSheet.create({
  soften: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  wash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    /* Read off the frames: white behind a sheet comes out at #c5c5c7 and the
       black Receive button at #515153, which is not a grey laid over the top —
       a grey wash flattens both to the same middle — but the screen itself
       turned down. A quarter of black keeps what contrast the blur leaves. */
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  veil: { backgroundColor: 'rgba(255,255,255,0.28)' },
});

export function Sheet({
  children,
  onClose,
  behind,
  veil = false,
}: {
  children: ReactNode;
  onClose?: () => void;
  behind?: ReactNode;
  /* Thirteen of the fourteen sheet frames turn the screen behind them down to
     about #c5c5c7. One — the voice sheet you open from the ask bar — only
     veils it, leaving white white. Pass this for that one. */
  veil?: boolean;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: colour.surface }}>
      {behind ? (
        <Scrim style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} to={0.9}>
          <View pointerEvents="none" style={{ flex: 1 }}>
            <Backdrop>{behind}</Backdrop>
            {/* the frames put the screen behind a sheet out of focus rather
                than merely dim, which is what keeps the sheet the only thing
                you can read */}
            <BlurView intensity={52} tint="light" style={s.soften} />
            <View style={[s.wash, veil && s.veil]} />
          </View>
        </Scrim>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={onClose}
        style={{ flex: 1 }}
      />
      <Rise
        style={{
          /* the frames never let a sheet swallow the whole screen: what it is
             over stays visible above it. It is a panel, not an edge — inset 10
             each side and 11 off the bottom, with all four corners round. */
          maxHeight: '82%',
          marginHorizontal: 10,
          marginBottom: 11,
          backgroundColor: colour.surface,
          borderRadius: 28,
          paddingHorizontal: 20,
          paddingTop: space.s4,
          paddingBottom: 24,
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
          {React.Children.toArray(children).map((child, i) => (
            <Reveal key={i} index={i + 3} rise={10}>
              {child}
            </Reveal>
          ))}
        </ScrollView>
      </Rise>
    </View>
  );
}
