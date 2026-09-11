import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  TravelogueSocialError,
  useTravelogueSocialActions,
} from '../../components/feed/useTravelogueSocialActions';
import { useAppAlert } from '../../components/shared/modals';
import { EVENT_ZONE_BY_ID } from '../../constants/eventZone/eventZone';
import type { CopyFor } from '../../i18n';
import { useAppLanguage, useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { deletePlaceReviewForTravel } from '../../services/travel/deletePlaceReviewForTravel';
import { loadTravelRecordDetail } from '../../services/travel/loadTravelRecordDetail';
import {
  PlaceReviewSyncError,
  savePlaceReviewForTravel,
} from '../../services/travel/savePlaceReviewForTravel';
import { updateTravelRecordForTravel } from '../../services/travel/updateTravelRecordForTravel';
import { useAuthStore, usePlanStore } from '../../stores';
import { selectReusableAccessToken } from '../../stores/useAuthStore';
import type {
  PlaceReview,
  TravelRecord,
  TravelRecordComment,
  TravelRecordPlace,
} from '../../types/travelReview';
import type { DailyItinerary, RouteItem, TravelPlan } from '../../types/travelPlan';
import { resolveEventZoneForRoute } from '../../utils/eventZone/zoneResolver';
import { computeTripTotalMinutes, formatDurationMinutes } from '../../utils/geo/tripDuration';
import {
  collectTravelRecordMedia,
  getReviewForTravelRecordPlace,
  snapshotToRouteItems,
  travelRecordDestinationLabel,
  travelRecordOverallRating,
} from '../../utils/review/travelReview';

type Copy = CopyFor<'travelReview'>;
type TravelRecordDetailNavigation = NativeStackNavigationProp<
  RootStackParamList,
  'TravelRecordDetail'
>;

export type { Copy };

export const TRAVELOGUE_MAP_HEIGHT = 200;

function sortTravelRecordPlaces(places: TravelRecordPlace[]): TravelRecordPlace[] {
  return [...places].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
}

export function zoneBaseColorForRoute(route: RouteItem): string {
  return EVENT_ZONE_BY_ID[resolveEventZoneForRoute(route)].baseColor;
}

/**
 * 방문 여부는 여행기 API의 `visited`만 사용 (로컬 일정 스냅샷 병합 금지).
 */
export function isTravelRecordPlaceVisited(place: TravelRecordPlace): boolean {
  return place.visited === true;
}

function buildApiPlanShell(travelRecord: TravelRecord): TravelPlan | null {
  const travelId = travelRecord.travelId;
  if (!travelId) {
    return null;
  }
  const start =
    travelRecord.travelStartDate ?? new Date().toISOString().slice(0, 10);
  const end = travelRecord.travelEndDate ?? start;
  return {
    planId: travelId,
    apiTravelId: travelId,
    title: travelRecord.title ?? '',
    startDate: start,
    endDate: end,
    status: 'COMPLETED',
    travelStatus: 'COMPLETED',
    constraints: {},
    members: [],
    itinerary: [],
    createdAt: travelRecord.publishedAt ?? new Date().toISOString(),
    source: 'api',
  };
}

export type UseTravelogueDetailScreenParams = {
  navigation: TravelRecordDetailNavigation;
  travelRecordId: string;
};

export function useTravelogueDetailScreen({
  travelRecordId,
}: UseTravelogueDetailScreenParams) {
  const language = useAppLanguage();
  const accessToken = useAuthStore(selectReusableAccessToken);
  const authUserId = useAuthStore(s => s.user?.userId ?? null);
  const [travelRecord, setTravelRecord] = useState<TravelRecord | null>(null);
  const [loadedAsOwner, setLoadedAsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const reloadTravelRecord = useCallback(async () => {
    const { record, loadedAsOwner: asOwner } = await loadTravelRecordDetail({
      travelRecordId,
      accessToken,
    });
    setTravelRecord(record);
    setLoadedAsOwner(asOwner);
    setLoadError(false);
  }, [travelRecordId, accessToken]);

  useEffect(() => {
    let cancelled = false;
    setLoadError(false);
    setLoading(true);
    setTravelRecord(null);
    setLoadedAsOwner(false);
    void loadTravelRecordDetail({
      travelRecordId,
      accessToken,
    })
      .then(({ record, loadedAsOwner: asOwner }) => {
        if (!cancelled) {
          setTravelRecord(record);
          setLoadedAsOwner(asOwner);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
          setTravelRecord(null);
          setLoadedAsOwner(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [travelRecordId, accessToken]);

  const isOwner = useMemo(() => {
    if (loadedAsOwner) {
      return true;
    }
    if (!authUserId || !travelRecord?.authorId) {
      return false;
    }
    return (
      String(authUserId).toLowerCase() ===
      String(travelRecord.authorId).toLowerCase()
    );
  }, [loadedAsOwner, authUserId, travelRecord?.authorId]);

  return {
    language,
    loading,
    loadError,
    travelRecord,
    isOwner,
    setTravelRecord,
    reloadTravelRecord,
  };
}

export type UseTravelogueDetailBodyParams = {
  travelRecord: TravelRecord;
  isOwner: boolean;
  onTravelRecordChange: (next: TravelRecord) => void;
  onReloadTravelRecord: () => Promise<void>;
  navigation: TravelRecordDetailNavigation;
};

export function useTravelogueDetailBody({
  travelRecord,
  isOwner,
  onTravelRecordChange,
  onReloadTravelRecord,
  navigation,
}: UseTravelogueDetailBodyParams) {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const copy = useCopy('travelReview');
  const { alert } = useAppAlert();
  const accessToken = useAuthStore(selectReusableAccessToken);
  const linkedPlan = usePlanStore(s => {
    const id = travelRecord.travelId;
    if (!id) {
      return null;
    }
    return s.plans.find(p => p.planId === id || p.apiTravelId === id) ?? null;
  });
  const {
    social,
    userId,
    userName,
    commenting,
    handleToggleLike,
    handleToggleBookmark,
    bookmarkedByMe,
    handleAddComment,
    handleUpdateComment,
    handleDeleteComment,
    handleImportPlan,
    importModalProps,
  } = useTravelogueSocialActions(travelRecord, copy, navigation, {
    onTravelRecordPatch: patch => {
      onTravelRecordChange({ ...travelRecord, ...patch });
    },
  });

  const [commentOpen, setCommentOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<TravelRecordComment | null>(
    null,
  );
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [reviewRoute, setReviewRoute] = useState<RouteItem | null>(null);
  const [savingReview, setSavingReview] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const reloadAfterEdit = async () => {
    try {
      await onReloadTravelRecord();
    } catch {
      // 저장은 성공했을 수 있음 — 새로고침 실패만 조용히 무시
    }
  };

  const onPullRefresh = () => {
    setRefreshing(true);
    void onReloadTravelRecord()
      .catch(() => undefined)
      .finally(() => setRefreshing(false));
  };

  const onToggleBookmark = () => {
    void handleToggleBookmark().catch(error => {
      alert({
        title:
          error instanceof TravelogueSocialError
            ? error.message
            : copy.socialBookmarkFailed,
      });
    });
  };

  const onToggleLike = () => {
    void handleToggleLike().catch(error => {
      alert({
        title:
          error instanceof TravelogueSocialError
            ? error.message
            : copy.socialLikeFailed,
      });
    });
  };

  const onSubmitComment = async (text: string) => {
    try {
      if (editingComment) {
        await handleUpdateComment(editingComment.commentId, text);
      } else {
        await handleAddComment(text);
      }
    } catch (error) {
      alert({
        title:
          error instanceof TravelogueSocialError
            ? error.message
            : editingComment
              ? copy.socialCommentUpdateFailed
              : copy.socialCommentFailed,
      });
      throw error;
    }
  };

  const onDeleteComment = (comment: TravelRecordComment) => {
    alert({
      title: copy.feedDeleteCommentConfirmTitle,
      message: copy.feedDeleteCommentConfirmMessage,
      buttons: [
        { label: copy.cancel, variant: 'secondary', onPress: () => undefined },
        {
          label: copy.feedDeleteComment,
          variant: 'danger',
          onPress: () => {
            void handleDeleteComment(comment.commentId).catch(error => {
              alert({
                title:
                  error instanceof TravelogueSocialError
                    ? error.message
                    : copy.socialCommentDeleteFailed,
              });
            });
          },
        },
      ],
    });
  };

  const editPlan = useMemo(
    () =>
      linkedPlan?.source === 'api'
        ? linkedPlan
        : buildApiPlanShell(travelRecord),
    [linkedPlan, travelRecord],
  );

  /** 일정은 여행기 API days만 사용 (로컬 plan 스냅샷 폴백 금지) */
  const days = useMemo(() => {
    return (travelRecord.days ?? []).map(day => ({
      ...day,
      places: sortTravelRecordPlaces(day.places),
    }));
  }, [travelRecord]);

  const scheduleItinerary = useMemo((): DailyItinerary[] => {
    return days.map(day => ({
      dailyId: day.travelRecordDayId,
      dayNumber: day.dayNumber,
      date: day.visitDate,
      routes: snapshotToRouteItems(day.places),
    }));
  }, [days]);

  const mapRoutes = useMemo(
    () => scheduleItinerary.flatMap(day => day.routes),
    [scheduleItinerary],
  );

  const routesByPlaceId = useMemo(
    () => new Map(mapRoutes.map(route => [route.itemId, route] as const)),
    [mapRoutes],
  );

  const feedImages = useMemo(() => collectTravelRecordMedia(travelRecord), [travelRecord]);
  const rating = travelRecordOverallRating(travelRecord);
  const destinationLabel = travelRecordDestinationLabel(travelRecord);

  const selectedDayNumber = useMemo(() => {
    if (!selectedRouteId) {
      return undefined;
    }
    const day = scheduleItinerary.find(item =>
      item.routes.some(route => route.itemId === selectedRouteId),
    );
    return day?.dayNumber;
  }, [scheduleItinerary, selectedRouteId]);

  useEffect(() => {
    if (mapRoutes.length === 0) {
      setSelectedRouteId(null);
      return;
    }
    setSelectedRouteId(prev =>
      prev && mapRoutes.some(r => r.itemId === prev) ? prev : mapRoutes[0].itemId,
    );
  }, [mapRoutes]);

  const totalDurationLabel = useMemo(() => {
    if (scheduleItinerary.length === 0) {
      return null;
    }
    const minutes = computeTripTotalMinutes(scheduleItinerary);
    return copy.totalDuration(formatDurationMinutes(minutes, language));
  }, [scheduleItinerary, copy, language]);

  const publishedDate = travelRecord.publishedAt
    ? new Date(travelRecord.publishedAt).toLocaleDateString()
    : '';
  const tripPeriod =
    travelRecord.travelStartDate && travelRecord.travelEndDate
      ? copy.tripPeriod(travelRecord.travelStartDate, travelRecord.travelEndDate)
      : null;

  const existingReviewForModal = reviewRoute
    ? getReviewForTravelRecordPlace(travelRecord.placeReviews, {
        travelRecordPlaceId: reviewRoute.itemId,
        planPlaceId: reviewRoute.apiPlanPlaceId,
      })
    : undefined;

  const openPlaceReviewEditor = (place: TravelRecordPlace) => {
    const route =
      routesByPlaceId.get(place.travelRecordPlaceId) ??
      snapshotToRouteItems([place])[0];
    if (!route?.apiPlanPlaceId && place.planPlaceId) {
      setReviewRoute({ ...route, apiPlanPlaceId: place.planPlaceId });
      return;
    }
    setReviewRoute(route);
  };

  const handleSaveTravelogue = async (payload: {
    title: string;
    content: string;
    overallRating: number;
    status: 'PUBLISHED' | 'HIDDEN';
    coverImageUrl?: string;
    imageUrls: string[];
  }) => {
    if (!accessToken?.trim() || !travelRecord.travelId) {
      alert({
        title:
          language === 'ko' ? '로그인이 필요합니다.' : 'Please sign in to edit.',
      });
      throw new Error('login required');
    }
    setPublishing(true);
    try {
      const updated = await updateTravelRecordForTravel({
        accessToken,
        travelRecordId: travelRecord.travelRecordId,
        travelId: travelRecord.travelId,
        authorNickname: travelRecord.authorNickname || userName,
        title: payload.title,
        content: payload.content,
        status: payload.status,
        currentStatus: travelRecord.status,
        ...(payload.coverImageUrl !== undefined
          ? { coverImageUrl: payload.coverImageUrl }
          : {}),
        imageUrls: payload.imageUrls,
        overallRating: payload.overallRating,
      });
      onTravelRecordChange({
        ...updated,
        placeReviews: travelRecord.placeReviews,
        days: updated.days.length > 0 ? updated.days : travelRecord.days,
      });
      await reloadAfterEdit();
    } catch (error) {
      alert({
        title:
          error instanceof Error
            ? error.message
            : language === 'ko'
              ? '여행기 수정에 실패했습니다.'
              : 'Failed to update travelogue.',
      });
      throw error;
    } finally {
      setPublishing(false);
    }
  };

  const handleSavePlaceReview = async (
    payload: Omit<PlaceReview, 'placeReviewId' | 'createdAt' | 'updatedAt'> & {
      placeReviewId?: string;
    },
  ) => {
    if (!editPlan || !reviewRoute) {
      return;
    }
    setSavingReview(true);
    try {
      const saved = await savePlaceReviewForTravel({
        accessToken,
        plan: editPlan,
        route: reviewRoute,
        authorNickname: travelRecord.authorNickname || userName,
        payload: {
          placeReviewId: payload.placeReviewId,
          rating: payload.rating,
          content: payload.content,
          tags: payload.tags,
          media: payload.media,
        },
      });
      const nextReviews = [
        ...travelRecord.placeReviews.filter(
          r =>
            r.placeReviewId !== saved.placeReviewId &&
            !(
              saved.planPlaceId &&
              r.planPlaceId &&
              r.planPlaceId === saved.planPlaceId
            ),
        ),
        saved,
      ];
      onTravelRecordChange({ ...travelRecord, placeReviews: nextReviews });
      await reloadAfterEdit();
    } catch (error) {
      alert({
        title:
          error instanceof PlaceReviewSyncError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Failed to save review.',
      });
      throw error;
    } finally {
      setSavingReview(false);
    }
  };

  const handleDeletePlaceReview = () =>
    new Promise<void>((resolve, reject) => {
      if (!editPlan || !reviewRoute) {
        reject(new Error('no route'));
        return;
      }
      alert({
        title: copy.deleteReviewConfirmTitle,
        message: copy.deleteReviewConfirmMessage,
        buttons: [
          {
            label: copy.cancel,
            variant: 'secondary',
            onPress: () => reject(new Error('cancelled')),
          },
          {
            label: copy.deleteReviewConfirm,
            variant: 'danger',
            onPress: () => {
              void (async () => {
                setSavingReview(true);
                try {
                  await deletePlaceReviewForTravel({
                    accessToken,
                    plan: editPlan,
                    route: reviewRoute,
                    placeReviewId: existingReviewForModal?.placeReviewId,
                  });
                  if (existingReviewForModal) {
                    onTravelRecordChange({
                      ...travelRecord,
                      placeReviews: travelRecord.placeReviews.filter(
                        r =>
                          r.placeReviewId !==
                          existingReviewForModal.placeReviewId,
                      ),
                    });
                  }
                  await reloadAfterEdit();
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

  return {
    insets,
    language,
    copy,
    isOwner,
    travelRecord,
    social,
    userId,
    userName,
    commenting,
    bookmarkedByMe,
    handleImportPlan,
    importModalProps,
    commentOpen,
    setCommentOpen,
    editingComment,
    setEditingComment,
    selectedRouteId,
    setSelectedRouteId,
    composeOpen,
    setComposeOpen,
    publishing,
    reviewRoute,
    setReviewRoute,
    savingReview,
    refreshing,
    onPullRefresh,
    onToggleBookmark,
    onToggleLike,
    onSubmitComment,
    onDeleteComment,
    days,
    scheduleItinerary,
    routesByPlaceId,
    feedImages,
    rating,
    destinationLabel,
    selectedDayNumber,
    totalDurationLabel,
    publishedDate,
    tripPeriod,
    existingReviewForModal,
    openPlaceReviewEditor,
    handleSaveTravelogue,
    handleSavePlaceReview,
    handleDeletePlaceReview,
  };
}
