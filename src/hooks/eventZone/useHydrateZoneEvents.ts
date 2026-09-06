import { useCallback, useEffect, useRef, useState } from 'react';

import { isAlphaFeatureBlocked } from '../../constants/common/alphaFeatureBlocks';
import { EVENT_ZONES } from '../../constants/eventZone/eventZone';
import {
  mapActiveZoneEvents,
  mapCurrentZoneEventRound,
  mapParticipationToRecord,
  mapZoneEventDetail,
} from '../../services/eventZone/zoneEventMapper';
import {
  fetchActiveZoneEvents,
  fetchCurrentZoneEventRound,
  fetchMyZoneEventParticipations,
  fetchZoneEventDetail,
} from '../../services/eventZone/zoneEventService';
import { selectReusableAccessToken, useAuthStore } from '../../stores/useAuthStore';
import { useEventParticipationStore } from '../../stores/useEventParticipationStore';
import { useZoneEventStore } from '../../stores/useZoneEventStore';

const STALE_MS = 15_000;

/** 알파 차단이어도 DEV에서는 조회를 붙여 확인한다. */
export function canQueryZoneEvents(): boolean {
  return !isAlphaFeatureBlocked('zoneEvent') || __DEV__;
}

let hydrateInflight: Promise<void> | null = null;

async function hydrateActiveZoneEvents(
  accessToken?: string | null,
  force = false,
): Promise<void> {
  if (!force && hydrateInflight) {
    return hydrateInflight;
  }

  const store = useZoneEventStore.getState();
  if (
    !force &&
    store.lastFetchedAt != null &&
    Date.now() - store.lastFetchedAt < STALE_MS
  ) {
    return;
  }

  hydrateInflight = (async () => {
    store.setLoading(true);
    try {
      const [round, ...lists] = await Promise.all([
        fetchCurrentZoneEventRound(accessToken),
        ...EVENT_ZONES.map(zone => fetchActiveZoneEvents(zone.id, accessToken)),
      ]);
      useZoneEventStore.getState().setCurrentRound(mapCurrentZoneEventRound(round));
      useZoneEventStore.getState().replaceActiveEvents(mapActiveZoneEvents(lists.flat()));
      useZoneEventStore.getState().markFetched();
    } finally {
      useZoneEventStore.getState().setLoading(false);
    }
  })();

  const run = hydrateInflight;
  return run.finally(() => {
    if (hydrateInflight === run) {
      hydrateInflight = null;
    }
  });
}

/** 허브·홈: 활성 이벤트 + 현재 회차 조회 */
export function useHydrateZoneEvents(enabled = true) {
  const accessToken = useAuthStore(selectReusableAccessToken);
  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;

  const refresh = useCallback(async (force = false) => {
    if (!canQueryZoneEvents()) {
      return;
    }
    await hydrateActiveZoneEvents(accessTokenRef.current, force);
  }, []);

  useEffect(() => {
    if (!enabled || !canQueryZoneEvents()) {
      return;
    }
    void refresh().catch(() => undefined);
  }, [enabled, refresh, accessToken]);

  return { refresh };
}

/** 상세 화면: GET /zone-events/{eventId} */
export function useHydrateZoneEventDetail(eventId: string | undefined) {
  const accessToken = useAuthStore(selectReusableAccessToken);
  const upsert = useZoneEventStore(s => s.triggerEvent);
  const [loading, setLoading] = useState(() => Boolean(eventId) && canQueryZoneEvents());

  useEffect(() => {
    if (!eventId || !canQueryZoneEvents()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchZoneEventDetail(eventId, accessToken)
      .then(dto => {
        if (cancelled || !dto) {
          return;
        }
        const mapped = mapZoneEventDetail(dto);
        if (mapped) {
          upsert(mapped);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, eventId, upsert]);

  return { loading };
}

/** 상세 화면: GET /zone-events/{eventId}/participations/me */
export function useHydrateMyEventParticipations(eventId: string | undefined) {
  const accessToken = useAuthStore(selectReusableAccessToken);
  const upsertRecords = useEventParticipationStore(s => s.upsertRecords);

  useEffect(() => {
    if (!eventId || !accessToken) {
      return;
    }
    let cancelled = false;
    fetchMyZoneEventParticipations(accessToken, eventId)
      .then(list => {
        if (cancelled) {
          return;
        }
        const mapped = list
          .map(mapParticipationToRecord)
          .filter((item): item is NonNullable<typeof item> => item != null);
        if (mapped.length > 0) {
          upsertRecords(mapped);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [accessToken, eventId, upsertRecords]);
}
