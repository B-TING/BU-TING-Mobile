import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  EVENT_ZONE_BY_ID,
  eventZoneName,
  eventZoneSummary,
  landmarkName,
} from '../../constants/eventZone/eventZone';
import { ICON_COLOR_MUTED } from '../../constants/icons';
import { AppIcon } from '../shared/icons/AppIcon';
import type { AppLanguage } from '../../types/user';
import type { EventZoneChatRoom, EventZoneId, ZoneEvent } from '../../types/eventZone';
import { EventZoneCard } from './EventZoneCard';
import { EventZoneSheetHandle } from './EventZoneSheetHandle';

const panelShadow = StyleSheet.create({
  sheet: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 14,
  },
});

type EventZoneChatListProps = {
  rooms: EventZoneChatRoom[];
  language: AppLanguage;
  title: string;
  memberCountLabel: (n: number) => string;
  joinLabel: string;
  activeEventsByZone: Partial<Record<EventZoneId, ZoneEvent>>;
  bottomInset: number;
  liveMemberCounts?: Partial<Record<EventZoneId, number>>;
  onRoomPress: (zoneId: EventZoneId) => void;
  onJoinPress: (roomId: string) => void;
  historyLabel?: string;
  onHistoryPress?: () => void;
  surpriseMissionBadge?: string;
  embedded?: boolean;
};

export function EventZoneChatList({
  rooms,
  language,
  title,
  memberCountLabel,
  joinLabel,
  activeEventsByZone,
  bottomInset,
  liveMemberCounts,
  onRoomPress,
  onJoinPress,
  historyLabel,
  onHistoryPress,
  surpriseMissionBadge,
  embedded = false,
}: EventZoneChatListProps) {
  return (
    <View
      style={embedded ? panelShadow.sheet : panelShadow.card}
      className={
        embedded
          ? 'flex-1 bg-white'
          : 'flex-1 overflow-hidden rounded-3xl border border-brand-border bg-white'
      }>
      {embedded ? <EventZoneSheetHandle /> : null}
      <View className={`px-4 pb-3 ${embedded ? 'pt-1' : 'border-b border-brand-border pt-5'}`}>
        <View className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 text-base font-bold text-brand-text">{title}</Text>
          {historyLabel && onHistoryPress ? (
            <Pressable
              accessibilityRole="button"
              onPress={onHistoryPress}
              className="flex-row items-center gap-1 rounded-full border border-brand-border bg-brand-background px-3 py-1.5 active:opacity-80">
              <AppIcon name="clipboardList" size={14} color={ICON_COLOR_MUTED} />
              <Text className="text-xs font-semibold text-brand-primary">{historyLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 4,
          paddingBottom: bottomInset + 16,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}>
        {rooms.map(room => {
          const zone = EVENT_ZONE_BY_ID[room.zoneId];
          const activeEvent = activeEventsByZone[room.zoneId];
          const isEventRoom = activeEvent != null;

          const landmarkPills = zone.landmarks
            .slice(0, 2)
            .map(l => `${l.emoji ?? '📍'} ${landmarkName(l, language)}`)
            .join('  ');
          const summary = eventZoneSummary(zone, language);
          const landmarksText = landmarkPills;

          return (
            <EventZoneCard
              key={room.id}
              zoneName={eventZoneName(zone, language)}
              summary={summary}
              landmarks={landmarksText}
              membersLabel={memberCountLabel(liveMemberCounts?.[room.zoneId] ?? room.memberCount)}
              joinLabel={joinLabel}
              isEvent={isEventRoom}
              eventChipLabel={surpriseMissionBadge}
              onPress={() => onRoomPress(room.zoneId)}
              onJoin={() => onJoinPress(room.id)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}
