/* The photo the camera took, on its way to the chat. The camera screen puts
   it here and goes back; home takes it the moment it is in front again. */
import type { Photo } from '../../services';

let waiting: Photo | null = null;

export const handoff = {
  put(photo: Photo) {
    waiting = photo;
  },
  take(): Photo | null {
    const p = waiting;
    waiting = null;
    return p;
  },
};
