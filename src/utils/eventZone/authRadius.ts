import { resolveEventAuthTarget } from '../../constants/eventZone/eventGame';
import type { EventZoneCoordinate, ZoneEvent } from '../../types/eventZone';
import { haversineKm } from '../geo/geo';

export type AuthRadiusEvaluation =
  | {
      status: 'inside';
      distanceM: number;
      radiusM: number;
    }
  | {
      status: 'outside';
      distanceM: number;
      radiusM: number;
    }
  | {
      status: 'no_target';
    };

export function distanceMetersBetween(
  from: EventZoneCoordinate,
  to: { latitude: number; longitude: number },
): number {
  return haversineKm(from.lat, from.lng, to.latitude, to.longitude) * 1000;
}

/** 사용자 좌표가 이벤트 인증 반경 안인지 판정. 타겟 없으면 no_target. */
export function evaluateAuthRadius(
  user: EventZoneCoordinate | null | undefined,
  event: ZoneEvent,
  targetId?: string | null,
): AuthRadiusEvaluation {
  const target = resolveEventAuthTarget(event, targetId);
  if (!target) {
    return { status: 'no_target' };
  }

  if (!user) {
    return {
      status: 'outside',
      distanceM: Number.POSITIVE_INFINITY,
      radiusM: target.radiusM,
    };
  }

  const distanceM = distanceMetersBetween(user, target);
  if (distanceM <= target.radiusM) {
    return {
      status: 'inside',
      distanceM,
      radiusM: target.radiusM,
    };
  }

  return {
    status: 'outside',
    distanceM,
    radiusM: target.radiusM,
  };
}

export function isWithinAuthRadius(
  user: EventZoneCoordinate,
  event: ZoneEvent,
  targetId?: string | null,
): boolean {
  return evaluateAuthRadius(user, event, targetId).status === 'inside';
}

/** 1km 이상은 km, 미만은 m. */
export function formatAuthDistanceM(distanceM: number): string {
  if (!Number.isFinite(distanceM) || distanceM < 0) {
    return '—';
  }
  if (distanceM >= 1000) {
    const km = distanceM / 1000;
    const value = km >= 10 ? Math.round(km).toString() : km.toFixed(1);
    return `${value}km`;
  }
  return `${Math.round(distanceM)}m`;
}
