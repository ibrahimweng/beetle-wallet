/* Whether the chat has been pointed out on this phone. Home shows the card
   dipping once, the first time, and never again. */
import { storage } from '../../services';

const KEY = 'beetle.home.pointed-out.v1';

export const chatPointedOut = () => storage.get<boolean>(KEY).then(v => v === true);
export const markChatPointedOut = () => storage.set(KEY, true);
export const forgetChatPointedOut = () => storage.remove(KEY);
