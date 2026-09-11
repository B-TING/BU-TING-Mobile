import type { PlaceProviderDto } from './travelApi';
import type { RouteItemType } from './travelPlan';

export type TravelRecordStatus = 'DRAFT' | 'PUBLISHED' | 'HIDDEN';

export type TransportType = 'CAR' | 'PUBLIC_TRANSPORT' | 'WALK';

export type ReviewMediaType = 'image' | 'video';

export type ReviewMedia = {
  mediaId: string;
  type: ReviewMediaType;
  uri: string;
  thumbnailUri?: string;
  /** S3 object key from upload response (optional; used for delete) */
  fileKey?: string;
  mimeType?: string;
  fileName?: string;
};

/** OpenAPI `PlaceReviewResponse` (+ client display fields) */
export type PlaceReview = {
  placeReviewId: string;
  /** 일정 장소 ID — 초안 전 후기는 여기에 붙음 */
  planPlaceId: string | null;
  /** 여행기 스냅샷 장소 ID — 초안 생성 후 복사본에 붙을 수 있음 */
  travelRecordPlaceId: string | null;
  rating: number;
  stayMinutes?: number | null;
  content: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  /** Client-only: place label for local UI */
  placeName: string;
  /** Client display; 저장 시에는 `mediaFileKeys`로 서버에 전달 */
  media: ReviewMedia[];
};

/** OpenAPI `TravelRecordRouteResponse` */
export type TravelRecordRoute = {
  transportType: TransportType;
  durationMinutes: number | null;
  distanceMeters: number | null;
  provider: PlaceProviderDto;
};

/** OpenAPI `TravelRecordPlaceResponse` (+ client route type for plan import) */
export type TravelRecordPlace = {
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
  routeToNext: TravelRecordRoute | null;
  /** Client-only: maps back to local RouteItem.type when importing a plan */
  routeItemType?: RouteItemType;
};

/** OpenAPI `TravelRecordDayResponse` */
export type TravelRecordDay = {
  travelRecordDayId: string;
  originalPlanId: string | null;
  dayNumber: number;
  visitDate: string;
  places: TravelRecordPlace[];
};

/** OpenAPI `TravelRecordCommentResponse` */
export type TravelRecordComment = {
  commentId: string;
  travelRecordId: string;
  authorId: string;
  authorNickname: string;
  authorProfileImageUrl: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Session UI state for likes/comments (API-backed).
 * Prefer `likeCount` / `likedByMe` when present.
 */
export type TravelRecordSocial = {
  likedUserIds: string[];
  comments: TravelRecordComment[];
  /** API likeCount (preferred over likedUserIds.length) */
  likeCount?: number;
  likedByMe?: boolean;
};

/**
 * OpenAPI `TravelRecordResponse` / feed fields used by the app.
 * `placeReviews` is a client aggregation for local detail UI.
 */
export type TravelRecord = {
  travelRecordId: string;
  /** 이 여행기가 생성된 원본 Travel ID */
  travelId: string | null;
  authorId: string;
  authorNickname: string;
  title: string | null;
  content: string | null;
  coverImageUrl: string | null;
  /** 여행기 사진 URL 목록 (상세). 없으면 빈 배열 */
  imageUrls: string[];
  /** 서버 종합 평점 (피드/목록). 없으면 placeReviews 평균 사용 */
  overallRating: number | null;
  travelStartDate: string | null;
  travelEndDate: string | null;
  status: TravelRecordStatus;
  publishedAt: string | null;
  likeCount: number;
  viewCount: number;
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
  days: TravelRecordDay[];
  placeReviews: PlaceReview[];
};
