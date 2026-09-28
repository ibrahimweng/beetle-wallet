/* Every step of the way in checks it is allowed to be on screen: a step past
   the next one to do sends you back to that one, and a session sends you on to
   where you land — the ready screen the moment the account opens, home after
   that. The screens after the way in do the opposite. Only the screen that is
   actually showing sends anybody anywhere: the ones underneath it in the
   stack keep quiet until they are come back to. */
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApp } from './store';
import { canEnter, landing, nextStep, routeOf, type Step } from './machine';

function useFocused() {
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  return focused;
}

export function useStepGuard(step: Step) {
  const { ready, session, progress } = useApp();
  const router = useRouter();
  const focused = useFocused();
  const allowed = ready && !session && canEnter(step, progress);
  useEffect(() => {
    if (!ready || !focused) return;
    if (session) router.replace(routeOf[landing(progress)]);
    else if (!canEnter(step, progress)) router.replace(routeOf[nextStep(progress)]);
  }, [ready, focused, session, progress, step, router]);
  return allowed;
}

export function useSessionGuard() {
  const { ready, session } = useApp();
  const router = useRouter();
  const focused = useFocused();
  useEffect(() => {
    if (ready && focused && !session) router.replace('/welcome');
  }, [ready, focused, session, router]);
  return ready && !!session;
}

/** For the screens before the way in: somebody with a session is sent on. */
export function useSessionRedirect() {
  const { ready, session, progress } = useApp();
  const router = useRouter();
  const focused = useFocused();
  useEffect(() => {
    if (ready && focused && session) router.replace(routeOf[landing(progress)]);
  }, [ready, focused, session, progress, router]);
}
