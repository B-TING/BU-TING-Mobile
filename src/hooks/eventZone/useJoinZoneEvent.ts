import { useCallback, useState } from 'react';

import { isServerTargetId } from '../../services/eventZone/zoneEventMapper';
import { selectReusableAccessToken, useAuthStore } from '../../stores/useAuthStore';
import type { EventZoneCoordinate } from '../../types/eventZone';
import {
  joinZoneEvent,
  resolveOpenParticipationId,
  ZoneEventServiceError,
} from '../../services/eventZone/zoneEventService';

export type JoinZoneEventResult =
  | { status: 'unauthenticated' }
  | { status: 'ok'; participationId: string }
  | { status: 'out_of_range'; distanceMeters: number }
  | { status: 'error'; message: string };

export function useJoinZoneEvent() {
  const accessToken = useAuthStore(selectReusableAccessToken);
  const [joining, setJoining] = useState(false);

  const join = useCallback(
    async (
      eventId: string,
      coords: EventZoneCoordinate,
      targetId: string,
    ): Promise<JoinZoneEventResult> => {
      if (!accessToken) {
        return { status: 'unauthenticated' };
      }
      if (!isServerTargetId(targetId)) {
        return { status: 'error', message: 'Zone event target is required' };
      }

      setJoining(true);
      try {
        const participation = await joinZoneEvent(accessToken, eventId, {
          targetId,
          latitude: coords.lat,
          longitude: coords.lng,
        });
        return { status: 'ok', participationId: participation.participationId };
      } catch (error) {
        if (error instanceof ZoneEventServiceError) {
          if (error.status === 401) {
            return { status: 'unauthenticated' };
          }
          if (error.distanceMeters != null) {
            return { status: 'out_of_range', distanceMeters: error.distanceMeters };
          }
          if (error.status === 409) {
            const openId =
              error.openParticipationId ??
              (await resolveOpenParticipationId(accessToken, eventId).catch(() => undefined));
            if (openId) {
              return { status: 'ok', participationId: openId };
            }
          }
          return { status: 'error', message: error.message };
        }
        return {
          status: 'error',
          message: error instanceof Error ? error.message : 'Zone event join failed',
        };
      } finally {
        setJoining(false);
      }
    },
    [accessToken],
  );

  return { accessToken, joining, join };
}
