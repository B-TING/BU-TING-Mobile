import { Image, Pressable, Text, View } from 'react-native';

import type { EventParticipationStatus } from '../../types/eventParticipation';
import { EventStatusBadge } from './EventStatusBadge';

type EventHistoryCardProps = {
  title: string;
  zoneName: string;
  /** 하단 보조 텍스트 (예: "50P · 배지 지급", "검수 중", 타임스탬프 등) */
  result?: string;
  note?: string;
  status: EventParticipationStatus;
  statusLabel: string;
  timestamp?: string;
  imageUri?: string;
  imageAccessibilityLabel?: string;
  resultTone?: 'primary' | 'warning' | 'danger' | 'muted';
  noteTone?: 'primary' | 'warning' | 'danger' | 'muted';
  onPress: () => void;
};

// Figma HistoryCard: bg-white border-#E2E8F0 rounded-2xl p=14, top row: title(14px bold) + StatusBadge, zone(12px medium muted), result(12px bold primary)
const RESULT_COLOR: Record<NonNullable<EventHistoryCardProps['resultTone']>, string> = {
  primary: '#0077B6',
  warning: '#B45309',
  danger: '#DC2626',
  muted: '#64748B',
};

export function EventHistoryCard({
  title,
  zoneName,
  result,
  note,
  status,
  statusLabel,
  timestamp,
  imageUri,
  imageAccessibilityLabel,
  resultTone = 'muted',
  noteTone = 'muted',
  onPress,
}: EventHistoryCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-start gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-3.5 active:opacity-90">
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          accessibilityLabel={imageAccessibilityLabel}
          className="h-16 w-16 rounded-xl bg-[#E2E8F0]"
          resizeMode="cover"
        />
      ) : null}
      <View className="min-w-0 flex-1 gap-1.5">
        <View className="flex-row items-start justify-between gap-2">
          <Text className="min-w-0 flex-1 text-[14px] font-bold leading-5 text-[#1E293B]">
            {title}
          </Text>
          <EventStatusBadge label={statusLabel} status={status} />
        </View>
        <Text className="text-[12px] font-medium leading-[17px] text-[#64748B]">{zoneName}</Text>
        {result ? (
          <Text
            className="text-[12px] font-bold leading-[17px]"
            style={{ color: RESULT_COLOR[resultTone] }}>
            {result}
          </Text>
        ) : null}
        {note ? (
          <Text
            className="text-[12px] leading-[17px]"
            style={{ color: RESULT_COLOR[noteTone] }}>
            {note}
          </Text>
        ) : null}
        {timestamp ? (
          <Text className="text-[11px] text-[#64748B]">{timestamp}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
