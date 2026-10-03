/* Handing the details on: one of them copied, or all of them to the phone's
   share sheet, saying what happened either way. */
import { Share } from 'react-native';
import { toast } from '../../design';
import { copyText } from './clipboard';

/** Copies one detail and says so; `where` is what to read it off where this build has no clipboard. */
export async function copyDetail(text: string, words: string, where: 'card' | 'sheet') {
  toast((await copyText(text)) ? `${words} copied. Paste it anywhere.` : `This build cannot reach the clipboard. Read it off the ${where}.`);
}

/** The phone's share sheet with all of it; the clipboard where there is none. */
export async function shareDetails(all: string, where: 'card' | 'sheet') {
  try {
    await Share.share({ message: all });
  } catch {
    await copyDetail(all, 'Your details are', where);
  }
}
