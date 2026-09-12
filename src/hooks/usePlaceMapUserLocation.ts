import { useEffect, useState } from 'react';

import { useLocationConsent } from '../components/shared/modals';
import { DEFAULT_USER_LOCATION_BUSAN } from '../constants/eventZone/eventZone';
import type { EventZoneCoordinate } from '../types/eventZone';
import { resolveBusanSearchLocation } from '../utils/location/resolveBusanSearchLocation';

export type PlaceMapLocationStatus = 'loading' | 'ready' | 'fallback';

/**
 * 장소 지도 검색·인근 시설(짐 보관소)용 초기 중심점.
 * 좌표 확보는 `resolveBusanSearchLocation` → `acquireDeviceCoordinates`.
 * - 동의·권한·GPS 성공 + 부산 안 → 현재 위치
 * - 그 외(거절/실패/부산 외) → 부산역 기본 좌표
 */
export function usePlaceMapUserLocation() {
  const { ensureLocationConsent } = useLocationConsent();
  const [location, setLocation] = useState<EventZoneCoordinate>(
    DEFAULT_USER_LOCATION_BUSAN,
  );
  const [status, setStatus] = useState<PlaceMapLocationStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    resolveBusanSearchLocation(ensureLocationConsent).then(result => {
      if (cancelled) {
        return;
      }
      setLocation(result.location);
      setStatus(result.status);
    });

    return () => {
      cancelled = true;
    };
  }, [ensureLocationConsent]);

  return { location, status };
}

/**
 * enabled일 때만 GPS/동의로 부산 검색 중심을 구한다.
 * (일정에 당일 장소가 없을 때 여행지 추가 초깃값용)
 */
export function useBusanSearchLocationWhen(enabled: boolean) {
  const { ensureLocationConsent } = useLocationConsent();
  const [location, setLocation] = useState<EventZoneCoordinate | null>(null);
  const [status, setStatus] = useState<PlaceMapLocationStatus | 'idle'>('idle');

  useEffect(() => {
    if (!enabled) {
      setLocation(null);
      setStatus('idle');
      return;
    }

    let cancelled = false;
    setStatus('loading');
    setLocation(null);

    resolveBusanSearchLocation(ensureLocationConsent).then(result => {
      if (cancelled) {
        return;
      }
      setLocation(result.location);
      setStatus(result.status);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, ensureLocationConsent]);

  return { location, status };
}
