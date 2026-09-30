/* Whether the lab has been opened this time the app is running. The app
   opens as itself; the lab is behind a long press on the version line in
   Settings, and the tab back to it is only there once it has been opened,
   so nothing of the lab shows while the app is being used as an app. */
import { useEffect, useState } from 'react';

let open = false;
const listeners = new Set<() => void>();

export const door = {
  /** the lab was opened: the tab back to it comes with it */
  opened() {
    open = true;
    listeners.forEach(l => l());
  },
  /** leaving the lab for the app: the tab goes */
  closed() {
    open = false;
    listeners.forEach(l => l());
  },
  isOpen: () => open,
};

export function useLabOpen(): boolean {
  const [is, setIs] = useState(open);
  useEffect(() => {
    const l = () => setIs(open);
    listeners.add(l);
    /* the lab may have opened before this listened: the tab is mounted with the app, the lab's effect runs first */
    setIs(open);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return is;
}
