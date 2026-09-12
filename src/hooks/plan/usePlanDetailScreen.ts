import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getNavbarActionBarInset, getNavbarOverlayHeight } from '../../components/shared/navigation/Navbar';
import { type PlanDetailTab } from '../../constants/plan/planDetail';
import { useAppLanguage, useCopy } from '../../i18n';
import { useAppAlert, useFeatureUnavailableAlert } from '../../components/shared/modals';
import {
  ALPHA_FEATURE_LABELS,
  isAlphaFeatureBlocked,
} from '../../constants/common/alphaFeatureBlocks';
import { usePlanRoutePlaceDetails } from '../usePlanRoutePlaceDetails';
import { useTravelExpensesSync } from '../useTravelExpensesSync';
import { useTravelMembersSync } from '../useTravelMembersSync';
import type { RootStackParamList } from '../../navigation/types';
import { navigateToMainTab } from '../../navigation/navigateToMainTab';
import { loadPlanPlaceReviewsForTravel } from '../../services/travel/loadPlanPlaceReviewsForTravel';
import { fetchMyTravelRecords } from '../../services/travel/travelRecordService';
import {
  EMPTY_REVIEWS,
  hydrateRoutePlaceInfo,
  useAppStore,
  useAuthStore,
  usePlanStore,
  useTravelRecordStore,
} from '../../stores';
import { selectIsPlanOfflineSync } from '../../stores/usePlanStore';
import { selectReusableAccessToken } from '../../stores/useAuthStore';
import { useApiTravelPlanSync } from '../useApiTravelPlanSync';
import { useMainTabNavigationOptional } from '../../navigation/mainTabNavigation';
import { usePlanOfflineSyncFeedback } from '../usePlanOfflineSyncFeedback';
import { usePlanDetailBudget } from './usePlanDetailBudget';
import { usePlanDetailMembers } from './usePlanDetailMembers';
import { usePlanDetailReviews } from './usePlanDetailReviews';
import { usePlanDetailSchedule } from './usePlanDetailSchedule';
import { usePlanPicker } from './usePlanPicker';
import { sortedRoutes } from '../../utils/plan/planItinerary';
import {
  mergeRouteWithPlaceDetail,
  resolveRouteImageUrl,
} from '../../utils/places/routePlaceDetail';

export type UsePlanDetailScreenParams = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PlanDetail'>;
  paramPlanId?: string;
  initialTab?: PlanDetailTab;
  openReboot?: boolean;
  embeddedInMainTabs?: boolean;
};

/** PlanDetail 화면 오케스트레이터 — 도메인 훅을 조합하고 화면 공통 상태를 관리합니다. */
export function usePlanDetailScreen({
  navigation,
  paramPlanId,
  initialTab,
  openReboot,
  embeddedInMainTabs = false,
}: UsePlanDetailScreenParams) {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const offlineMode = useAppStore(s => s.offlineMode);
  const setOfflineMode = useAppStore(s => s.setOfflineMode);

  const plans = usePlanStore(s => s.plans);
  const plansHydrated = usePlanStore(s => s._hasHydrated);
  const activePlanId = usePlanStore(s => s.activePlanId);
  const completePlan = usePlanStore(s => s.completePlan);
  const displayName = useAppStore(s => s.auth.displayName) ?? 'Traveler';
  const accessToken = useAuthStore(selectReusableAccessToken);
  const authUser = useAuthStore(s => s.user);

  const plan = useMemo(() => {
    if (paramPlanId) {
      return plans.find(p => p.planId === paramPlanId) ?? null;
    }
    if (activePlanId) {
      const active = plans.find(p => p.planId === activePlanId);
      if (active && active.status !== 'COMPLETED') {
        return active;
      }
    }
    return plans.find(p => p.status === 'DRAFT' || p.status === 'CONFIRMED') ?? null;
  }, [paramPlanId, plans, activePlanId]);

  const planId = plan?.planId ?? '';
  const isApiPlan = plan?.source === 'api';
  const isPlanOfflineSync = usePlanStore(selectIsPlanOfflineSync(planId));
  const scheduleReadOnly = isApiPlan && isPlanOfflineSync;
  const viewOnly = scheduleReadOnly || offlineMode;
  const travelId = plan?.apiTravelId ?? plan?.planId;

  const copy = useCopy('planDetail');
  const pickerCopy = useCopy('mainHome');
  const setupCopy = useCopy('setup');
  const { alert } = useAppAlert();
  const { showUnavailable } = useFeatureUnavailableAlert();
  const { toastText, toastOpacity, showToast } = usePlanOfflineSyncFeedback({
    planId,
    enabled: isApiPlan,
    message: copy.offlineSyncNotice,
  });

  const notifyScheduleReadOnly = useCallback(() => {
    showToast(copy.offlineSyncNotice);
  }, [showToast, copy.offlineSyncNotice]);

  const mainTabs = useMainTabNavigationOptional();
  const syncEnabled =
    isApiPlan &&
    !offlineMode &&
    (!embeddedInMainTabs || mainTabs?.activeTab === 'route');

  const { syncFromServer } = useApiTravelPlanSync({
    planId,
    enabled: syncEnabled,
    accessToken,
  });
  const { syncMembers } = useTravelMembersSync({
    planId,
    travelId,
    accessToken,
    enabled: syncEnabled,
  });
  const {
    syncExpenses,
    refreshSettlementPreview,
    settlement,
    summary,
    settlementLoading,
    settlementError,
    confirming,
    confirmSettlement,
  } = useTravelExpensesSync({
    planId,
    travelId,
    accessToken,
    enabled: isApiPlan && !offlineMode,
  });

  const planReviews =
    useTravelRecordStore(s =>
      travelId ? s.reviewsByTravelId[travelId] : undefined,
    ) ?? EMPTY_REVIEWS;
  const [isPlanPublished, setIsPlanPublished] = useState(false);
  const [tab, setTab] = useState<PlanDetailTab>(initialTab ?? 'overview');

  const planPlaceIdsKey = useMemo(() => {
    if (!plan) {
      return '';
    }
    return plan.itinerary
      .flatMap(day => day.routes)
      .map(r => r.apiPlanPlaceId)
      .filter(Boolean)
      .join(',');
  }, [plan]);

  useEffect(() => {
    if (!planId || !accessToken || !isApiPlan || !travelId) {
      setIsPlanPublished(false);
      return;
    }
    let cancelled = false;
    void fetchMyTravelRecords(accessToken)
      .then(list => {
        if (cancelled) {
          return;
        }
        const match = list.find(
          item =>
            item.travelId === travelId &&
            (item.status === 'PUBLISHED' || item.status === 'HIDDEN'),
        );
        setIsPlanPublished(Boolean(match));
      })
      .catch(() => {
        if (!cancelled) {
          setIsPlanPublished(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [planId, accessToken, isApiPlan, travelId]);

  useEffect(() => {
    if (!planId || !accessToken || !isApiPlan) {
      return;
    }
    const current = usePlanStore.getState().plans.find(p => p.planId === planId);
    if (!current) {
      return;
    }
    void loadPlanPlaceReviewsForTravel({ accessToken, plan: current });
  }, [planId, accessToken, isApiPlan, planPlaceIdsKey]);

  const {
    pickerPlans,
    canSwitchPlans,
    planPickerOpen,
    openPlanPicker,
    closePlanPicker,
    selectPlan: applySelectedPlan,
  } = usePlanPicker(plan);

  const selectPlan = useCallback(
    (nextPlanId: string) => {
      applySelectedPlan(nextPlanId);
      if (!embeddedInMainTabs) {
        navigation.setParams({ planId: nextPlanId });
      }
    },
    [applySelectedPlan, embeddedInMainTabs, navigation],
  );

  const createNewPlan = useCallback(() => {
    if (offlineMode) {
      return;
    }
    closePlanPicker();
    navigation.navigate('PlanWizard');
  }, [closePlanPicker, navigation, offlineMode]);

  const members = usePlanDetailMembers({
    navigation,
    plan,
    planId,
    travelId,
    accessToken,
    authUserId: authUser?.userId,
    isApiPlan,
    offlineMode,
    syncMembers,
  });

  const budget = usePlanDetailBudget({
    plan,
    planId,
    travelId,
    accessToken,
    isApiPlan,
    viewOnly,
    scheduleReadOnly,
    canInvite: members.canInvite,
    notifyScheduleReadOnly,
    settlement,
    summary,
    confirmSettlement,
    refreshSettlementPreview,
    syncExpenses,
  });

  const rawAllRoutes = useMemo(
    () => plan?.itinerary.flatMap(day => sortedRoutes(day.routes)) ?? [],
    [plan],
  );
  const detailsByPlaceId = usePlanRoutePlaceDetails(rawAllRoutes, tab === 'schedule');

  const enrichedPlan = useMemo(() => {
    if (!plan) {
      return null;
    }
    return {
      ...plan,
      itinerary: plan.itinerary.map(day => ({
        ...day,
        routes: sortedRoutes(day.routes).map(route => {
          const withCatalog = hydrateRoutePlaceInfo(route, language);
          const detail = detailsByPlaceId[route.placeId] ?? null;
          const merged = mergeRouteWithPlaceDetail(withCatalog, detail, language);
          const imageUrl = resolveRouteImageUrl(merged, detail);
          if (!imageUrl || merged.placeInfo?.imageUrl) {
            return merged;
          }
          return {
            ...merged,
            placeInfo: { ...merged.placeInfo!, imageUrl },
          };
        }),
      })),
    };
  }, [plan, language, detailsByPlaceId]);

  const tripDates = useMemo(
    () => enrichedPlan?.itinerary.map(day => day.date) ?? [],
    [enrichedPlan],
  );

  const allRoutes = useMemo(
    () => enrichedPlan?.itinerary.flatMap(d => d.routes) ?? [],
    [enrichedPlan],
  );

  const schedule = usePlanDetailSchedule({
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
  });

  const reviews = usePlanDetailReviews({
    navigation,
    plan,
    planId,
    accessToken,
    isApiPlan,
    viewOnly,
    scheduleReadOnly,
    displayName,
    allRoutes,
    planReviews,
    notifyScheduleReadOnly,
  });

  const viewedPlanIdRef = useRef(planId);
  useEffect(() => {
    if (viewedPlanIdRef.current === planId) {
      return;
    }
    viewedPlanIdRef.current = planId;
    schedule.resetScheduleUiOnPlanChange();
    reviews.resetReviewUiOnPlanChange();
    budget.resetBudgetUiOnPlanChange();
    members.resetMemberUiOnPlanChange();
  }, [
    planId,
    schedule.resetScheduleUiOnPlanChange,
    reviews.resetReviewUiOnPlanChange,
    budget.resetBudgetUiOnPlanChange,
    members.resetMemberUiOnPlanChange,
  ]);

  const openRebootPendingRef = useRef(openReboot === true);

  useEffect(() => {
    openRebootPendingRef.current = openReboot === true;
  }, [openReboot]);

  useEffect(() => {
    if (offlineMode || !openRebootPendingRef.current || !enrichedPlan) {
      return;
    }

    openRebootPendingRef.current = false;
    navigation.setParams({ openReboot: undefined });

    if (isAlphaFeatureBlocked('reboot')) {
      showUnavailable(ALPHA_FEATURE_LABELS.reboot);
      return;
    }

    setTab('schedule');

    const timer = setTimeout(() => {
      schedule.scheduleRef.current?.handleRebootFabPress();
    }, 400);

    return () => clearTimeout(timer);
  }, [enrichedPlan, navigation, offlineMode, schedule.scheduleRef, showUnavailable]);

  const exitOffline = useCallback(() => {
    setOfflineMode(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  }, [navigation, setOfflineMode]);

  const offlineExitNotifiedRef = useRef(false);

  useEffect(() => {
    if (enrichedPlan) {
      offlineExitNotifiedRef.current = false;
      return;
    }

    if (offlineMode) {
      if (!plansHydrated) {
        return;
      }
      if (offlineExitNotifiedRef.current) {
        return;
      }
      offlineExitNotifiedRef.current = true;
      alert({
        title: setupCopy.offlineMode,
        message: setupCopy.offlineModeEmpty,
      });
      exitOffline();
      return;
    }

    navigation.replace('PlanWizard');
  }, [
    alert,
    enrichedPlan,
    exitOffline,
    navigation,
    offlineMode,
    plansHydrated,
    setupCopy.offlineMode,
    setupCopy.offlineModeEmpty,
  ]);

  const roleLabels = {
    LEADER: copy.roleLeader,
    MEMBER: copy.roleMember,
  };

  const transportCopy = {
    transportModeTitle: copy.transportModeTitle,
    legWalk: copy.legWalk,
    legDrive: copy.legDrive,
    legTransit: copy.legTransit,
  };

  const scheduleImmersive = embeddedInMainTabs && tab === 'schedule';
  const mainTabBottomClearance = embeddedInMainTabs
    ? getNavbarOverlayHeight(insets.bottom)
    : 0;
  const fabBottomInset = embeddedInMainTabs
    ? mainTabBottomClearance
    : insets.bottom;
  const actionBarBottomInset = scheduleImmersive
    ? Math.max(insets.bottom, 8)
    : embeddedInMainTabs
      ? getNavbarActionBarInset(insets.bottom)
      : insets.bottom;
  const toastBottom = fabBottomInset + 16;

  const handleBackPress = useCallback(() => {
    if (offlineMode) {
      exitOffline();
    } else {
      navigateToMainTab(navigation, 'home');
    }
  }, [offlineMode, exitOffline, navigation]);

  const handlePublished = useCallback(() => {
    setIsPlanPublished(true);
    if (planId) {
      completePlan(planId);
    }
    navigateToMainTab(navigation, 'home');
  }, [planId, completePlan, navigation]);

  const handleViewFeed = useCallback(() => {
    if (isAlphaFeatureBlocked('feed')) {
      showUnavailable(ALPHA_FEATURE_LABELS.feed);
      return;
    }
    navigateToMainTab(navigation, 'feed');
  }, [navigation, showUnavailable]);

  const handleViewTravelRecord = useCallback(
    (travelRecordId: string) => {
      if (isAlphaFeatureBlocked('travelogue')) {
        showUnavailable(ALPHA_FEATURE_LABELS.travelogue);
        return;
      }
      navigation.navigate('TravelRecordDetail', { travelRecordId });
    },
    [navigation, showUnavailable],
  );

  return {
    language,
    offlineMode,
    plansHydrated,
    copy,
    pickerCopy,
    setupCopy,
    reviewCopy: reviews.reviewCopy,
    enrichedPlan,
    planId,
    isApiPlan,
    isPlanOfflineSync,
    viewOnly,
    scheduleReadOnly,
    tab,
    setTab,
    toastText,
    toastOpacity,
    showToast,
    notifyScheduleReadOnly,
    selectedDay: schedule.selectedDay,
    setSelectedDay: schedule.setSelectedDay,
    scheduleReorderActive: schedule.scheduleReorderActive,
    setScheduleReorderActive: schedule.setScheduleReorderActive,
    reviewFormRoute: reviews.reviewFormRoute,
    setReviewFormRoute: reviews.setReviewFormRoute,
    savingReview: reviews.savingReview,
    budgetModalOpen: budget.budgetModalOpen,
    setBudgetModalOpen: budget.setBudgetModalOpen,
    inviteModalOpen: members.inviteModalOpen,
    inviteLink: members.inviteLink,
    inviteExpiredAt: members.inviteExpiredAt,
    inviteLoading: members.inviteLoading,
    inviteError: members.inviteError,
    canInvite: members.canInvite,
    canLeaveTrip: members.canLeaveTrip,
    leavingTrip: members.leavingTrip,
    selectedMember: members.selectedMember,
    memberActionBusy: members.memberActionBusy,
    memberActionError: members.memberActionError,
    canTransferSelected: members.canTransferSelected,
    canKickSelected: members.canKickSelected,
    settlementConfirmed: budget.settlementConfirmed,
    canConfirmSettlement: budget.canConfirmSettlement,
    settlementMemberSummaries: budget.settlementMemberSummaries,
    settlementForDisplay: budget.settlementForDisplay,
    settlementLoading,
    settlementError,
    confirming,
    budgetEntries: budget.budgetEntries,
    budgetTotal: budget.budgetTotal,
    tripDates,
    allRoutes,
    recordsProgress: reviews.recordsProgress,
    isPlanPublished,
    roleLabels,
    day: schedule.day,
    transportCopy,
    mainTabBottomClearance,
    actionBarBottomInset,
    toastBottom,
    scheduleRef: schedule.scheduleRef,
    planReviews,
    displayName,
    scheduleModal: schedule.scheduleModal,
    pickRoute: schedule.pickRoute,
    schedulePlaceIds: schedule.schedulePlaceIds,
    addPlaceAnchor: schedule.addPlaceAnchor,
    reviewFormExisting: reviews.reviewFormExisting,
    handleBackPress,
    handleInvite: members.handleInvite,
    openMemberActions: members.openMemberActions,
    closeMemberActions: members.closeMemberActions,
    requestTransferLeader: members.requestTransferLeader,
    requestKickMember: members.requestKickMember,
    requestLeaveTrip: members.requestLeaveTrip,
    handleSaveBudgetEntry: budget.handleSaveBudgetEntry,
    handleConfirmSettlement: budget.handleConfirmSettlement,
    closeInviteModal: members.closeInviteModal,
    loadInviteLink: members.loadInviteLink,
    handleDeleteRoute: schedule.handleDeleteRoute,
    handleAddDay: schedule.handleAddDay,
    handleRemoveDay: schedule.handleRemoveDay,
    handleToggleVisited: schedule.handleToggleVisited,
    handleSaveRouteMemo: schedule.handleSaveRouteMemo,
    handlePickReplacement: schedule.handlePickReplacement,
    handleReorderRoutes: schedule.handleReorderRoutes,
    handleOptimizeDayRoute: schedule.handleOptimizeDayRoute,
    handleAddPlace: schedule.handleAddPlace,
    handleQuickRating: reviews.handleQuickRating,
    handleSavePlaceReview: reviews.handleSavePlaceReview,
    handleDeletePlaceReview: reviews.handleDeletePlaceReview,
    closeScheduleModal: schedule.closeScheduleModal,
    requestCompletePlan: reviews.requestCompletePlan,
    syncExpenses,
    handlePublished,
    handleViewFeed,
    handleViewTravelRecord,
    handleWriteReview: reviews.handleWriteReview,
    handleScheduleModalChange: schedule.handleScheduleModalChange,
    pickerPlans,
    canSwitchPlans,
    planPickerOpen,
    openPlanPicker,
    closePlanPicker,
    selectPlan,
    createNewPlan,
  };
}
