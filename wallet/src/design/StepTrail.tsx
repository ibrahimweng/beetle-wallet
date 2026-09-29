/* A step of the way in, as the stack above the title names it: a 24 glyph in
   ink with a 16 grey label 36 in. The stack itself is drawn by the way in,
   because its rows arrive and leave as part of that screen's choreography. */
import type { IconName } from '../icons';

export type TrailStep = { icon: IconName; label: string };
