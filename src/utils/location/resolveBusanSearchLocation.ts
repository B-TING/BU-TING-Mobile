import { DEFAULT_USER_LOCATION_BUSAN } from '../../constants/eventZone/eventZone';
import type { EventZoneCoordinate } from '../../types/eventZone';
import { isInsideBusanBounds } from '../eventZone/zoneResolver';
import type { LocationConsentResult } from '../../components/shared/modals';
import { acquireDeviceCoordinates } from './acquireDeviceCoordinates';

export type BusanSearchLocationResult = {
  location: EventZoneCoordinate;
  status: 'ready' | 'fallback';
};

/**
 * 지도 검색 중심점: 공통 좌표 확보 후 부산 안이면 현재 위치, 아니면 부산역.
 */
export async function resolveBusanSearchLocation(
  ensureLocationConsent: () => Promise<LocationConsentResult>,
): Promise<BusanSearchLocationResult> {
  const acquired = await acquireDeviceCoordinates({ ensureLocationConsent });
  if (!acquired.ok || !isInsideBusanBounds(acquired.coords)) {
    return { location: DEFAULT_USER_LOCATION_BUSAN, status: 'fallback' };
  }

  return { location: acquired.coords, status: 'ready' };
}
