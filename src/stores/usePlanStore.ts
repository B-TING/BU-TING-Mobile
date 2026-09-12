import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getCopyForLanguage } from '../i18n';
import { enrichPlaceInfo } from '../constants/places/placeCatalog';
import { isTourApiContentId, routeTypeToContentTypeId } from '../utils/places/routePlaceDetail';
import type { PlanWizardAnswers } from '../types/planWizard';
import type { BudgetEntry, RouteItem, TravelLegMode, TravelPlan } from '../types/travelPlan';
import { isPlanForCurrentApiServer } from '../utils/api/apiServerOrigin';
import { jsonEqual } from '../utils/common/jsonEqual';
import { createId } from '../utils/common/id';
import { optimizeRouteOrder } from '../utils/plan/routeOptimize';
import { getSelectableHomePlans } from '../utils/plan/selectableHomePlans';
import {
  listCompletedLocalPlanIds,
  selectLatestLocalPlan as pickLatestLocalPlan,
} from '../utils/plan/selectLatestLocalPlan';
import { isServerBackedPlan } from '../utils/plan/serverBackedPlan';

export const EMPTY_BUDGET: BudgetEntry[] = [];

type PlanState = {
  plans: TravelPlan[];
  activePlanId: string | null;
  planCandidates: TravelPlan[] | null;
  budgetByPlan: Record<string, BudgetEntry[]>;
  /** GET 동기화 실패로 오프라인 캐시를 쓰는 플랜 ID */
  offlineSyncPlanIds: Record<string, true>;
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setPlanOfflineSync: (planId: string, offline: boolean) => void;
  addPlan: (plan: TravelPlan) => void;
  upsertPlan: (plan: TravelPlan) => void;
  setActivePlan: (planId: string) => void;
  clearActivePlan: () => void;
  confirmPlan: (planId: string) => void;
  setPlanCandidates: (candidates: TravelPlan[] | null) => void;
  clearCandidates: () => void;
  toggleRouteVisited: (planId: string, itemId: string) => void;
  removeRouteFromPlan: (planId: string, itemId: string) => void;
  replaceRouteInPlan: (planId: string, itemId: string, replacement: RouteItem) => void;
  addRouteToPlan: (planId: string, dayNumber: number, route: RouteItem) => void;
  reorderRoutesInPlan: (planId: string, dayNumber: number, orderedItemIds: string[]) => void;
  updateRouteLegMode: (planId: string, itemId: string, legMode: TravelLegMode) => void;
  updateRouteMemo: (planId: string, itemId: string, memo: string | undefined) => void;
  optimizeDayRoute: (planId: string, dayNumber: number) => void;
  addItineraryDay: (planId: string, dayNumber: number, visitDate: string) => void;
  removeItineraryDay: (planId: string, dayNumber: number) => void;
  addBudgetEntry: (entry: Omit<BudgetEntry, 'entryId'> & { entryId?: string }) => void;
  setBudgetEntries: (planId: string, entries: BudgetEntry[]) => void;
  getBudgetForPlan: (planId: string) => BudgetEntry[];
  completePlan: (planId: string) => void;
  /** 완료된 여행을 로컬 캐시에서 제거 (오프라인 목록용) */
  purgeCompletedLocalPlans: () => void;
  replacePlan: (plan: TravelPlan) => void;
};

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      plans: [],
      activePlanId: null,
      planCandidates: null,
      budgetByPlan: {},
      offlineSyncPlanIds: {},
      _hasHydrated: false,
      setHasHydrated: value => set({ _hasHydrated: value }),
      setPlanOfflineSync: (planId, offline) =>
        set(state => {
          const offlineSyncPlanIds = state.offlineSyncPlanIds ?? {};
          if (!offline) {
            if (!offlineSyncPlanIds[planId]) {
              return state;
            }
            const next = { ...offlineSyncPlanIds };
            delete next[planId];
            return { offlineSyncPlanIds: next };
          }
          if (offlineSyncPlanIds[planId]) {
            return state;
          }
          return {
            offlineSyncPlanIds: { ...offlineSyncPlanIds, [planId]: true },
          };
        }),
      addPlan: plan =>
        set(state => ({
          plans: [...state.plans.filter(p => p.planId !== plan.planId), plan],
          activePlanId: plan.planId,
        })),
      upsertPlan: plan =>
        set(state => {
          const existing = state.plans.find(p => p.planId === plan.planId);
          if (existing && jsonEqual(existing, plan)) {
            return state;
          }
          const nextPlan =
            existing && jsonEqual(existing.itinerary, plan.itinerary)
              ? { ...plan, itinerary: existing.itinerary }
              : plan;
          return {
            plans: existing
              ? state.plans.map(p => (p.planId === plan.planId ? nextPlan : p))
              : [...state.plans, nextPlan],
          };
        }),
      setActivePlan: planId => set({ activePlanId: planId }),
      clearActivePlan: () => set({ activePlanId: null }),
      confirmPlan: planId =>
        set(state => ({
          plans: state.plans.map(p =>
            p.planId === planId ? { ...p, status: 'CONFIRMED' } : p,
          ),
          activePlanId: planId,
        })),
      setPlanCandidates: candidates => set({ planCandidates: candidates }),
      clearCandidates: () => set({ planCandidates: null }),
      toggleRouteVisited: (planId, itemId) =>
        set(state => ({
          plans: state.plans.map(plan => {
            if (plan.planId !== planId) {
              return plan;
            }
            return {
              ...plan,
              itinerary: plan.itinerary.map(day => ({
                ...day,
                routes: day.routes.map(r =>
                  r.itemId === itemId ? { ...r, isVisited: !r.isVisited } : r,
                ),
              })),
            };
          }),
        })),
      removeRouteFromPlan: (planId, itemId) =>
        set(state => ({
          plans: state.plans.map(plan => {
            if (plan.planId !== planId) {
              return plan;
            }
            return {
              ...plan,
              itinerary: plan.itinerary.map(day => {
                const filtered = day.routes.filter(r => r.itemId !== itemId);
                return {
                  ...day,
                  routes: filtered.map((r, i) => ({ ...r, sequence: i + 1 })),
                };
              }),
            };
          }),
        })),
      replaceRouteInPlan: (planId, itemId, replacement) =>
        set(state => ({
          plans: state.plans.map(plan => {
            if (plan.planId !== planId) {
              return plan;
            }
            return {
              ...plan,
              itinerary: plan.itinerary.map(day => ({
                ...day,
                routes: day.routes.map(r =>
                  r.itemId === itemId
                    ? {
                        ...replacement,
                        itemId: r.itemId,
                        sequence: r.sequence,
                        isVisited: false,
                      }
                    : r,
                ),
              })),
            };
          }),
        })),
      addRouteToPlan: (planId, dayNumber, route) =>
        set(state => ({
          plans: state.plans.map(plan => {
            if (plan.planId !== planId) {
              return plan;
            }
            return {
              ...plan,
              itinerary: plan.itinerary.map(day => {
                if (day.dayNumber !== dayNumber) {
                  return day;
                }
                return {
                  ...day,
                  routes: [
                    ...day.routes,
                    {
                      ...route,
                      sequence:
                        route.sequence ??
                        (day.routes.length === 0
                          ? 1
                          : Math.max(...day.routes.map(r => r.sequence)) + 1),
                    },
                  ],
                };
              }),
            };
          }),
        })),
      reorderRoutesInPlan: (planId, dayNumber, orderedItemIds) =>
        set(state => ({
          plans: state.plans.map(plan => {
            if (plan.planId !== planId) {
              return plan;
            }
            return {
              ...plan,
              itinerary: plan.itinerary.map(day => {
                if (day.dayNumber !== dayNumber) {
                  return day;
                }
                const byId = Object.fromEntries(day.routes.map(r => [r.itemId, r]));
                const routes = orderedItemIds
                  .map((id, i) => {
                    const r = byId[id];
                    return r ? { ...r, sequence: i + 1 } : null;
                  })
                  .filter((r): r is RouteItem => r != null);
                return { ...day, routes };
              }),
            };
          }),
        })),
      updateRouteLegMode: (planId, itemId, legMode) =>
        set(state => ({
          plans: state.plans.map(plan => {
            if (plan.planId !== planId) {
              return plan;
            }
            return {
              ...plan,
              itinerary: plan.itinerary.map(day => ({
                ...day,
                routes: day.routes.map(r =>
                  r.itemId === itemId ? { ...r, legMode } : r,
                ),
              })),
            };
          }),
        })),
      updateRouteMemo: (planId, itemId, memo) =>
        set(state => ({
          plans: state.plans.map(plan => {
            if (plan.planId !== planId) {
              return plan;
            }
            return {
              ...plan,
              itinerary: plan.itinerary.map(day => ({
                ...day,
                routes: day.routes.map(r =>
                  r.itemId === itemId ? { ...r, memo } : r,
                ),
              })),
            };
          }),
        })),
      optimizeDayRoute: (planId, dayNumber) =>
        set(state => ({
          plans: state.plans.map(plan => {
            if (plan.planId !== planId) {
              return plan;
            }
            return {
              ...plan,
              itinerary: plan.itinerary.map(day => {
                if (day.dayNumber !== dayNumber) {
                  return day;
                }
                return { ...day, routes: optimizeRouteOrder(day.routes) };
              }),
            };
          }),
        })),
      addItineraryDay: (planId, dayNumber, visitDate) =>
        set(state => ({
          plans: state.plans.map(plan => {
            if (plan.planId !== planId) {
              return plan;
            }
            return {
              ...plan,
              itinerary: [
                ...plan.itinerary,
                {
                  dailyId: createId('day'),
                  dayNumber,
                  date: visitDate,
                  routes: [],
                },
              ],
            };
          }),
        })),
      removeItineraryDay: (planId, dayNumber) =>
        set(state => ({
          plans: state.plans.map(plan => {
            if (plan.planId !== planId) {
              return plan;
            }
            const filtered = plan.itinerary
              .filter(day => day.dayNumber !== dayNumber)
              .sort((a, b) => a.dayNumber - b.dayNumber)
              .map((day, index) => ({
                ...day,
                dayNumber: index + 1,
              }));
            return { ...plan, itinerary: filtered };
          }),
        })),
      addBudgetEntry: entry => {
        const full: BudgetEntry = {
          ...entry,
          entryId: entry.entryId ?? createId('exp-'),
        };
        set(state => ({
          budgetByPlan: {
            ...state.budgetByPlan,
            [entry.planId]: [...(state.budgetByPlan[entry.planId] ?? []), full],
          },
        }));
      },
      setBudgetEntries: (planId, entries) =>
        set(state => ({
          budgetByPlan: {
            ...state.budgetByPlan,
            [planId]: entries,
          },
        })),
      getBudgetForPlan: planId => get().budgetByPlan[planId] ?? EMPTY_BUDGET,
      completePlan: planId =>
        set(state => {
          // 완료 여행은 로컬(오프라인) 목록에서 제거
          const plans = state.plans.filter(p => p.planId !== planId);
          const budgetByPlan = { ...state.budgetByPlan };
          delete budgetByPlan[planId];
          const offlineSyncPlanIds = { ...(state.offlineSyncPlanIds ?? {}) };
          delete offlineSyncPlanIds[planId];
          const activePlanId =
            state.activePlanId === planId
              ? (getSelectableHomePlans(plans)[0]?.planId ?? null)
              : state.activePlanId;
          return { plans, budgetByPlan, offlineSyncPlanIds, activePlanId };
        }),
      purgeCompletedLocalPlans: () =>
        set(state => {
          const completedIds = new Set(listCompletedLocalPlanIds(state.plans));
          if (completedIds.size === 0) {
            return state;
          }
          const plans = state.plans.filter(p => !completedIds.has(p.planId));
          const budgetByPlan = { ...state.budgetByPlan };
          const offlineSyncPlanIds = { ...(state.offlineSyncPlanIds ?? {}) };
          for (const id of completedIds) {
            delete budgetByPlan[id];
            delete offlineSyncPlanIds[id];
          }
          const activePlanId =
            state.activePlanId && completedIds.has(state.activePlanId)
              ? (getSelectableHomePlans(plans)[0]?.planId ?? null)
              : state.activePlanId;
          return { plans, budgetByPlan, offlineSyncPlanIds, activePlanId };
        }),
      replacePlan: plan =>
        set(state => ({
          plans: state.plans.map(p => (p.planId === plan.planId ? plan : p)),
        })),
    }),
    {
      name: '@buting/plans',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        plans: state.plans,
        activePlanId: state.activePlanId,
        budgetByPlan: state.budgetByPlan,
        offlineSyncPlanIds: state.offlineSyncPlanIds,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn('[Bu-Ting] plans persist rehydrate error', error);
        }
        try {
          const store = usePlanStore.getState();
          store.setHasHydrated(true);
          store.purgeCompletedLocalPlans();
        } catch (cleanupError) {
          console.warn('[Bu-Ting] plans post-rehydrate cleanup failed', cleanupError);
          try {
            usePlanStore.setState({ _hasHydrated: true });
          } catch {
            // Jest 등 AsyncStorage 없는 환경
          }
        }
      },
    },
  ),
);

export function selectActivePlan(state: PlanState): TravelPlan | null {
  if (!state.activePlanId) {
    return null;
  }
  const active = state.plans.find(p => p.planId === state.activePlanId);
  if (
    !active ||
    active.status === 'COMPLETED' ||
    active.travelStatus === 'COMPLETED' ||
    !isServerBackedPlan(active) ||
    !isPlanForCurrentApiServer(active)
  ) {
    return null;
  }
  return active;
}

/** 메인 홈 히어로·일정 탭용 — 예정·진행·완료. 활성 플랜이 없으면 null. */
export function selectHomeFeaturedPlan(state: PlanState): TravelPlan | null {
  const selectable = getSelectableHomePlans(state.plans);
  if (!state.activePlanId) {
    return null;
  }
  return selectable.find(p => p.planId === state.activePlanId) ?? selectable[0] ?? null;
}

/** 홈에서 바꿀 수 있는 예정·진행·완료 서버 연동 여행 */
export function selectSelectableHomePlans(state: PlanState): TravelPlan[] {
  return getSelectableHomePlans(state.plans);
}

/** 플랜 가계부 — 없으면 공유 EMPTY (매 호출 새 [] 금지) */
export function selectBudgetForPlan(planId: string) {
  return (state: PlanState): BudgetEntry[] =>
    state.budgetByPlan?.[planId] ?? EMPTY_BUDGET;
}

/** 오프라인 열람용 — 현재 API origin · 일정 내용 우선, 활성 일정, 최근 생성 순 */
export function selectLatestLocalPlan(state: PlanState): TravelPlan | null {
  return pickLatestLocalPlan(state);
}

export function selectPlanById(planId: string) {
  return (state: PlanState) => {
    const plan = state.plans.find(p => p.planId === planId) ?? null;
    if (!plan || !isPlanForCurrentApiServer(plan)) {
      return null;
    }
    return plan;
  };
}

export function selectIsPlanOfflineSync(planId: string) {
  return (state: PlanState) => Boolean(state.offlineSyncPlanIds?.[planId]);
}

/** 기존 플랜에 placeInfo가 없을 때 런타임 보강 */
export function hydrateRoutePlaceInfo(
  route: RouteItem,
  lang: 'ko' | 'en' | 'ja' | 'zh',
): RouteItem {
  const placeInfo =
    route.placeInfo ?? enrichPlaceInfo(route.placeId, route.placeName, route.type, lang);

  if (isTourApiContentId(route.placeId)) {
    const categoryLabel =
      getCopyForLanguage('placeSearch', lang).categoryLabels[routeTypeToContentTypeId(route.type)];
    if (placeInfo.category !== categoryLabel) {
      return { ...route, placeInfo: { ...placeInfo, category: categoryLabel } };
    }
  }

  if (route.placeInfo) {
    return route;
  }
  return { ...route, placeInfo };
}

export const emptyWizardAnswers = (): PlanWizardAnswers => ({
  title: '',
  startDate: '',
  endDate: '',
  companionCount: 1,
  companionTypes: [],
  travelStyleIds: [],
  hasHeavyBaggage: false,
  hasPets: false,
  otherConstraintIds: [],
  attractionIds: [],
  selectedAttractions: [],
  foodIds: [],
  accommodationMode: 'area_only',
  accommodationPlaceId: null,
  accommodationName: null,
  bookedAccommodation: null,
  accommodationAreaIds: [],
  generationMode: 'manual',
});
