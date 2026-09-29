/* Who may be on which screen. Home needs a session and sends anyone without
   one to the way in; the way in does the opposite itself, because it knows
   whether the ready screen has been seen. Only the screen that is actually
   showing sends anybody anywhere: the ones underneath it in the stack keep
   quiet until they are come back to. */
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApp } from './store';

export function useFocused() {
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  return focused;
}

export function useSessionGuard() {
  const { ready, session } = useApp();
  const router = useRouter();
  const focused = useFocused();
  useEffect(() => {
    if (ready && focused && !session) router.replace('/way-in');
  }, [ready, focused, session, router]);
  return ready && !!session;
}
