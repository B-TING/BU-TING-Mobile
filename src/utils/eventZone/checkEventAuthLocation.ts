import { DEV_SNAP_EVENT_AUTH_COORDS, resolveEventAuthTarget } from '../../constants/eventZone/eventGame';
import type { LocationConsentResult } from '../../components/shared/modals';
import type { EventZoneCoordinate, ZoneEvent } from '../../types/eventZone';
import { acquireDeviceCoordinates } from '../location/acquireDeviceCoordinates';
import {
  evaluateAuthRadius,
  type AuthRadiusEvaluation,
} from './authRadius';

export type EventAuthLocationCheck =
  | AuthRadiusEvaluation
  | { status: 'consent_denied' }
  | { status: 'permission_denied' }
  | { status: 'location_unavailable' };

/**
 * DEV에서 인증 타겟 좌표를 사용자 좌표로 쓴다.
 * 서버 반경 검증까지 통과하려면 join/submit에도 이 좌표를 보내야 한다.
 */
export function resolveEventAuthUserCoords(
  event: ZoneEvent,
  fallback: EventZoneCoordinate | null | undefined,
  targetId?: string | null,
): EventZoneCoordinate | null {
  if (__DEV__ && DEV_SNAP_EVENT_AUTH_COORDS) {
    const target = resolveEventAuthTarget(event, targetId);
    if (target) {
      return { lat: target.latitude, lng: target.longitude };
    }
  }
  return fallback ?? null;
}

/**
 * 동의 → 권한 → GPS(캐시 우선) → 인증 반경 판정.
 * Phase 1: 반경 안에서만 참여·촬영 허용.
 */
export async function checkEventAuthLocation(
  event: ZoneEvent,
  ensureLocationConsent: () => Promise<LocationConsentResult>,
  targetId?: string | null,
): Promise<EventAuthLocationCheck> {
  const snapped = resolveEventAuthUserCoords(event, null, targetId);
  if (snapped) {
    return evaluateAuthRadius(snapped, event, targetId);
  }

  const acquired = await acquireDeviceCoordinates({ ensureLocationConsent });
  if (!acquired.ok) {
    return { status: acquired.reason };
  }

  return evaluateAuthRadius(acquired.coords, event, targetId);
}
