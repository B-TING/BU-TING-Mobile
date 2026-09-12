import { useCallback, useEffect, useState } from 'react';
import type { NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  TravelogueSocialError,
  useTravelogueSocialActions,
} from './useTravelogueSocialActions';
import { useAppAlert } from '../../components/shared/modals';
import { getNavbarOverlayHeight } from '../../components/shared/navigation/Navbar';
import { useAppLanguage, useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { fetchTravelRecordFeed } from '../../services/travel/travelRecordService';
import { mapTravelRecordFeedItem } from '../../types/travelRecordApi';
import { useAuthStore } from '../../stores';
import { selectReusableAccessToken } from '../../stores/useAuthStore';
import type { TravelRecord, TravelRecordComment } from '../../types/travelReview';
import type { AppLanguage } from '../../types/user';
import { isTravelRecordPublic } from '../../utils/review/travelReview';

type UseTravelogueFeedScreenParams = {
  embeddedInMainTabs?: boolean;
};

type UseTravelogueFeedRowParams = {
  travelRecord: TravelRecord;
  language: AppLanguage;
  navigation: NavigationProp<RootStackParamList>;
  onPatchRecord: (travelRecordId: string, patch: Partial<TravelRecord>) => void;
};

export function useTravelogueFeedScreen({
  embeddedInMainTabs = false,
}: UseTravelogueFeedScreenParams) {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const accessToken = useAuthStore(selectReusableAccessToken);
  const copy = useCopy('travelReview');

  const [travelRecords, setTravelRecords] = useState<TravelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const bottomPadding = embeddedInMainTabs
    ? getNavbarOverlayHeight(insets.bottom) + 16
    : insets.bottom + 16;

  const loadFeed = useCallback(async () => {
    const page = await fetchTravelRecordFeed(
      { size: 20, sort: 'LATEST' },
      accessToken,
    );
    const mapped = (page.items ?? [])
      .map(mapTravelRecordFeedItem)
      .filter(isTravelRecordPublic);
    setTravelRecords(mapped);
  }, [accessToken]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadFeed()
      .catch(error => {
        if (__DEV__) {
          console.warn('[TravelogueFeed] fetch failed', error);
        }
        if (!cancelled) {
          setTravelRecords([]);
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
  }, [loadFeed]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadFeed();
    } finally {
      setRefreshing(false);
    }
  }, [loadFeed]);

  const onPatchRecord = useCallback(
    (travelRecordId: string, patch: Partial<TravelRecord>) => {
      setTravelRecords(prev =>
        prev.map(r => (r.travelRecordId === travelRecordId ? { ...r, ...patch } : r)),
      );
    },
    [],
  );

  return {
    language,
    copy,
    travelRecords,
    loading,
    refreshing,
    bottomPadding,
    onRefresh,
    onPatchRecord,
  };
}

export function useTravelogueFeedRow({
  travelRecord,
  language,
  navigation,
  onPatchRecord,
}: UseTravelogueFeedRowParams) {
  const { alert } = useAppAlert();
  const copy = useCopy('travelReview');
  const [commentOpen, setCommentOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<TravelRecordComment | null>(
    null,
  );
  const {
    social,
    userId,
    userName,
    commenting,
    handleToggleLike,
    handleToggleBookmark,
    bookmarkedByMe,
    handleAddComment,
    handleUpdateComment,
    handleDeleteComment,
    handleImportPlan,
    importModalProps,
  } = useTravelogueSocialActions(travelRecord, copy, navigation, {
    onTravelRecordPatch: patch => {
      onPatchRecord(travelRecord.travelRecordId, patch);
    },
  });

  const onToggleBookmark = () => {
    void handleToggleBookmark().catch(error => {
      alert({
        title:
          error instanceof TravelogueSocialError
            ? error.message
            : copy.socialBookmarkFailed,
      });
    });
  };

  const onToggleLike = () => {
    void handleToggleLike().catch(error => {
      alert({
        title:
          error instanceof TravelogueSocialError
            ? error.message
            : copy.socialLikeFailed,
      });
    });
  };

  const onSubmitComment = async (text: string) => {
    try {
      if (editingComment) {
        await handleUpdateComment(editingComment.commentId, text);
      } else {
        await handleAddComment(text);
      }
    } catch (error) {
      alert({
        title:
          error instanceof TravelogueSocialError
            ? error.message
            : editingComment
              ? copy.socialCommentUpdateFailed
              : copy.socialCommentFailed,
      });
      throw error;
    }
  };

  const onDeleteComment = (comment: TravelRecordComment) => {
    alert({
      title: copy.feedDeleteCommentConfirmTitle,
      message: copy.feedDeleteCommentConfirmMessage,
      buttons: [
        { label: copy.cancel, variant: 'secondary', onPress: () => undefined },
        {
          label: copy.feedDeleteComment,
          variant: 'danger',
          onPress: () => {
            void handleDeleteComment(comment.commentId).catch(error => {
              alert({
                title:
                  error instanceof TravelogueSocialError
                    ? error.message
                    : copy.socialCommentDeleteFailed,
              });
            });
          },
        },
      ],
    });
  };

  const closeCommentModal = () => {
    setCommentOpen(false);
    setEditingComment(null);
  };

  const onPressDetail = () => {
    navigation.navigate('TravelRecordDetail', {
      travelRecordId: travelRecord.travelRecordId,
    });
  };

  const onOpenComposer = () => {
    setEditingComment(null);
    setCommentOpen(true);
  };

  const onEditComment = (comment: TravelRecordComment) => {
    setEditingComment(comment);
    setCommentOpen(true);
  };

  return {
    copy,
    language,
    social,
    userId,
    userName,
    commenting,
    bookmarkedByMe,
    commentOpen,
    editingComment,
    importModalProps,
    onToggleLike,
    onToggleBookmark,
    onSubmitComment,
    onDeleteComment,
    closeCommentModal,
    onPressDetail,
    onOpenComposer,
    onEditComment,
    handleImportPlan,
  };
}
