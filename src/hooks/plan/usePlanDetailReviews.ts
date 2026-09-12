import { useCallback, useMemo, useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppAlert } from '../../components/shared/modals';
import { useCopy } from '../../i18n';
import { navigateToMainTab } from '../../navigation/navigateToMainTab';
import type { RootStackParamList } from '../../navigation/types';
import { deletePlaceReviewForTravel } from '../../services/travel/deletePlaceReviewForTravel';
import {
  PlaceReviewSyncError,
  savePlaceReviewForTravel,
} from '../../services/travel/savePlaceReviewForTravel';
import { updateTravelStatus } from '../../services/travel/travelService';
import { usePlanStore } from '../../stores';
import type { RouteItem, TravelPlan } from '../../types/travelPlan';
import type { PlaceReview } from '../../types/travelReview';
import { getReviewForPlace, reviewProgress } from '../../utils/review/travelReview';

type UsePlanDetailReviewsParams = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PlanDetail'>;
  plan: TravelPlan | null;
  planId: string;
  accessToken: string | null | undefined;
  isApiPlan: boolean;
  viewOnly: boolean;
  scheduleReadOnly: boolean;
  displayName: string;
  allRoutes: RouteItem[];
  planReviews: PlaceReview[];
  notifyScheduleReadOnly: () => void;
};

/** 장소 후기 · 여행 완료 */
export function usePlanDetailReviews({
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
}: UsePlanDetailReviewsParams) {
  const reviewCopy = useCopy('travelReview');
  const { alert } = useAppAlert();
  const completePlan = usePlanStore(s => s.completePlan);

  const [reviewFormRoute, setReviewFormRoute] = useState<RouteItem | null>(null);
  const [savingReview, setSavingReview] = useState(false);

  const recordsProgress = useMemo(
    () => reviewProgress(allRoutes, planReviews),
    [allRoutes, planReviews],
  );

  const reviewFormExisting = reviewFormRoute
    ? getReviewForPlace(
        planReviews,
        reviewFormRoute.apiPlanPlaceId ?? reviewFormRoute.itemId,
      )
    : undefined;

  const handleCompletePlan = useCallback(async () => {
    if (!planId) {
      return;
    }

    if (isApiPlan && accessToken && plan) {
      try {
        await updateTravelStatus(accessToken, plan.apiTravelId ?? plan.planId, {
          status: 'COMPLETED',
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '여행 완료 처리에 실패했습니다.';
        alert({ title: '여행 완료 실패', message });
        return;
      }
    }

    completePlan(planId);
    navigateToMainTab(navigation, 'home');
  }, [accessToken, alert, completePlan, isApiPlan, navigation, plan, planId]);

  const requestCompletePlan = useCallback(() => {
    alert({
      title: reviewCopy.completeTripConfirmTitle,
      message: reviewCopy.completeTripConfirmMessage,
      buttons: [
        { label: reviewCopy.cancel, variant: 'secondary', onPress: () => {} },
        {
          label: reviewCopy.completeTripConfirm,
          variant: 'primary',
          onPress: () => {
            void handleCompletePlan();
          },
        },
      ],
    });
  }, [alert, handleCompletePlan, reviewCopy]);

  const handleQuickRating = useCallback(
    (routeItem: RouteItem, rating: number) => {
      if (viewOnly || !plan) {
        if (scheduleReadOnly) {
          notifyScheduleReadOnly();
        }
        return;
      }
      void savePlaceReviewForTravel({
        accessToken,
        plan,
        route: routeItem,
        authorNickname: displayName,
        payload: {
          rating,
          tags: [],
          content: null,
          media: [],
        },
      });
    },
    [
      accessToken,
      displayName,
      notifyScheduleReadOnly,
      plan,
      scheduleReadOnly,
      viewOnly,
    ],
  );

  const handleSavePlaceReview = useCallback(
    async (
      payload: Omit<PlaceReview, 'placeReviewId' | 'createdAt' | 'updatedAt'> & {
        placeReviewId?: string;
      },
    ) => {
      if (viewOnly || !plan || !reviewFormRoute) {
        if (scheduleReadOnly) {
          notifyScheduleReadOnly();
        }
        return;
      }
      setSavingReview(true);
      try {
        await savePlaceReviewForTravel({
          accessToken,
          plan,
          route: reviewFormRoute,
          authorNickname: displayName,
          payload: {
            placeReviewId: payload.placeReviewId,
            rating: payload.rating,
            content: payload.content,
            tags: payload.tags,
            media: payload.media,
          },
        });
      } catch (error) {
        alert({
          title:
            error instanceof PlaceReviewSyncError
              ? error.message
              : error instanceof Error
                ? error.message
                : '후기 저장에 실패했습니다.',
        });
        throw error;
      } finally {
        setSavingReview(false);
      }
    },
    [
      accessToken,
      alert,
      displayName,
      notifyScheduleReadOnly,
      plan,
      reviewFormRoute,
      scheduleReadOnly,
      viewOnly,
    ],
  );

  const handleDeletePlaceReview = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (viewOnly || !plan || !reviewFormRoute) {
        if (scheduleReadOnly) {
          notifyScheduleReadOnly();
        }
        reject(new Error('no route'));
        return;
      }
      const existing = getReviewForPlace(
        planReviews,
        reviewFormRoute.apiPlanPlaceId ?? reviewFormRoute.itemId,
      );
      alert({
        title: reviewCopy.deleteReviewConfirmTitle,
        message: reviewCopy.deleteReviewConfirmMessage,
        buttons: [
          {
            label: reviewCopy.cancel,
            variant: 'secondary',
            onPress: () => reject(new Error('cancelled')),
          },
          {
            label: reviewCopy.deleteReviewConfirm,
            variant: 'danger',
            onPress: () => {
              void (async () => {
                setSavingReview(true);
                try {
                  await deletePlaceReviewForTravel({
                    accessToken,
                    plan,
                    route: reviewFormRoute,
                    placeReviewId: existing?.placeReviewId,
                  });
                  resolve();
                } catch (error) {
                  alert({
                    title:
                      error instanceof PlaceReviewSyncError
                        ? error.message
                        : error instanceof Error
                          ? error.message
                          : 'Failed to delete review.',
                  });
                  reject(error);
                } finally {
                  setSavingReview(false);
                }
              })();
            },
          },
        ],
      });
    });
  }, [
    accessToken,
    alert,
    notifyScheduleReadOnly,
    plan,
    planReviews,
    reviewCopy,
    reviewFormRoute,
    scheduleReadOnly,
    viewOnly,
  ]);

  const handleWriteReview = useCallback(
    (routeItem: RouteItem) => {
      if (viewOnly) {
        if (scheduleReadOnly) {
          notifyScheduleReadOnly();
        }
        return;
      }
      setReviewFormRoute(routeItem);
    },
    [notifyScheduleReadOnly, scheduleReadOnly, viewOnly],
  );

  const resetReviewUiOnPlanChange = useCallback(() => {
    setReviewFormRoute(null);
  }, []);

  return {
    reviewCopy,
    reviewFormRoute,
    setReviewFormRoute,
    savingReview,
    recordsProgress,
    reviewFormExisting,
    handleQuickRating,
    handleSavePlaceReview,
    handleDeletePlaceReview,
    handleWriteReview,
    requestCompletePlan,
    resetReviewUiOnPlanChange,
  };
}
