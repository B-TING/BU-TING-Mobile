import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import type { CopyFor } from '../../../i18n';
import type { AppLanguage } from '../../../types/user';
import type { PlaceReview, TravelRecordStatus } from '../../../types/travelReview';
import {
  buildDefaultContent,
  buildDefaultTravelRecordTitle,
  collectTravelogueCoverCandidates,
  defaultComposeOverallRating,
} from '../../../utils/review/travelReview';
import { toStoredMediaUrl } from '../../../utils/media/pickMedia';
import { ResolvedRemoteImage } from '../../shared/media/ResolvedRemoteImage';
import { StarRating } from '../../shared/rating/StarRating';
import { AppModal, AppModalActions } from '../../shared/modals';

type Copy = CopyFor<'travelReview'>;

export type TravelogueComposePublishPayload = {
  title: string;
  content: string;
  overallRating: number;
  status: Extract<TravelRecordStatus, 'PUBLISHED' | 'HIDDEN'>;
  /** 선택 시에만 전달. 미선택이면 필드 생략 → 서버가 imageUrls[0] 사용 */
  coverImageUrl?: string;
  imageUrls: string[];
};

type TravelogueComposeModalProps = {
  visible: boolean;
  copy: Copy;
  language: AppLanguage;
  authorNickname: string;
  destinationLabel: string;
  placeReviews: PlaceReview[];
  defaultTitle?: string;
  /** 수정 모드: 기존 제목/본문/공개 여부 */
  initialTitle?: string | null;
  initialContent?: string | null;
  initialStatus?: Extract<TravelRecordStatus, 'PUBLISHED' | 'HIDDEN'>;
  initialOverallRating?: number | null;
  initialCoverImageUrl?: string | null;
  initialImageUrls?: string[] | null;
  mode?: 'create' | 'edit';
  totalDurationLabel?: string | null;
  publishing?: boolean;
  onClose: () => void;
  onPublish: (payload: TravelogueComposePublishPayload) => void | Promise<void>;
};

export function TravelogueComposeModal({
  visible,
  copy,
  language,
  authorNickname,
  destinationLabel,
  placeReviews,
  defaultTitle,
  initialTitle,
  initialContent,
  initialStatus,
  initialOverallRating,
  initialCoverImageUrl,
  initialImageUrls,
  mode = 'create',
  totalDurationLabel,
  publishing = false,
  onClose,
  onPublish,
}: TravelogueComposeModalProps) {
  const isEdit = mode === 'edit';
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [overallRating, setOverallRating] = useState(0);
  const [isPublic, setIsPublic] = useState(true);
  /** null = 자동(서버 첫 장). string = 사용자가 고른 storedUrl */
  const [selectedCoverUrl, setSelectedCoverUrl] = useState<string | null>(null);

  const coverCandidates = useMemo(
    () =>
      collectTravelogueCoverCandidates(placeReviews, {
        imageUrls: initialImageUrls,
        coverImageUrl: initialCoverImageUrl,
      }),
    [placeReviews, initialImageUrls, initialCoverImageUrl],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    setOverallRating(defaultComposeOverallRating(placeReviews, initialOverallRating));
    if (isEdit) {
      setTitle(
        (initialTitle ?? defaultTitle ?? '').trim() ||
          buildDefaultTravelRecordTitle(destinationLabel, language),
      );
      setContent(initialContent ?? '');
      setIsPublic(initialStatus !== 'HIDDEN');
      const initialStored = initialCoverImageUrl?.trim()
        ? toStoredMediaUrl(initialCoverImageUrl.trim())
        : null;
      const matched =
        initialStored &&
        coverCandidates.some(item => item.storedUrl === initialStored)
          ? initialStored
          : null;
      setSelectedCoverUrl(matched);
      return;
    }
    setTitle(defaultTitle ?? buildDefaultTravelRecordTitle(destinationLabel, language));
    setContent(buildDefaultContent(placeReviews, language));
    setIsPublic(true);
    setSelectedCoverUrl(null);
  }, [
    visible,
    isEdit,
    initialTitle,
    initialContent,
    initialStatus,
    initialOverallRating,
    initialCoverImageUrl,
    defaultTitle,
    destinationLabel,
    language,
    placeReviews,
    coverCandidates,
  ]);

  const handlePublish = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || publishing || overallRating < 1) {
      return;
    }
    const imageUrls = coverCandidates.map(item => item.storedUrl);
    const payload: TravelogueComposePublishPayload = {
      title: trimmedTitle,
      content: content.trim(),
      overallRating,
      status: isPublic ? 'PUBLISHED' : 'HIDDEN',
      imageUrls,
    };
    if (selectedCoverUrl) {
      payload.coverImageUrl = selectedCoverUrl;
    }
    void Promise.resolve(onPublish(payload))
      .then(() => {
        onClose();
      })
      .catch(() => {
        // 부모에서 에러 처리 — 모달은 열어 둔다
      });
  };

  return (
    <AppModal
      visible={visible}
      onClose={publishing ? () => undefined : onClose}
      title={isEdit ? copy.editTravelogueTitle : copy.composeTitle}
      subtitle={isEdit ? copy.editTravelogueSub : copy.composeSub}
      maxHeight="92%"
      keyboardAware
      footer={
        <AppModalActions
          actions={[
            {
              label: copy.cancel,
              onPress: onClose,
              variant: 'secondary',
              disabled: publishing,
            },
            {
              label: publishing
                ? language === 'ko'
                  ? isEdit
                    ? '저장 중…'
                    : '게시 중…'
                  : isEdit
                    ? 'Saving…'
                    : 'Publishing…'
                : isEdit
                  ? copy.saveTravelogue
                  : copy.publish,
              onPress: handlePublish,
              variant: 'primary',
              disabled: publishing || !title.trim() || overallRating < 1,
            },
          ]}
        />
      }>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {totalDurationLabel ? (
          <Text className="-mt-2 mb-4 text-sm font-semibold text-brand-primary">
            {totalDurationLabel}
          </Text>
        ) : null}

        <Text className="mb-1 text-xs font-bold text-brand-muted">{copy.travelogueTitle}</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={copy.travelogueTitlePlaceholder}
          placeholderTextColor="#94A3B8"
          className="mb-4 rounded-xl border border-brand-border bg-white px-3 py-3 text-sm text-brand-text"
        />

        <Text className="mb-1 text-xs font-bold text-brand-muted">{copy.authorLabel}</Text>
        <Text className="mb-4 text-base font-semibold text-brand-text">{authorNickname}</Text>

        <Text className="mb-2 text-xs font-bold text-brand-muted">{copy.overallRating}</Text>
        <View className="mb-1 flex-row items-center gap-2">
          <StarRating value={overallRating} onChange={setOverallRating} />
          <Text className="text-sm font-bold text-brand-primary">
            {overallRating > 0 ? copy.stars(overallRating) : '—'}
          </Text>
        </View>
        <Text className="mb-4 text-[10px] text-brand-muted">{copy.overallRatingHint}</Text>

        {coverCandidates.length > 0 ? (
          <View className="mb-4">
            <Text className="mb-1 text-xs font-bold text-brand-muted">
              {copy.coverImageLabel}
            </Text>
            <Text className="mb-2 text-[10px] text-brand-muted">{copy.coverImageHint}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2 pr-2">
                <Pressable
                  onPress={() => setSelectedCoverUrl(null)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedCoverUrl == null }}
                  className={`h-20 w-20 items-center justify-center rounded-xl border-2 ${
                    selectedCoverUrl == null
                      ? 'border-brand-primary bg-brand-selected'
                      : 'border-brand-border bg-white'
                  }`}>
                  <Text
                    className={`text-center text-[11px] font-bold ${
                      selectedCoverUrl == null ? 'text-brand-primary' : 'text-brand-muted'
                    }`}>
                    {copy.coverImageAuto}
                  </Text>
                </Pressable>
                {coverCandidates.map(item => {
                  const selected = selectedCoverUrl === item.storedUrl;
                  return (
                    <Pressable
                      key={item.storedUrl}
                      onPress={() => setSelectedCoverUrl(item.storedUrl)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      className={`h-20 w-20 overflow-hidden rounded-xl border-2 ${
                        selected ? 'border-brand-primary' : 'border-brand-border'
                      }`}>
                      <ResolvedRemoteImage
                        uri={item.displayUri}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        ) : null}

        <Text className="mb-2 text-xs font-bold text-brand-muted">{copy.visibilityLabel}</Text>
        <View className="mb-2 flex-row gap-2">
          <Pressable
            onPress={() => setIsPublic(true)}
            className={`flex-1 items-center rounded-xl border py-3 ${
              isPublic
                ? 'border-brand-primary bg-brand-selected'
                : 'border-brand-border bg-white'
            }`}>
            <Text
              className={`text-sm font-bold ${
                isPublic ? 'text-brand-primary' : 'text-brand-muted'
              }`}>
              {copy.visibilityPublic}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setIsPublic(false)}
            className={`flex-1 items-center rounded-xl border py-3 ${
              !isPublic
                ? 'border-brand-primary bg-brand-selected'
                : 'border-brand-border bg-white'
            }`}>
            <Text
              className={`text-sm font-bold ${
                !isPublic ? 'text-brand-primary' : 'text-brand-muted'
              }`}>
              {copy.visibilityPrivate}
            </Text>
          </Pressable>
        </View>
        <Text className="mb-4 text-[10px] text-brand-muted">
          {isPublic ? copy.visibilityPublicHint : copy.visibilityPrivateHint}
        </Text>

        <Text className="mb-2 text-xs font-bold text-brand-muted">{copy.overallReview}</Text>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder={copy.overallReviewPlaceholder}
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          className="mb-4 min-h-[120px] rounded-xl border border-brand-border bg-white px-3 py-3 text-sm text-brand-text"
        />

        <Text className="mb-3 text-xs font-bold text-brand-muted">{copy.placeReviewsSection}</Text>
        {placeReviews.length === 0 ? (
          <Text className="mb-2 text-sm text-brand-muted">{copy.composePartialHint}</Text>
        ) : (
          placeReviews.map(review => (
            <View
              key={review.placeReviewId}
              className="mb-2 rounded-xl border border-brand-border bg-brand-surface px-3 py-3">
              <Text className="font-semibold text-brand-text">{review.placeName}</Text>
              <View className="mt-1 flex-row items-center gap-2">
                <StarRating value={review.rating} readonly size="sm" />
                <Text className="text-xs text-brand-muted">{copy.stars(review.rating)}</Text>
              </View>
              {review.content ? (
                <Text className="mt-1 text-xs text-brand-muted" numberOfLines={2}>
                  {review.content}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </AppModal>
  );
}
