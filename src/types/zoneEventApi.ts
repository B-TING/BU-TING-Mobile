import type { EquippedTitleResponse } from './zoneTitleApi';

/** GET /api/v1/zone-events* · /zone-event-rounds/current 응답 DTO */

export type ZoneEventApiZoneRef = {
  zoneId: string;
  zoneName?: string | null;
};

export type ZoneEventRewardSummaryResponse = {
  points?: number | null;
  badgeCode?: string | null;
  topN?: number | null;
  prizeRewardCode?: string | null;
};

export type ZoneEventAuthTargetBriefResponse = {
  placeName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radiusM?: number | null;
};

export type ZoneEventAuthTargetDetailResponse = {
  targetId?: string | null;
  targetKind?: string | null;
  landmarkId?: string | null;
  placeName?: string | null;
  guideText?: string | null;
  exampleImageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radiusM?: number | null;
};

export type ZoneEventSummaryResponse = {
  eventId: string;
  zone: ZoneEventApiZoneRef;
  typeCode: string;
  typeName?: string | null;
  requiresUpload?: boolean;
  title?: string | null;
  description?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  durationMinutes?: number | null;
  remainingSeconds: number;
  status?: string | null;
  roundId?: string | null;
  baseReward?: ZoneEventRewardSummaryResponse | null;
  authTarget?: ZoneEventAuthTargetBriefResponse | null;
  successCount?: number;
  myParticipationStatus?: string | null;
  myOpenParticipationId?: string | null;
};

export type ZoneEventDetailResponse = {
  eventId: string;
  zone: ZoneEventApiZoneRef;
  typeCode: string;
  typeName?: string | null;
  requiresUpload?: boolean;
  title?: string | null;
  description?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  durationMinutes?: number | null;
  remainingSeconds: number;
  status?: string | null;
  roundId?: string | null;
  baseReward?: ZoneEventRewardSummaryResponse | null;
  excellenceReward?: ZoneEventRewardSummaryResponse | null;
  authTarget?: ZoneEventAuthTargetDetailResponse | null;
  successCount?: number;
  successLimitPerUser?: number | null;
  myRemainingAttempts?: number | null;
  round?: unknown;
};

export type ZoneEventRoundSlotStatus = 'OPEN' | 'REST' | 'UPCOMING' | string;

export type ZoneEventRoundSlotResponse = {
  zoneId: string;
  slotStatus: ZoneEventRoundSlotStatus;
  eventId?: string | null;
};

export type ZoneEventRoundStatusResponse = {
  roundId: string;
  status: string;
  startsAt?: string | null;
  endsAt?: string | null;
  zones?: ZoneEventRoundSlotResponse[] | null;
};

export type ZoneEventParticipationJoinRequest = {
  latitude: number;
  longitude: number;
};

export type ZoneEventParticipationResponse = {
  participationId: string;
  eventId: string;
  zoneId?: string | null;
  typeCode?: string | null;
  status?: string | null;
  success?: boolean | null;
  distanceM?: number | null;
  mediaUrl?: string | null;
  content?: string | null;
  likeCount?: number;
  visibility?: string | null;
  joinedAt?: string | null;
  completedAt?: string | null;
};

export type ZoneEventParticipationSubmitRequest = {
  mediaFileKey: string;
  content?: string | null;
  latitude: number;
  longitude: number;
  capturedAt?: string | null;
};

export type ZoneEventSubmitResultResponse = {
  participation: ZoneEventParticipationResponse;
  rewards?: ZoneEventGrantedRewardResponse[] | null;
  pointBalance?: number;
  newlyEarnedTitles?: EquippedTitleResponse[] | null;
  titleProgress?: unknown;
};

export type ZoneEventGrantedRewardResponse = {
  grantId?: string | null;
  rewardType?: string | null;
  code?: string | null;
  name?: string | null;
  pointAmount?: number | null;
  grantReason?: string | null;
  grantedAt?: string | null;
};

export type ZoneEventHistoryEventBriefResponse = {
  eventId: string;
  title?: string | null;
  typeCode?: string | null;
  zone?: ZoneEventApiZoneRef | null;
  roundId?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type ZoneEventHistoryItemResponse = {
  participationId: string;
  status?: string | null;
  event: ZoneEventHistoryEventBriefResponse;
  mediaUrl?: string | null;
  mediaUrlExpiresIn?: number | null;
  content?: string | null;
  likeCount?: number;
  commentCount?: number;
  visibility?: string | null;
  joinedAt?: string | null;
  completedAt?: string | null;
};

export type ZoneEventHistoryPageResponse = {
  items?: ZoneEventHistoryItemResponse[] | null;
  nextCursor?: string | null;
  hasNext?: boolean;
};

export type ZoneEventHistoryQuery = {
  zone?: string;
  type?: string;
  status?: string;
  from?: string;
  to?: string;
  cursor?: string;
  size?: number;
};

export type ZoneEventAlbumSortParam = 'LATEST' | 'MOST_LIKED';

export type ZoneEventAlbumQuery = {
  sort?: ZoneEventAlbumSortParam;
  cursor?: string;
  size?: number;
};

export type ZoneEventAlbumItemResponse = {
  participationId: string;
  eventId: string;
  eventTitle?: string | null;
  zoneId: string;
  authorId: string;
  authorNickname?: string | null;
  authorProfileImageUrl?: string | null;
  equippedTitle?: EquippedTitleResponse | null;
  content?: string | null;
  mediaUrl?: string | null;
  mediaUrlExpiresIn?: number | null;
  likeCount?: number;
  likedByMe?: boolean;
  commentCount?: number;
  isMine?: boolean;
  completedAt?: string | null;
};

export type ZoneEventAlbumPageResponse = {
  items?: ZoneEventAlbumItemResponse[] | null;
  nextCursor?: string | null;
  hasNext?: boolean;
};

export type ZoneEventVisibilityUpdateRequest = {
  visibility: 'PUBLIC' | 'PRIVATE';
};

export type ZoneEventLikeResponse = {
  likeId: string;
  participationId: string;
  likedAt?: string | null;
  likeCount?: number;
};

export type ZoneEventCommentResponse = {
  commentId: string;
  participationId: string;
  authorId: string;
  authorNickname?: string | null;
  authorProfileImageUrl?: string | null;
  equippedTitle?: EquippedTitleResponse | null;
  content?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ZoneEventCommentPageResponse = {
  items?: ZoneEventCommentResponse[] | null;
  nextCursor?: string | null;
  hasNext?: boolean;
};

export type ZoneEventCommentQuery = {
  cursor?: string;
  size?: number;
};

export type ZoneEventCommentRequest = {
  content: string;
};

export type ZoneEventReportReasonCode =
  | 'NOT_ON_SITE'
  | 'INAPPROPRIATE'
  | 'SPAM'
  | 'OTHER';

export type ZoneEventReportRequest = {
  reasonCode: ZoneEventReportReasonCode;
  memo?: string;
};

export type ZoneEventReportResponse = {
  reportId: string;
  participationId: string;
  createdAt?: string | null;
};

