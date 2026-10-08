/* The way back to the lab from any screen: a small dark tab tucked into the
   right edge, in the gutter every screen keeps clear, so it covers nothing.
   It is only there once the lab has been opened this time round — the app
   opens as itself, with nothing of the lab showing — and not on the lab. */
import React from 'react';
import { View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Icon, Tap, colour } from '../design';
import { LAB } from './enabled';
import { useLabOpen } from './door';

export function LabTab() {
  const pathname = usePathname();
  const router = useRouter();
  const open = useLabOpen();
  if (!LAB || !open || pathname === '/lab' || pathname === '/') return null;
  const back = () => {
    if (router.canDismiss()) router.dismissTo('/lab');
    else router.replace('/lab');
  };
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: '44%', right: 0, zIndex: 20 }}>
      <Tap
        accessibilityRole="button"
        accessibilityLabel="Back to the lab"
        onPress={back}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 0 }}
        style={{ width: 20, height: 48, borderTopLeftRadius: 10, borderBottomLeftRadius: 10, backgroundColor: 'rgba(43,39,33,0.82)', alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon name="grid" size={12} colour={colour.textInverse} />
      </Tap>
    </View>
  );
}
