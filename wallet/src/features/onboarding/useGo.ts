/* Going somewhere from a screen of the way in. The screen blurs away first
   and the router is asked once it has gone; a screen that is come back to,
   or a step that could not be taken after all, is brought back with stay(). */
import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useLeave } from '../../design';

type Router = ReturnType<typeof useRouter>;
type Href = Parameters<Router['push']>[0];

export function useGo() {
  const router = useRouter();
  const { leaving, leave, stay } = useLeave();
  useFocusEffect(
    useCallback(() => {
      stay();
    }, [stay]),
  );
  return {
    leaving,
    leave,
    stay,
    push: (href: Href) => leave(() => router.push(href)),
    replace: (href: Href) => leave(() => router.replace(href)),
    back: () => leave(() => router.back()),
  };
}
