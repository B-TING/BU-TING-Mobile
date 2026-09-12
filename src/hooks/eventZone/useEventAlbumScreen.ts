import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/types';
import { useCopy } from '../../i18n';
import { mapAlbumComment, mapAlbumItemToPost, mapHistoryItemToAlbumPost } from '../../services/eventZone/zoneEventMapper';
import {
  addZoneEventComment,
  deleteZoneEventComment,
  editZoneEventComment,
  fetchAllZoneAlbums,
  fetchEventAlbum,
  fetchMyZoneEventHistory,
  fetchRoundAlbum,
  fetchZoneAlbum,
  fetchZoneEventComments,
  likeZoneEventParticipation,
  unlikeZoneEventParticipation,
  updateZoneEventParticipationVisibility,
  reportZoneEventParticipation,
  ZoneEventServiceError,
} from '../../services/eventZone/zoneEventService';
import { useEventAlbumStore } from '../../stores';
import {
  isAlbumPostMine,
  selectVisibleAlbumPosts,
  sortAlbumPosts,
} from '../../stores/useEventAlbumStore';
import { selectAuthUser, selectReusableAccessToken, useAuthStore } from '../../stores/useAuthStore';
import type { EventAlbumSort } from '../../types/eventAlbum';
import type { EventZoneId } from '../../types/eventZone';
import type { ZoneEventAlbumQuery, ZoneEventReportReasonCode } from '../../types/zoneEventApi';
import { canQueryZoneEvents } from './useHydrateZoneEvents';

const PAGE_SIZE = 20;

type Params = {
  zoneId?: EventZoneId;
  eventId?: string;
  roundId?: string;
  allZones?: boolean;
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
  const setLike = useEventAlbumStore(s => s.setLike);
  const setComments = useEventAlbumStore(s => s.setComments);
  const appendComment = useEventAlbumStore(s => s.appendComment);
  const updateComment = useEventAlbumStore(s => s.updateComment);
  const removeComment = useEventAlbumStore(s => s.removeComment);

  const [sort, setSort] = useState<EventAlbumSort>('latest');
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [editCommentId, setEditCommentId] = useState<string | null>(null);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [reportedPostIds, setReportedPostIds] = useState<Set<string>>(new Set());
  const [loadingComments, setLoadingComments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const loadingMoreRef = useRef(false);
  const visibilityBusyRef = useRef(false);
  const likeBusyRef = useRef<Set<string>>(new Set());
  const commentBusyRef = useRef(false);
  const reportBusyRef = useRef(false);
  const scopeRef = useRef('');

  const loadAllZones =
    Boolean(params.allZones) ||
    (!params.eventId && !params.zoneId && !params.roundId);
  const hasScope = Boolean(
    params.eventId || params.zoneId || params.roundId || loadAllZones,
  );

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

      const scopeKey = `${params.eventId ?? ''}|${params.roundId ?? ''}|${params.zoneId ?? ''}|${loadAllZones ? 'all' : ''}|${sort}`;
      const prevPosts = useEventAlbumStore.getState().posts;
      if (reset && scopeRef.current !== scopeKey) {
        scopeRef.current = scopeKey;
      }

      const query: ZoneEventAlbumQuery = {
        sort: toAlbumSortParam(sort),
        cursor: reset ? undefined : cursorRef.current ?? undefined,
        size: PAGE_SIZE,
      };

      let page;
      let usedMergedZones = false;
      try {
        if (params.roundId) {
          page = await fetchRoundAlbum(params.roundId, query, accessToken);
          if ((page.items?.length ?? 0) === 0) {
            page = await fetchAllZoneAlbums(query, accessToken);
            usedMergedZones = true;
          }
        } else if (loadAllZones) {
          page = await fetchAllZoneAlbums(query, accessToken);
          usedMergedZones = true;
        } else if (params.zoneId) {
          page = await fetchZoneAlbum(params.zoneId, query, accessToken);
        } else {
          page = await fetchEventAlbum(params.eventId as string, query, accessToken);
        }
      } catch (error) {
        if (params.roundId || loadAllZones) {
          page = await fetchAllZoneAlbums(query, accessToken);
          usedMergedZones = true;
        } else {
          throw error;
        }
      }

      const mapped = (page.items ?? [])
        .map(mapAlbumItemToPost)
        .filter((item): item is NonNullable<typeof item> => item != null)
        .map(post => ({
          ...post,
          isMine: post.isMine || isAlbumPostMine(post, userId),
        }));

      if (reset && accessToken && userId) {
        try {
          const history = await fetchMyZoneEventHistory(accessToken, {
            status: 'SUCCESS',
            size: 50,
          });
          const incomingIds = new Set(mapped.map(post => post.id));
          const nickname = authUser?.nickname?.trim() || '여행자';
          for (const item of history.items ?? []) {
            const mine = mapHistoryItemToAlbumPost(item, { userId, nickname });
            if (!mine || mine.visibility !== 'private' || incomingIds.has(mine.id)) {
              continue;
            }
            mapped.push(mine);
            incomingIds.add(mine.id);
          }
        } catch {
          // 공개 앨범만으로라도 보여준다
        }
      }

      if (reset) {
        const prevById = new Map(prevPosts.map(post => [post.id, post]));
        const merged = mapped.map(post => {
          const prev = prevById.get(post.id);
          if (!prev) {
            return post;
          }
          return {
            ...post,
            visibility: prev.visibility === 'private' ? 'private' : post.visibility,
            comments: prev.comments.length > 0 ? prev.comments : post.comments,
            isMine: post.isMine || prev.isMine,
          };
        });
        const incomingIds = new Set(mapped.map(post => post.id));
        const keptMine = prevPosts.filter(
          post =>
            !incomingIds.has(post.id) &&
            isAlbumPostMine(post, userId) &&
            (post.visibility === 'private' || post.isMine),
        );
        replacePosts([...merged, ...keptMine]);
      } else {
        upsertPosts(mapped);
      }
      cursorRef.current = usedMergedZones ? null : page.nextCursor ?? null;
      setHasNext(!usedMergedZones && Boolean(page.hasNext && page.nextCursor));
    },
    [
      accessToken,
      hasScope,
      loadAllZones,
      params.eventId,
      params.roundId,
      params.zoneId,
      replacePosts,
      sort,
      upsertPosts,
      userId,
      authUser?.nickname,
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
        zoneId: params.roundId || loadAllZones ? undefined : params.zoneId,
        eventId:
          params.zoneId || params.roundId || loadAllZones
            ? undefined
            : params.eventId,
      }),
    [loadAllZones, posts, userId, params.zoneId, params.eventId, params.roundId],
  );

  const sortedPosts = useMemo(
    () => sortAlbumPosts(visiblePosts, sort),
    [visiblePosts, sort],
  );

  const commentPost = useMemo(
    () => sortedPosts.find(post => post.id === commentPostId) ?? null,
    [sortedPosts, commentPostId],
  );

  const editComment = useMemo(
    () => commentPost?.comments.find(item => item.id === editCommentId) ?? null,
    [commentPost, editCommentId],
  );

  const deleteComment = useMemo(
    () => commentPost?.comments.find(item => item.id === deleteCommentId) ?? null,
    [commentPost, deleteCommentId],
  );

  const loadComments = useCallback(
    async (postId: string) => {
      setLoadingComments(true);
      try {
        const page = await fetchZoneEventComments(
          postId,
          { size: PAGE_SIZE },
          accessToken,
        );
        const comments = (page.items ?? [])
          .map(mapAlbumComment)
          .filter((item): item is NonNullable<typeof item> => item != null);
        const post = useEventAlbumStore.getState().posts.find(item => item.id === postId);
        setComments(
          postId,
          comments,
          Math.max(post?.commentCount ?? 0, comments.length),
        );
      } catch {
        // keep current comments
      } finally {
        setLoadingComments(false);
      }
    },
    [accessToken, setComments],
  );

  const openComment = useCallback(
    (postId: string) => {
      setCommentPostId(postId);
      void loadComments(postId);
    },
    [loadComments],
  );

  const handleToggleLike = useCallback(
    async (postId: string) => {
      if (likeBusyRef.current.has(postId)) {
        return 'busy' as const;
      }
      if (!accessToken) {
        navigation.navigate('Login');
        return 'login' as const;
      }
      const post = useEventAlbumStore.getState().posts.find(item => item.id === postId);
      if (!post) {
        return 'failed' as const;
      }
      if (post.isMine || (userId && post.authorId === userId)) {
        return 'own' as const;
      }
      const prevLiked = post.likedByMe;
      const prevCount = post.likeCount;
      const nextLiked = !prevLiked;
      const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1));
      likeBusyRef.current.add(postId);
      setLike(postId, nextLiked, nextCount);
      try {
        if (nextLiked) {
          const result = await likeZoneEventParticipation(accessToken, postId);
          if (typeof result.likeCount === 'number') {
            setLike(postId, true, result.likeCount);
          }
        } else {
          await unlikeZoneEventParticipation(accessToken, postId);
        }
        return 'ok' as const;
      } catch (error) {
        if (error instanceof ZoneEventServiceError && nextLiked) {
          if (error.status === 400) {
            setLike(postId, prevLiked, prevCount);
            return 'own' as const;
          }
          if (error.status === 409) {
            setLike(postId, true, nextCount);
            return 'ok' as const;
          }
        }
        setLike(postId, prevLiked, prevCount);
        return 'failed' as const;
      } finally {
        likeBusyRef.current.delete(postId);
      }
    },
    [accessToken, navigation, setLike, userId],
  );

  const handleSubmitComment = useCallback(
    async (text: string) => {
      const content = text.trim().slice(0, 200);
      if (!content || !commentPostId || commentBusyRef.current) {
        return;
      }
      if (!accessToken) {
        navigation.navigate('Login');
        return;
      }
      commentBusyRef.current = true;
      try {
        const created = await addZoneEventComment(accessToken, commentPostId, content);
        const mapped = mapAlbumComment(created);
        if (mapped) {
          appendComment(commentPostId, mapped);
        }
      } finally {
        commentBusyRef.current = false;
      }
    },
    [accessToken, appendComment, commentPostId, navigation],
  );

  const handleEditComment = useCallback(
    async (text: string) => {
      const content = text.trim().slice(0, 200);
      if (!content || !commentPostId || !editCommentId || commentBusyRef.current) {
        return;
      }
      if (!accessToken) {
        navigation.navigate('Login');
        return;
      }
      commentBusyRef.current = true;
      try {
        const updated = await editZoneEventComment(
          accessToken,
          commentPostId,
          editCommentId,
          content,
        );
        const mapped = mapAlbumComment(updated);
        if (mapped) {
          updateComment(commentPostId, mapped);
        }
        setEditCommentId(null);
      } finally {
        commentBusyRef.current = false;
      }
    },
    [accessToken, commentPostId, editCommentId, navigation, updateComment],
  );

  const handleDeleteComment = useCallback(async () => {
    if (!commentPostId || !deleteCommentId || commentBusyRef.current) {
      return;
    }
    if (!accessToken) {
      navigation.navigate('Login');
      return;
    }
    commentBusyRef.current = true;
    try {
      await deleteZoneEventComment(accessToken, commentPostId, deleteCommentId);
      removeComment(commentPostId, deleteCommentId);
      setDeleteCommentId(null);
    } finally {
      commentBusyRef.current = false;
    }
  }, [accessToken, commentPostId, deleteCommentId, navigation, removeComment]);

  const handleToggleVisibility = useCallback(
    async (postId: string, isPrivate: boolean) => {
      if (visibilityBusyRef.current) {
        return;
      }
      if (!accessToken) {
        navigation.navigate('Login');
        return;
      }
      const current = useEventAlbumStore.getState().posts.find(item => item.id === postId);
      const prevVisibility = current?.visibility ?? (isPrivate ? 'private' : 'public');
      const next = isPrivate ? 'PUBLIC' : 'PRIVATE';
      const nextVisibility = next === 'PUBLIC' ? 'public' : 'private';
      visibilityBusyRef.current = true;
      setVisibility(postId, nextVisibility);
      try {
        await updateZoneEventParticipationVisibility(accessToken, postId, next);
      } catch {
        setVisibility(postId, prevVisibility);
      } finally {
        visibilityBusyRef.current = false;
      }
    },
    [accessToken, navigation, setVisibility],
  );

  const reportPost = useMemo(
    () => sortedPosts.find(post => post.id === reportPostId) ?? null,
    [sortedPosts, reportPostId],
  );

  const handleReport = useCallback(
    async (reasonCode: ZoneEventReportReasonCode, memo?: string) => {
      if (!reportPostId || reportBusyRef.current) {
        return 'idle' as const;
      }
      if (!accessToken) {
        navigation.navigate('Login');
        return 'login' as const;
      }
      reportBusyRef.current = true;
      try {
        await reportZoneEventParticipation(accessToken, reportPostId, {
          reasonCode,
          memo: memo?.trim() ? memo.trim().slice(0, 500) : undefined,
        });
        setReportedPostIds(prev => new Set(prev).add(reportPostId));
        setReportPostId(null);
        return 'ok' as const;
      } catch (error) {
        if (error instanceof ZoneEventServiceError) {
          if (error.status === 401) {
            navigation.navigate('Login');
            return 'login' as const;
          }
          if (error.status === 409) {
            setReportedPostIds(prev => new Set(prev).add(reportPostId));
            setReportPostId(null);
            return 'duplicate' as const;
          }
        }
        return 'failed' as const;
      } finally {
        reportBusyRef.current = false;
      }
    },
    [accessToken, navigation, reportPostId],
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
    loadingComments,
    openComment,
    closeComment: () => {
      setCommentPostId(null);
      setEditCommentId(null);
      setDeleteCommentId(null);
    },
    toggleLike: handleToggleLike,
    handleToggleVisibility,
    handleSubmitComment,
    handleEditComment,
    handleDeleteComment,
    editComment,
    deleteComment,
    openEditComment: (commentId: string) => setEditCommentId(commentId),
    closeEditComment: () => setEditCommentId(null),
    openDeleteComment: (commentId: string) => setDeleteCommentId(commentId),
    closeDeleteComment: () => setDeleteCommentId(null),
    reportPost,
    reportedPostIds,
    openReport: (postId: string) => {
      if (!accessToken) {
        navigation.navigate('Login');
        return;
      }
      setReportPostId(postId);
    },
    closeReport: () => setReportPostId(null),
    handleReport,
    openTitles: () => navigation.navigate('EventTitles'),
    refresh,
    loadMore,
    goBack: () => navigation.goBack(),
  };
}
