import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { ApiClientError } from '../../services/api/apiClient';
import { fetchMyPointLedger, fetchMyRewards } from '../../services/user/userRewardsService';
import { selectReusableAccessToken, useAuthStore } from '../../stores/useAuthStore';
import type { PointLedgerItem, UserRewardsSummary } from '../../types/userRewardsApi';

const PAGE_SIZE = 20;

type Navigation = NativeStackNavigationProp<RootStackParamList, 'EventRewards'>;

const EMPTY_SUMMARY: UserRewardsSummary = { pointBalance: 0, badges: [] };

export function useEventRewardsScreen(navigation: Navigation) {
  const copy = useCopy('userRewards');
  const accessToken = useAuthStore(selectReusableAccessToken);

  const [summary, setSummary] = useState<UserRewardsSummary>(EMPTY_SUMMARY);
  const [ledger, setLedger] = useState<PointLedgerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const loadingMoreRef = useRef(false);

  const loadLedger = useCallback(
    async (reset: boolean) => {
      if (!accessToken) {
        setLedger([]);
        setHasNext(false);
        cursorRef.current = null;
        return;
      }
      const page = await fetchMyPointLedger(accessToken, {
        cursor: reset ? undefined : cursorRef.current ?? undefined,
        size: PAGE_SIZE,
      });
      setLedger(prev => (reset ? page.items : [...prev, ...page.items]));
      cursorRef.current = page.nextCursor;
      setHasNext(Boolean(page.hasNext && page.nextCursor));
    },
    [accessToken],
  );

  const load = useCallback(async () => {
    if (!accessToken) {
      setSummary(EMPTY_SUMMARY);
      setLedger([]);
      setHasNext(false);
      cursorRef.current = null;
      return;
    }
    const [nextSummary] = await Promise.all([
      fetchMyRewards(accessToken),
      loadLedger(true),
    ]);
    setSummary(nextSummary);
  }, [accessToken, loadLedger]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } catch {
      // keep current
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!hasNext || loadingMoreRef.current || loading || refreshing) {
      return;
    }
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      await loadLedger(false);
    } catch {
      // keep current page
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [hasNext, loadLedger, loading, refreshing]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      void load()
        .catch(error => {
          if (cancelled) {
            return;
          }
          if (error instanceof ApiClientError && error.status === 401) {
            navigation.navigate('Login');
          }
          setSummary(EMPTY_SUMMARY);
          setLedger([]);
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }, [load, navigation]),
  );

  return {
    copy,
    isAuthenticated: Boolean(accessToken),
    summary,
    ledger,
    loading,
    refreshing,
    loadingMore,
    refresh,
    loadMore,
    goBack: () => navigation.goBack(),
    goLogin: () => navigation.navigate('Login'),
  };
}
