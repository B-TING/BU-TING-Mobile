import { Image, Pressable, Text, View } from 'react-native';

import type { EventAlbumPost } from '../../types/eventAlbum';
import { EVENT_ZONE_BY_ID, eventZoneName } from '../../constants/eventZone/eventZone';
import type { AppLanguage } from '../../types/user';
import { AppIcon } from '../shared/icons/AppIcon';
import { ICON_COLOR_HEART, ICON_COLOR_MUTED, ICON_COLOR_PRIMARY } from '../../constants/icons';
import { EventChip } from './EventChip';
import { BRAND_BORDER, BRAND_MUTED, BRAND_PRIMARY, BRAND_TEXT } from './eventZoneTheme';

type EventAlbumCardCopy = {
  typePlaceAuth: string;
  typeObjectSight: string;
  likeLabel: string;
  commentLabel: string;
  commentCount: (n: number) => string;
  visibilityPublic: string;
  visibilityPrivate: string;
  makePublic: string;
  makePrivate: string;
  addComment: string;
  privateBadge: string;
  reportLabel: string;
  reportedLabel: string;
};

type EventAlbumCardProps = {
  post: EventAlbumPost;
  language: AppLanguage;
  copy: EventAlbumCardCopy;
  isMine: boolean;
  onToggleLike: () => void;
  onPressComment: () => void;
  onToggleVisibility: () => void;
  onPressReport?: () => void;
  reported?: boolean;
};

function authorInitial(nickname: string): string {
  const trimmed = nickname.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

export function EventAlbumCard({
  post,
  language,
  copy,
  isMine,
  onToggleLike,
  onPressComment,
  onToggleVisibility,
  onPressReport,
  reported,
}: EventAlbumCardProps) {
  const zone = EVENT_ZONE_BY_ID[post.zoneId];
  const zoneLabel = zone ? eventZoneName(zone, language) : post.zoneId;
  const typeLabel =
    post.eventType === 'PLACE_AUTH' ? copy.typePlaceAuth : copy.typeObjectSight;
  const isPrivate = post.visibility === 'private';

  return (
    <View
      className="overflow-hidden rounded-2xl border bg-white"
      style={{ borderColor: BRAND_BORDER }}>
      <View className="flex-row items-center gap-3 px-3.5 pt-3.5">
        <View
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: BRAND_PRIMARY }}>
          <Text className="text-sm font-bold text-white">
            {authorInitial(post.authorNickname)}
          </Text>
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-1.5">
            <Text className="text-[14px] font-bold" style={{ color: BRAND_TEXT }}>
              {post.authorNickname}
            </Text>
            {post.equippedTitle ? (
              <EventChip label={post.equippedTitle.titleName} variant="title" />
            ) : null}
            {isPrivate ? <EventChip label={copy.privateBadge} variant="muted" /> : null}
          </View>
          <Text className="text-[12px] font-medium" style={{ color: BRAND_MUTED }} numberOfLines={1}>
            {typeLabel} / {zoneLabel}
          </Text>
        </View>
      </View>

      {post.localImageUri ? (
        <Image
          source={{ uri: post.localImageUri }}
          className="mt-3 h-52 w-full"
          resizeMode="cover"
        />
      ) : (
        <View
          className="mt-3 h-40 w-full items-center justify-center"
          style={{ backgroundColor: zone?.baseColor ?? '#E2E8F0' }}>
          <Text className="text-[13px] font-bold text-white/90">{post.eventTitleKo}</Text>
        </View>
      )}

      <View className="gap-2 px-3.5 py-3">
        <Text className="text-[14px] font-bold" style={{ color: BRAND_TEXT }}>
          {post.eventTitleKo}
        </Text>
        {post.content ? (
          <Text className="text-[13px] leading-5" style={{ color: BRAND_TEXT }}>
            {post.content}
          </Text>
        ) : null}

        <View className="flex-row flex-wrap items-center gap-2 pt-1">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: post.likedByMe, disabled: isMine }}
            disabled={isMine}
            onPress={onToggleLike}
            className="flex-row items-center gap-1.5 rounded-full px-3 py-2 active:opacity-80"
            style={{
              backgroundColor: post.likedByMe ? 'rgba(0,119,182,0.12)' : '#F1F5F9',
            }}>
            <AppIcon
              name="heart"
              size={16}
              color={post.likedByMe ? ICON_COLOR_HEART : ICON_COLOR_MUTED}
              filled={post.likedByMe}
            />
            <Text
              className="text-[12px] font-bold"
              style={{ color: post.likedByMe ? BRAND_PRIMARY : BRAND_TEXT }}>
              {copy.likeLabel}
            </Text>
            {post.likeCount > 0 ? (
              <Text className="text-[12px] font-semibold" style={{ color: BRAND_MUTED }}>
                {post.likeCount}
              </Text>
            ) : null}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onPressComment}
            className="flex-row items-center gap-1.5 rounded-full bg-[#F1F5F9] px-3 py-2 active:opacity-80">
            <AppIcon name="messageCircle" size={16} color={ICON_COLOR_PRIMARY} />
            <Text className="text-[12px] font-bold" style={{ color: BRAND_TEXT }}>
              {copy.addComment}
            </Text>
            {(post.commentCount ?? post.comments.length) > 0 ? (
              <Text className="text-[12px] font-semibold" style={{ color: BRAND_MUTED }}>
                {copy.commentCount(post.commentCount ?? post.comments.length)}
              </Text>
            ) : null}
          </Pressable>

          {isMine ? (
            <Pressable
              accessibilityRole="button"
              onPress={onToggleVisibility}
              className="flex-row items-center gap-1 rounded-full border bg-white px-3 py-2 active:opacity-80"
              style={{ borderColor: BRAND_BORDER }}>
              <Text className="text-[12px] font-bold" style={{ color: BRAND_PRIMARY }}>
                {isPrivate ? copy.makePublic : copy.makePrivate}
              </Text>
            </Pressable>
          ) : onPressReport ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: reported }}
              disabled={reported}
              onPress={onPressReport}
              className="flex-row items-center gap-1 rounded-full border bg-white px-3 py-2 active:opacity-80"
              style={{ borderColor: BRAND_BORDER }}>
              <Text className="text-[12px] font-bold" style={{ color: reported ? BRAND_MUTED : BRAND_PRIMARY }}>
                {reported ? copy.reportedLabel : copy.reportLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {post.comments.length > 0 ? (
          <View className="gap-1.5 border-t pt-2" style={{ borderTopColor: BRAND_BORDER }}>
            {post.comments.slice(-2).map(comment => (
              <Text key={comment.id} className="text-[12px] leading-[17px]" style={{ color: BRAND_TEXT }}>
                <Text className="font-bold">{comment.authorNickname} </Text>
                {comment.content}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
