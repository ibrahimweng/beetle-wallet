/* The code as a picture, to hand out or keep: the card it sits on is
   captured as it is drawn, and the picture goes to the phone's share sheet
   or into Photos. On the web the capture is a drawing of the page, so Save
   it downloads the picture and Share it, with no share sheet to give, puts
   the words on the clipboard instead. A build made before these modules
   were added has none of them, and says so rather than crashing. */
import { Platform } from 'react-native';
import type { RefObject } from 'react';
import type { View } from 'react-native';
import { copyText } from './clipboard';

type ViewShot = typeof import('react-native-view-shot');
type Sharing = typeof import('expo-sharing');
type MediaLibrary = typeof import('expo-media-library');

/* each module is asked for once, by name, quietly: the bundler wants the
   names written out, and a build without one gets null */
const shot: ViewShot | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-view-shot') as ViewShot;
  } catch {
    return null;
  }
})();
const sharing: Sharing | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-sharing') as Sharing;
  } catch {
    return null;
  }
})();
const photos: MediaLibrary | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-media-library') as MediaLibrary;
  } catch {
    return null;
  }
})();

/** The card as a PNG: a file on the phone, a data address on the web; null where this build cannot draw it. */
export async function capture(ref: RefObject<View | null>): Promise<string | null> {
  if (!shot || !ref.current) return null;
  try {
    return await shot.captureRef(ref, { format: 'png', quality: 1, result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile' });
  } catch {
    return null;
  }
}

/** Hands the picture to the share sheet; the words where there is none. What happened, to say. */
export async function sharePicture(ref: RefObject<View | null>, words: string, title = 'Your Beetle code'): Promise<string> {
  if (Platform.OS !== 'web' && sharing) {
    const uri = await capture(ref);
    if (uri && (await sharing.isAvailableAsync().catch(() => false))) {
      try {
        await sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: title });
        return 'Shared.';
      } catch {
        /* the sheet was put away, or would not open: the words still go */
      }
    }
  }
  const ok = await copyText(words);
  return ok ? 'No share sheet here, so the words are on your clipboard instead.' : 'No share sheet here, and no clipboard to give. Read the number off the screen.';
}

/** Puts the picture in Photos, or downloads it on the web. What happened, to say. */
export async function savePicture(ref: RefObject<View | null>, filename = 'beetle-code.png'): Promise<string> {
  const uri = await capture(ref);
  if (!uri) return 'This build cannot draw the picture to save it.';
  if (Platform.OS === 'web') {
    try {
      const doc = (globalThis as { document?: Document }).document;
      if (!doc) return 'Nothing here to save into.';
      const a = doc.createElement('a');
      a.href = uri;
      a.download = filename;
      a.click();
      return `Downloaded: ${filename}.`;
    } catch {
      return 'The browser would not take the download.';
    }
  }
  if (!photos) return 'This build cannot reach Photos.';
  try {
    const p = await photos.requestPermissionsAsync(true);
    if (!p.granted) return 'Beetle was not allowed into Photos. Allow it in the phone’s settings and try again.';
    await photos.saveToLibraryAsync(uri);
    return 'Saved to Photos.';
  } catch {
    return 'Photos would not take it. Try again in a moment.';
  }
}

/** Your code's own picture: shared, and saved. */
export const shareCode = (ref: RefObject<View | null>, words: string) => sharePicture(ref, words, 'Your Beetle code');
export const saveCode = (ref: RefObject<View | null>) => savePicture(ref, 'beetle-code.png');
