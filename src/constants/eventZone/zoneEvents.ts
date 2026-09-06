import type { EventZoneId, ZoneEvent, ZoneEventType } from '../../types/eventZone';
import { EVENT_ZONES } from './eventZone';

/** 이벤트 종류별 기본 메타 (기획 확정 전 목업) */
export const ZONE_EVENT_TYPE_META: Record<
  ZoneEventType,
  {
    labelKo: string;
    emoji: string;
    /** 기본 지속 시간(분) */
    defaultDurationMinutes: number;
    descriptionKo: string;
  }
> = {
  walk_conquest: {
    labelKo: '부산 도보 정복전',
    emoji: '🚶',
    defaultDurationMinutes: 60 * 24 * 7,
    descriptionKo: '이번 주 이 구역을 걸어서 정복하고 배지를 모아보세요.',
  },
  receipt_auth: {
    labelKo: '소울푸드 영수증 인증',
    emoji: '🍜',
    defaultDurationMinutes: 120,
    descriptionKo: '지금 이 구역 맛집 영수증을 인증하면 리워드를 드려요.',
  },
  qr_cross: {
    labelKo: '핫플 QR 크로스',
    emoji: '📸',
    defaultDurationMinutes: 60,
    descriptionKo: '핫플레이스 QR을 찍고 미션을 완료하세요. (게릴라)',
  },
  zone_battle: {
    labelKo: '타 구역 유저와 대결',
    emoji: '⚔️',
    defaultDurationMinutes: 30,
    descriptionKo: '다른 구역 유저와 실시간 대결! 알림을 켠 유저 대상.',
  },
  PLACE_AUTH: {
    labelKo: '장소 인증 미션',
    emoji: '📍',
    defaultDurationMinutes: 45,
    descriptionKo:
      '목표 장소 반경 안에서 촬영·제출하세요. GPS 1차 통과 후 관리자 검수로 확정됩니다.',
  },
  OBJECT_AUTH: {
    labelKo: '사물 인증 미션',
    emoji: '🔍',
    defaultDurationMinutes: 30,
    descriptionKo:
      '목표 사물을 반경 안에서 촬영·제출하세요. GPS 1차 통과 후 관리자 검수로 확정됩니다.',
  },
  MUKJJIPPA: {
    labelKo: '묵찌빠 대결',
    emoji: '✊',
    defaultDurationMinutes: 20,
    descriptionKo: '다른 구역 유저와 묵찌빠로 대결해 승리하세요. (목업)',
  },
};

export const ZONE_EVENT_TYPES: ZoneEventType[] = Object.keys(
  ZONE_EVENT_TYPE_META,
) as ZoneEventType[];

let mockEventSeq = 0;

/** 구역 + 타입으로 목업 이벤트 VO 생성 */
export function buildMockZoneEvent(
  zoneId: EventZoneId,
  type: ZoneEventType,
  startsAt: string = new Date().toISOString(),
): ZoneEvent {
  const meta = ZONE_EVENT_TYPE_META[type];
  mockEventSeq += 1;

  return {
    id: `zone-event-${mockEventSeq}`,
    type,
    zoneId,
    titleKo: meta.labelKo,
    descriptionKo: meta.descriptionKo,
    startsAt,
    durationMinutes: meta.defaultDurationMinutes,
  };
}

/** 개발용: 랜덤 구역 + 랜덤 타입 이벤트 생성 */
export function buildRandomMockZoneEvent(): ZoneEvent {
  const zone = EVENT_ZONES[Math.floor(Math.random() * EVENT_ZONES.length)];
  const type = ZONE_EVENT_TYPES[Math.floor(Math.random() * ZONE_EVENT_TYPES.length)];
  return buildMockZoneEvent(zone.id, type);
}

/** 이벤트 종료 시각 계산 (API endsAt 우선) */
export function zoneEventEndsAt(event: ZoneEvent): number {
  if (event.endsAt) {
    const parsed = new Date(event.endsAt).getTime();
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return new Date(event.startsAt).getTime() + event.durationMinutes * 60_000;
}

export function zoneEventTypeCode(event: ZoneEvent): string {
  return event.typeCode ?? event.type;
}

export function isZoneEventActive(event: ZoneEvent, now = Date.now()): boolean {
  if (event.status === 'CLOSED' || event.status === 'CANCELLED') {
    return false;
  }
  if (typeof event.remainingSeconds === 'number' && event.fetchedAt != null) {
    const elapsedSec = Math.floor((now - event.fetchedAt) / 1000);
    return event.remainingSeconds - elapsedSec > 0;
  }
  const start = new Date(event.startsAt).getTime();
  return now >= start && now < zoneEventEndsAt(event);
}
