import { useLocationConsentStore } from '../../stores/useLocationConsentStore';
import { useLocationStore } from '../../stores/useLocationStore';
import type { EventZoneCoordinate } from '../../types/eventZone';
import {
  checkFineLocationPermission,
  getCurrentCoordinates,
} from './deviceLocation';

/**
 * GPS를 읽고 LocationStore에 기록한다.
 * 권한/동의 검사는 호출부 책임.
 */
export async function fetchAndCacheCoordinates(): Promise<EventZoneCoordinate | null> {
  const coords = await getCurrentCoordinates();
  if (coords) {
    useLocationStore.getState().setCoords(coords);
  }
  return coords;
}

/**
 * 동의·권한이 이미 있을 때만 GPS를 갱신한다.
 * 다이얼로그를 띄우지 않음 (이벤트/홈 화면 백그라운드 워밍용).
 */
export async function refreshLocationCacheIfPermitted(): Promise<EventZoneCoordinate | null> {
  if (!useLocationConsentStore.getState().disclosureAccepted) {
    return null;
  }

  const permission = await checkFineLocationPermission();
  if (permission !== 'granted') {
    return null;
  }

  return fetchAndCacheCoordinates();
}
