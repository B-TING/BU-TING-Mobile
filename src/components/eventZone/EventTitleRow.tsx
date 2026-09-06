import { Pressable, Text, View } from 'react-native';

import {
  BRAND_BORDER,
  BRAND_MUTED,
  BRAND_PRIMARY,
  BRAND_SELECTED,
  BRAND_SHEET,
  BRAND_TEXT,
  EVENT_PINK,
} from './eventZoneTheme';
import type { TitleRowStatus } from '../../hooks/eventZone/useEventTitlesScreen';

type EventTitleRowProps = {
  name: string;
  subtitle: string;
  status: TitleRowStatus;
  actionLabel: string;
  busy?: boolean;
  onPress?: () => void;
};

export function EventTitleRow({
  name,
  subtitle,
  status,
  actionLabel,
  busy,
  onPress,
}: EventTitleRowProps) {
  const equipped = status === 'equipped';
  const locked = status === 'locked';

  return (
    <View
      className="flex-row items-center gap-3 rounded-2xl border px-3.5 py-3"
      style={{
        borderColor: equipped ? BRAND_PRIMARY : BRAND_BORDER,
        backgroundColor: equipped ? BRAND_SELECTED : locked ? '#F8FAFC' : '#FFFFFF',
      }}>
      <View className="min-w-0 flex-1">
        <Text
          className="text-[14px] font-bold"
          style={{ color: locked ? BRAND_MUTED : BRAND_TEXT }}
          numberOfLines={1}>
          {name}
        </Text>
        <Text className="mt-0.5 text-[12px] font-medium" style={{ color: BRAND_MUTED }}>
          {subtitle}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: locked || busy, selected: equipped }}
        disabled={locked || busy || !onPress}
        onPress={onPress}
        className="rounded-full px-3 py-1.5 active:opacity-80"
        style={{
          backgroundColor: equipped ? BRAND_SELECTED : locked ? BRAND_SHEET : EVENT_PINK,
          borderWidth: equipped ? 1 : 0,
          borderColor: equipped ? BRAND_PRIMARY : 'transparent',
        }}>
        <Text
          className="text-[12px] font-bold"
          style={{
            color: equipped ? BRAND_PRIMARY : locked ? BRAND_MUTED : '#FFFFFF',
          }}>
          {actionLabel}
        </Text>
      </Pressable>
    </View>
  );
}
