import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { PlaceReviewCard } from '../../review/cards/PlaceReviewCard';
import { PlaceReviewFormModal } from '../../review/modals/PlaceReviewFormModal';
import { TravelogueComposeModal } from '../../review/modals/TravelogueComposeModal';
import { AppIcon } from '../../shared/icons/AppIcon';
import { useAppAlert, useFeatureUnavailableAlert } from '../../shared/modals';
import {
  ALPHA_FEATURE_LABELS,
  isAlphaFeatureBlocked,
} from '../../../constants/common/alphaFeatureBlocks';
import { ICON_COLOR_PRIMARY } from '../../../constants/icons';
import { useCopy } from '../../../i18n';
import { deletePlaceReviewForTravel } from '../../../services/travel/deletePlaceReviewForTravel';
import { loadPlanPlaceReviewsForTravel } from '../../../services/travel/loadPlanPlaceReviewsForTravel';
import {
  publishTravelRecordForTravel,
  PublishTravelRecordError,
} from '../../../services/travel/publishTravelRecordForTravel';
import {
  PlaceReviewSyncError,
  savePlaceReviewForTravel,
} from '../../../services/travel/savePlaceReviewForTravel';
import { updateTravelRecordForTravel } from '../../../services/travel/updateTravelRecordForTravel';
import {
  fetchMyTravelRecords,
  TravelRecordServiceError,
} from '../../../services/travel/travelRecordService';
import { mapTravelRecordManageItem } from '../../../types/travelRecordApi';
import { EMPTY_REVIEWS, useTravelRecordStore } from '../../../stores/useTravelRecordStore';
import { useAuthStore } from '../../../stores';
import { selectReusableAccessToken } from '../../../stores/useAuthStore';
import type { AppLanguage } from '../../../types/user';
import type { RouteItem, TravelPlan } from '../../../types/travelPlan';
import type { PlaceReview, TravelRecord, TravelRecordStatus } from '../../../types/travelReview';
import {
  collectPlanRoutes,
  getReviewForPlace,
  isTravelRecordPublic,
  reviewProgress,
} from '../../../utils/review/travelReview';
import { computeTripTotalMinutes, formatDurationMinutes } from '../../../utils/geo/tripDuration';

function placeKey(route: RouteItem): string {
  return route.apiPlanPlaceId ?? route.itemId;
}

type PlanRecordsTabProps = {
  plan: TravelPlan;
  allRoutes: RouteItem[];
  language: AppLanguage;
  authorNickname: string;
  destinationLabel: string;
  isTripActive: boolean;
  onPublished?: () => void;
  onEndTrip?: () => void;
  onViewFeed?: () => void;
  onViewTravelRecord?: (travelRecordId: string) => void;
};

export function PlanRecordsTab({
  plan,
  allRoutes,
  language,
  authorNickname,
  destinationLabel,
  isTripActive,
  onPublished,
  onEndTrip,
  onViewFeed,
  onViewTravelRecord,
}: PlanRecordsTabProps) {
  const { alert } = useAppAlert();
  const { showUnavailable } = useFeatureUnavailableAlert();
  const copy = useCopy('travelReview');
  const accessToken = useAuthStore(selectReusableAccessToken);
  const travelId = plan.apiTravelId ?? plan.planId;
  const reviews =
    useTravelRecordStore(s => s.reviewsByTravelId[travelId]) ?? EMPTY_REVIEWS;

  const [publishedTravelRecord, setPublishedTravelRecord] =
    useState<TravelRecord | null>(null);
  const isPublished = Boolean(publishedTravelRecord);

  const [reviewRoute, setReviewRoute] = useState<RouteItem | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<'create' | 'edit'>('create');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [savingReview, setSavingReview] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!accessToken?.trim() || plan.source !== 'api') {
      setPublishedTravelRecord(null);
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
        setPublishedTravelRecord(
          match ? mapTravelRecordManageItem(match, authorNickname) : null,
        );
      })
      .catch(error => {
        if (__DEV__) {
          const message =
            error instanceof TravelRecordServiceError ? error.message : String(error);
          console.warn('[PlanRecordsTab] fetchMyTravelRecords failed:', message);
        }
        if (!cancelled) {
          setPublishedTravelRecord(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, authorNickname, plan.source, travelId]);

  const reloadReviewsFromServer = async () => {
    if (!accessToken?.trim() || plan.source !== 'api') {
      return;
    }
    await loadPlanPlaceReviewsForTravel({ accessToken, plan });
  };

  const reloadPublishedTravelRecord = async () => {
    if (!accessToken?.trim() || plan.source !== 'api') {
      return;
    }
    const list = await fetchMyTravelRecords(accessToken);
    const match = list.find(
      item =>
        item.travelId === travelId &&
        (item.status === 'PUBLISHED' || item.status === 'HIDDEN'),
    );
    setPublishedTravelRecord(
      match ? mapTravelRecordManageItem(match, authorNickname) : null,
    );
  };

  const eligibleRoutes = useMemo(() => collectPlanRoutes(allRoutes), [allRoutes]);
  const progress = useMemo(
    () => reviewProgress(allRoutes, reviews),
    [allRoutes, reviews],
  );

  const totalDurationLabel = useMemo(() => {
    const minutes = computeTripTotalMinutes(plan.itinerary);
    if (minutes <= 0) {
      return null;
    }
    return copy.totalDuration(formatDurationMinutes(minutes, language));
  }, [copy, plan.itinerary, language]);

  const openCreateCompose = () => {
    if (isAlphaFeatureBlocked('travelogue')) {
      showUnavailable(ALPHA_FEATURE_LABELS.travelogue);
      return;
    }
    setComposeMode('create');
    setComposeOpen(true);
  };

  const openEditCompose = () => {
    if (isAlphaFeatureBlocked('travelogue')) {
      showUnavailable(ALPHA_FEATURE_LABELS.travelogue);
      return;
    }
    setComposeMode('edit');
    setComposeOpen(true);
  };

  const handleSavePlaceReview = async (
    payload: Omit<PlaceReview, 'placeReviewId' | 'createdAt' | 'updatedAt'> & {
      placeReviewId?: string;
    },
  ) => {
    if (!reviewRoute) {
      return;
    }
    setSavingReview(true);
    try {
      await savePlaceReviewForTravel({
        accessToken,
        plan,
        route: reviewRoute,
        authorNickname,
        payload: {
          placeReviewId: payload.placeReviewId,
          rating: payload.rating,
          content: payload.content,
          tags: payload.tags,
          media: payload.media,
        },
      });
      await reloadReviewsFromServer();
    } catch (error) {
      alert({
        title:
          error instanceof Error
            ? error.message
            : language === 'ko'
              ? '후기 저장에 실패했습니다.'
              : 'Failed to save review.',
      });
      throw error;
    } finally {
      setSavingReview(false);
    }
  };

  const handleDeletePlaceReview = () =>
    new Promise<void>((resolve, reject) => {
      if (!reviewRoute) {
        reject(new Error('no route'));
        return;
      }
      const existing = getReviewForPlace(reviews, placeKey(reviewRoute));
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
                    plan,
                    route: reviewRoute,
                    placeReviewId: existing?.placeReviewId,
                  });
                  await reloadReviewsFromServer();
                  resolve();
                } catch (error) {
                  alert({
                    title:
                      error instanceof PlaceReviewSyncError
                        ? error.message
                        : error instanceof Error
                          ? error.message
                          : language === 'ko'
                            ? '후기 삭제에 실패했습니다.'
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

  const handlePublish = async (payload: {
    title: string;
    content: string;
    overallRating: number;
    status: Extract<TravelRecordStatus, 'PUBLISHED' | 'HIDDEN'>;
    coverImageUrl?: string;
    imageUrls: string[];
  }) => {
    if (!accessToken?.trim()) {
      alert({
        title:
          language === 'ko' ? '로그인이 필요합니다.' : 'Please sign in to publish.',
      });
      throw new Error('login required');
    }

    setPublishing(true);
    try {
      const editingExisting =
        composeMode === 'edit' &&
        publishedTravelRecord &&
        !publishedTravelRecord.travelRecordId.startsWith('local-');

      if (editingExisting) {
        const updated = await updateTravelRecordForTravel({
          accessToken,
          travelRecordId: publishedTravelRecord.travelRecordId,
          travelId,
          authorNickname,
          title: payload.title,
          content: payload.content,
          status: payload.status,
          currentStatus: publishedTravelRecord.status,
          ...(payload.coverImageUrl !== undefined
            ? { coverImageUrl: payload.coverImageUrl }
            : {}),
          imageUrls: payload.imageUrls,
          overallRating: payload.overallRating,
        });
        setPublishedTravelRecord(updated);
        setSuccessMsg(
          payload.status === 'PUBLISHED'
            ? copy.updatedSuccessPublic
            : copy.updatedSuccessPrivate,
        );
        await reloadPublishedTravelRecord().catch(() => undefined);
      } else {
        const published = await publishTravelRecordForTravel({
          accessToken,
          plan,
          authorNickname,
          title: payload.title,
          content: payload.content,
          status: payload.status,
          ...(payload.coverImageUrl !== undefined
            ? { coverImageUrl: payload.coverImageUrl }
            : {}),
          imageUrls: payload.imageUrls,
          overallRating: payload.overallRating,
        });
        setPublishedTravelRecord(published);
        setSuccessMsg(
          payload.status === 'PUBLISHED'
            ? copy.publishedSuccessPublic
            : copy.publishedSuccessPrivate,
        );
        await reloadPublishedTravelRecord().catch(() => undefined);
        onPublished?.();
      }
    } catch (error) {
      alert({
        title:
          error instanceof PublishTravelRecordError
            ? error.message
            : error instanceof Error
              ? error.message
              : language === 'ko'
                ? '여행기 저장에 실패했습니다.'
                : 'Failed to save travelogue.',
      });
      throw error;
    } finally {
      setPublishing(false);
    }
  };

  const existingReviewForModal = reviewRoute
    ? getReviewForPlace(reviews, placeKey(reviewRoute))
    : undefined;

  return (
    <View className="px-4 py-4">
      <Text className="mb-1 text-lg font-bold text-brand-text">{copy.recordsTitle}</Text>
      <Text className="mb-1 text-sm text-brand-muted">{copy.recordsSub}</Text>
      {totalDurationLabel ? (
        <Text className="mb-4 text-sm font-semibold text-brand-primary">{totalDurationLabel}</Text>
      ) : (
        <View className="mb-4" />
      )}

      <View className="mb-4 rounded-2xl border border-brand-border bg-brand-surface px-4 py-3">
        <Text className="text-sm font-semibold text-brand-text">
          {copy.progress(progress.completed, progress.total)}
        </Text>
        <View className="mt-2 h-2 overflow-hidden rounded-full bg-brand-border">
          <View
            className="h-full rounded-full bg-brand-primary"
            style={{
              width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%`,
            }}
          />
        </View>
        {progress.allDone ? (
          <Text className="mt-2 text-xs font-semibold text-brand-primary">
            {copy.allReviewsDone}
          </Text>
        ) : null}
      </View>

      {eligibleRoutes.length === 0 ? (
        <Text className="text-sm text-brand-muted">{copy.noReviewsYet}</Text>
      ) : (
        eligibleRoutes.map(route => {
          const review = getReviewForPlace(reviews, placeKey(route));
          return (
            <PlaceReviewCard
              key={route.itemId}
              placeName={route.placeName}
              isVisited={route.isVisited}
              review={review}
              writeLabel={copy.writeReview}
              editLabel={copy.editReview}
              visitFirstLabel={copy.visitFirst}
              onPress={
                onPublished || onEndTrip
                  ? () => setReviewRoute(route)
                  : undefined
              }
            />
          );
        })
      )}

      {successMsg ? (
        <View className="mt-4 rounded-2xl bg-brand-selected px-4 py-3">
          <Text className="text-sm font-semibold text-brand-primary">{successMsg}</Text>
        </View>
      ) : null}

      {isPublished && publishedTravelRecord ? (
        <View className="mt-4 rounded-2xl border border-brand-primary/30 bg-brand-selected px-4 py-4">
          <View className="flex-row items-start gap-2">
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-xs font-bold text-brand-primary">{copy.published}</Text>
                <View className="rounded-full bg-brand-primary/10 px-2 py-0.5">
                  <Text className="text-[10px] font-bold text-brand-primary">
                    {isTravelRecordPublic(publishedTravelRecord)
                      ? copy.publishedPublic
                      : copy.publishedPrivate}
                  </Text>
                </View>
              </View>
              <Text className="mt-1 text-base font-bold text-brand-text">
                {publishedTravelRecord.title}
              </Text>
            </View>
            <Pressable
              onPress={openEditCompose}
              accessibilityLabel={copy.editTravelogue}
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-full bg-white/80 active:opacity-80">
              <AppIcon name="pencil" size={18} color={ICON_COLOR_PRIMARY} strokeWidth={2.2} />
            </Pressable>
          </View>
          {onViewTravelRecord ? (
            <Pressable
              onPress={() => onViewTravelRecord(publishedTravelRecord.travelRecordId)}
              className="mt-3 active:opacity-80">
              <Text className="text-sm font-bold text-brand-primary">
                {copy.viewMyTravelogue}
              </Text>
            </Pressable>
          ) : null}
          {isTravelRecordPublic(publishedTravelRecord) && onViewFeed ? (
            <Pressable onPress={onViewFeed} className="mt-2 active:opacity-80">
              <Text className="text-sm font-bold text-brand-primary">
                {copy.viewFeed}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : onPublished ? (
        <Pressable
          onPress={openCreateCompose}
          className="mt-4 items-center rounded-2xl bg-brand-primary py-3 active:opacity-90">
          <Text className="font-bold text-white">{copy.composeTravelogue}</Text>
        </Pressable>
      ) : null}

      {!isPublished && onPublished && progress.total > 0 && !progress.allDone ? (
        <Text className="mt-2 text-center text-xs text-brand-muted">
          {copy.composePartialHint}
        </Text>
      ) : null}

      {isTripActive && onEndTrip ? (
        <Pressable
          onPress={onEndTrip}
          className="mt-3 items-center rounded-2xl border border-brand-border bg-brand-surface py-3 active:opacity-90">
          <Text className="font-bold text-brand-text">{copy.completeTrip}</Text>
        </Pressable>
      ) : null}

      <PlaceReviewFormModal
        visible={!!reviewRoute}
        route={reviewRoute}
        existing={existingReviewForModal}
        copy={copy}
        language={language}
        saving={savingReview}
        onClose={() => {
          if (!savingReview) {
            setReviewRoute(null);
          }
        }}
        onSave={handleSavePlaceReview}
        onDelete={existingReviewForModal ? handleDeletePlaceReview : undefined}
      />

      <TravelogueComposeModal
        visible={composeOpen}
        copy={copy}
        language={language}
        authorNickname={authorNickname}
        destinationLabel={destinationLabel}
        placeReviews={reviews}
        defaultTitle={plan.title}
        mode={composeMode}
        initialTitle={
          composeMode === 'edit' ? publishedTravelRecord?.title : undefined
        }
        initialContent={
          composeMode === 'edit' ? publishedTravelRecord?.content : undefined
        }
        initialStatus={
          composeMode === 'edit' &&
          (publishedTravelRecord?.status === 'PUBLISHED' ||
            publishedTravelRecord?.status === 'HIDDEN')
            ? publishedTravelRecord.status
            : undefined
        }
        initialOverallRating={
          composeMode === 'edit' ? publishedTravelRecord?.overallRating : undefined
        }
        initialCoverImageUrl={
          composeMode === 'edit' ? publishedTravelRecord?.coverImageUrl : undefined
        }
        initialImageUrls={
          composeMode === 'edit' ? publishedTravelRecord?.imageUrls : undefined
        }
        totalDurationLabel={totalDurationLabel}
        publishing={publishing}
        onClose={() => {
          if (!publishing) {
            setComposeOpen(false);
          }
        }}
        onPublish={handlePublish}
      />
    </View>
  );
}
