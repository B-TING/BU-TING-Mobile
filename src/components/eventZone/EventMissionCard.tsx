import { Text, View } from 'react-native';

import type { AppLanguage } from '../../types/user';
import type { ZoneEvent } from '../../types/eventZone';
import {
  EVENT_PINK_BG,
  EVENT_PINK_BODY,
  EVENT_PINK_BORDER,
  EVENT_PINK_DARK,
} from './eventZoneTheme';
import { EventRemainingLabel } from './EventRemainingLabel';

type EventMissionCardProps = {
  event: ZoneEvent;
  language: AppLanguage;
  endsInLabel: (remaining: string) => string;
  endedLabel: string;
};

export function EventMissionCard({
  event,
  language,
  endsInLabel,
  endedLabel,
}: EventMissionCardProps) {
  return (
    <View
      className="rounded-2xl border px-3.5 py-3"
      style={{ borderColor: EVENT_PINK_BORDER, backgroundColor: EVENT_PINK_BG }}>
      <View className="flex-row items-center gap-2">
        <Text className="text-[13px] leading-[18px]" style={{ color: EVENT_PINK_DARK }}>
          ⚡
        </Text>
        <Text
          className="flex-1 text-[14px] font-bold leading-5"
          style={{ color: EVENT_PINK_DARK }}
          numberOfLines={2}>
          {event.titleKo}
        </Text>
      </View>
      <Text className="mt-1.5 text-xs leading-[17px]" style={{ color: EVENT_PINK_BODY }}>
        {event.descriptionKo}
      </Text>
      <EventRemainingLabel
        event={event}
        language={language}
        endsInLabel={endsInLabel}
        endedLabel={endedLabel}
      />
    </View>
  );
}
