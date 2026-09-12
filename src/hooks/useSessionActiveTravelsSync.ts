import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { SESSION_TRAVELS_POLL_INTERVAL_MS } from '../constants/common/pollIntervals';
import { syncSessionActiveTravels } from '../services/travel/syncSessionActiveTravels';
import { selectIsAuthenticated, useAuthStore } from '../stores/useAuthStore';

/** 로그인 세션 동안 참여 중 여행을 서버와 동기화 (앱 마운트·포그라운드) */
export function useSessionActiveTravelsSync() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  const syncFromServer = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }
    await syncSessionActiveTravels();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    void syncFromServer();
  }, [isAuthenticated, syncFromServer]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        void syncFromServer();
      }
    });
    return () => subscription.remove();
  }, [isAuthenticated, syncFromServer]);

  return { syncFromServer };
}

/** 화면 포커스 시 참여 중 여행 재동기화 (NavigationContainer 내부에서만 사용) */
export function useSessionActiveTravelsSyncOnFocus(enabled = true) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  const syncFromServer = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }
    await syncSessionActiveTravels();
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) {
        return;
      }
      void syncFromServer();
      const intervalId = setInterval(() => {
        if (AppState.currentState === 'active') {
          void syncFromServer();
        }
      }, SESSION_TRAVELS_POLL_INTERVAL_MS);
      return () => {
        clearInterval(intervalId);
      };
    }, [enabled, syncFromServer]),
  );
}
