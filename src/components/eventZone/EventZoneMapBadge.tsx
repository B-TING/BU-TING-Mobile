import { Text, View } from 'react-native';

import { eventZoneName } from '../../constants/eventZone/eventZone';
import type { AppLanguage } from '../../types/user';
import type { EventZoneChatRoom, EventZoneDefinition } from '../../types/eventZone';

type EventZoneMapBadgeProps = {
  zone?: EventZoneDefinition | null;
  room: EventZoneChatRoom | undefined;
  language: AppLanguage;
  mapZoneBadgeLabel: string;
  noZoneLabel?: string;
  memberCountLabel: (n: number) => string;
  fallbackHint?: string;
  liveMemberCount?: number | null;
};

// Figma MapBadge: bg-white border-#E2E8F0 rounded-2xl px-3 py-2.5 shadow-sm, caption 10px bold #64748B, zone 13px bold #1E293B, members 11px bold #0077B6
export function EventZoneMapBadge({
  zone,
  room,
  language,
  mapZoneBadgeLabel,
  noZoneLabel,
  memberCountLabel,
  fallbackHint,
  liveMemberCount,
}: EventZoneMapBadgeProps) {
  const memberCount = liveMemberCount ?? room?.memberCount;

  return (
    <View className="max-w-[220px] rounded-2xl border border-[#E2E8F0] bg-white px-3 py-2.5 shadow-sm">
      {zone ? (
        <>
          <Text className="text-[10px] font-bold leading-[14px] text-[#64748B]">{mapZoneBadgeLabel}</Text>
          <Text className="mt-0.5 text-[13px] font-bold leading-[18px] text-[#1E293B]">
            {eventZoneName(zone, language)}
          </Text>
          {memberCount != null ? (
            <Text className="mt-0.5 text-[11px] font-bold leading-[15px] text-[#0077B6]">
              {memberCountLabel(memberCount)}
            </Text>
          ) : null}
        </>
      ) : (
        <>
          <Text className="text-[13px] font-bold leading-[18px] text-[#1E293B]">
            {noZoneLabel ?? mapZoneBadgeLabel}
          </Text>
          {fallbackHint ? (
            <Text className="mt-1 text-[11px] leading-[15px] text-amber-600">{fallbackHint}</Text>
          ) : null}
        </>
      )}
    </View>
  );
}
