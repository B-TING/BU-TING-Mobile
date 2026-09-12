import { useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { TRAVEL_PLAN_POLL_INTERVAL_MS } from '../constants/common/pollIntervals';
import { trySyncTravelPlanFromApi } from '../services/travel/trySyncTravelPlanFromApi';
import { unlockPlanSchedule } from '../utils/travel/scheduleApiLock';
import type { TravelPlan } from '../types/travelPlan';
import { isPlanForCurrentApiServer } from '../utils/api/apiServerOrigin';
import { usePlanStore } from '../stores/usePlanStore';

type UseApiTravelPlanSyncOptions = {
  planId: string;
  enabled: boolean;
  accessToken: string | null;
};

function findCurrentPlan(planId: string): TravelPlan | null {
  const plan = usePlanStore.getState().plans.find(p => p.planId === planId) ?? null;
  return plan && isPlanForCurrentApiServer(plan) ? plan : null;
}

/** API 연동 플랜 — 화면 포커스 시 서버 일정으로 로컬 캐시를 갱신 */
export function useApiTravelPlanSync({
  planId,
  enabled,
  accessToken,
}: UseApiTravelPlanSyncOptions) {
  const upsertPlan = usePlanStore(s => s.upsertPlan);
  const setPlanOfflineSync = usePlanStore(s => s.setPlanOfflineSync);

  const markPlanOfflineSync = useCallback(
    (targetPlanId: string, offline: boolean) => {
      setPlanOfflineSync?.(targetPlanId, offline);
    },
    [setPlanOfflineSync],
  );
  const syncingRef = useRef(false);

  const syncFromServer = useCallback(async (): Promise<TravelPlan | null> => {
    if (!enabled || !accessToken || !planId) {
      return findCurrentPlan(planId);
    }

    const localPlan = usePlanStore.getState().plans.find(p => p.planId === planId);
    if (!localPlan || localPlan.source !== 'api' || !isPlanForCurrentApiServer(localPlan)) {
      unlockPlanSchedule(planId);
      return localPlan && isPlanForCurrentApiServer(localPlan) ? localPlan : null;
    }

    if (syncingRef.current) {
      return localPlan;
    }

    syncingRef.current = true;
    try {
      const { plan, scheduleLocked } = await trySyncTravelPlanFromApi(
        accessToken,
        localPlan,
      );
      markPlanOfflineSync(planId, scheduleLocked);
      if (!scheduleLocked) {
        // 일정 sync와 멤버 sync가 동시에 돌면, 늦게 끝난 일정 sync가
        // 멤버 목록을 예전 스냅샷으로 덮어쓸 수 있어 최신 store 멤버를 유지한다.
        const latest = usePlanStore.getState().plans.find(p => p.planId === planId);
        upsertPlan({
          ...plan,
          members: latest?.members ?? plan.members,
        });
      }
      return plan;
    } finally {
      syncingRef.current = false;
    }
  }, [enabled, accessToken, planId, upsertPlan, markPlanOfflineSync]);

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
      }, TRAVEL_PLAN_POLL_INTERVAL_MS);
      return () => {
        clearInterval(intervalId);
      };
    }, [enabled, syncFromServer]),
  );

  return { syncFromServer };
}
