import { Pressable, Text, View } from 'react-native';

import type { EventZoneId } from '../../types/eventZone';
import { EventChip, type EventChipVariant } from './EventChip';
import {
  BRAND_BORDER,
  BRAND_MUTED,
  BRAND_PRIMARY,
  BRAND_SURFACE,
  BRAND_TEXT,
  EVENT_PINK,
  EVENT_PINK_BG,
  EVENT_PINK_BORDER,
  EVENT_PINK_DARK,
} from './eventZoneTheme';

export type EventRoundSlotItem = {
  zoneId: EventZoneId;
  zoneName: string;
  slotStatus: string;
  statusLabel: string;
  eventId?: string;
};

type EventRoundStatusCardProps = {
  title: string;
  statusLabel: string;
  remainingLabel?: string;
  albumLabel: string;
  slots: EventRoundSlotItem[];
  onPressAlbum: () => void;
  onPressSlot: (slot: EventRoundSlotItem) => void;
};

export function roundSlotChipVariant(status: string): EventChipVariant {
  if (status === 'OPEN') {
    return 'event';
  }
  if (status === 'UPCOMING') {
    return 'neutral';
  }
  return 'muted';
}

export function EventRoundStatusCard({
  title,
  statusLabel,
  remainingLabel,
  albumLabel,
  slots,
  onPressAlbum,
  onPressSlot,
}: EventRoundStatusCardProps) {
  const isOpen = slots.some(slot => slot.slotStatus === 'OPEN');

  return (
    <View
      className="rounded-2xl border p-3.5"
      style={{
        borderColor: isOpen ? EVENT_PINK_BORDER : BRAND_BORDER,
        backgroundColor: isOpen ? EVENT_PINK_BG : BRAND_SURFACE,
      }}>
      <View className="flex-row items-start justify-between gap-2">
        <View className="min-w-0 flex-1">
          <Text
            className="text-[11px] font-bold leading-[15px]"
            style={{ color: isOpen ? EVENT_PINK_DARK : BRAND_MUTED }}>
            {title}
          </Text>
          <Text
            className="mt-0.5 text-[13px] font-bold leading-[18px]"
            style={{ color: BRAND_TEXT }}>
            {statusLabel}
          </Text>
          {remainingLabel ? (
            <Text
              className="mt-1 text-[11px] font-semibold leading-[15px]"
              style={{ color: EVENT_PINK }}>
              {remainingLabel}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={albumLabel}
          onPress={onPressAlbum}
          className="flex-row items-center rounded-full border bg-white px-3 py-1.5 active:opacity-80"
          style={{ borderColor: BRAND_BORDER }}>
          <Text className="text-xs font-semibold" style={{ color: BRAND_PRIMARY }}>
            {albumLabel}
          </Text>
        </Pressable>
      </View>

      <View className="mt-2.5 flex-row flex-wrap gap-1.5">
        {slots.map(slot => (
          <Pressable
            key={slot.zoneId}
            accessibilityRole="button"
            accessibilityLabel={`${slot.zoneName} ${slot.statusLabel}`}
            onPress={() => onPressSlot(slot)}
            className="flex-row items-center gap-1 rounded-full border bg-white px-2 py-1 active:opacity-80"
            style={{ borderColor: BRAND_BORDER }}>
            <Text
              className="max-w-[92px] text-[11px] font-semibold leading-[15px]"
              numberOfLines={1}
              style={{ color: BRAND_TEXT }}>
              {slot.zoneName}
            </Text>
            <EventChip
              label={slot.statusLabel}
              variant={roundSlotChipVariant(slot.slotStatus)}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
