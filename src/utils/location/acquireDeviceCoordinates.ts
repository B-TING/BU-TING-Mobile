import type { LocationConsentResult } from '../../components/shared/modals';
import { getCachedCoordinates, useLocationStore } from '../../stores/useLocationStore';
import type { EventZoneCoordinate } from '../../types/eventZone';
import {
  getCurrentCoordinates,
  requestFineLocationPermission,
} from './deviceLocation';

export type AcquireLocationFailure =
  | 'consent_denied'
  | 'permission_denied'
  | 'location_unavailable';

export type AcquireLocationSuccess = {
  ok: true;
  coords: EventZoneCoordinate;
  fromCache: boolean;
};

export type AcquireLocationResult =
  | AcquireLocationSuccess
  | { ok: false; reason: AcquireLocationFailure };

export type AcquireDeviceCoordinatesOptions = {
  ensureLocationConsent: () => Promise<LocationConsentResult>;
  /** 신선 캐시 우선. 기본 true */
  preferCache?: boolean;
  /** GPS로 잡은 좌표를 LocationStore에 기록. 기본 true */
  writeCache?: boolean;
};

/**
 * 대화형 위치 확보 파이프라인 (단일 진입점).
 * 동의 → 권한 → (신선 캐시) → GPS → 스토어 기록.
 *
 * 기능별 해석(부산 안/밖, 반경 판정, 폴백 좌표)은 호출부에서 한다.
 * 조용한 폴링은 `refreshLocationCacheIfPermitted`를 쓴다.
 */
export async function acquireDeviceCoordinates(
  options: AcquireDeviceCoordinatesOptions,
): Promise<AcquireLocationResult> {
  const { ensureLocationConsent, preferCache = true, writeCache = true } = options;

  const consent = await ensureLocationConsent();
  if (consent !== 'accepted') {
    return { ok: false, reason: 'consent_denied' };
  }

  const permission = await requestFineLocationPermission();
  if (permission !== 'granted') {
    return { ok: false, reason: 'permission_denied' };
  }

  if (preferCache) {
    const cached = getCachedCoordinates();
    if (cached) {
      return { ok: true, coords: cached, fromCache: true };
    }
  }

  const coords = await getCurrentCoordinates();
  if (!coords) {
    return { ok: false, reason: 'location_unavailable' };
  }

  if (writeCache) {
    useLocationStore.getState().setCoords(coords);
  }

  return { ok: true, coords, fromCache: false };
}
