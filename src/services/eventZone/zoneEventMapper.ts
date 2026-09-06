import { EVENT_ZONES } from '../../constants/eventZone/eventZone';
import type {
  EventZoneId,
  ZoneEvent,
  ZoneEventAuthTarget,
  ZoneEventType,
} from '../../types/eventZone';
import type {
  ZoneEventAuthTargetBriefResponse,
  ZoneEventAuthTargetDetailResponse,
  ZoneEventDetailResponse,
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
