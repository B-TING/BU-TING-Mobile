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
