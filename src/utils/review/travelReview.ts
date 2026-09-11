import type {
  PlaceReview,
  ReviewMedia,
  TravelRecord,
  TravelRecordDay,
  TravelRecordPlace,
  TravelRecordSocial,
} from '../../types/travelReview';
import type { LucideIconName } from '../../constants/icons';
import type { RouteItem, TravelPlan } from '../../types/travelPlan';
import { createId } from '../common/id';
import { sortedRoutes } from '../plan/planItinerary';

function toTravelogueStoredUrl(uri: string): string {
  try {
    const parsed = new URL(uri);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    const withoutQuery = uri.split('?')[0] ?? uri;
    return withoutQuery.split('#')[0] ?? withoutQuery;
  }
}

export function averageRating(reviews: PlaceReview[]): number {
  if (reviews.length === 0) {
    return 0;
  }
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

/** API overallRating (1–5 정수). 후기 없으면 null */
export function overallRatingForApi(reviews: PlaceReview[]): number | null {
  const avg = averageRating(reviews);
  if (avg <= 0) {
    return null;
  }
  return Math.min(5, Math.max(1, Math.round(avg)));
}

/** 여행기 작성 모달 초기 종합 평점 (기존 값 우선, 없으면 후기 평균 반올림) */
export function defaultComposeOverallRating(
  placeReviews: PlaceReview[],
  existing?: number | null,
): number {
  if (
    typeof existing === 'number' &&
    !Number.isNaN(existing) &&
    existing >= 1 &&
    existing <= 5
  ) {
    return existing;
  }
  const avg = averageRating(placeReviews);
  if (avg > 0) {
    return Math.min(5, Math.max(1, Math.round(avg)));
  }
  return 0;
}

export function overallRatingToApi(value: number): number | null {
  if (!Number.isFinite(value) || value < 1 || value > 5) {
    return null;
  }
  return Math.round(value);
}

/** API overallRating만 표시 (장소 후기 평균·로컬 캐시 사용 안 함) */
export function travelRecordOverallRating(travelRecord: TravelRecord): number {
  if (
    typeof travelRecord.overallRating === 'number' &&
    !Number.isNaN(travelRecord.overallRating) &&
    travelRecord.overallRating > 0
  ) {
    return travelRecord.overallRating;
  }
  return 0;
}

export function reviewMatchesPlaceKey(
  review: PlaceReview,
  placeKey: string,
): boolean {
  return (
    review.planPlaceId === placeKey || review.travelRecordPlaceId === placeKey
  );
}

export function getReviewForPlace(
  reviews: PlaceReview[],
  placeKey: string,
): PlaceReview | undefined {
  return reviews.find(r => reviewMatchesPlaceKey(r, placeKey));
}

/** 초안 장소 ↔ 로컬/서버 후기 (planPlaceId 또는 travelRecordPlaceId) 매칭 */
export function getReviewForTravelRecordPlace(
  reviews: PlaceReview[],
  place: {
    travelRecordPlaceId: string;
    planPlaceId?: string | null;
  },
): PlaceReview | undefined {
  return reviews.find(
    r =>
      reviewMatchesPlaceKey(r, place.travelRecordPlaceId) ||
      (place.planPlaceId != null && reviewMatchesPlaceKey(r, place.planPlaceId)),
  );
}

/** @deprecated Use getReviewForPlace */
export const getReviewForRoute = getReviewForPlace;

export function collectPlanRoutes(routes: RouteItem[]): RouteItem[] {
  return routes.filter(r => r.type !== 'LOCKER');
}

export function reviewProgress(
  routes: RouteItem[],
  reviews: PlaceReview[],
): { total: number; completed: number; allDone: boolean } {
  const eligible = collectPlanRoutes(routes);
  const completed = eligible.filter(r =>
    reviews.some(rv =>
      reviewMatchesPlaceKey(rv, r.apiPlanPlaceId ?? r.itemId),
    ),
  ).length;
  return {
    total: eligible.length,
    completed,
    allDone: eligible.length > 0 && completed === eligible.length,
  };
}

export function buildDefaultTravelRecordTitle(
  destinationLabel: string,
  lang: 'ko' | 'en' | 'ja' | 'zh',
): string {
  switch (lang) {
    case 'ko':
      return `${destinationLabel} 여행기`;
    case 'ja':
      return `${destinationLabel}旅行記`;
    case 'zh':
      return `${destinationLabel}游记`;
    default:
      return `${destinationLabel} Travel Record`;
  }
}

/** @deprecated Use buildDefaultTravelRecordTitle */
export const buildDefaultTravelogueTitle = buildDefaultTravelRecordTitle;

export function buildDefaultContent(
  reviews: PlaceReview[],
  lang: 'ko' | 'en' | 'ja' | 'zh',
): string {
  if (reviews.length === 0) {
    return '';
  }
  const highlights = reviews
    .filter(r => r.rating >= 4)
    .map(r => r.placeName)
    .slice(0, 3);
  if (highlights.length === 0) {
    return reviews[0]?.content ?? '';
  }
  switch (lang) {
    case 'ko':
      return `${highlights.join(', ')} 등 ${reviews.length}곳을 다녀왔어요. 각 장소 후기를 참고해 주세요!`;
    case 'ja':
      return `${highlights.join('、')}など${reviews.length}箇所を訪れました。各スポットのレビューをご覧ください。`;
    case 'zh':
      return `去了${highlights.join('、')}等${reviews.length}个地方。欢迎查看各地点评！`;
    default:
      return `Visited ${reviews.length} spots including ${highlights.join(', ')}. See place reviews below!`;
  }
}

/** @deprecated Use buildDefaultContent */
export const buildDefaultOverallReview = buildDefaultContent;

export function buildTravelRecordDays(plan: TravelPlan): TravelRecordDay[] {
  return plan.itinerary.map(day => ({
    travelRecordDayId: day.dailyId ?? createId('trd-'),
    originalPlanId: day.apiPlanId ?? null,
    dayNumber: day.dayNumber,
    visitDate: day.date,
    places: sortedRoutes(day.routes)
      .filter(r => r.type !== 'LOCKER')
      .map(
        (r): TravelRecordPlace => ({
          travelRecordPlaceId: r.apiPlanPlaceId ?? r.itemId,
          planPlaceId: r.apiPlanPlaceId ?? r.itemId,
          sequence: r.sequence,
          placeName: r.placeName,
          address: r.placeInfo?.address ?? null,
          latitude: r.location.lat,
          longitude: r.location.lng,
          provider: r.apiProvider ?? 'GOOGLE',
          providerPlaceId: r.placeId,
          durationMinutes: null,
          memo: r.memo ?? null,
          scheduledTime: null,
          visited: r.isVisited,
          routeToNext: null,
          routeItemType: r.type,
        }),
      ),
  }));
}

/** @deprecated Use buildTravelRecordDays */
export const buildItinerarySnapshot = buildTravelRecordDays;

export function flattenTravelRecordPlaces(days: TravelRecordDay[]): TravelRecordPlace[] {
  const places: TravelRecordPlace[] = [];
  days.forEach(day => {
    day.places.forEach(place => {
      places.push(place);
    });
  });
  return places;
}

/** @deprecated Use flattenTravelRecordPlaces */
export function flattenItineraryRoutes(days: TravelRecordDay[]): TravelRecordPlace[] {
  return flattenTravelRecordPlaces(days);
}

export function resolveTravelRecordDays(
  travelRecord: TravelRecord,
  plan: TravelPlan | null,
): TravelRecordDay[] {
  if (travelRecord.days?.length) {
    return travelRecord.days;
  }
  if (plan) {
    return buildTravelRecordDays(plan);
  }
  return [];
}

/** @deprecated Use resolveTravelRecordDays */
export const resolveTravelogueItinerary = resolveTravelRecordDays;

export function snapshotToRouteItems(places: TravelRecordPlace[]): RouteItem[] {
  return places.map((place, index) => ({
    itemId: place.travelRecordPlaceId,
    apiPlanPlaceId: place.planPlaceId ?? undefined,
    apiProvider: place.provider,
    sequence: place.sequence ?? index,
    placeId: place.providerPlaceId,
    placeName: place.placeName,
    type: place.routeItemType ?? 'ATTRACTION',
    location: {
      lat: place.latitude ?? 0,
      lng: place.longitude ?? 0,
    },
    isVisited: place.visited ?? false,
    memo: place.memo ?? undefined,
    placeInfo: {
      description: '',
      hours: '',
      category: 'attraction',
      address: place.address ?? '',
    },
  }));
}

export function isTravelRecordPublic(travelRecord: TravelRecord): boolean {
  return travelRecord.status === 'PUBLISHED';
}

/** @deprecated Use isTravelRecordPublic */
export const isTraveloguePublic = isTravelRecordPublic;

export function travelRecordDestinationLabel(travelRecord: TravelRecord): string {
  const firstPlace = travelRecord.days
    ?.flatMap(day => day.places)
    .find(place => place.placeName);
  return firstPlace?.placeName ?? firstPlace?.address ?? '';
}

export function collectTravelRecordImages(travelRecord: TravelRecord): ReviewMedia[] {
  return collectTravelRecordMedia(travelRecord).filter(m => m.type === 'image');
}

/** 피드/상세 캐러셀용 — 이미지 + 영상 */
export function collectTravelRecordMedia(travelRecord: TravelRecord): ReviewMedia[] {
  const mediaItems: ReviewMedia[] = [];
  const seen = new Set<string>();
  const pushImage = (uri: string, mediaId: string) => {
    const trimmed = uri.trim();
    if (!trimmed || seen.has(trimmed)) {
      return;
    }
    seen.add(trimmed);
    mediaItems.push({ mediaId, type: 'image', uri: trimmed });
  };

  travelRecord.placeReviews.forEach(review => {
    (review.media ?? []).forEach(media => {
      if (media.type === 'image') {
        pushImage(media.uri, media.mediaId);
      } else if (media.type === 'video') {
        const key = media.uri.trim();
        if (key && !seen.has(key)) {
          seen.add(key);
          mediaItems.push(media);
        }
      }
    });
  });

  (travelRecord.imageUrls ?? []).forEach((uri, index) => {
    pushImage(uri, `record-image-${travelRecord.travelRecordId}-${index}`);
  });

  if (mediaItems.filter(m => m.type === 'image').length === 0 && travelRecord.coverImageUrl) {
    pushImage(
      travelRecord.coverImageUrl,
      `cover-${travelRecord.travelRecordId}`,
    );
  }
  return mediaItems;
}

export type TravelogueCoverCandidate = {
  /** UI 표시용 (presigned 가능) */
  displayUri: string;
  /** API 전송용 (maxLength 1000, 서명 쿼리 제거) */
  storedUrl: string;
};

/** 게시 시 imageUrls / 대표 선택 후보 */
export function collectTravelogueCoverCandidates(
  placeReviews: PlaceReview[],
  extras?: {
    imageUrls?: string[] | null;
    coverImageUrl?: string | null;
  },
): TravelogueCoverCandidate[] {
  const candidates: TravelogueCoverCandidate[] = [];
  const seen = new Set<string>();

  const push = (displayUri: string) => {
    const trimmed = displayUri.trim();
    if (!trimmed) {
      return;
    }
    const storedUrl = toTravelogueStoredUrl(trimmed);
    if (!storedUrl || seen.has(storedUrl)) {
      return;
    }
    seen.add(storedUrl);
    candidates.push({ displayUri: trimmed, storedUrl });
  };

  placeReviews.forEach(review => {
    (review.media ?? []).forEach(media => {
      if (media.type === 'image') {
        push(media.uri);
      }
    });
  });
  (extras?.imageUrls ?? []).forEach(push);
  if (extras?.coverImageUrl) {
    push(extras.coverImageUrl);
  }

  return candidates;
}

/** @deprecated Use collectTravelRecordImages */
export const collectTravelogueImages = collectTravelRecordImages;

export function getLikeCount(social: TravelRecordSocial | undefined): number {
  if (typeof social?.likeCount === 'number') {
    return social.likeCount;
  }
  return social?.likedUserIds.length ?? 0;
}

/** @deprecated Use getLikeCount */
export const getHelpfulCount = getLikeCount;

export function isLikedByUser(
  social: TravelRecordSocial | undefined,
  userId: string,
): boolean {
  if (typeof social?.likedByMe === 'boolean') {
    return social.likedByMe;
  }
  return social?.likedUserIds.includes(userId) ?? false;
}

/** @deprecated Use isLikedByUser */
export const isHelpfulByUser = isLikedByUser;

export function authorInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return '?';
  }
  return trimmed.charAt(0).toUpperCase();
}

export function travelRecordThumbnailIcon(travelRecord: TravelRecord): LucideIconName {
  const top = travelRecord.placeReviews.find(r => r.rating >= 4);
  if (top?.tags.includes('맛집') || top?.tags.includes('food')) {
    return 'utensils';
  }
  if (top?.tags.includes('뷰맛집') || top?.tags.includes('view')) {
    return 'sunset';
  }
  return 'map';
}

/** @deprecated Use travelRecordThumbnailIcon */
export const travelogueThumbnailIcon = travelRecordThumbnailIcon;

/** @deprecated Use travelRecordThumbnailIcon */
export function travelogueThumbnailEmoji(travelRecord: TravelRecord): string {
  const icon = travelRecordThumbnailIcon(travelRecord);
  if (icon === 'utensils') {
    return '🍽️';
  }
  if (icon === 'sunset') {
    return '🌅';
  }
  return '🗺️';
}
