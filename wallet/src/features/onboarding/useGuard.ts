/* Every step of the way in checks it is allowed to be on screen: a step past
   the next one to do sends you back to that one, and a session sends you on to
   where you land — the ready screen the moment the account opens, home after
   that. The screens after the way in do the opposite. */
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useApp } from './store';
import { canEnter, landing, nextStep, routeOf, type Step } from './machine';

export function useStepGuard(step: Step) {
  const { ready, session, progress } = useApp();
  const router = useRouter();
  const allowed = ready && !session && canEnter(step, progress);
  useEffect(() => {
    if (!ready) return;
    if (session) router.replace(routeOf[landing(progress)]);
    else if (!canEnter(step, progress)) router.replace(routeOf[nextStep(progress)]);
  }, [ready, session, progress, step, router]);
  return allowed;
}

export function useSessionGuard() {
  const { ready, session } = useApp();
  const router = useRouter();
  useEffect(() => {
    if (ready && !session) router.replace('/welcome');
  }, [ready, session, router]);
  return ready && !!session;
}
