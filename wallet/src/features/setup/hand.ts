/* The photo of the ID on its way back from the camera: the camera screen
   puts what it read here and goes back, and the setting-up stage takes it
   the moment it is in front again. */
let waiting: { name: string; number: string } | null = null;

export const idPhoto = {
  put(read: { name: string; number: string }) {
    waiting = read;
  },
  take() {
    const r = waiting;
    waiting = null;
    return r;
  },
};
