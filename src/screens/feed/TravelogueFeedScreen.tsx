import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import type { NavigationProp } from '@react-navigation/native';

import { TravelogueFeedItem } from '../../components/feed/TravelogueFeedItem';
import { ImportPlanModal } from '../../components/feed/modals/ImportPlanModal';
import { TravelogueCommentModal } from '../../components/feed/modals/TravelogueCommentModal';
import { BackButton } from '../../components/shared/buttons/BackButton';
import { AppIcon } from '../../components/shared/icons/AppIcon';
import {
  useTravelogueFeedRow,
  useTravelogueFeedScreen,
} from '../../hooks/feed/useTravelogueFeedScreen';
import { ICON_COLOR_MUTED, ICON_COLOR_PRIMARY } from '../../constants/icons';
import { TEST_ID } from '../../constants/e2e/testIds';
import type { RootStackParamList } from '../../navigation/types';
import type { TravelRecord } from '../../types/travelReview';
import type { AppLanguage } from '../../types/user';

type Props = {
  navigation: NavigationProp<RootStackParamList>;
  embeddedInMainTabs?: boolean;
};

type FeedRowProps = {
  travelRecord: TravelRecord;
  language: AppLanguage;
  navigation: NavigationProp<RootStackParamList>;
  onPatchRecord: (travelRecordId: string, patch: Partial<TravelRecord>) => void;
};

function TravelogueFeedRow({
  travelRecord,
  language,
  navigation,
  onPatchRecord,
}: FeedRowProps) {
  const {
    copy,
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
  } = useTravelogueFeedRow({
    travelRecord,
    language,
    navigation,
    onPatchRecord,
  });

  return (
    <>
      <TravelogueFeedItem
        travelRecord={travelRecord}
        copy={copy}
        language={language}
        social={social}
        userId={userId}
        userName={userName}
        onPressDetail={onPressDetail}
        onToggleLike={onToggleLike}
        onToggleBookmark={onToggleBookmark}
        bookmarkedByMe={bookmarkedByMe}
        onImportPlan={handleImportPlan}
        onOpenComposer={onOpenComposer}
        onEditComment={onEditComment}
        onDeleteComment={onDeleteComment}
      />
      <ImportPlanModal {...importModalProps} />
      <TravelogueCommentModal
        visible={commentOpen}
        copy={copy}
        userName={userName}
        subtitle={travelRecord.title ?? undefined}
        mode={editingComment ? 'edit' : 'create'}
        initialContent={editingComment?.content ?? ''}
        submitting={commenting}
        onClose={closeCommentModal}
        onSubmit={onSubmitComment}
      />
    </>
  );
}

export function TravelogueFeedScreen({ navigation, embeddedInMainTabs = false }: Props) {
  const {
    language,
    copy,
    travelRecords,
    loading,
    refreshing,
    bottomPadding,
    onRefresh,
    onPatchRecord,
  } = useTravelogueFeedScreen({ embeddedInMainTabs });

  return (
    <View testID={TEST_ID.feed.screen} className="flex-1 bg-brand-background">
      <View className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
        {!embeddedInMainTabs ? (
          <BackButton
            accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
            onPress={() => navigation.goBack()}
          />
        ) : null}
        <Text className="flex-1 text-lg font-bold text-brand-text">{copy.feedTitle}</Text>
      </View>

      {loading && travelRecords.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={ICON_COLOR_PRIMARY} />
        </View>
      ) : travelRecords.length === 0 ? (
          <View
            testID={TEST_ID.feed.empty}
            className="flex-1 items-center justify-center px-6"
            style={{ paddingBottom: bottomPadding }}>
          <View className="items-center rounded-2xl border-2 border-dashed border-brand-border bg-brand-surface px-6 py-12">
            <AppIcon name="fileText" size={40} color={ICON_COLOR_MUTED} />
            <Text className="mt-3 text-base font-semibold text-brand-text">
              {copy.feedEmpty}
            </Text>
            <Text className="mt-2 text-center text-sm text-brand-muted">
              {copy.feedEmptySub}
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={travelRecords}
          keyExtractor={item => item.travelRecordId}
          renderItem={({ item }) => (
            <TravelogueFeedRow
              travelRecord={item}
              language={language}
              navigation={navigation}
              onPatchRecord={onPatchRecord}
            />
          )}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPadding }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void onRefresh();
              }}
              tintColor={ICON_COLOR_PRIMARY}
            />
          }
        />
      )}
    </View>
  );
}
