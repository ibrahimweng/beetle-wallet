/* The phone answering the finger: a light click as a picker passes a step,
   a firmer knock where it stops against its end. On the web, and on a
   phone that cannot, nothing happens and nothing breaks. Clicks are held to
   one every 28ms, so a fast fling ticks like a wheel rather than buzzing. */
import { Platform } from 'react-native';

type HapticsModule = typeof import('expo-haptics');
const haptics: HapticsModule | null = (() => {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-haptics') as HapticsModule;
  } catch {
    return null;
  }
})();

let last = 0;

export const feel = {
  /** A step passed. */
  tick() {
    const now = Date.now();
    if (!haptics || now - last < 28) return;
    last = now;
    haptics.selectionAsync().catch(() => undefined);
  },
  /** The end reached: the hard stop. */
  stop() {
    if (!haptics) return;
    last = Date.now();
    haptics.impactAsync(haptics.ImpactFeedbackStyle.Rigid).catch(() => undefined);
  },
  /** A pick landed: a chip, a figure typed. */
  pick() {
    if (!haptics) return;
    last = Date.now();
    haptics.impactAsync(haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  },
  /** The light gathering as the card is pulled (see home/glow), a step at a time: a tick, then a soft knock, then a light one. */
  gather(step: number) {
    if (!haptics || step < 1) return;
    last = Date.now();
    if (step === 1) haptics.selectionAsync().catch(() => undefined);
    else haptics.impactAsync(step === 2 ? haptics.ImpactFeedbackStyle.Soft : haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  },
  /** The light pulsing as the card goes open: a firm knock, and a soft one with its echo. */
  pulse() {
    if (!haptics) return;
    const h = haptics;
    last = Date.now();
    h.impactAsync(h.ImpactFeedbackStyle.Rigid).catch(() => undefined);
    setTimeout(() => h.impactAsync(h.ImpactFeedbackStyle.Soft).catch(() => undefined), 90);
  },
};
