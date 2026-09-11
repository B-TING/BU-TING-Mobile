import type {
  CompanionTypeDto,
  PlaceProviderDto,
  TravelPaceDto,
  TravelStyleDto,
} from './travelApi';
import type {
  PlaceReview,
  TravelRecord,
  TravelRecordComment,
  TravelRecordDay,
  TravelRecordStatus,
  TransportType,
} from './travelReview';

export type TravelRecordFeedSort = 'LATEST' | 'MOST_LIKED' | 'MOST_VIEWED';

export type TravelRecordCreateRequest = {
  title?: string | null;
  content?: string | null;
  coverImageUrl?: string | null;
  imageUrls?: string[] | null;
};

export type TravelRecordUpdateRequest = {
  title?: string | null;
  content?: string | null;
  coverImageUrl?: string | null;
  imageUrls?: string[] | null;
  overallRating?: number | null;
};

export type PlaceReviewCreateRequest = {
  rating: number;
  content?: string | null;
  tags?: string[];
  stayMinutes?: number | null;
  /** 업로드 응답 `fileKey` (예: uploads/images/....png) */
  mediaFileKeys?: string[];
};

export type PlaceReviewUpdateRequest = {
  rating?: number | null;
  content?: string | null;
  tags?: string[] | null;
  stayMinutes?: number | null;
  mediaFileKeys?: string[] | null;
};

export type TravelRecordCommentCreateRequest = {
  content: string;
};

export type TravelRecordCommentUpdateRequest = {
  content: string;
};

/** POST /api/v1/travel-records/{travelRecordId}/clone-to-travel */
export type TravelRecordCloneToTravelRequest = {
  title?: string | null;
  startDate: string;
  hasHeavyBaggage?: boolean | null;
  hasPets?: boolean | null;
  travelStyle?: TravelStyleDto | null;
  preferFlatTerrain?: boolean | null;
  pace?: TravelPaceDto | null;
  companionCount?: number | null;
  preferredFoods?: string | null;
  companionType?: CompanionTypeDto | null;
  accommodationArea?: string | null;
};

export type TravelRecordRouteDto = {
  transportType: TransportType;
  durationMinutes: number | null;
  distanceMeters: number | null;
  provider: PlaceProviderDto;
};

export type TravelRecordPlaceDto = {
  travelRecordPlaceId: string;
  planPlaceId: string | null;
  sequence: number | null;
  placeName: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  provider: PlaceProviderDto;
  providerPlaceId: string;
  durationMinutes: number | null;
  memo: string | null;
  scheduledTime: string | null;
  visited: boolean | null;
  routeToNext: TravelRecordRouteDto | null;
};

export type TravelRecordDayDto = {
  travelRecordDayId: string;
  originalPlanId: string | null;
  dayNumber: number;
  visitDate: string;
  places: TravelRecordPlaceDto[];
};

/** OpenAPI `TravelRecordResponse` */
export type TravelRecordResponse = {
  travelRecordId: string;
  travelId: string | null;
  authorId: string;
  authorNickname?: string;
  title: string | null;
  content: string | null;
  coverImageUrl: string | null;
  /** 여행기 사진 URL 목록 (상세 응답) */
  imageUrls?: string[] | null;
  overallRating?: number | null;
  travelStartDate: string | null;
  travelEndDate: string | null;
  status: TravelRecordStatus;
  publishedAt: string | null;
  likeCount: number;
  viewCount: number;
  likedByMe?: boolean;
  days: TravelRecordDayDto[];
};

/** OpenAPI `TravelRecordFeedResponse` */
export type TravelRecordFeedResponse = {
  travelRecordId: string;
  travelId: string | null;
  authorId: string;
  authorNickname: string;
  title: string | null;
  content: string | null;
  coverImageUrl: string | null;
  imageUrls?: string[] | null;
  overallRating?: number | null;
  travelStartDate: string | null;
  travelEndDate: string | null;
  publishedAt: string | null;
  likeCount: number;
  viewCount: number;
  likedByMe: boolean;
};

export type TravelRecordFeedPageResponse = {
  items: TravelRecordFeedResponse[];
  nextCursor: string | null;
  hasNext: boolean;
};

/** OpenAPI `TravelRecordManageResponse` */
export type TravelRecordManageResponse = {
  travelRecordId: string;
  travelId: string | null;
  authorId: string;
  title: string | null;
  content: string | null;
  coverImageUrl: string | null;
  imageUrls?: string[] | null;
  overallRating?: number | null;
  travelStartDate: string | null;
  travelEndDate: string | null;
  status: TravelRecordStatus;
  publishedAt: string | null;
  likeCount: number;
  viewCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type TravelRecordBookmarkResponse = {
  bookmarkId: string;
  bookmarkedAt: string;
  travelRecord: TravelRecordFeedResponse;
};

export type TravelRecordLikeResponse = {
  likeId: string;
  travelRecordId: string;
  likedAt: string;
  likeCount: number;
};

export type PlaceReviewResponse = {
  placeReviewId: string;
  planPlaceId: string | null;
  travelRecordPlaceId: string | null;
  rating: number;
  stayMinutes?: number | null;
  content: string | null;
  tags: string[];
  mediaUrls?: string[];
  createdAt: string;
  updatedAt: string;
};

export type PlaceReviewSummaryItemResponse = {
  placeReviewId: string;
  travelRecordId: string;
  travelRecordTitle: string | null;
  authorId: string;
  authorNickname: string;
  travelRecordPlaceId: string;
  placeName: string;
  rating: number;
  stayMinutes?: number | null;
  content: string | null;
  tags: string[];
  mediaUrls?: string[];
  createdAt: string;
  updatedAt: string;
};

export type PlaceReviewSummaryResponse = {
  placeId: string;
  reviewCount: number;
  averageRating: number;
  ratingCounts: Record<string, number>;
  reviews: PlaceReviewSummaryItemResponse[];
};

export type TravelRecordFeedQuery = {
  cursor?: string;
  size?: number;
  keyword?: string;
  placeId?: string;
  travelStartDate?: string;
  travelEndDate?: string;
  region?: string;
  city?: string;
  sort?: TravelRecordFeedSort;
};

export type PlaceTravelRecordsQuery = {
  placeId: string;
  cursor?: string;
  size?: number;
};

function mapDays(days: TravelRecordDayDto[] | undefined): TravelRecordDay[] {
  return (days ?? []).map(day => ({
    travelRecordDayId: day.travelRecordDayId,
    originalPlanId: day.originalPlanId,
    dayNumber: day.dayNumber,
    visitDate: day.visitDate,
    places: (day.places ?? []).map(place => ({
      travelRecordPlaceId: place.travelRecordPlaceId,
      planPlaceId: place.planPlaceId,
      sequence: place.sequence,
      placeName: place.placeName,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      provider: place.provider,
      providerPlaceId: place.providerPlaceId,
      durationMinutes: place.durationMinutes,
      memo: place.memo,
      scheduledTime: place.scheduledTime,
      visited: place.visited === true,
      routeToNext: place.routeToNext,
    })),
  }));
}

function normalizeImageUrls(value: string[] | null | undefined): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [];
  }
  return value.map(item => item.trim()).filter(Boolean);
}

/** API 상세 응답 → 앱 TravelRecord */
export function mapTravelRecordResponse(
  dto: TravelRecordResponse,
  extras?: {
    authorNickname?: string;
    likedByMe?: boolean;
    placeReviews?: PlaceReview[];
  },
): TravelRecord {
  return {
    travelRecordId: dto.travelRecordId,
    travelId: dto.travelId,
    authorId: dto.authorId,
    authorNickname: dto.authorNickname ?? extras?.authorNickname ?? '',
    title: dto.title,
    content: dto.content,
    coverImageUrl: dto.coverImageUrl,
    imageUrls: normalizeImageUrls(dto.imageUrls),
    overallRating: normalizeOverallRating(dto.overallRating),
    travelStartDate: dto.travelStartDate,
    travelEndDate: dto.travelEndDate,
    status: dto.status,
    publishedAt: dto.publishedAt,
    likeCount: dto.likeCount,
    viewCount: dto.viewCount,
    likedByMe: dto.likedByMe ?? extras?.likedByMe,
    days: mapDays(dto.days),
    placeReviews: extras?.placeReviews ?? [],
  };
}

/** 피드 아이템 → 앱 TravelRecord (days/후기 없음) */
export function mapTravelRecordFeedItem(dto: TravelRecordFeedResponse): TravelRecord {
  return {
    travelRecordId: dto.travelRecordId,
    travelId: dto.travelId,
    authorId: dto.authorId,
    authorNickname: dto.authorNickname,
    title: dto.title,
    content: dto.content,
    coverImageUrl: dto.coverImageUrl,
    imageUrls: normalizeImageUrls(dto.imageUrls),
    overallRating: normalizeOverallRating(dto.overallRating),
    travelStartDate: dto.travelStartDate,
    travelEndDate: dto.travelEndDate,
    status: 'PUBLISHED',
    publishedAt: dto.publishedAt,
    likeCount: dto.likeCount,
    viewCount: dto.viewCount,
    likedByMe: dto.likedByMe,
    days: [],
    placeReviews: [],
  };
}

/** 북마크 목록 → 앱 TravelRecord */
export function mapTravelRecordBookmarkItem(
  dto: TravelRecordBookmarkResponse,
): TravelRecord {
  return {
    ...mapTravelRecordFeedItem(dto.travelRecord),
    bookmarkedByMe: true,
  };
}

/** 내 기록 관리 목록 → 앱 TravelRecord */
export function mapTravelRecordManageItem(
  dto: TravelRecordManageResponse,
  authorNickname = '',
): TravelRecord {
  return {
    travelRecordId: dto.travelRecordId,
    travelId: dto.travelId,
    authorId: dto.authorId,
    authorNickname,
    title: dto.title,
    content: dto.content,
    coverImageUrl: dto.coverImageUrl,
    imageUrls: normalizeImageUrls(dto.imageUrls),
    overallRating: normalizeOverallRating(dto.overallRating),
    travelStartDate: dto.travelStartDate,
    travelEndDate: dto.travelEndDate,
    status: dto.status,
    publishedAt: dto.publishedAt,
    likeCount: dto.likeCount,
    viewCount: dto.viewCount,
    days: [],
    placeReviews: [],
  };
}

function normalizeOverallRating(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return null;
  }
  return Math.round(value * 10) / 10;
}

export type { TravelRecordComment };
