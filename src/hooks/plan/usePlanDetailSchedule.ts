import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  type PlanScheduleTabHandle,
  type ScheduleModalState,
} from '../../components/plan/schedule/planScheduleTypes';
import { useAppAlert } from '../../components/shared/modals';
import { useCopy } from '../../i18n';
import { useBusanSearchLocationWhen } from '../usePlaceMapUserLocation';
import {
  addPlanPlaceFromCandidate,
  findDayRoute,
  getDayRoutesFromPlan,
  removePlanPlaceFromApi,
  replacePlanPlaceFromCandidate,
  routesInItemOrder,
  updatePlanPlaceMemoOnApi,
  updatePlanPlaceOrderOnApi,
  updatePlanPlaceVisitedOnApi,
} from '../../services/travel/planPlaceSync';
import {
  addPlanDayOnApi,
  canAddPlanDay,
  canRemovePlanDay,
  computeNextPlanDay,
  removePlanDayOnApi,
} from '../../services/travel/planDaySync';
import { usePlanStore } from '../../stores';
import type { AppLanguage } from '../../types/user';
import type { RouteItem, TravelLegMode, TravelPlan } from '../../types/travelPlan';
import { sortedRoutes } from '../../utils/plan/planItinerary';
import { optimizeRouteOrder } from '../../utils/plan/routeOptimize';
import {
  candidateToRouteItem,
  type RebootPlaceCandidate,
} from '../../utils/places/rebootPlaces';
import { usePlaceDetailCacheStore } from '../../stores/usePlaceDetailCacheStore';
import { lockPlanScheduleIfApiError } from '../../utils/travel/scheduleApiLock';

function seedCandidateRouteImage(candidate: RebootPlaceCandidate): void {
  usePlaceDetailCacheStore.getState().seedImageUrl(candidate.placeId, candidate.imageUrl, {
    name: candidate.placeName,
    address: candidate.address,
  });
}

type UsePlanDetailScheduleParams = {
  plan: TravelPlan | null;
  enrichedPlan: TravelPlan | null;
  planId: string;
  accessToken: string | null | undefined;
  isApiPlan: boolean;
  viewOnly: boolean;
  scheduleReadOnly: boolean;
  offlineMode: boolean;
  language: AppLanguage;
  notifyScheduleReadOnly: () => void;
  syncFromServer: () => Promise<TravelPlan | null>;
};

/** 일정 CRUD · 일 추가/삭제 · 경로 최적화 */
export function usePlanDetailSchedule({
  plan,
  enrichedPlan,
  planId,
  accessToken,
  isApiPlan,
  viewOnly,
  scheduleReadOnly,
  offlineMode,
  language,
  notifyScheduleReadOnly,
  syncFromServer,
}: UsePlanDetailScheduleParams) {
  const copy = useCopy('planDetail');
  const { alert } = useAppAlert();

  const toggleVisited = usePlanStore(s => s.toggleRouteVisited);
  const replaceRoute = usePlanStore(s => s.replaceRouteInPlan);
  const addRoute = usePlanStore(s => s.addRouteToPlan);
  const removeRoute = usePlanStore(s => s.removeRouteFromPlan);
  const reorderRoutes = usePlanStore(s => s.reorderRoutesInPlan);
  const updateRouteMemo = usePlanStore(s => s.updateRouteMemo);
  const addItineraryDay = usePlanStore(s => s.addItineraryDay);
  const removeItineraryDay = usePlanStore(s => s.removeItineraryDay);

  const [selectedDay, setSelectedDay] = useState(1);
  const [scheduleModal, setScheduleModal] = useState<ScheduleModalState>({ kind: 'none' });
  const [scheduleReorderActive, setScheduleReorderActive] = useState(false);
  const scheduleRef = useRef<PlanScheduleTabHandle>(null);

  const lockScheduleOnApiError = useCallback(
    (error: unknown) => {
      if (!isApiPlan) {
        return;
      }
      lockPlanScheduleIfApiError(planId, error);
    },
    [isApiPlan, planId],
  );

  const scheduleDay =
    enrichedPlan?.itinerary.find(d => d.dayNumber === selectedDay) ??
    enrichedPlan?.itinerary[0];
  const scheduleRoutes = useMemo(
    () => (scheduleDay ? sortedRoutes(scheduleDay.routes) : []),
    [scheduleDay],
  );
  const schedulePlaceIds = useMemo(
    () => scheduleRoutes.map(r => r.placeId),
    [scheduleRoutes],
  );
  const pickRoute =
    scheduleModal.kind === 'pick'
      ? (scheduleRoutes.find(r => r.itemId === scheduleModal.itemId) ?? null)
      : null;
  const lastScheduleRoute = scheduleRoutes[scheduleRoutes.length - 1];
  const needGpsAddAnchor =
    !offlineMode && scheduleModal.kind === 'add' && !lastScheduleRoute?.location;
  const { location: gpsAddAnchor } = useBusanSearchLocationWhen(needGpsAddAnchor);
  const addPlaceAnchor =
    lastScheduleRoute?.location ?? gpsAddAnchor ?? undefined;

  const closeScheduleModal = useCallback(() => {
    setScheduleModal({ kind: 'none' });
  }, []);

  const handleDeleteRoute = useCallback(
    async (route: RouteItem) => {
      if (!planId || viewOnly) {
        if (scheduleReadOnly) {
          notifyScheduleReadOnly();
        }
        return;
      }

      if (isApiPlan && accessToken && (route.apiPlanPlaceId || route.itemId)) {
        try {
          await removePlanPlaceFromApi(accessToken, route);
          await syncFromServer();
        } catch (error) {
          lockScheduleOnApiError(error);
          const message =
            error instanceof Error ? error.message : '장소 삭제에 실패했습니다.';
          alert({ title: '장소 삭제 실패', message });
          return;
        }
        return;
      }

      removeRoute(planId, route.itemId);
    },
    [
      accessToken,
      alert,
      isApiPlan,
      lockScheduleOnApiError,
      notifyScheduleReadOnly,
      planId,
      removeRoute,
      scheduleReadOnly,
      syncFromServer,
      viewOnly,
    ],
  );

  const resolveSelectedDayAfterRemove = useCallback(
    (removedDayNumber: number, previousSelected: number) => {
      const itinerary =
        usePlanStore.getState().plans.find(p => p.planId === planId)?.itinerary ?? [];
      if (itinerary.length === 0) {
        return 1;
      }
      if (itinerary.some(day => day.dayNumber === previousSelected)) {
        return previousSelected;
      }
      if (previousSelected === removedDayNumber) {
        return Math.max(1, removedDayNumber - 1);
      }
      if (previousSelected > removedDayNumber) {
        const adjusted = previousSelected - 1;
        if (itinerary.some(day => day.dayNumber === adjusted)) {
          return adjusted;
        }
      }
      return itinerary[itinerary.length - 1]?.dayNumber ?? 1;
    },
    [planId],
  );

  const handleAddDay = useCallback(async () => {
    if (!planId || !enrichedPlan || viewOnly) {
      if (scheduleReadOnly) {
        notifyScheduleReadOnly();
      }
      return;
    }

    if (!canAddPlanDay(enrichedPlan)) {
      alert({ title: copy.addDay, message: copy.cannotAddMoreDays });
      return;
    }

    if (isApiPlan && accessToken) {
      try {
        const next = await addPlanDayOnApi(accessToken, enrichedPlan);
        await syncFromServer();
        setSelectedDay(next.dayNumber);
      } catch (error) {
        lockScheduleOnApiError(error);
        const message =
          error instanceof Error ? error.message : copy.cannotAddMoreDays;
        alert({ title: copy.addDay, message });
      }
      return;
    }

    const next = computeNextPlanDay(enrichedPlan);
    if (!next) {
      alert({ title: copy.addDay, message: copy.cannotAddMoreDays });
      return;
    }
    addItineraryDay(planId, next.dayNumber, next.visitDate);
    setSelectedDay(next.dayNumber);
  }, [
    accessToken,
    addItineraryDay,
    alert,
    copy.addDay,
    copy.cannotAddMoreDays,
    enrichedPlan,
    isApiPlan,
    lockScheduleOnApiError,
    notifyScheduleReadOnly,
    planId,
    scheduleReadOnly,
    syncFromServer,
    viewOnly,
  ]);

  const confirmRemoveDay = useCallback(async () => {
    if (!planId || !enrichedPlan || !scheduleDay || viewOnly) {
      return;
    }

    const removedDayNumber = scheduleDay.dayNumber;
    const previousSelected = selectedDay;

    if (isApiPlan && accessToken) {
      try {
        await removePlanDayOnApi(accessToken, enrichedPlan, scheduleDay);
        await syncFromServer();
        setSelectedDay(resolveSelectedDayAfterRemove(removedDayNumber, previousSelected));
      } catch (error) {
        lockScheduleOnApiError(error);
        const message =
          error instanceof Error ? error.message : copy.removeDayConfirmTitle;
        alert({ title: copy.removeDay, message });
      }
      return;
    }

    removeItineraryDay(planId, removedDayNumber);
    setSelectedDay(resolveSelectedDayAfterRemove(removedDayNumber, previousSelected));
  }, [
    accessToken,
    alert,
    copy.removeDay,
    copy.removeDayConfirmTitle,
    enrichedPlan,
    isApiPlan,
    lockScheduleOnApiError,
    planId,
    removeItineraryDay,
    resolveSelectedDayAfterRemove,
    scheduleDay,
    selectedDay,
    syncFromServer,
    viewOnly,
  ]);

  const handleRemoveDay = useCallback(() => {
    if (!planId || !enrichedPlan || !scheduleDay || viewOnly) {
      if (scheduleReadOnly) {
        notifyScheduleReadOnly();
      }
      return;
    }

    if (!canRemovePlanDay(enrichedPlan)) {
      alert({ title: copy.removeDay, message: copy.cannotRemoveLastDay });
      return;
    }

    alert({
      title: copy.removeDayConfirmTitle,
      message: copy.removeDayConfirmMessage(scheduleDay.date, scheduleDay.dayNumber),
      buttons: [
        { label: copy.rebootCancel, variant: 'secondary', onPress: () => {} },
        {
          label: copy.removeDayConfirm,
          variant: 'primary',
          onPress: () => {
            void confirmRemoveDay();
          },
        },
      ],
    });
  }, [
    alert,
    confirmRemoveDay,
    copy.cannotRemoveLastDay,
    copy.rebootCancel,
    copy.removeDay,
    copy.removeDayConfirm,
    copy.removeDayConfirmMessage,
    copy.removeDayConfirmTitle,
    enrichedPlan,
    notifyScheduleReadOnly,
    planId,
    scheduleDay,
    scheduleReadOnly,
    viewOnly,
  ]);

  const handleToggleVisited = useCallback(
    (itemId: string) => {
      if (!planId || !plan) {
        return;
      }
      if (scheduleReadOnly) {
        notifyScheduleReadOnly();
        return;
      }

      const route = plan.itinerary
        .flatMap(day => day.routes)
        .find(r => r.itemId === itemId);
      if (!route) {
        return;
      }

      const nextVisited = !route.isVisited;
      toggleVisited(planId, itemId);

      if (isApiPlan && accessToken && route.apiPlanPlaceId) {
        void updatePlanPlaceVisitedOnApi(accessToken, route, nextVisited).catch(error => {
          toggleVisited(planId, itemId);
          if (__DEV__) {
            console.warn('[PlanDetail] visited PATCH failed', error);
          }
        });
      }
    },
    [
      accessToken,
      isApiPlan,
      notifyScheduleReadOnly,
      plan,
      planId,
      scheduleReadOnly,
      toggleVisited,
    ],
  );

  const handleSaveRouteMemo = useCallback(
    async (route: RouteItem, memo: string | undefined) => {
      if (!planId || viewOnly) {
        if (scheduleReadOnly) {
          notifyScheduleReadOnly();
        }
        return;
      }

      const previousMemo = route.memo;
      updateRouteMemo(planId, route.itemId, memo);

      if (isApiPlan && accessToken) {
        try {
          await updatePlanPlaceMemoOnApi(accessToken, route, memo ?? null);
        } catch (error) {
          updateRouteMemo(planId, route.itemId, previousMemo);
          lockScheduleOnApiError(error);
          const message =
            error instanceof Error ? error.message : '메모 저장에 실패했습니다.';
          alert({ title: '메모 저장 실패', message });
        }
      }
    },
    [
      accessToken,
      alert,
      isApiPlan,
      lockScheduleOnApiError,
      notifyScheduleReadOnly,
      planId,
      scheduleReadOnly,
      updateRouteMemo,
      viewOnly,
    ],
  );

  const handlePickReplacement = useCallback(
    async (candidate: RebootPlaceCandidate, legMode?: TravelLegMode) => {
      if (!pickRoute || !planId || !scheduleDay || viewOnly) {
        return;
      }

      seedCandidateRouteImage(candidate);

      const apiPlanId = scheduleDay.apiPlanId;
      if (isApiPlan && accessToken && apiPlanId) {
        try {
          const synced = await syncFromServer();
          const freshRoute =
            findDayRoute(synced, scheduleDay.dayNumber, pickRoute) ?? pickRoute;

          const replaced = await replacePlanPlaceFromCandidate(
            accessToken,
            freshRoute,
            candidate,
          );
          await syncFromServer();
          if (legMode && legMode !== pickRoute.legMode) {
            usePlanStore.getState().updateRouteLegMode(planId, replaced.itemId, legMode);
          }
          closeScheduleModal();
        } catch (error) {
          lockScheduleOnApiError(error);
          const message =
            error instanceof Error ? error.message : '장소 변경에 실패했습니다.';
          alert({ title: '장소 변경 실패', message });
          await syncFromServer();
        }
        return;
      }

      const replacement = candidateToRouteItem(
        candidate,
        pickRoute.sequence,
        language,
        pickRoute.type === 'LOCKER' ? 'ATTRACTION' : pickRoute.type,
        legMode ?? pickRoute.legMode,
      );
      replaceRoute(planId, pickRoute.itemId, replacement);
      closeScheduleModal();
    },
    [
      accessToken,
      alert,
      closeScheduleModal,
      isApiPlan,
      language,
      lockScheduleOnApiError,
      pickRoute,
      planId,
      replaceRoute,
      scheduleDay,
      syncFromServer,
      viewOnly,
    ],
  );

  const handleReorderRoutes = useCallback(
    async (dayNumber: number, orderedItemIds: string[]) => {
      if (!planId || viewOnly) {
        return;
      }

      const day = enrichedPlan?.itinerary.find(d => d.dayNumber === dayNumber);
      const apiPlanId = day?.apiPlanId;
      if (!isApiPlan || !accessToken || !apiPlanId) {
        reorderRoutes(planId, dayNumber, orderedItemIds);
        return;
      }

      try {
        const synced = await syncFromServer();
        const freshRoutes = getDayRoutesFromPlan(synced, dayNumber);
        const orderedRoutes = routesInItemOrder(freshRoutes, orderedItemIds);
        if (orderedRoutes.length !== freshRoutes.length) {
          throw new Error(
            '일정이 동기화되지 않았습니다. 잠시 후 다시 시도해 주세요.',
          );
        }

        await updatePlanPlaceOrderOnApi(accessToken, apiPlanId, orderedRoutes);
        await syncFromServer();
      } catch (error) {
        lockScheduleOnApiError(error);
        const message =
          error instanceof Error ? error.message : '순서 변경에 실패했습니다.';
        alert({ title: '순서 변경 실패', message });
        await syncFromServer();
      }
    },
    [
      accessToken,
      alert,
      enrichedPlan,
      isApiPlan,
      lockScheduleOnApiError,
      planId,
      reorderRoutes,
      syncFromServer,
      viewOnly,
    ],
  );

  const handleOptimizeDayRoute = useCallback(
    async (dayNumber: number) => {
      if (!planId || viewOnly) {
        return;
      }

      const day = enrichedPlan?.itinerary.find(d => d.dayNumber === dayNumber);
      const apiPlanId = day?.apiPlanId;
      const routes = getDayRoutesFromPlan(enrichedPlan, dayNumber);
      if (routes.length < 2) {
        return;
      }

      if (!isApiPlan || !accessToken || !apiPlanId) {
        const orderedItemIds = optimizeRouteOrder(routes).map(r => r.itemId);
        reorderRoutes(planId, dayNumber, orderedItemIds);
        alert({ title: copy.routeOptimize, message: copy.routeOptimized });
        return;
      }

      try {
        const synced = await syncFromServer();
        const freshRoutes = getDayRoutesFromPlan(synced, dayNumber);
        if (freshRoutes.length < 2) {
          return;
        }
        const optimized = optimizeRouteOrder(freshRoutes);

        await updatePlanPlaceOrderOnApi(accessToken, apiPlanId, optimized);
        await syncFromServer();
        alert({ title: copy.routeOptimize, message: copy.routeOptimized });
      } catch (error) {
        lockScheduleOnApiError(error);
        const message =
          error instanceof Error ? error.message : '경로 최적화에 실패했습니다.';
        alert({ title: '경로 최적화 실패', message });
        await syncFromServer();
      }
    },
    [
      accessToken,
      alert,
      copy.routeOptimize,
      copy.routeOptimized,
      enrichedPlan,
      isApiPlan,
      lockScheduleOnApiError,
      planId,
      reorderRoutes,
      syncFromServer,
      viewOnly,
    ],
  );

  const handleAddPlace = useCallback(
    async (candidate: RebootPlaceCandidate, legMode?: TravelLegMode) => {
      if (!scheduleDay || !planId || !enrichedPlan || viewOnly) {
        return;
      }

      seedCandidateRouteImage(candidate);

      const apiPlanId = scheduleDay.apiPlanId;
      if (isApiPlan && apiPlanId && accessToken) {
        try {
          await syncFromServer();
          await addPlanPlaceFromCandidate(accessToken, apiPlanId, candidate);
          const afterAdd = await syncFromServer();
          if (legMode && legMode !== 'walk') {
            const dayRoutes = getDayRoutesFromPlan(afterAdd, scheduleDay.dayNumber);
            const added = dayRoutes.find(r => r.placeId === candidate.placeId);
            if (added) {
              usePlanStore.getState().updateRouteLegMode(planId, added.itemId, legMode);
            }
          }
          closeScheduleModal();
        } catch (error) {
          lockScheduleOnApiError(error);
          const message =
            error instanceof Error ? error.message : '장소 추가에 실패했습니다.';
          alert({ title: '장소 추가 실패', message });
          await syncFromServer();
        }
        return;
      }

      const newRoute = candidateToRouteItem(
        candidate,
        scheduleRoutes.length + 1,
        language,
        'ATTRACTION',
        legMode ?? 'walk',
      );
      addRoute(planId, scheduleDay.dayNumber, newRoute);
      closeScheduleModal();
    },
    [
      accessToken,
      addRoute,
      alert,
      closeScheduleModal,
      enrichedPlan,
      isApiPlan,
      language,
      lockScheduleOnApiError,
      planId,
      scheduleDay,
      scheduleRoutes.length,
      syncFromServer,
      viewOnly,
    ],
  );

  const handleScheduleToggleVisited = useCallback(
    (itemId: string) => {
      if (viewOnly) {
        if (scheduleReadOnly) {
          notifyScheduleReadOnly();
        }
        return;
      }
      handleToggleVisited(itemId);
    },
    [handleToggleVisited, notifyScheduleReadOnly, scheduleReadOnly, viewOnly],
  );

  const handleScheduleModalChange = useCallback(
    (modal: ScheduleModalState) => {
      if (viewOnly) {
        if (scheduleReadOnly) {
          notifyScheduleReadOnly();
        }
        return;
      }
      setScheduleModal(modal);
    },
    [notifyScheduleReadOnly, scheduleReadOnly, viewOnly],
  );

  useEffect(() => {
    if (scheduleModal.kind === 'pick' && !pickRoute) {
      closeScheduleModal();
    }
  }, [closeScheduleModal, pickRoute, scheduleModal.kind]);

  const resetScheduleUiOnPlanChange = useCallback(() => {
    setSelectedDay(1);
    setScheduleModal({ kind: 'none' });
    setScheduleReorderActive(false);
  }, []);

  const day =
    enrichedPlan?.itinerary.find(d => d.dayNumber === selectedDay) ??
    enrichedPlan?.itinerary[0];

  return {
    selectedDay,
    setSelectedDay,
    scheduleModal,
    scheduleReorderActive,
    setScheduleReorderActive,
    scheduleRef,
    schedulePlaceIds,
    pickRoute,
    addPlaceAnchor,
    day,
    handleDeleteRoute,
    handleAddDay,
    handleRemoveDay,
    handleToggleVisited: handleScheduleToggleVisited,
    handleSaveRouteMemo,
    handlePickReplacement,
    handleReorderRoutes,
    handleOptimizeDayRoute,
    handleAddPlace,
    closeScheduleModal,
    handleScheduleModalChange,
    resetScheduleUiOnPlanChange,
  };
}
