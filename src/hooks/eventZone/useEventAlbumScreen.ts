import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/types';
import { useCopy } from '../../i18n';
import { mapAlbumItemToPost } from '../../services/eventZone/zoneEventMapper';
import {
  fetchEventAlbum,
  fetchRoundAlbum,
  fetchZoneAlbum,
  updateZoneEventParticipationVisibility,
} from '../../services/eventZone/zoneEventService';
import { useEventAlbumStore } from '../../stores';
import {
  selectVisibleAlbumPosts,
  sortAlbumPosts,
} from '../../stores/useEventAlbumStore';
import { selectAuthUser, selectReusableAccessToken, useAuthStore } from '../../stores/useAuthStore';
import type { EventAlbumSort } from '../../types/eventAlbum';
import type { EventZoneId } from '../../types/eventZone';
import type { ZoneEventAlbumQuery } from '../../types/zoneEventApi';
import { canQueryZoneEvents } from './useHydrateZoneEvents';

const PAGE_SIZE = 20;

type Params = {
  zoneId?: EventZoneId;
  eventId?: string;
  roundId?: string;
};

type Navigation = NativeStackNavigationProp<RootStackParamList, 'EventAlbum'>;

function toAlbumSortParam(sort: EventAlbumSort): ZoneEventAlbumQuery['sort'] {
  return sort === 'most_liked' ? 'MOST_LIKED' : 'LATEST';
}

export function useEventAlbumScreen(navigation: Navigation, params: Params) {
  const copy = useCopy('eventGame');
  const authUser = useAuthStore(selectAuthUser);
  const accessToken = useAuthStore(selectReusableAccessToken);
  const userId = authUser?.userId ?? '';

  const posts = useEventAlbumStore(s => s.posts);
  const replacePosts = useEventAlbumStore(s => s.replacePosts);
  const upsertPosts = useEventAlbumStore(s => s.upsertPosts);
  const setVisibility = useEventAlbumStore(s => s.setVisibility);

  const [sort, setSort] = useState<EventAlbumSort>('latest');
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const loadingMoreRef = useRef(false);
  const visibilityBusyRef = useRef(false);
  const scopeRef = useRef('');

  const hasScope = Boolean(params.eventId || params.zoneId || params.roundId);

  const loadPage = useCallback(
    async (reset: boolean) => {
      if (!hasScope || !canQueryZoneEvents()) {
        if (reset) {
          replacePosts([]);
        }
        setHasNext(false);
        cursorRef.current = null;
        return;
      }

      const scopeKey = `${params.eventId ?? ''}|${params.roundId ?? ''}|${params.zoneId ?? ''}|${sort}`;
      if (reset && scopeRef.current !== scopeKey) {
        replacePosts([]);
        scopeRef.current = scopeKey;
      }

      const query: ZoneEventAlbumQuery = {
        sort: toAlbumSortParam(sort),
        cursor: reset ? undefined : cursorRef.current ?? undefined,
        size: PAGE_SIZE,
      };

      const page = params.eventId
        ? await fetchEventAlbum(params.eventId, query, accessToken)
        : params.roundId
          ? await fetchRoundAlbum(params.roundId, query, accessToken)
          : await fetchZoneAlbum(params.zoneId as EventZoneId, query, accessToken);

      const mapped = (page.items ?? [])
        .map(mapAlbumItemToPost)
        .filter((item): item is NonNullable<typeof item> => item != null);

      if (reset) {
        const keptPrivateMine = useEventAlbumStore
          .getState()
          .posts.filter(
            post =>
              post.visibility === 'private' &&
              (post.isMine || (Boolean(userId) && post.authorId === userId)),
          );
        const incomingIds = new Set(mapped.map(post => post.id));
        replacePosts([
          ...mapped,
          ...keptPrivateMine.filter(post => !incomingIds.has(post.id)),
        ]);
      } else {
        upsertPosts(mapped);
      }
      cursorRef.current = page.nextCursor ?? null;
      setHasNext(Boolean(page.hasNext && page.nextCursor));
    },
    [
      accessToken,
      hasScope,
      params.eventId,
      params.roundId,
      params.zoneId,
      replacePosts,
      sort,
      upsertPosts,
      userId,
    ],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadPage(true);
    } catch {
      if (!hasScope) {
        replacePosts([]);
      }
    } finally {
      setRefreshing(false);
    }
  }, [hasScope, loadPage, replacePosts]);

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
          if (!cancelled && !hasScope) {
            replacePosts([]);
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
    }, [hasScope, loadPage, replacePosts]),
  );

  const visiblePosts = useMemo(
    () =>
      selectVisibleAlbumPosts(posts, userId, {
        zoneId: params.eventId || params.roundId ? undefined : params.zoneId,
        eventId: params.eventId,
      }),
    [posts, userId, params.zoneId, params.eventId, params.roundId],
  );

  const sortedPosts = useMemo(
    () => sortAlbumPosts(visiblePosts, sort),
    [visiblePosts, sort],
  );

  const commentPost = useMemo(
    () => sortedPosts.find(post => post.id === commentPostId) ?? null,
    [sortedPosts, commentPostId],
  );

  const handleToggleVisibility = useCallback(
    async (postId: string, isPrivate: boolean) => {
      if (visibilityBusyRef.current) {
        return;
      }
      if (!accessToken) {
        navigation.navigate('Login');
        return;
      }
      const next = isPrivate ? 'PUBLIC' : 'PRIVATE';
      visibilityBusyRef.current = true;
      try {
        await updateZoneEventParticipationVisibility(accessToken, postId, next);
        setVisibility(postId, next === 'PUBLIC' ? 'public' : 'private');
      } catch {
        // keep previous visibility
      } finally {
        visibilityBusyRef.current = false;
      }
    },
    [accessToken, navigation, setVisibility],
  );

  return {
    copy,
    userId,
    sort,
    setSort,
    sortedPosts,
    commentPost,
    loading,
    refreshing,
    loadingMore,
    openComment: (postId: string) => setCommentPostId(postId),
    closeComment: () => setCommentPostId(null),
    toggleLike: () => undefined,
    handleToggleVisibility,
    handleSubmitComment: () => undefined,
    refresh,
    loadMore,
    goBack: () => navigation.goBack(),
  };
}
