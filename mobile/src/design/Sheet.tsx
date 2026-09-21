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
import { LinearGradient } from 'expo-linear-gradient';
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
});

/* Over the camera the frames lay white instead: a fifth of it at the top,
   running to solid by the bottom, so the dark screen reads as a dim room
   above the sheet rather than a black one. The blur's own tint carries the
   first sixth of that. */
const VEIL = ['rgba(255,255,255,0.05)', 'rgba(255,255,255,1)'] as const;

export function Sheet({
  children,
  onClose,
  behind,
  veil = false,
}: {
  children: ReactNode;
  onClose?: () => void;
  behind?: ReactNode;
  /* Most sheet frames turn the screen behind them down to about #c5c5c7.
     The ones over the camera veil it in white instead. Pass this for those. */
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
            <BlurView intensity={52} tint={veil ? 'default' : 'light'} style={s.soften} />
            {veil ? (
              <LinearGradient
                colors={VEIL}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={s.soften}
              />
            ) : (
              <View style={s.wash} />
            )}
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
