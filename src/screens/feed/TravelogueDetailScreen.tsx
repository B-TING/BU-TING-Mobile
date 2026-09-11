import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScheduleMapView } from '../../kakaoMap';
import { TravelogueCommentsSection } from '../../components/feed/TravelogueCommentsSection';
import { ImportPlanModal } from '../../components/feed/modals/ImportPlanModal';
import { TravelogueCommentModal } from '../../components/feed/modals/TravelogueCommentModal';
import { TravelogueImageCarousel } from '../../components/feed/TravelogueImageCarousel';
import { TravelogueSocialBar } from '../../components/feed/TravelogueSocialBar';
import { PlaceReviewFormModal } from '../../components/review/modals/PlaceReviewFormModal';
import { TravelogueComposeModal } from '../../components/review/modals/TravelogueComposeModal';
import { BackButton } from '../../components/shared/buttons/BackButton';
import { AppIcon } from '../../components/shared/icons/AppIcon';
import { ResolvedRemoteImage } from '../../components/shared/media/ResolvedRemoteImage';
import { ReviewVideoThumb } from '../../components/shared/media/ReviewVideoViews';
import { StarRating } from '../../components/shared/rating/StarRating';
import { getScheduleDayColor } from '../../constants/plan/scheduleDayColors';
import { ICON_COLOR_MUTED, ICON_COLOR_PRIMARY } from '../../constants/icons';
import {
  isTravelRecordPlaceVisited,
  TRAVELOGUE_MAP_HEIGHT,
  useTravelogueDetailBody,
  useTravelogueDetailScreen,
  zoneBaseColorForRoute,
  type Copy,
} from '../../hooks/feed/useTravelogueDetailScreen';
import type { RootStackParamList } from '../../navigation/types';
import type { PlaceReview, TravelRecord } from '../../types/travelReview';
import {
  authorInitial,
  getReviewForTravelRecordPlace,
} from '../../utils/review/travelReview';
import { formatWeekdayDate } from '../../utils/geo/geo';

type Props = NativeStackScreenProps<RootStackParamList, 'TravelRecordDetail'>;

function PlaceReviewBlock({
  review,
  copy,
}: {
  review: PlaceReview;
  copy: Copy;
}) {
  return (
    <View className="mt-2 border-t border-brand-border pt-2">
      <View className="flex-row items-center gap-2">
        <StarRating value={review.rating} readonly size="sm" />
        <Text className="text-xs text-brand-muted">{copy.stars(review.rating)}</Text>
      </View>
      {review.tags.length > 0 ? (
        <View className="mt-2 flex-row flex-wrap gap-1">
          {review.tags.map(tag => (
            <View key={tag} className="rounded-full bg-brand-selected px-2 py-0.5">
              <Text className="text-[10px] font-semibold text-brand-primary">#{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {review.content ? (
        <Text className="mt-2 text-sm leading-5 text-brand-text">{review.content}</Text>
      ) : null}
      {(review.media ?? []).length > 0 ? (
        <View className="mt-2 flex-row flex-wrap gap-2">
          {(review.media ?? []).map(item => {
            const isRemoteImage =
              item.type === 'image' &&
              (item.uri.startsWith('http://') || item.uri.startsWith('https://'));
            if (item.type === 'video') {
              return (
                <ReviewVideoThumb
                  key={item.mediaId}
                  uri={item.uri}
                  fileKey={item.fileKey}
                  size={56}
                />
              );
            }
            return (
              <View
                key={item.mediaId}
                className="relative h-14 w-14 overflow-hidden rounded-xl bg-brand-selected">
                {isRemoteImage ? (
                  <ResolvedRemoteImage
                    uri={item.uri}
                    fileKey={item.fileKey}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center">
                    <AppIcon name="paperclip" size={18} color={ICON_COLOR_MUTED} />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function TravelogueDetailBody({
  travelRecord,
  isOwner,
  onTravelRecordChange,
  onReloadTravelRecord,
  navigation,
}: {
  travelRecord: TravelRecord;
  isOwner: boolean;
  onTravelRecordChange: (next: TravelRecord) => void;
  onReloadTravelRecord: () => Promise<void>;
  navigation: Props['navigation'];
}) {
  const {
    insets,
    language,
    copy,
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
  } = useTravelogueDetailBody({
    travelRecord,
    isOwner,
    onTravelRecordChange,
    onReloadTravelRecord,
    navigation,
  });

  return (
    <View className="flex-1 bg-brand-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
        <BackButton
          accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          onPress={() => navigation.goBack()}
        />
        <Text className="flex-1 text-lg font-bold text-brand-text" numberOfLines={1}>
          {copy.feedTitle}
        </Text>
        {isOwner ? (
          <Pressable
            onPress={() => setComposeOpen(true)}
            accessibilityLabel={copy.editTravelogue}
            hitSlop={8}
            className="ml-2 h-9 w-9 items-center justify-center rounded-full bg-brand-selected active:opacity-80">
            <AppIcon name="pencil" size={18} color={ICON_COLOR_PRIMARY} strokeWidth={2.2} />
          </Pressable>
        ) : null}
      </View>

      {scheduleItinerary.some(day => day.routes.length > 0) ? (
        <View
          className="shrink-0 border-b border-brand-border bg-brand-surface"
          style={{ height: TRAVELOGUE_MAP_HEIGHT, overflow: 'hidden' }}>
          <ScheduleMapView
            itinerary={scheduleItinerary}
            selectedDayNumber={selectedDayNumber}
            highlightItemId={selectedRouteId}
            mapTitle={copy.mapTitle}
            mapSubtitle={copy.mapSubtitle}
            showFooter={false}
          />
        </View>
      ) : null}

      <ScrollView
        className="flex-1 bg-brand-background"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onPullRefresh}
            tintColor={ICON_COLOR_PRIMARY}
            colors={[ICON_COLOR_PRIMARY]}
          />
        }>
        <View className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-primary">
            <Text className="text-sm font-bold text-white">
              {authorInitial(travelRecord.authorNickname)}
            </Text>
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-bold text-brand-text">
              {travelRecord.authorNickname}
            </Text>
            <Text className="text-xs text-brand-muted">{destinationLabel}</Text>
          </View>
        </View>

        <TravelogueImageCarousel travelRecord={travelRecord} images={feedImages} />

        <View className="px-4 pt-3">
          <TravelogueSocialBar
            copy={copy}
            social={social}
            userId={userId}
            onToggleLike={onToggleLike}
            onImportPlan={handleImportPlan}
          />

          <Text className="text-[10px] font-bold tracking-wide text-brand-primary">
            TRAVELOGUE
          </Text>
          <View className="mt-1 flex-row items-start justify-between gap-2">
            <Text className="min-w-0 flex-1 text-2xl font-bold text-brand-text">
              {travelRecord.title ?? ''}
            </Text>
            <View className="shrink-0 flex-row items-center gap-1">
              {isOwner ? (
                <Pressable
                  onPress={() => setComposeOpen(true)}
                  accessibilityLabel={copy.editTravelogue}
                  hitSlop={8}
                  className="h-9 w-9 items-center justify-center rounded-full bg-brand-selected active:opacity-80">
                  <AppIcon
                    name="pencil"
                    size={18}
                    color={ICON_COLOR_PRIMARY}
                    strokeWidth={2.2}
                  />
                </Pressable>
              ) : null}
              <Pressable
                onPress={onToggleBookmark}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={bookmarkedByMe ? copy.unbookmark : copy.bookmark}
                accessibilityState={{ selected: bookmarkedByMe }}
                className="h-9 w-9 items-center justify-center rounded-full active:opacity-80">
                <AppIcon
                  name="bookmark"
                  size={20}
                  color={bookmarkedByMe ? ICON_COLOR_PRIMARY : ICON_COLOR_MUTED}
                  filled={bookmarkedByMe}
                />
              </Pressable>
            </View>
          </View>
          <Text className="mt-2 text-sm text-brand-muted">
            {copy.detailBy(travelRecord.authorNickname)} · {destinationLabel}
            {publishedDate ? ` · ${publishedDate}` : ''}
          </Text>
          {tripPeriod ? (
            <Text className="mt-1 text-xs text-brand-muted">{tripPeriod}</Text>
          ) : null}
          {totalDurationLabel ? (
            <Text className="mt-1 text-xs font-semibold text-brand-primary">
              {totalDurationLabel}
            </Text>
          ) : null}

          {rating > 0 ? (
            <View className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
              <Text className="mb-2 text-xs font-bold text-brand-muted">{copy.overallRating}</Text>
              <View className="flex-row items-center gap-2">
                <StarRating value={rating} readonly />
                <Text className="text-sm font-bold text-brand-primary">
                  {copy.stars(rating)}
                </Text>
              </View>
              {travelRecord.content ? (
                <>
                  <Text className="mb-2 mt-4 text-xs font-bold text-brand-muted">
                    {copy.overallSummary}
                  </Text>
                  <Text className="text-sm leading-6 text-brand-text">{travelRecord.content}</Text>
                </>
              ) : null}
            </View>
          ) : travelRecord.content ? (
            <View className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
              <Text className="mb-2 text-xs font-bold text-brand-muted">{copy.overallSummary}</Text>
              <Text className="text-sm leading-6 text-brand-text">{travelRecord.content}</Text>
            </View>
          ) : null}

          {days.length > 0 ? (
            <>
              <Text className="mb-3 mt-6 text-base font-bold text-brand-text">
                {copy.itinerarySection}
              </Text>
              {days.map(day => {
                const dayColor = getScheduleDayColor(day.dayNumber);
                return (
                  <View key={`day-${day.dayNumber}`} className="mb-4">
                    <Text
                      className="mb-2 text-sm font-bold"
                      style={{ color: dayColor.main }}>
                      {copy.dayLabel(day.dayNumber)} ·{' '}
                      {formatWeekdayDate(day.visitDate, language)}
                    </Text>
                    {day.places.map((place, index) => {
                      const order = index + 1;
                      const review = getReviewForTravelRecordPlace(
                        travelRecord.placeReviews,
                        place,
                      );
                      const selected = selectedRouteId === place.travelRecordPlaceId;
                      const route = routesByPlaceId.get(place.travelRecordPlaceId);
                      const zoneColor = route
                        ? zoneBaseColorForRoute(route)
                        : dayColor.main;

                      return (
                        <Pressable
                          key={place.travelRecordPlaceId}
                          onPress={() => setSelectedRouteId(place.travelRecordPlaceId)}
                          className="mb-2 rounded-2xl border bg-brand-surface p-4 active:opacity-90"
                          style={
                            selected
                              ? {
                                  borderColor: dayColor.main,
                                  borderWidth: 2,
                                  backgroundColor: dayColor.light,
                                }
                              : {
                                  borderColor: '#E2E8F0',
                                  borderLeftWidth: 4,
                                  borderLeftColor: zoneColor,
                                }
                          }>
                          <View className="flex-row items-start">
                            <View
                              className="mr-3 h-8 w-8 items-center justify-center rounded-full"
                              style={{ backgroundColor: dayColor.main }}>
                              <Text className="text-sm font-bold text-white">{order}</Text>
                            </View>
                            <View className="min-w-0 flex-1">
                              <View className="flex-row items-start gap-2">
                                <Text className="min-w-0 flex-1 text-base font-bold text-brand-text">
                                  {place.placeName}
                                </Text>
                                {isOwner && isTravelRecordPlaceVisited(place) ? (
                                  <Pressable
                                    onPress={event => {
                                      event.stopPropagation?.();
                                      openPlaceReviewEditor(place);
                                    }}
                                    accessibilityLabel={
                                      review ? copy.editReview : copy.writeReview
                                    }
                                    hitSlop={8}
                                    className={`h-8 w-8 items-center justify-center rounded-full active:opacity-80 ${
                                      review ? 'bg-brand-selected' : 'bg-brand-primary/10'
                                    }`}>
                                    <AppIcon
                                      name={review ? 'pencil' : 'plus'}
                                      size={15}
                                      color={
                                        review ? ICON_COLOR_MUTED : ICON_COLOR_PRIMARY
                                      }
                                      strokeWidth={2.2}
                                    />
                                  </Pressable>
                                ) : null}
                              </View>
                              {review ? (
                                <PlaceReviewBlock review={review} copy={copy} />
                              ) : (
                                <Text className="mt-2 text-xs text-brand-muted">
                                  {copy.noReviewForPlace}
                                </Text>
                              )}
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}
            </>
          ) : (
            <>
              <Text className="mb-3 mt-6 text-base font-bold text-brand-text">
                {copy.placeReviewsSection}
              </Text>
              {travelRecord.placeReviews.length === 0 ? (
                <Text className="text-sm text-brand-muted">{copy.noReviewsYet}</Text>
              ) : (
                travelRecord.placeReviews.map(review => (
                  <View
                    key={review.placeReviewId}
                    className="mb-3 rounded-2xl border border-brand-border bg-brand-surface p-4">
                    <View className="flex-row items-start gap-2">
                      <Text className="min-w-0 flex-1 text-base font-bold text-brand-text">
                        {review.placeName}
                      </Text>
                      {isOwner ? (
                        <Pressable
                          onPress={() => {
                            const place =
                              days
                                .flatMap(d => d.places)
                                .find(
                                  p =>
                                    p.travelRecordPlaceId ===
                                      review.travelRecordPlaceId ||
                                    p.planPlaceId === review.planPlaceId,
                                ) ?? null;
                            if (place) {
                              openPlaceReviewEditor(place);
                            }
                          }}
                          accessibilityLabel={copy.editReview}
                          hitSlop={8}
                          className="h-8 w-8 items-center justify-center rounded-full bg-brand-selected active:opacity-80">
                          <AppIcon
                            name="pencil"
                            size={15}
                            color={ICON_COLOR_MUTED}
                            strokeWidth={2.2}
                          />
                        </Pressable>
                      ) : null}
                    </View>
                    <PlaceReviewBlock review={review} copy={copy} />
                  </View>
                ))
              )}
            </>
          )}

          <View className="mt-6 border-t border-brand-border pt-4">
            <Text className="mb-3 text-base font-bold text-brand-text">{copy.feedCommentsTitle}</Text>
            <TravelogueCommentsSection
              copy={copy}
              comments={social.comments}
              currentUserId={userId}
              currentUserName={userName}
              language={language}
              onOpenComposer={() => {
                setEditingComment(null);
                setCommentOpen(true);
              }}
              onEditComment={comment => {
                setEditingComment(comment);
                setCommentOpen(true);
              }}
              onDeleteComment={onDeleteComment}
            />
          </View>
        </View>
      </ScrollView>

      <TravelogueCommentModal
        visible={commentOpen}
        copy={copy}
        userName={userName}
        subtitle={travelRecord.title ?? undefined}
        mode={editingComment ? 'edit' : 'create'}
        initialContent={editingComment?.content ?? ''}
        submitting={commenting}
        onClose={() => {
          setCommentOpen(false);
          setEditingComment(null);
        }}
        onSubmit={onSubmitComment}
      />
      <ImportPlanModal {...importModalProps} />

      {isOwner ? (
        <>
          <TravelogueComposeModal
            visible={composeOpen}
            copy={copy}
            language={language}
            authorNickname={travelRecord.authorNickname || userName}
            destinationLabel={destinationLabel}
            placeReviews={travelRecord.placeReviews}
            mode="edit"
            initialTitle={travelRecord.title}
            initialContent={travelRecord.content}
            initialStatus={
              travelRecord.status === 'HIDDEN' ? 'HIDDEN' : 'PUBLISHED'
            }
            initialOverallRating={travelRecord.overallRating}
            initialCoverImageUrl={travelRecord.coverImageUrl}
            initialImageUrls={travelRecord.imageUrls}
            publishing={publishing}
            onClose={() => {
              if (!publishing) {
                setComposeOpen(false);
              }
            }}
            onPublish={handleSaveTravelogue}
          />
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
        </>
      ) : null}
    </View>
  );
}

export function TravelogueDetailScreen({ navigation, route }: Props) {
  const { language, loading, loadError, travelRecord, isOwner, setTravelRecord, reloadTravelRecord } =
    useTravelogueDetailScreen({
      navigation,
      travelRecordId: route.params.travelRecordId,
    });

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background">
        <ActivityIndicator color={ICON_COLOR_PRIMARY} />
      </View>
    );
  }

  if (!travelRecord) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background px-6">
        <Text className="text-brand-muted">
          {loadError
            ? language === 'ko'
              ? '여행기를 불러오지 못했어요'
              : 'Could not load travelogue'
            : language === 'ko'
              ? '여행기를 찾을 수 없어요'
              : 'Travelogue not found'}
        </Text>
        <BackButton
          accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          onPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <TravelogueDetailBody
      travelRecord={travelRecord}
      isOwner={isOwner}
      onTravelRecordChange={setTravelRecord}
      onReloadTravelRecord={reloadTravelRecord}
      navigation={navigation}
    />
  );
}
