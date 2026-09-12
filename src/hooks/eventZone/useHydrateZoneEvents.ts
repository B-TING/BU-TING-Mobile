import { useCallback, useEffect, useRef, useState } from 'react';

import { isAlphaFeatureBlocked } from '../../constants/common/alphaFeatureBlocks';
import { ZONE_EVENT_POLL_INTERVAL_MS } from '../../constants/common/pollIntervals';
import { useForegroundInterval } from '../useForegroundInterval';
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
  if (hydrateInflight) {
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

  const showLoading = !force;
  hydrateInflight = (async () => {
    if (showLoading) {
      store.setLoading(true);
    }
    try {
      const [round, ...lists] = await Promise.all([
        fetchCurrentZoneEventRound(accessToken).catch(() => undefined),
        ...EVENT_ZONES.map(zone => fetchActiveZoneEvents(zone.id, accessToken)),
      ]);
      useZoneEventStore.getState().setCurrentRound(mapCurrentZoneEventRound(round));
      useZoneEventStore.getState().replaceActiveEvents(mapActiveZoneEvents(lists.flat()));
      useZoneEventStore.getState().markFetched();
    } finally {
      if (showLoading) {
        useZoneEventStore.getState().setLoading(false);
      }
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

  const pollEnabled = enabled && canQueryZoneEvents();

  useEffect(() => {
    if (!pollEnabled) {
      return;
    }
    void refresh().catch(() => undefined);
  }, [pollEnabled, refresh, accessToken]);

  useForegroundInterval(
    () => {
      void refresh(true).catch(() => undefined);
    },
    ZONE_EVENT_POLL_INTERVAL_MS,
    pollEnabled,
  );

  return { refresh };
}

/** 상세 화면: GET /zone-events/{eventId} */
export function useHydrateZoneEventDetail(eventId: string | undefined) {
  const accessToken = useAuthStore(selectReusableAccessToken);
  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;
  const upsert = useZoneEventStore(s => s.triggerEvent);
  const [loading, setLoading] = useState(() => Boolean(eventId) && canQueryZoneEvents());

  const refreshDetail = useCallback(async () => {
    if (!eventId || !canQueryZoneEvents()) {
      return;
    }
    const dto = await fetchZoneEventDetail(eventId, accessTokenRef.current);
    if (!dto) {
      return;
    }
    const mapped = mapZoneEventDetail(dto);
    if (mapped) {
      upsert(mapped);
    }
  }, [eventId, upsert]);

  useEffect(() => {
    if (!eventId || !canQueryZoneEvents()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    refreshDetail()
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [eventId, refreshDetail]);

  useForegroundInterval(
    () => {
      void refreshDetail().catch(() => undefined);
    },
    ZONE_EVENT_POLL_INTERVAL_MS,
    Boolean(eventId) && canQueryZoneEvents(),
  );

  return { loading };
}

/** 상세 화면: GET /zone-events/{eventId}/participations/me */
export function useHydrateMyEventParticipations(eventId: string | undefined) {
  const accessToken = useAuthStore(selectReusableAccessToken);
  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;
  const upsertRecords = useEventParticipationStore(s => s.upsertRecords);

  const refreshMine = useCallback(async () => {
    const token = accessTokenRef.current;
    if (!eventId || !token) {
      return;
    }
    try {
      const list = await fetchMyZoneEventParticipations(token, eventId);
      const mapped = list
        .map(mapParticipationToRecord)
        .filter((item): item is NonNullable<typeof item> => item != null);
      if (mapped.length > 0) {
        upsertRecords(mapped);
      }
    } catch {
      // 폴링 실패는 이전 스냅샷 유지
    }
  }, [eventId, upsertRecords]);

  useEffect(() => {
    void refreshMine();
  }, [refreshMine]);

  useForegroundInterval(
    () => {
      void refreshMine();
    },
    ZONE_EVENT_POLL_INTERVAL_MS,
    Boolean(eventId && accessToken),
  );
}
