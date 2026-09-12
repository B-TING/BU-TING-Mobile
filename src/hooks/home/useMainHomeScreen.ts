import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NavigationProp } from '@react-navigation/native';
import type { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GUIDE_TARGET } from '../../components/guide/guideTypes';
import { FAB_GAP, FAB_SIZE } from '../../components/helpdesk/HomeActionFabs';
import { getNavbarOverlayHeight } from '../../components/shared/navigation/Navbar';
import { useAppAlert, useFeatureUnavailableAlert } from '../../components/shared/modals';
import { ROUTE_FAB_BOTTOM_OFFSET } from '../../components/plan/fab/RouteOptimizeFab';
import {
  ALPHA_FEATURE_LABELS,
  isAlphaFeatureBlocked,
} from '../../constants/common/alphaFeatureBlocks';
import { festivalToHomeEvent } from '../../constants/festival/festivalCalendar';
import { getChatRoomByZoneId } from '../../constants/eventZone/eventZone';
import { useMainTabNavigation } from '../../navigation/mainTabNavigation';
import { openItineraryOrWizard } from '../../navigation/navigateToMainTab';
import type { RootStackParamList } from '../../navigation/types';
import { showTravelSurveyOnboardingPrompt } from '../../services/setup/travelSurveyOnboardingPrompt';
import { fetchTravelRecordFeed } from '../../services/travel/travelRecordService';
import { PLACE_CONTENT_TYPE } from '../../types/placesApi';
import { mapTravelRecordFeedItem } from '../../types/travelRecordApi';
import type { EventZoneId } from '../../types/eventZone';
import type { TravelRecord } from '../../types/travelReview';
import {
  selectActivePlan,
  selectHomeFeaturedPlan,
  useAppStore,
  useAuthStore,
  useFestivalStore,
  usePlanStore,
} from '../../stores';
import { isServerBackedPlan } from '../../utils/plan/serverBackedPlan';
import { getNearestUpcomingStop } from '../../utils/plan/planSchedule';
import { resolvePlanTravelStatus } from '../../utils/plan/planTravelStatus';
import { isTravelRecordPublic } from '../../utils/review/travelReview';
import { usePlanPicker } from '../plan/usePlanPicker';
import { useLocationCache } from '../location/useLocationCache';
import { selectReusableAccessToken } from '../../stores/useAuthStore';
import { useSessionActiveTravelsSyncOnFocus } from '../useSessionActiveTravelsSync';
import { usePlanOfflineSyncFeedback } from '../usePlanOfflineSyncFeedback';
import { useAppLanguage, useCopy } from '../../i18n';
import { upcomingFestivalDateRangeYyyymmdd } from '../../utils/places/festivalApiMapper';

type UseMainHomeScreenParams = {
  navigation: NavigationProp<RootStackParamList>;
  suppressNavbarClearance?: boolean;
  forceShowRebootFab?: boolean;
  guideScrollTargetId?: string | null;
};

export function useMainHomeScreen({
  navigation,
  suppressNavbarClearance = false,
  forceShowRebootFab = false,
  guideScrollTargetId = null,
}: UseMainHomeScreenParams) {
  useLocationCache();
  const insets = useSafeAreaInsets();
  const { goToTab, activeTab } = useMainTabNavigation();
  const { alert } = useAppAlert();
  const { showUnavailable } = useFeatureUnavailableAlert();
  const scrollRef = useRef<ScrollView>(null);
  const travelogueOffsetY = useRef(0);
  const language = useAppLanguage();
  const copy = useCopy('mainHome');
  const planDetailCopy = useCopy('planDetail');
  const helpCopy = useCopy('helpdesk');
  const pendingTravelSurveyPrompt = useAppStore(s => s.pendingTravelSurveyPrompt);
  const setPendingTravelSurveyPrompt = useAppStore(
    s => s.setPendingTravelSurveyPrompt,
  );
  const accessToken = useAuthStore(selectReusableAccessToken);
  const activePlan = usePlanStore(selectActivePlan);
  const featuredPlan = usePlanStore(selectHomeFeaturedPlan);
  const {
    pickerPlans,
    canSwitchPlans,
    planPickerOpen,
    openPlanPicker,
    closePlanPicker,
    selectPlan: selectHomePlan,
    activePlanCount,
  } = usePlanPicker();
  const featuredTravelStatus = useMemo(
    () => (featuredPlan ? resolvePlanTravelStatus(featuredPlan) : null),
    [featuredPlan],
  );
  const showTripRebootFab =
    forceShowRebootFab || featuredTravelStatus === 'IN_PROGRESS';
  const showSyncStatus = Boolean(featuredPlan && isServerBackedPlan(featuredPlan));
  const { toastText, toastOpacity } =
    usePlanOfflineSyncFeedback({
      planId: featuredPlan?.planId ?? '',
      enabled: showSyncStatus,
      message: planDetailCopy.offlineSyncNotice,
    });
  useSessionActiveTravelsSyncOnFocus(activeTab === 'home');

  const [latestTravelogue, setLatestTravelogue] = useState<TravelRecord | null>(null);
  const [loadingTravelogue, setLoadingTravelogue] = useState(true);
  const homeFestivals = useFestivalStore(s => s.homeFestivals);
  const fetchHomeFestivals = useFestivalStore(s => s.fetchHomeFestivals);
  const homeEvents = useMemo(
    () => homeFestivals.map(festivalToHomeEvent),
    [homeFestivals],
  );

  useEffect(() => {
    void fetchHomeFestivals(
      language === 'ko' ? '행사 정보를 불러오지 못했어요' : 'Could not load events',
    );
  }, [fetchHomeFestivals, language]);

  useEffect(() => {
    let cancelled = false;
    setLoadingTravelogue(true);
    void fetchTravelRecordFeed({ size: 1, sort: 'LATEST' }, accessToken)
      .then(page => {
        if (cancelled) {
          return;
        }
        const first = (page.items ?? [])
          .map(mapTravelRecordFeedItem)
          .find(isTravelRecordPublic);
        setLatestTravelogue(first ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setLatestTravelogue(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingTravelogue(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!pendingTravelSurveyPrompt) {
      return;
    }
    setPendingTravelSurveyPrompt(false);
    showTravelSurveyOnboardingPrompt(alert, navigation, language);
  }, [
    alert,
    language,
    navigation,
    pendingTravelSurveyPrompt,
    setPendingTravelSurveyPrompt,
  ]);

  useEffect(() => {
    let cancelled = false;

    const scrollHome = (y: number, animated: boolean) => {
      scrollRef.current?.scrollTo({ y, animated });
    };

    if (guideScrollTargetId !== GUIDE_TARGET.traveloguePreview) {
      scrollHome(0, true);
      return;
    }

    const tryScrollToTravelogue = (attempt: number) => {
      if (cancelled) {
        return;
      }
      const y = travelogueOffsetY.current;
      if (y > 0 || attempt >= 10) {
        scrollHome(Math.max(0, y - 72), true);
        return;
      }
      setTimeout(() => tryScrollToTravelogue(attempt + 1), 40);
    };

    tryScrollToTravelogue(0);
    return () => {
      cancelled = true;
    };
  }, [guideScrollTargetId]);

  const upcomingStop = useMemo(
    () =>
      featuredPlan && featuredTravelStatus === 'IN_PROGRESS'
        ? getNearestUpcomingStop(featuredPlan)
        : null,
    [featuredPlan, featuredTravelStatus],
  );

  const goToPlan = useCallback(() => {
    openItineraryOrWizard(navigation);
  }, [navigation]);

  const goToCreatePlan = useCallback(() => {
    closePlanPicker();
    navigation.navigate('PlanWizard');
  }, [closePlanPicker, navigation]);

  const goToReboot = useCallback(() => {
    if (isAlphaFeatureBlocked('reboot')) {
      showUnavailable(ALPHA_FEATURE_LABELS.reboot);
      return;
    }
    if (!activePlan) {
      return;
    }
    navigation.navigate('PlanDetail', {
      planId: activePlan.planId,
      tab: 'schedule',
      openReboot: true,
    });
  }, [activePlan, navigation, showUnavailable]);

  const goToHelpDesk = useCallback(() => {
    if (isAlphaFeatureBlocked('helpdesk')) {
      showUnavailable(ALPHA_FEATURE_LABELS.helpdesk);
      return;
    }
    navigation.navigate('HelpDeskChat');
  }, [navigation, showUnavailable]);

  const goToEventZone = useCallback(() => {
    navigation.navigate('EventZone');
  }, [navigation]);

  const goToEventZoneChat = useCallback(
    (zoneId: EventZoneId) => {
      const room = getChatRoomByZoneId(zoneId);
      if (room) {
        navigation.navigate('EventZoneChat', { roomId: room.id });
      }
    },
    [navigation],
  );

  const handleQuickAccessPress = useCallback(
    (id: string) => {
      if (id === 'festivals') {
        navigation.navigate('FestivalCalendar');
      }
      if (id === 'luggage') {
        navigation.navigate('LuggageStorage');
      }
      if (id === 'hotels') {
        navigation.navigate('PlaceMapSearch', {
          contentTypeId: PLACE_CONTENT_TYPE.accommodation,
        });
      }
      if (id === 'attractions') {
        navigation.navigate('PlaceMapSearch', {
          contentTypeId: PLACE_CONTENT_TYPE.attraction,
        });
      }
      if (id === 'restaurants') {
        navigation.navigate('PlaceMapSearch', {
          contentTypeId: PLACE_CONTENT_TYPE.restaurant,
        });
      }
      if (id === 'help') {
        goToHelpDesk();
      }
    },
    [goToHelpDesk, navigation],
  );

  const handleEventsViewAllPress = useCallback(() => {
    navigation.navigate('FestivalCalendar');
  }, [navigation]);

  const handleEventPress = useCallback(
    (id: string) => {
      const { eventStartDate, eventEndDate } = upcomingFestivalDateRangeYyyymmdd();
      navigation.navigate('PlaceMapSearch', {
        contentTypeId: PLACE_CONTENT_TYPE.festival,
        selectedContentId: id,
        festivalEventStartDate: eventStartDate,
        festivalEventEndDate: eventEndDate,
      });
    },
    [navigation],
  );

  const handleTravelogueLayout = useCallback((y: number) => {
    travelogueOffsetY.current = y;
  }, []);

  const handleTraveloguePress = useCallback(() => {
    if (isAlphaFeatureBlocked('travelogue') || isAlphaFeatureBlocked('feed')) {
      showUnavailable(ALPHA_FEATURE_LABELS.travelogue);
      return;
    }
    if (latestTravelogue) {
      navigation.navigate('TravelRecordDetail', {
        travelRecordId: latestTravelogue.travelRecordId,
      });
    } else {
      goToTab('feed');
    }
  }, [goToTab, latestTravelogue, navigation, showUnavailable]);

  const handleFeedPress = useCallback(() => {
    if (isAlphaFeatureBlocked('feed')) {
      showUnavailable(ALPHA_FEATURE_LABELS.feed);
      return;
    }
    goToTab('feed');
  }, [goToTab, showUnavailable]);

  const navbarClearance = suppressNavbarClearance
    ? Math.max(insets.bottom, 8)
    : getNavbarOverlayHeight(insets.bottom);
  const fabBottom = navbarClearance + ROUTE_FAB_BOTTOM_OFFSET;
  const guideTraveloguePad =
    guideScrollTargetId === GUIDE_TARGET.traveloguePreview ? 140 : 0;
  const scrollPaddingBottom =
    fabBottom +
    FAB_SIZE +
    (showTripRebootFab ? FAB_GAP + FAB_SIZE : 0) +
    16 +
    guideTraveloguePad;

  const activePlanHeroCopy = useMemo(
    () => ({
      plannedLabel: copy.plannedLabel,
      inProgressLabel: copy.inProgressLabel,
      completedLabel: copy.completedLabel,
      nextStop: copy.nextStop,
      viewItinerary: copy.viewItinerary,
      viewCompletedItinerary: copy.viewCompletedItinerary,
      completedTripHint: copy.completedTripHint,
      dday: copy.dday,
      ddayToday: copy.ddayToday,
      dayLabel: copy.dayLabel,
      switchPlanCount: copy.switchPlanCount,
      switchPlanA11y: copy.switchPlanA11y,
      createNewPlan: copy.createNewPlan,
      createNewPlanChip: copy.createNewPlanChip,
      createNewPlanA11y: copy.createNewPlanA11y,
    }),
    [copy],
  );

  return {
    scrollRef,
    language,
    copy,
    helpCopy,
    featuredPlan,
    featuredTravelStatus,
    pickerPlans,
    activePlanCount,
    canSwitchPlans,
    planPickerOpen,
    showTripRebootFab,
    toastText,
    toastOpacity,
    latestTravelogue,
    loadingTravelogue,
    homeEvents,
    upcomingStop,
    fabBottom,
    scrollPaddingBottom,
    activePlanHeroCopy,
    goToPlan,
    openPlanPicker,
    closePlanPicker,
    selectHomePlan,
    goToCreatePlan,
    goToReboot,
    goToHelpDesk,
    goToEventZone,
    goToEventZoneChat,
    handleQuickAccessPress,
    handleEventsViewAllPress,
    handleEventPress,
    handleTravelogueLayout,
    handleTraveloguePress,
    handleFeedPress,
  };
}
