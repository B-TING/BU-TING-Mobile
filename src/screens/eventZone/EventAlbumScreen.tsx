import { useRef, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventAlbumCard } from '../../components/eventZone/EventAlbumCard';
import { EventChip } from '../../components/eventZone/EventChip';
import { EventNavHeader } from '../../components/eventZone/EventNavHeader';
import {
  AppModal,
  AppModalActions,
  AppModalPrimaryFooter,
  useAppAlert,
} from '../../components/shared/modals';
import { AppIcon } from '../../components/shared/icons/AppIcon';
import { ICON_COLOR_PRIMARY } from '../../constants/icons';
import { useEventAlbumScreen } from '../../hooks/eventZone/useEventAlbumScreen';
import { useAppLanguage } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import {
  BRAND_BORDER,
  BRAND_MUTED,
  BRAND_PRIMARY,
  BRAND_SELECTED,
  BRAND_TEXT,
} from '../../components/eventZone/eventZoneTheme';
import type { EventAlbumSort } from '../../types/eventAlbum';
import type { ZoneEventReportReasonCode } from '../../types/zoneEventApi';

type Props = NativeStackScreenProps<RootStackParamList, 'EventAlbum'>;

function SortChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className="rounded-full px-3.5 py-2 active:opacity-80"
      style={{
        backgroundColor: active ? BRAND_PRIMARY : '#FFFFFF',
        borderWidth: 1,
        borderColor: active ? BRAND_PRIMARY : BRAND_BORDER,
      }}>
      <Text
        className="text-[12px] font-bold"
        style={{ color: active ? '#FFFFFF' : BRAND_TEXT }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function EventAlbumScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const {
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
    closeComment,
    toggleLike,
    handleToggleVisibility,
    handleSubmitComment,
    handleEditComment,
    handleDeleteComment,
    editComment,
    deleteComment,
    openEditComment,
    closeEditComment,
    openDeleteComment,
    closeDeleteComment,
    reportPost,
    reportedPostIds,
    openReport,
    closeReport,
    handleReport,
    openTitles,
    refresh,
    loadMore,
    goBack,
  } = useEventAlbumScreen(navigation, route.params ?? {});

  const { alert } = useAppAlert();

  const inputRef = useRef<TextInput>(null);
  const editInputRef = useRef<TextInput>(null);
  const [draft, setDraft] = useState('');
  const [editDraft, setEditDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState<ZoneEventReportReasonCode>('NOT_ON_SITE');
  const [reportMemo, setReportMemo] = useState('');

  useEffect(() => {
    if (!commentPost) {
      setDraft('');
      setSubmitting(false);
      return;
    }
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [commentPost]);

  useEffect(() => {
    if (!editComment) {
      setEditDraft('');
      setEditing(false);
      return;
    }
    setEditDraft(editComment.content);
    const timer = setTimeout(() => editInputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [editComment]);

  useEffect(() => {
    if (!reportPost) {
      setReportReason('NOT_ON_SITE');
      setReportMemo('');
      setReporting(false);
    }
  }, [reportPost]);

  const cardCopy = {
    typePlaceAuth: copy.typePlaceAuth,
    typeObjectSight: copy.typeObjectSight,
    likeLabel: copy.albumLike,
    commentLabel: copy.albumComment,
    commentCount: copy.albumCommentCount,
    visibilityPublic: copy.albumVisibilityPublic,
    visibilityPrivate: copy.albumVisibilityPrivate,
    makePublic: copy.albumMakePublic,
    makePrivate: copy.albumMakePrivate,
    addComment: copy.albumAddComment,
    privateBadge: copy.albumPrivateBadge,
    reportLabel: copy.albumReport,
    reportedLabel: copy.albumReportReported,
  };

  const onSubmitComment = async () => {
    const trimmed = draft.trim();
    if (!trimmed || submitting) {
      return;
    }
    if (!userId) {
      navigation.navigate('Login');
      return;
    }
    setSubmitting(true);
    try {
      await handleSubmitComment(trimmed);
      setDraft('');
    } catch {
      // keep draft
    } finally {
      setSubmitting(false);
    }
  };

  const onSaveEditComment = async () => {
    const trimmed = editDraft.trim();
    if (!trimmed || editing || !editComment) {
      return;
    }
    if (trimmed === editComment.content) {
      closeEditComment();
      return;
    }
    setEditing(true);
    try {
      await handleEditComment(trimmed);
    } catch {
      // keep draft
    } finally {
      setEditing(false);
    }
  };

  const onConfirmDeleteComment = async () => {
    if (deleting) {
      return;
    }
    setDeleting(true);
    try {
      await handleDeleteComment();
    } catch {
      // keep comment
    } finally {
      setDeleting(false);
    }
  };

  const onSubmitReport = async () => {
    if (reporting) {
      return;
    }
    setReporting(true);
    try {
      const result = await handleReport(reportReason, reportMemo);
      if (result === 'ok') {
        alert({ title: copy.albumReportTitle, message: copy.albumReportDone });
      } else if (result === 'duplicate') {
        alert({ title: copy.albumReportTitle, message: copy.albumReportDuplicate });
      } else if (result === 'failed') {
        alert({ title: copy.albumReportTitle, message: copy.albumReportFailed });
      }
    } finally {
      setReporting(false);
    }
  };

  const reportReasons: ZoneEventReportReasonCode[] = [
    'NOT_ON_SITE',
    'INAPPROPRIATE',
    'SPAM',
    'OTHER',
  ];

  const sorts: { key: EventAlbumSort; label: string }[] = [
    { key: 'latest', label: copy.albumSortLatest },
    { key: 'most_liked', label: copy.albumSortMostLiked },
  ];

  return (
    <View className="flex-1 bg-[#F8FAFC]" style={{ paddingTop: insets.top }}>
      <View className="border-b border-[#E2E8F0] bg-white px-2">
        <EventNavHeader
          title={route.params?.roundId ? copy.albumRoundTitle : copy.albumTitle}
          subtitle={route.params?.roundId ? copy.albumRoundSubtitle : copy.albumSubtitle}
          onBack={goBack}
          backAccessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          rightAccessory={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.albumTitles}
              onPress={openTitles}
              className="flex-row items-center gap-1 rounded-xl px-2 py-2 active:opacity-80">
              <AppIcon name="star" size={18} color={ICON_COLOR_PRIMARY} />
              <Text className="text-[12px] font-bold" style={{ color: BRAND_PRIMARY }}>
                {copy.albumTitles}
              </Text>
            </Pressable>
          }
        />
      </View>

      <View className="flex-row gap-2 border-b border-[#E2E8F0] bg-white px-4 py-3">
        {sorts.map(item => (
          <SortChip
            key={item.key}
            label={item.label}
            active={sort === item.key}
            onPress={() => setSort(item.key)}
          />
        ))}
      </View>

      {loading && sortedPosts.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={sortedPosts}
          keyExtractor={item => item.id}
          contentContainerStyle={{
            flexGrow: 1,
            padding: 16,
            paddingBottom: insets.bottom + 24,
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
          }
          onEndReached={() => {
            void loadMore();
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-8 py-16">
              <Text className="text-center text-sm leading-relaxed" style={{ color: BRAND_MUTED }}>
                {copy.albumEmpty}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4">
                <ActivityIndicator />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <EventAlbumCard
              post={item}
              language={language}
              copy={cardCopy}
              isMine={Boolean(item.isMine) || (Boolean(userId) && item.authorId === userId)}
              onToggleLike={() => void toggleLike(item.id)}
              onPressComment={() => openComment(item.id)}
              onToggleVisibility={() =>
                void handleToggleVisibility(item.id, item.visibility === 'private')
              }
              reported={reportedPostIds.has(item.id)}
              onPressReport={
                Boolean(item.isMine) || (Boolean(userId) && item.authorId === userId)
                  ? undefined
                  : () => openReport(item.id)
              }
            />
          )}
        />
      )}

      <AppModal
        visible={commentPost != null}
        title={copy.albumCommentsTitle}
        subtitle={commentPost?.eventTitleKo}
        onClose={closeComment}
        keyboardAware
        footer={
          <AppModalPrimaryFooter
            cancelLabel={copy.albumCommentCancel}
            confirmLabel={copy.albumAddComment}
            onCancel={closeComment}
            onConfirm={onSubmitComment}
            confirmDisabled={!draft.trim() || submitting || !userId}
          />
        }>
        <View className="px-5 pb-3">
          {loadingComments ? (
            <View className="mb-3 py-3">
              <ActivityIndicator />
            </View>
          ) : commentPost && commentPost.comments.length > 0 ? (
            <View className="mb-3 max-h-40 gap-3">
              {commentPost.comments.map(comment => {
                const isMineComment = Boolean(userId) && comment.authorId === userId;
                return (
                  <View key={comment.id} className="gap-1">
                    <View className="flex-row flex-wrap items-center gap-1">
                      <Text className="text-[13px] font-bold" style={{ color: BRAND_TEXT }}>
                        {comment.authorNickname}
                      </Text>
                      {comment.equippedTitle ? (
                        <EventChip label={comment.equippedTitle.titleName} variant="title" />
                      ) : null}
                    </View>
                    <Text className="text-[13px] leading-5" style={{ color: BRAND_TEXT }}>
                      {comment.content}
                    </Text>
                    {isMineComment ? (
                      <View className="flex-row gap-3">
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => openEditComment(comment.id)}
                          className="active:opacity-80">
                          <Text className="text-[12px] font-semibold" style={{ color: BRAND_PRIMARY }}>
                            {copy.albumCommentEdit}
                          </Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => openDeleteComment(comment.id)}
                          className="active:opacity-80">
                          <Text className="text-[12px] font-semibold" style={{ color: BRAND_MUTED }}>
                            {copy.albumCommentDelete}
                          </Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : null}
          <TextInput
            ref={inputRef}
            value={draft}
            onChangeText={setDraft}
            placeholder={copy.albumCommentPlaceholder}
            placeholderTextColor={BRAND_MUTED}
            multiline
            maxLength={200}
            className="min-h-[72px] rounded-xl border px-3 py-2 text-[14px]"
            style={{ borderColor: BRAND_BORDER, color: BRAND_TEXT }}
          />
          {!userId ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Login')}
              className="mt-2">
              <Text className="text-[12px]" style={{ color: BRAND_MUTED }}>
                {copy.albumLoginRequired}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </AppModal>

      <AppModal
        visible={editComment != null}
        title={copy.albumCommentEditTitle}
        onClose={closeEditComment}
        keyboardAware
        footer={
          <AppModalPrimaryFooter
            cancelLabel={copy.albumCommentCancel}
            confirmLabel={copy.albumCommentEditSave}
            onCancel={closeEditComment}
            onConfirm={() => void onSaveEditComment()}
            confirmDisabled={!editDraft.trim() || editing}
          />
        }>
        <View className="px-5 pb-3">
          <TextInput
            ref={editInputRef}
            value={editDraft}
            onChangeText={setEditDraft}
            placeholder={copy.albumCommentPlaceholder}
            placeholderTextColor={BRAND_MUTED}
            multiline
            maxLength={200}
            className="min-h-[72px] rounded-xl border px-3 py-2 text-[14px]"
            style={{ borderColor: BRAND_BORDER, color: BRAND_TEXT }}
          />
        </View>
      </AppModal>

      <AppModal
        visible={deleteComment != null}
        title={copy.albumCommentDeleteTitle}
        subtitle={copy.albumCommentDeleteMessage}
        onClose={closeDeleteComment}
        footer={
          <AppModalActions
            actions={[
              {
                label: copy.albumCommentCancel,
                onPress: closeDeleteComment,
                variant: 'secondary',
                disabled: deleting,
              },
              {
                label: copy.albumCommentDeleteConfirm,
                onPress: () => void onConfirmDeleteComment(),
                variant: 'danger',
                disabled: deleting,
              },
            ]}
          />
        }>
        {deleteComment ? (
          <View className="px-5 pb-3">
            <Text className="text-[13px] leading-5" style={{ color: BRAND_TEXT }}>
              {deleteComment.content}
            </Text>
          </View>
        ) : null}
      </AppModal>

      <AppModal
        visible={reportPost != null}
        title={copy.albumReportTitle}
        subtitle={reportPost?.eventTitleKo}
        onClose={closeReport}
        keyboardAware
        footer={
          <AppModalPrimaryFooter
            cancelLabel={copy.albumReportCancel}
            confirmLabel={copy.albumReportSubmit}
            onCancel={closeReport}
            onConfirm={() => void onSubmitReport()}
            confirmDisabled={reporting}
          />
        }>
        <View className="px-5 pb-3 gap-2">
          {reportReasons.map(reason => {
            const selected = reportReason === reason;
            return (
              <Pressable
                key={reason}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setReportReason(reason)}
                className="flex-row items-center rounded-xl border px-3 py-2.5 active:opacity-80"
                style={{
                  borderColor: selected ? BRAND_PRIMARY : BRAND_BORDER,
                  backgroundColor: selected ? BRAND_SELECTED : '#FFFFFF',
                }}>
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: selected ? BRAND_PRIMARY : BRAND_TEXT }}>
                  {copy.albumReportReasons[reason]}
                </Text>
              </Pressable>
            );
          })}
          <TextInput
            value={reportMemo}
            onChangeText={setReportMemo}
            placeholder={copy.albumReportMemoPlaceholder}
            placeholderTextColor={BRAND_MUTED}
            multiline
            maxLength={500}
            className="mt-1 min-h-[72px] rounded-xl border px-3 py-2 text-[14px]"
            style={{ borderColor: BRAND_BORDER, color: BRAND_TEXT }}
          />
        </View>
      </AppModal>
    </View>
  );
}
