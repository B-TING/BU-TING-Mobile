import { useEffect, useMemo, useState } from 'react';

import { useLocationConsent } from '../components/shared/modals';
import { DEFAULT_USER_LOCATION_BUSAN } from '../constants/eventZone/eventZone';
import { useLocationStore } from '../stores/useLocationStore';
import type { EventZoneCoordinate, EventZoneId } from '../types/eventZone';
import {
  isInsideBusanBounds,
  resolveEventZoneFromCoordinate,
} from '../utils/eventZone/zoneResolver';
import { acquireDeviceCoordinates } from '../utils/location/acquireDeviceCoordinates';

export type CurrentEventZoneStatus = 'loading' | 'ready' | 'fallback';

export type CurrentEventZoneState = {
  /** 부산 안이면 구역 ID. 부산 밖·위치 미확인이면 null(채팅 미소속). */
  zoneId: EventZoneId | null;
  /** 지도 카메라 등용. 폴백 시 부산역. */
  location: EventZoneCoordinate;
  /** GPS/권한을 쓰지 못함 (채팅 소속으로 부산에 있다고 치지 않음) */
  usedFallback: boolean;
  status: CurrentEventZoneStatus;
};

/**
 * 채팅 구역·홈 위젯용 현재 위치/구역.
 * - LocationStore 캐시/폴링과 연동 (#182)
 * - 좌표 확보는 `acquireDeviceCoordinates` 단일 파이프라인
 * - 동의·권한·GPS 성공 + 부산 안 → 해당 구역
 * - 부산 밖 → zoneId null (미소속)
 * - 거절/실패 → zoneId null + usedFallback
 */
export function useCurrentEventZone(): CurrentEventZoneState {
  const { ensureLocationConsent } = useLocationConsent();
  const coords = useLocationStore(s => s.coords);
  /** 캐시가 없을 때만 쓰는 부트스트랩 상태 */
  const [bootStatus, setBootStatus] = useState<CurrentEventZoneStatus>(
    coords ? 'ready' : 'loading',
  );

  useEffect(() => {
    if (coords) {
      setBootStatus('ready');
    }
  }, [coords]);

  useEffect(() => {
    if (useLocationStore.getState().coords) {
      return;
    }

    let cancelled = false;

    (async () => {
      setBootStatus('loading');

      const acquired = await acquireDeviceCoordinates({ ensureLocationConsent });
      if (cancelled) {
        return;
      }

      setBootStatus(acquired.ok ? 'ready' : 'fallback');
    })().catch(() => {
      if (cancelled) {
        return;
      }
      setBootStatus('fallback');
    });

    return () => {
      cancelled = true;
    };
  }, [ensureLocationConsent]);

  return useMemo((): CurrentEventZoneState => {
    if (coords) {
      return {
        zoneId: isInsideBusanBounds(coords)
          ? resolveEventZoneFromCoordinate(coords)
          : null,
        location: coords,
        usedFallback: false,
        status: 'ready',
      };
    }

    if (bootStatus === 'loading') {
      return {
        zoneId: null,
        location: DEFAULT_USER_LOCATION_BUSAN,
        usedFallback: false,
        status: 'loading',
      };
    }

    return {
      zoneId: null,
      location: DEFAULT_USER_LOCATION_BUSAN,
      usedFallback: true,
      status: 'fallback',
    };
  }, [bootStatus, coords]);
}
