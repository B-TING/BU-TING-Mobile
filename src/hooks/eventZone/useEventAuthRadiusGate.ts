import { useCallback, useRef, useState } from 'react';

import { useLocationConsent } from '../../components/shared/modals';
import type { ZoneEvent } from '../../types/eventZone';
import { checkEventAuthLocation } from '../../utils/eventZone/checkEventAuthLocation';

export type RadiusGateResult =
  | { status: 'inside' }
  | { status: 'outside'; distanceM: number | null; radiusM: number }
  | { status: 'consent_denied' }
  | { status: 'permission_denied' }
  | { status: 'location_unavailable' };

/** 참여·촬영 전에 GPS 반경을 검사한다. 결과는 onResult 콜백으로 전달. */
export function useEventAuthRadiusGate() {
  const { ensureLocationConsent } = useLocationConsent();
  const [checking, setChecking] = useState(false);
  const checkingRef = useRef(false);

  const assertWithinRadius = useCallback(
    async (
      event: ZoneEvent,
      onResult?: (result: RadiusGateResult) => void,
      targetId?: string | null,
    ): Promise<boolean> => {
      if (checkingRef.current) {
        return false;
      }

      checkingRef.current = true;
      setChecking(true);
      try {
        const result = await checkEventAuthLocation(
          event,
          ensureLocationConsent,
          targetId,
        );

        if (result.status === 'inside') {
          onResult?.({ status: 'inside' });
          return true;
        }

        if (result.status === 'outside') {
          const distanceM = Number.isFinite(result.distanceM)
            ? Math.round(result.distanceM)
            : null;
          onResult?.({ status: 'outside', distanceM, radiusM: result.radiusM });
          return false;
        }

        if (result.status === 'consent_denied') {
          onResult?.({ status: 'consent_denied' });
          return false;
        }

        if (result.status === 'permission_denied') {
          onResult?.({ status: 'permission_denied' });
          return false;
        }

        onResult?.({ status: 'location_unavailable' });
        return false;
      } finally {
        checkingRef.current = false;
        setChecking(false);
      }
    },
    [ensureLocationConsent],
  );

  return { checking, assertWithinRadius };
}
