import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { REVIEW_TAG_PRESETS } from '../../../constants/review/travelReview';
import { ICON_COLOR_PRIMARY } from '../../../constants/icons';
import type { CopyFor } from '../../../i18n';
import type { AppLanguage } from '../../../types/user';
import type { PlaceReview, ReviewMedia } from '../../../types/travelReview';
import type { RouteItem } from '../../../types/travelPlan';
import { createId } from '../../../utils/common/id';
import {
  hasMediaPermission,
  requestMediaPermission,
  type MediaPermissionKind,
} from '../../../utils/media/mediaPermissions';
import { pickReviewMedia } from '../../../utils/media/pickMedia';
import { AppIcon } from '../../shared/icons/AppIcon';
import { ResolvedRemoteImage } from '../../shared/media/ResolvedRemoteImage';
import { ReviewVideoThumb } from '../../shared/media/ReviewVideoViews';
import { AppModal, AppModalActions, useAppAlert } from '../../shared/modals';
import { StarRating } from '../../shared/rating/StarRating';
import { MediaPermissionDisclosure } from './MediaPermissionDisclosure';
import { MediaSourcePickModal } from './MediaSourcePickModal';

type Copy = CopyFor<'travelReview'>;

const MAX_MEDIA = 20;

type MediaSource = 'library' | 'camera';

type PermissionPrompt = {
  mediaType: 'image' | 'video';
  source: MediaSource;
  mode: 'request' | 'blocked';
};

type PlaceReviewFormModalProps = {
  visible: boolean;
  route: RouteItem | null;
  existing?: PlaceReview;
  copy: Copy;
  language: AppLanguage;
  onClose: () => void;
  onSave: (
    payload: Omit<PlaceReview, 'placeReviewId' | 'createdAt' | 'updatedAt'> & {
      placeReviewId?: string;
    },
  ) => void | Promise<void>;
  /** 기존 후기 삭제 (일정 장소는 유지) */
  onDelete?: () => void | Promise<void>;
  saving?: boolean;
};

function isDisplayableImageUri(uri: string): boolean {
  return (
    uri.startsWith('http://') ||
    uri.startsWith('https://') ||
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://')
  );
}

function permissionKindForSource(source: MediaSource): MediaPermissionKind {
  return source === 'camera' ? 'camera' : 'library';
}

export function PlaceReviewFormModal({
  visible,
  route,
  existing,
  copy,
  language,
  onClose,
  onSave,
  onDelete,
  saving = false,
}: PlaceReviewFormModalProps) {
  const { alert } = useAppAlert();
  const [rating, setRating] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<ReviewMedia[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [picking, setPicking] = useState(false);
  const [sourcePickType, setSourcePickType] = useState<'image' | 'video' | null>(null);
  const [permissionPrompt, setPermissionPrompt] = useState<PermissionPrompt | null>(null);

  const presets = REVIEW_TAG_PRESETS[language];
  const canDelete = Boolean(existing?.placeReviewId && onDelete);

  useEffect(() => {
    if (!visible || !route) {
      return;
    }
    setRating(existing?.rating ?? 5);
    setTags(existing?.tags ?? []);
    setTagInput('');
    setContent(existing?.content ?? '');
    setMedia(existing?.media ?? []);
    setSourcePickType(null);
    setPermissionPrompt(null);
  }, [visible, route, existing]);

  if (!route) {
    return null;
  }

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed) || tags.length >= 8) {
      return;
    }
    setTags(prev => [...prev, trimmed]);
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const busy = submitting || saving || deleting || picking;

  const showPickError = (result: Awaited<ReturnType<typeof pickReviewMedia>>) => {
    if (result.status === 'denied') {
      setPermissionPrompt(prev =>
        prev
          ? { ...prev, mode: 'blocked' }
          : {
              mediaType: 'image',
              source: 'library',
              mode: 'blocked',
            },
      );
      return;
    }
    if (result.status === 'error') {
      alert({ title: result.message || copy.mediaPickFailed });
    }
  };

  const appendPickedMedia = async (mediaType: 'image' | 'video', source: MediaSource) => {
    setPicking(true);
    try {
      const result = await pickReviewMedia({
        mediaType,
        source,
        labels: {
          title: mediaType === 'video' ? copy.addVideo : copy.addPhoto,
          chooseFromLibrary: copy.chooseFromLibrary,
          takePhoto: copy.takePhoto,
          takeVideo: copy.takeVideo,
          cancel: copy.cancel,
          unsupportedVideoFormat: copy.unsupportedVideoFormat,
          unsupportedImageFormat: copy.unsupportedImageFormat,
          fileTooLarge: copy.fileTooLarge,
        },
      });
      if (result.status !== 'ok') {
        showPickError(result);
        return;
      }
      setMedia(prev => {
        if (prev.length >= MAX_MEDIA) {
          return prev;
        }
        return [
          ...prev,
          {
            mediaId: createId('med-'),
            type: result.asset.type,
            uri: result.asset.uri,
            fileName: result.asset.fileName,
            mimeType: result.asset.mimeType,
          },
        ];
      });
    } finally {
      setPicking(false);
    }
  };

  const beginMediaSource = async (mediaType: 'image' | 'video', source: MediaSource) => {
    setSourcePickType(null);
    const kind = permissionKindForSource(source);
    if (await hasMediaPermission(kind)) {
      await appendPickedMedia(mediaType, source);
      return;
    }
    setPermissionPrompt({ mediaType, source, mode: 'request' });
  };

  const handlePermissionAllow = async () => {
    if (!permissionPrompt || permissionPrompt.mode !== 'request') {
      return;
    }
    const { mediaType, source } = permissionPrompt;
    const kind = permissionKindForSource(source);
    const result = await requestMediaPermission(kind);
    if (result === 'granted') {
      setPermissionPrompt(null);
      await appendPickedMedia(mediaType, source);
      return;
    }
    if (result === 'blocked') {
      setPermissionPrompt({ mediaType, source, mode: 'blocked' });
      return;
    }
    setPermissionPrompt(null);
  };

  const openMediaSourcePicker = (mediaType: 'image' | 'video') => {
    if (picking || busy) {
      return;
    }
    if (media.length >= MAX_MEDIA) {
      alert({ title: copy.mediaLimitReached });
      return;
    }
    setSourcePickType(mediaType);
  };

  const removeMedia = (mediaId: string) => {
    setMedia(prev => prev.filter(m => m.mediaId !== mediaId));
  };

  const handleSave = async () => {
    if (submitting || saving || deleting || picking) {
      return;
    }
    setSubmitting(true);
    try {
      await onSave({
        placeReviewId: existing?.placeReviewId,
        planPlaceId: route.apiPlanPlaceId ?? null,
        travelRecordPlaceId: existing?.travelRecordPlaceId ?? null,
        placeName: route.placeName,
        rating,
        tags,
        content: content.trim() || null,
        media,
      });
      onClose();
    } catch {
      // 실패 알림은 부모 onSave 에서 처리. Unhandled rejection 방지.
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || submitting || saving || deleting) {
      return;
    }
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch {
      // 취소·실패 시 모달 유지 (실패 알림은 부모에서 처리)
    } finally {
      setDeleting(false);
    }
  };

  const footerActions = [
    {
      label: copy.cancel,
      onPress: onClose,
      variant: 'secondary' as const,
      disabled: busy,
    },
    ...(canDelete
      ? [
          {
            label: deleting ? '…' : copy.deleteReview,
            onPress: () => {
              void handleDelete();
            },
            variant: 'danger' as const,
            disabled: busy,
          },
        ]
      : []),
    {
      label: submitting || saving ? '…' : copy.save,
      onPress: () => {
        void handleSave();
      },
      variant: 'primary' as const,
      disabled: busy,
    },
  ];

  return (
    <>
      <AppModal
        visible={visible}
        onClose={onClose}
        title={existing ? copy.editReview : copy.writeReview}
        subtitle={route.placeName}
        maxHeight="90%"
        keyboardAware
        backdropDismiss={!busy}
        footer={<AppModalActions actions={footerActions} />}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          <Text className="mb-2 text-xs font-bold text-brand-muted">{copy.ratingLabel}</Text>
          <StarRating value={rating} onChange={setRating} />

          <Text className="mb-2 mt-4 text-xs font-bold text-brand-muted">{copy.tagsLabel}</Text>
          <View className="mb-2 flex-row flex-wrap gap-2">
            {presets.map(tag => {
              const selected = tags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  onPress={() => (selected ? removeTag(tag) : addTag(tag))}
                  className={`rounded-full px-3 py-1.5 ${
                    selected ? 'bg-brand-primary' : 'bg-brand-surface border border-brand-border'
                  }`}>
                  <Text
                    className={`text-xs font-semibold ${
                      selected ? 'text-white' : 'text-brand-text'
                    }`}>
                    #{tag}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View className="mb-2 flex-row items-center gap-2">
            <TextInput
              value={tagInput}
              onChangeText={setTagInput}
              placeholder={copy.tagPlaceholder}
              placeholderTextColor="#94A3B8"
              className="min-h-[40px] flex-1 rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-text"
              onSubmitEditing={() => addTag(tagInput)}
              returnKeyType="done"
            />
            <Pressable
              onPress={() => addTag(tagInput)}
              className="rounded-xl bg-brand-surface px-3 py-2.5 active:opacity-80">
              <Text className="text-sm font-semibold text-brand-primary">+</Text>
            </Pressable>
          </View>
          {tags.length > 0 ? (
            <View className="mb-2 flex-row flex-wrap gap-1.5">
              {tags.map(tag => (
                <Pressable
                  key={tag}
                  onPress={() => removeTag(tag)}
                  className="rounded-full bg-brand-border px-2 py-1">
                  <Text className="text-[10px] text-brand-text">#{tag} ×</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Text className="mb-2 mt-2 text-xs font-bold text-brand-muted">{copy.commentLabel}</Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder={copy.commentPlaceholder}
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="mb-4 min-h-[96px] rounded-xl border border-brand-border bg-white px-3 py-3 text-sm text-brand-text"
          />

          <Text className="mb-2 text-xs font-bold text-brand-muted">{copy.mediaLabel}</Text>
          <View className="mb-2 flex-row gap-2">
            <Pressable
              onPress={() => openMediaSourcePicker('image')}
              disabled={busy}
              className="flex-1 items-center rounded-xl border border-dashed border-brand-border bg-brand-surface py-3 active:opacity-80">
              <Text className="text-sm font-semibold text-brand-primary">{copy.addPhoto}</Text>
            </Pressable>
            <Pressable
              onPress={() => openMediaSourcePicker('video')}
              disabled={busy}
              className="flex-1 items-center rounded-xl border border-dashed border-brand-border bg-brand-surface py-3 active:opacity-80">
              <Text className="text-sm font-semibold text-brand-primary">{copy.addVideo}</Text>
            </Pressable>
          </View>
          {media.length > 0 ? (
            <View className="mb-2 flex-row flex-wrap gap-2">
              {media.map(item => {
                if (item.type === 'video') {
                  return (
                    <View key={item.mediaId} className="relative">
                      <ReviewVideoThumb
                        uri={item.uri}
                        fileKey={item.fileKey}
                        size={64}
                      />
                      <Pressable
                        onPress={() => removeMedia(item.mediaId)}
                        className="absolute right-0.5 top-0.5 z-10 rounded-full bg-black/60 p-0.5"
                        accessibilityRole="button">
                        <AppIcon name="x" size={10} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  );
                }
                return (
                  <Pressable
                    key={item.mediaId}
                    onPress={() => removeMedia(item.mediaId)}
                    className="relative h-20 w-20 overflow-hidden rounded-xl bg-brand-surface">
                    {isDisplayableImageUri(item.uri) ? (
                      item.uri.startsWith('http') ? (
                        <ResolvedRemoteImage
                          uri={item.uri}
                          fileKey={item.fileKey}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Image
                          source={{ uri: item.uri }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      )
                    ) : (
                      <View className="h-full w-full items-center justify-center">
                        <AppIcon name="camera" size={24} color={ICON_COLOR_PRIMARY} />
                      </View>
                    )}
                    <View className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5">
                      <AppIcon name="x" size={10} color="#FFFFFF" />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <Text className="mb-4 text-[10px] text-brand-muted">{copy.mediaHint}</Text>
        </ScrollView>
      </AppModal>

      <MediaSourcePickModal
        visible={sourcePickType != null}
        title={
          sourcePickType === 'video'
            ? copy.addVideo
            : sourcePickType === 'image'
              ? copy.addPhoto
              : ''
        }
        libraryLabel={copy.chooseFromLibrary}
        cameraLabel={sourcePickType === 'video' ? copy.takeVideo : copy.takePhoto}
        cancelLabel={copy.cancel}
        onPickLibrary={() => {
          if (!sourcePickType) {
            return;
          }
          void beginMediaSource(sourcePickType, 'library');
        }}
        onPickCamera={() => {
          if (!sourcePickType) {
            return;
          }
          void beginMediaSource(sourcePickType, 'camera');
        }}
        onCancel={() => setSourcePickType(null)}
      />

      <MediaPermissionDisclosure
        visible={permissionPrompt != null}
        title={copy.mediaPermissionTitle}
        disclosure={
          permissionPrompt?.source === 'camera'
            ? copy.mediaPermissionCameraDisclosure
            : copy.mediaPermissionLibraryDisclosure
        }
        detail={
          permissionPrompt?.mode === 'blocked'
            ? copy.mediaPermissionDenied
            : copy.mediaPermissionDetail
        }
        allowLabel={copy.mediaPermissionAllow}
        denyLabel={copy.mediaPermissionDeny}
        openSettingsLabel={copy.mediaPermissionOpenSettings}
        mode={permissionPrompt?.mode ?? 'request'}
        onAllow={() => {
          void handlePermissionAllow();
        }}
        onDeny={() => setPermissionPrompt(null)}
      />
    </>
  );
}
