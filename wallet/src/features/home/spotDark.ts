/* What the tour's dark is, on the phone and on the web alike. */
import type { SharedValue } from 'react-native-reanimated';

export type Hole = { x: SharedValue<number>; y: SharedValue<number>; w: SharedValue<number>; h: SharedValue<number>; r: SharedValue<number> };
/** the way in's dark, most of the way solid */
export const SCRIM = 'rgba(26, 19, 13, 0.66)';
