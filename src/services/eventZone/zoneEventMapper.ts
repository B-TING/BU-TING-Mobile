import { EVENT_ZONES } from '../../constants/eventZone/eventZone';
import type { EventParticipationRecord, EventParticipationStatus } from '../../types/eventParticipation';
import type {
  EventZoneId,
  ZoneEvent,
  ZoneEventAuthTarget,
  ZoneEventType,
} from '../../types/eventZone';
import type { EventAlbumComment, EventAlbumPost } from '../../types/eventAlbum';
import type { EquippedTitleResponse } from '../../types/zoneTitleApi';
import type {
  ZoneEventAlbumItemResponse,
  ZoneEventAuthTargetBriefResponse,
  ZoneEventAuthTargetDetailResponse,
  ZoneEventCommentResponse,
  ZoneEventDetailResponse,
  ZoneEventHistoryItemResponse,
  ZoneEventParticipationResponse,
  ZoneEventRoundStatusResponse,
  ZoneEventSummaryResponse,
} from '../../types/zoneEventApi';

const DEFAULT_AUTH_RADIUS_M = 150;
const EVENT_ZONE_ID_SET = new Set<string>(EVENT_ZONES.map(zone => zone.id));

export function isEventZoneId(value: string | null | undefined): value is EventZoneId {
  return typeof value === 'string' && EVENT_ZONE_ID_SET.has(value);
}

function asString(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

export function mapEquippedTitle(value: unknown): EquippedTitleResponse | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const dto = value as Record<string, unknown>;
  const titleName = asString(dto.titleName);
  const zoneId = asString(dto.zoneId);
  if (!titleName || !isEventZoneId(zoneId)) {
    return undefined;
  }
  return {
    titleCode: asString(dto.titleCode) || titleName,
    titleName,
    zoneId,
    tier: asNumber(dto.tier) ?? 0,
    style: asString(dto.style) || undefined,
    color: asString(dto.color) || undefined,
  };
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function mapTypeCode(typeCode: string): ZoneEventType {
  if (
    typeCode === 'PLACE_AUTH' ||
    typeCode === 'OBJECT_AUTH' ||
    typeCode === 'MUKJJIPPA' ||
    typeCode === 'walk_conquest' ||
    typeCode === 'receipt_auth' ||
    typeCode === 'qr_cross' ||
    typeCode === 'zone_battle'
  ) {
    return typeCode;
  }
  return 'PLACE_AUTH';
}

function mapBriefAuthTarget(
  eventId: string,
  typeCode: string,
  dto: ZoneEventAuthTargetBriefResponse | null | undefined,
): ZoneEventAuthTarget[] {
  if (!dto) {
    return [];
  }
  const latitude = asNumber(dto.latitude);
  const longitude = asNumber(dto.longitude);
  if (latitude == null || longitude == null) {
    return [];
  }
  const kind = typeCode === 'OBJECT_AUTH' ? 'OBJECT' : 'PLACE';
  const placeNameKo = asString(dto.placeName) || '인증 장소';
  return [
    {
      targetId: `${eventId}-target`,
      kind,
      placeNameKo,
      latitude,
      longitude,
      radiusM: asNumber(dto.radiusM) ?? DEFAULT_AUTH_RADIUS_M,
      objectLabelKo: kind === 'OBJECT' ? placeNameKo : undefined,
    },
  ];
}

function mapDetailAuthTarget(
  eventId: string,
  typeCode: string,
  dto: ZoneEventAuthTargetDetailResponse | null | undefined,
): ZoneEventAuthTarget[] {
  if (!dto) {
    return [];
  }
  const latitude = asNumber(dto.latitude);
  const longitude = asNumber(dto.longitude);
  if (latitude == null || longitude == null) {
    return [];
  }
  const kind =
    asString(dto.targetKind).toUpperCase() === 'OBJECT' || typeCode === 'OBJECT_AUTH'
      ? 'OBJECT'
      : 'PLACE';
  const placeNameKo = asString(dto.placeName) || '인증 장소';
  return [
    {
      targetId: asString(dto.targetId) || `${eventId}-target`,
      kind,
      placeNameKo,
      landmarkId: asString(dto.landmarkId) || undefined,
      latitude,
      longitude,
      radiusM: asNumber(dto.radiusM) ?? DEFAULT_AUTH_RADIUS_M,
      objectLabelKo: kind === 'OBJECT' ? placeNameKo : undefined,
      guideText: asString(dto.guideText) || undefined,
      exampleImageUrl: asString(dto.exampleImageUrl) || undefined,
    },
  ];
}

function mapSharedFields(dto: {
  eventId: string;
  zone: { zoneId: string };
  typeCode: string;
  typeName?: string | null;
  title?: string | null;
  description?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  durationMinutes?: number | null;
  remainingSeconds: number;
  status?: string | null;
  roundId?: string | null;
}): ZoneEvent | null {
  if (!isEventZoneId(dto.zone?.zoneId)) {
    return null;
  }
  const eventId = asString(dto.eventId);
  const typeCode = asString(dto.typeCode);
  if (!eventId || !typeCode) {
    return null;
  }
  const remainingSeconds = asNumber(dto.remainingSeconds) ?? 0;
  const durationMinutes = asNumber(dto.durationMinutes) ?? 0;
  const startsAt = asString(dto.startsAt) || new Date().toISOString();

  return {
    id: eventId,
    type: mapTypeCode(typeCode),
    typeCode,
    zoneId: dto.zone.zoneId,
    titleKo: asString(dto.title) || asString(dto.typeName) || typeCode,
    descriptionKo: asString(dto.description),
    startsAt,
    endsAt: asString(dto.endsAt) || undefined,
    durationMinutes,
    remainingSeconds,
    fetchedAt: Date.now(),
    status: asString(dto.status) || undefined,
    roundId: asString(dto.roundId) || undefined,
  };
}

/** 활성 목록 DTO → 허브·홈에서 쓰는 ZoneEvent */
export function mapZoneEventSummary(dto: ZoneEventSummaryResponse): ZoneEvent | null {
  const mapped = mapSharedFields(dto);
  if (!mapped) {
    return null;
  }
  return {
    ...mapped,
    myParticipationStatus: dto.myParticipationStatus ?? undefined,
    myOpenParticipationId: asString(dto.myOpenParticipationId) || undefined,
    authTargets: mapBriefAuthTarget(mapped.id, mapped.typeCode ?? mapped.type, dto.authTarget),
  };
}

/** 상세 DTO → ZoneEvent (가이드·예시 이미지 포함) */
export function mapZoneEventDetail(dto: ZoneEventDetailResponse): ZoneEvent | null {
  const mapped = mapSharedFields(dto);
  if (!mapped) {
    return null;
  }
  return {
    ...mapped,
    myRemainingAttempts: dto.myRemainingAttempts ?? undefined,
    authTargets: mapDetailAuthTarget(mapped.id, mapped.typeCode ?? mapped.type, dto.authTarget),
  };
}

export function mapActiveZoneEvents(dtos: ZoneEventSummaryResponse[]): ZoneEvent[] {
  return dtos
    .map(mapZoneEventSummary)
    .filter((event): event is ZoneEvent => event != null);
}

export type MappedZoneEventRound = {
  roundId: string;
  status: string;
  startsAt?: string;
  endsAt?: string;
  zones: Array<{
    zoneId: EventZoneId;
    slotStatus: string;
    eventId?: string;
  }>;
};

export function mapCurrentZoneEventRound(
  dto: ZoneEventRoundStatusResponse | null | undefined,
): MappedZoneEventRound | null {
  if (!dto) {
    return null;
  }
  const roundId = asString(dto.roundId);
  if (!roundId) {
    return null;
  }
  return {
    roundId,
    status: asString(dto.status),
    startsAt: asString(dto.startsAt) || undefined,
    endsAt: asString(dto.endsAt) || undefined,
    zones: (dto.zones ?? [])
      .filter(slot => isEventZoneId(slot.zoneId))
      .map(slot => ({
        zoneId: slot.zoneId as EventZoneId,
        slotStatus: asString(slot.slotStatus),
        eventId: asString(slot.eventId) || undefined,
      })),
  };
}

export function mapParticipationStatus(
  status: string | null | undefined,
): EventParticipationStatus {
  if (status === 'SUCCESS') {
    return 'approved';
  }
  if (status === 'FAIL' || status === 'REVOKED' || status === 'CANCELLED') {
    return 'rejected';
  }
  if (status === 'JOINED') {
    return 'in_progress';
  }
  return 'pending_review';
}

export function mapSubmitParticipationStatus(
  status: string | null | undefined,
): 'pending_review' | 'approved' | 'rejected' {
  const mapped = mapParticipationStatus(status);
  return mapped === 'in_progress' ? 'pending_review' : mapped;
}

function mapPhase1TypeCode(
  typeCode: string | null | undefined,
): Extract<ZoneEventType, 'PLACE_AUTH' | 'OBJECT_AUTH'> | null {
  if (typeCode === 'PLACE_AUTH' || typeCode === 'OBJECT_AUTH') {
    return typeCode;
  }
  return null;
}

export function mapHistoryItemToRecord(
  dto: ZoneEventHistoryItemResponse,
): EventParticipationRecord | null {
  const participationId = asString(dto.participationId);
  const eventId = asString(dto.event?.eventId);
  const zoneId = dto.event?.zone?.zoneId;
  const eventType = mapPhase1TypeCode(dto.event?.typeCode);
  if (!participationId || !eventId || !isEventZoneId(zoneId) || !eventType) {
    return null;
  }
  if (asString(dto.status) === 'CANCELLED') {
    return null;
  }
  const joinedAt = asString(dto.joinedAt) || new Date().toISOString();
  const completedAt = asString(dto.completedAt) || undefined;
  return {
    id: participationId,
    eventId,
    zoneId,
    eventType,
    eventTitleKo: asString(dto.event?.title) || eventType,
    status: mapParticipationStatus(dto.status),
    createdAt: joinedAt,
    submittedAt: completedAt,
  };
}

export function mapAlbumItemToPost(
  dto: ZoneEventAlbumItemResponse,
): EventAlbumPost | null {
  const participationId = asString(dto.participationId);
  const eventId = asString(dto.eventId);
  const zoneId = dto.zoneId;
  if (!participationId || !eventId || !isEventZoneId(zoneId)) {
    return null;
  }
  const eventType: EventAlbumPost['eventType'] = 'PLACE_AUTH';
  return {
    id: participationId,
    participationId,
    eventId,
    zoneId,
    eventTitleKo: asString(dto.eventTitle) || eventId,
    eventType,
    authorId: asString(dto.authorId),
    authorNickname: asString(dto.authorNickname) || '여행자',
    equippedTitle: mapEquippedTitle(dto.equippedTitle),
    content: asString(dto.content) || undefined,
    localImageUri: asString(dto.mediaUrl) || undefined,
    likeCount: asNumber(dto.likeCount) ?? 0,
    likedByMe: Boolean(dto.likedByMe),
    comments: [],
    commentCount: asNumber(dto.commentCount) ?? 0,
    visibility: 'public',
    isMine: Boolean(dto.isMine),
    completedAt: asString(dto.completedAt) || new Date().toISOString(),
  };
}

export function mapAlbumComment(
  dto: ZoneEventCommentResponse,
): EventAlbumComment | null {
  const id = asString(dto.commentId);
  if (!id) {
    return null;
  }
  return {
    id,
    authorId: asString(dto.authorId),
    authorNickname: asString(dto.authorNickname) || '여행자',
    content: asString(dto.content),
    createdAt: asString(dto.createdAt) || new Date().toISOString(),
  };
}

export function mapParticipationToRecord(
  dto: ZoneEventParticipationResponse,
): EventParticipationRecord | null {
  const participationId = asString(dto.participationId);
  const eventId = asString(dto.eventId);
  const zoneId = dto.zoneId;
  const eventType = mapPhase1TypeCode(dto.typeCode);
  if (!participationId || !eventId || !isEventZoneId(zoneId) || !eventType) {
    return null;
  }
  const joinedAt = asString(dto.joinedAt) || new Date().toISOString();
  const completedAt = asString(dto.completedAt) || undefined;
  return {
    id: participationId,
    eventId,
    zoneId,
    eventType,
    eventTitleKo: eventType,
    status: mapParticipationStatus(dto.status),
    createdAt: joinedAt,
    submittedAt: completedAt,
  };
}

