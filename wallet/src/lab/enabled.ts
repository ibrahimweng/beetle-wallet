/* Whether this build opens on the lab. It does everywhere a designer might
   be looking — the web, Expo Go, a development build, and the preview APK —
   and not in the production build, which is the demo people are shown.
   EXPO_PUBLIC_LAB=1 or 0 at export time overrides that either way. */
import { channel } from 'expo-updates';

const flag = process.env.EXPO_PUBLIC_LAB;
export const LAB: boolean = flag === '1' || flag === '0' ? flag === '1' : channel !== 'production';
