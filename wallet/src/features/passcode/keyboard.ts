/* The keyboard, for the sheet that asks for the password. A sheet sits 10
   off the bottom of the screen (design/Sheet.tsx), and the phone's keyboard
   comes up over that bottom: on iOS, where the window does not shrink for
   it, the sheet is lifted by as much as the keyboard covers, on the
   keyboard's own curve; on Android the window makes the room itself. Either
   way the room left over the keyboard is known, so the sheet can give way
   above the box rather than run up under the status bar (the owner's rule:
   whatever is typed into stays in view). */
import { useEffect, useState, type RefObject } from 'react';
import { Keyboard, Platform, type KeyboardEvent, type View } from 'react-native';

export type KeyboardRoom = {
  /** where the keyboard's top is on the screen, or null while it is down */
  top: number | null;
  /** how far a view that fills the screen behind the sheet rises to sit on it */
  lift: number;
};

/** The room a sheet's content has with the keyboard's top at `top`: from 10 over the keyboard up to 12 under the
    status bar, less the sheet's grabber (32) and the room under its content (24), as design/Sheet.tsx sets them. */
export const roomOver = (top: number, safeTop: number) => top - 10 - (safeTop + 12) - 32 - 24;

/** Where the keyboard is, and how far `view` (which fills the screen behind the sheet) has to rise to sit on it. */
export function useKeyboardRoom(view: RefObject<View | null>): KeyboardRoom {
  const [room, setRoom] = useState<KeyboardRoom>({ top: null, lift: 0 });
  useEffect(() => {
    /* a browser's keyboard is not the page's to know about (and React Native Web's Keyboard cannot say where it is) */
    if (Platform.OS === 'web') return;
    const ios = Platform.OS === 'ios';
    let live = true;
    const up = (e: KeyboardEvent) => {
      const top = e.endCoordinates.screenY;
      if (!ios) {
        setRoom({ top, lift: 0 });
        return;
      }
      /* measured in the window, so it holds wherever the sheet was put up from: a page, or a sheet under the status bar */
      view.current?.measureInWindow((_x, y, _w, h) => {
        if (!live) return;
        if (e.duration) Keyboard.scheduleLayoutAnimation(e);
        setRoom({ top, lift: Math.max(0, Math.round(y + h - top)) });
      });
    };
    const down = (e: KeyboardEvent) => {
      if (ios && e.duration) Keyboard.scheduleLayoutAnimation(e);
      setRoom({ top: null, lift: 0 });
    };
    const subs = [Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', up), Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', down)];
    /* up already, from something typed before the sheet came */
    const now = Keyboard.metrics();
    if (now && Keyboard.isVisible()) up({ endCoordinates: now, duration: 0, easing: 'keyboard' });
    return () => {
      live = false;
      subs.forEach(s => s.remove());
    };
  }, [view]);
  return room;
}
