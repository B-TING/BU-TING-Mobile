import { Pressable, Text, View } from 'react-native';

import { ICON_COLOR_WHITE } from '../../constants/icons';
import type { AppLanguage } from '../../types/user';
import type { ZoneEvent } from '../../types/eventZone';
import { AppIcon } from '../shared/icons/AppIcon';
import { EventRemainingLabel } from '../eventZone/EventRemainingLabel';
import {
  EVENT_PINK,
  EVENT_PINK_BG,
  EVENT_PINK_BORDER,
  EVENT_PINK_BODY,
  EVENT_PINK_DARK,
} from '../eventZone/eventZoneTheme';

type EventGameBannerProps = {
  event: ZoneEvent;
  language: AppLanguage;
  actionLabel: string;
  endsInLabel: (remaining: string) => string;
  endedLabel: string;
  onPress: () => void;
};

/** 존 확장 시 선택된 존의 활성 이벤트 게임 배너 */
export function EventGameBanner({
  event,
  language,
  actionLabel,
  endsInLabel,
  endedLabel,
  onPress,
}: EventGameBannerProps) {
  return (
    <View
      className="mx-3 flex-row items-center gap-2 rounded-2xl border px-3 py-2.5 shadow-sm"
      style={{ borderColor: EVENT_PINK_BORDER, backgroundColor: EVENT_PINK_BG }}>
      <View
        className="h-8 w-8 items-center justify-center rounded-full"
        style={{ backgroundColor: EVENT_PINK }}>
        <AppIcon name="zap" size={16} color={ICON_COLOR_WHITE} />
      </View>
      <View className="min-w-0 flex-1">
        <Text
          className="text-xs font-bold"
          style={{ color: EVENT_PINK_DARK }}
          numberOfLines={1}>
          {event.titleKo}
        </Text>
        <Text
          className="mt-0.5 text-[11px] leading-snug"
          style={{ color: EVENT_PINK_BODY }}
          numberOfLines={2}>
          {event.descriptionKo}
        </Text>
        <EventRemainingLabel
          event={event}
          language={language}
          endsInLabel={endsInLabel}
          endedLabel={endedLabel}
          className="mt-1"
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        onPress={onPress}
        className="rounded-full px-3 py-2 active:opacity-90"
        style={{ backgroundColor: EVENT_PINK }}>
        <Text className="text-[11px] font-bold text-white">{actionLabel}</Text>
      </Pressable>
    </View>
  );
}
