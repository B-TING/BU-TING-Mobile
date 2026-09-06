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
import { EventNavHeader } from '../../components/eventZone/EventNavHeader';
import {
  AppModal,
  AppModalPrimaryFooter,
} from '../../components/shared/modals';
import { useEventAlbumScreen } from '../../hooks/eventZone/useEventAlbumScreen';
import { useAppLanguage } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import {
  BRAND_BORDER,
  BRAND_MUTED,
  BRAND_PRIMARY,
  BRAND_TEXT,
} from '../../components/eventZone/eventZoneTheme';
import type { EventAlbumSort } from '../../types/eventAlbum';

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
    openComment,
    closeComment,
    toggleLike,
    handleToggleVisibility,
    handleSubmitComment,
    refresh,
    loadMore,
    goBack,
  } = useEventAlbumScreen(navigation, route.params ?? {});

  const inputRef = useRef<TextInput>(null);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!commentPost) {
      setDraft('');
      setSubmitting(false);
      return;
    }
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [commentPost]);

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
  };

  const onSubmitComment = () => {
    const trimmed = draft.trim();
    if (!trimmed || submitting) {
      return;
    }
    if (!userId) {
      return;
    }
    setSubmitting(true);
    handleSubmitComment();
    setDraft('');
    setSubmitting(false);
    closeComment();
  };

  const sorts: { key: EventAlbumSort; label: string }[] = [
    { key: 'latest', label: copy.albumSortLatest },
    { key: 'most_liked', label: copy.albumSortMostLiked },
  ];

  return (
    <View className="flex-1 bg-[#F8FAFC]" style={{ paddingTop: insets.top }}>
      <View className="border-b border-[#E2E8F0] bg-white px-2">
        <EventNavHeader
          title={copy.albumTitle}
          subtitle={copy.albumSubtitle}
          onBack={goBack}
          backAccessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
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
              onToggleLike={() => toggleLike()}
              onPressComment={() => openComment(item.id)}
              onToggleVisibility={() =>
                void handleToggleVisibility(item.id, item.visibility === 'private')
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
          {commentPost && commentPost.comments.length > 0 ? (
            <View className="mb-3 max-h-40 gap-2">
              {commentPost.comments.map(comment => (
                <Text
                  key={comment.id}
                  className="text-[13px] leading-5"
                  style={{ color: BRAND_TEXT }}>
                  <Text className="font-bold">{comment.authorNickname} </Text>
                  {comment.content}
                </Text>
              ))}
            </View>
          ) : null}
          <TextInput
            ref={inputRef}
            value={draft}
            onChangeText={setDraft}
            placeholder={copy.albumCommentPlaceholder}
            placeholderTextColor={BRAND_MUTED}
            multiline
            className="min-h-[72px] rounded-xl border px-3 py-2 text-[14px]"
            style={{ borderColor: BRAND_BORDER, color: BRAND_TEXT }}
          />
          {!userId ? (
            <Text className="mt-2 text-[12px]" style={{ color: BRAND_MUTED }}>
              {copy.albumLoginRequired}
            </Text>
          ) : null}
        </View>
      </AppModal>
    </View>
  );
}
