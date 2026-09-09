import { useCallback, useState } from 'react';

import { mapZoneEventDetail } from '../../services/eventZone/zoneEventMapper';
import {
  cancelZoneEventParticipation,
  fetchZoneEventDetail,
  ZoneEventServiceError,
} from '../../services/eventZone/zoneEventService';
import { useEventParticipationStore } from '../../stores';
import { useZoneEventStore } from '../../stores/useZoneEventStore';
import { selectReusableAccessToken, useAuthStore } from '../../stores/useAuthStore';

export type CancelZoneEventResult =
  | { status: 'unauthenticated' }
  | { status: 'ok' }
  | { status: 'error'; message: string };

export function useCancelZoneEvent() {
  const accessToken = useAuthStore(selectReusableAccessToken);
  const removeRecord = useEventParticipationStore(s => s.removeRecord);
  const triggerEvent = useZoneEventStore(s => s.triggerEvent);
  const [cancelling, setCancelling] = useState(false);

  const cancel = useCallback(
    async (eventId: string, participationId: string): Promise<CancelZoneEventResult> => {
      if (!accessToken) {
        return { status: 'unauthenticated' };
      }

      setCancelling(true);
      try {
        await cancelZoneEventParticipation(accessToken, eventId, participationId);
        removeRecord(participationId);
        const dto = await fetchZoneEventDetail(eventId, accessToken).catch(() => undefined);
        const mapped = dto ? mapZoneEventDetail(dto) : undefined;
        if (mapped) {
          triggerEvent(mapped);
        }
        return { status: 'ok' };
      } catch (error) {
        if (error instanceof ZoneEventServiceError && error.status === 401) {
          return { status: 'unauthenticated' };
        }
        return {
          status: 'error',
          message: error instanceof Error ? error.message : 'Zone event cancel failed',
        };
      } finally {
        setCancelling(false);
      }
    },
    [accessToken, removeRecord, triggerEvent],
  );

  return { accessToken, cancelling, cancel };
}
