import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import {
  mapHistoryItemToRecord,
} from '../../services/eventZone/zoneEventMapper';
import { fetchMyZoneEventHistory } from '../../services/eventZone/zoneEventService';
import { useEventParticipationStore } from '../../stores';
import { selectReusableAccessToken, useAuthStore } from '../../stores/useAuthStore';
import { sortParticipationRecordsNewestFirst } from '../../stores/useEventParticipationStore';

const PAGE_SIZE = 20;

export function useEventParticipationHistory() {
  const accessToken = useAuthStore(selectReusableAccessToken);
  const rawRecords = useEventParticipationStore(s => s.records);
  const replaceRecords = useEventParticipationStore(s => s.replaceRecords);
  const upsertRecords = useEventParticipationStore(s => s.upsertRecords);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const loadingMoreRef = useRef(false);

  const loadPage = useCallback(
    async (reset: boolean) => {
      if (!accessToken) {
        if (reset) {
          replaceRecords([]);
        }
        setHasNext(false);
        cursorRef.current = null;
        return;
      }

      const page = await fetchMyZoneEventHistory(accessToken, {
        cursor: reset ? undefined : cursorRef.current ?? undefined,
        size: PAGE_SIZE,
      });
      const mapped = (page.items ?? [])
        .map(mapHistoryItemToRecord)
        .filter((item): item is NonNullable<typeof item> => item != null);

      if (reset) {
        replaceRecords(mapped);
      } else {
        upsertRecords(mapped);
      }
      cursorRef.current = page.nextCursor ?? null;
      setHasNext(Boolean(page.hasNext && page.nextCursor));
    },
    [accessToken, replaceRecords, upsertRecords],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadPage(true);
    } catch {
      if (!accessToken) {
        replaceRecords([]);
      }
    } finally {
      setRefreshing(false);
    }
  }, [accessToken, loadPage, replaceRecords]);

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
            replaceRecords([]);
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
    }, [accessToken, loadPage, replaceRecords]),
  );

  return {
    accessToken,
    records: sortParticipationRecordsNewestFirst(rawRecords),
    loading,
    refreshing,
    loadingMore,
    hasNext,
    refresh,
    loadMore,
  };
}
