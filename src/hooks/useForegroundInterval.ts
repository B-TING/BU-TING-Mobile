import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * 포그라운드이고 enabled일 때만 interval을 돈다.
 * 첫 tick은 호출 쪽이 이미 가져왔으면 생략한다. 백그라운드에서 복귀하면 즉시 한 번 돈다.
 */
export function useForegroundInterval(
  callback: () => void,
  intervalMs: number,
  enabled: boolean,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled || intervalMs <= 0) {
      return;
    }

    const tick = () => {
      if (AppState.currentState !== 'active') {
        return;
      }
      callbackRef.current();
    };

    const intervalId = setInterval(tick, intervalMs);
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        tick();
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [enabled, intervalMs]);
}
