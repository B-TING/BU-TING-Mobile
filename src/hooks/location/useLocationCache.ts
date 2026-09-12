import { useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';

import { useLocationConsentStore } from '../../stores/useLocationConsentStore';
import { LOCATION_POLL_INTERVAL_MS } from '../../utils/location/locationCache';
import { refreshLocationCacheIfPermitted } from '../../utils/location/refreshLocationCache';

/**
 * #182 홈·이벤트 화면이 포커스일 때만 위치를 주기 갱신한다.
 * watchPosition 추적은 하지 않는다.
 * 대화형 확보(동의 다이얼로그)는 `acquireDeviceCoordinates`를 쓴다.
 */
export function useLocationCache() {
  const isFocused = useIsFocused();
  const disclosureAccepted = useLocationConsentStore(s => s.disclosureAccepted);

  useEffect(() => {
    if (!isFocused || !disclosureAccepted) {
      return;
    }

    const tick = () => {
      void refreshLocationCacheIfPermitted();
    };

    tick();
    const intervalId = setInterval(tick, LOCATION_POLL_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [isFocused, disclosureAccepted]);
}
