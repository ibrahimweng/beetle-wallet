/* The button's menu. Read off the Actions frame: the home screen fades out,
   the five actions stand right aligned with their own coloured glyph, rows 68
   apart, glyphs 40 square with their right edge 26 in from the side, and the
   black button stays where it is so it closes what it opened. Anywhere that
   is not an action closes it too. */
import React from 'react';
import { Head, Icon, colour } from '../design';
import { Pressable, StyleSheet, View } from 'react-native';
import { IconName } from '../icons';
import { Route } from '../routes';
import { Home } from './home';
import { still } from './send';

const ITEMS: { icon: IconName; label: string; to: Route; colour: string }[] = [
  { icon: 'voice-filled', label: 'Voice', to: 'ask', colour: colour.warn },
  { icon: 'send-filled', label: 'Send money', to: 'pay', colour: colour.accent },
  { icon: 'receive-filled', label: 'Receive', to: 'ways', colour: colour.good },
  { icon: 'history-filled', label: 'History', to: 'history', colour: colour.violet },
  { icon: 'settings-filled', label: 'Settings', to: 'settings', colour: colour.ink },
];

export function Actions({ go, close }: { go: (r: Route) => void; close: () => void }) {
  return (
    <Pressable style={s.fill} accessibilityLabel="Close" onPress={close}>
      {/* the frame fades the home screen out behind the menu rather than
          covering it, so the button you pressed stays where it was */}
      <View style={s.behind} pointerEvents="none">
        <Home nav={still} />
      </View>
      <View style={s.veil} />
      <View style={s.items}>
        {ITEMS.map(it => (
          <Pressable
            key={it.label}
            accessibilityRole="button"
            onPress={() => go(it.to)}
            style={({ pressed }) => [s.item, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Head>{it.label}</Head>
            <Icon name={it.icon} size={40} colour={it.colour} />
          </Pressable>
        ))}
      </View>
      <Pressable accessibilityLabel="Close" onPress={close} style={s.fab}>
        <Icon name="fab-plus" size={24} colour={colour.textInverse} />
      </Pressable>
    </Pressable>
  );
}

const s = StyleSheet.create({
  fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colour.surface },
  behind: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  veil: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  items: { position: 'absolute', right: 26, bottom: 138, alignItems: 'flex-end', gap: 28 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 32 },
  fab: {
    /* exactly where the dock's own button is, so the one you pressed is the
       one that closes this */
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colour.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
