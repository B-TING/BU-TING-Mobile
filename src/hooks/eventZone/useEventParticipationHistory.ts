import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { mapHistoryItemToRecord } from '../../services/eventZone/zoneEventMapper';
import { fetchMyZoneEventHistory } from '../../services/eventZone/zoneEventService';
import { selectReusableAccessToken, useAuthStore } from '../../stores/useAuthStore';
import type { EventParticipationRecord, EventParticipationStatus } from '../../types/eventParticipation';
import type { EventZoneId } from '../../types/eventZone';

const PAGE_SIZE = 20;

export type HistoryEventTypeFilter = 'PLACE_AUTH' | 'OBJECT_AUTH';

export type EventHistoryFilters = {
  zone?: EventZoneId;
  type?: HistoryEventTypeFilter;
  status?: EventParticipationStatus;
};

function toApiStatus(status: EventParticipationStatus | undefined): string | undefined {
  if (status === 'in_progress') return 'JOINED';
  if (status === 'pending_review') return 'SUBMITTED,UNDER_REVIEW';
  if (status === 'approved') return 'SUCCESS';
  if (status === 'rejected') return 'FAIL,REVOKED';
  return undefined;
}

export function useEventParticipationHistory() {
  const accessToken = useAuthStore(selectReusableAccessToken);
  const [filters, setFilters] = useState<EventHistoryFilters>({});
  const [records, setRecords] = useState<EventParticipationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const loadingMoreRef = useRef(false);
  const requestSeqRef = useRef(0);

  const loadPage = useCallback(
    async (reset: boolean, nextFilters: EventHistoryFilters = filters) => {
      const requestSeq = ++requestSeqRef.current;
      if (reset) {
        cursorRef.current = null;
      }

      if (!accessToken) {
        setHasNext(false);
        cursorRef.current = null;
        return;
      }

      const page = await fetchMyZoneEventHistory(accessToken, {
        zone: nextFilters.zone,
        type: nextFilters.type,
        status: toApiStatus(nextFilters.status),
        cursor: reset ? undefined : cursorRef.current ?? undefined,
        size: PAGE_SIZE,
      });
      if (requestSeq !== requestSeqRef.current) {
        return;
      }

      const mapped = (page.items ?? [])
        .map(mapHistoryItemToRecord)
        .filter((item): item is NonNullable<typeof item> => item != null);

      if (reset) {
        setRecords(mapped);
      } else {
        setRecords(prev => {
          const seen = new Set(prev.map(item => item.id));
          return [...prev, ...mapped.filter(item => !seen.has(item.id))];
        });
      }
      cursorRef.current = page.nextCursor ?? null;
      setHasNext(Boolean(page.hasNext && page.nextCursor));
    },
    [accessToken, filters],
  );

  const setZoneFilter = useCallback((zone: EventZoneId | undefined) => {
    setFilters(prev => ({ ...prev, zone }));
  }, []);

  const setTypeFilter = useCallback((type: HistoryEventTypeFilter | undefined) => {
    setFilters(prev => ({ ...prev, type }));
  }, []);

  const setStatusFilter = useCallback((status: EventParticipationStatus | undefined) => {
    setFilters(prev => ({ ...prev, status }));
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadPage(true);
    } catch {
      if (!accessToken) {
        setRecords([]);
      }
    } finally {
      setRefreshing(false);
    }
  }, [accessToken, loadPage]);

  const loadMore = useCallback(async () => {
    if (!hasNext || loadingMoreRef.current || loading || refreshing) {
      return;
    }
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      await loadPage(false);
    } catch {
      // keep current page
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [hasNext, loadPage, loading, refreshing]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      void loadPage(true)
        .catch(() => {
          if (!cancelled && !accessToken) {
            setRecords([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }, [accessToken, loadPage]),
  );

  const hasActiveFilters = Boolean(filters.zone || filters.type || filters.status);

  return {
    accessToken,
    records,
    filters,
    hasActiveFilters,
    setZoneFilter,
    setTypeFilter,
    setStatusFilter,
    loading,
    refreshing,
    loadingMore,
    hasNext,
    refresh,
    loadMore,
  };
}
