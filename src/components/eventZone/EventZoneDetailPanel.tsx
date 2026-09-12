import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  eventZoneName,
  eventZoneSummary,
  landmarkName,
} from '../../constants/eventZone/eventZone';
import { ICON_COLOR_MUTED } from '../../constants/icons';
import { AppIcon } from '../shared/icons/AppIcon';
import type { AppLanguage } from '../../types/user';
import type {
  EventZoneChatRoom,
  EventZoneDefinition,
  ZoneEvent,
} from '../../types/eventZone';
import { EventActionButton } from './EventActionButton';
import { EventChip } from './EventChip';
import { EventLandmarkRow } from './EventLandmarkRow';
import { EventMissionCard } from './EventMissionCard';
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

type EventZoneDetailPanelProps = {
  zone: EventZoneDefinition;
  room: EventZoneChatRoom | undefined;
  language: AppLanguage;
  landmarksTitle: string;
  memberCountLabel: (n: number) => string;
  enterChatRoomLabel: string;
  joinMissionLabel: string;
  closeLabel: string;
  mapZoneBadgeLabel: string;
  isCurrentZone: boolean;
  activeEvent?: ZoneEvent;
  eventEndsInLabel: (remaining: string) => string;
  eventEndedLabel: string;
  surpriseMissionBadge: string;
  onClose: () => void;
  onEnterChat: () => void;
  onJoinMission: () => void;
  liveMemberCount?: number | null;
  bottomInset?: number;
  embedded?: boolean;
};

export function EventZoneDetailPanel({
  zone,
  room,
  language,
  landmarksTitle,
  memberCountLabel,
  enterChatRoomLabel,
  joinMissionLabel,
  closeLabel,
  mapZoneBadgeLabel,
  isCurrentZone,
  activeEvent,
  eventEndsInLabel,
  eventEndedLabel,
  surpriseMissionBadge,
  onClose,
  onEnterChat,
  onJoinMission,
  liveMemberCount,
  bottomInset = 0,
  embedded = false,
}: EventZoneDetailPanelProps) {
  return (
    <View
      style={embedded ? panelShadow.sheet : panelShadow.card}
      className={
        embedded
          ? 'flex-1 bg-white'
          : 'flex-1 overflow-hidden rounded-3xl border border-brand-border bg-white'
      }>
      {embedded ? <EventZoneSheetHandle /> : null}

      <View className={`flex-row items-start justify-between px-4 pb-3 ${embedded ? 'pt-1' : 'pt-5'}`}>
        <View className="min-w-0 flex-1 pr-2">
          {isCurrentZone ? (
            <Text className="text-[10px] font-bold leading-[14px] text-brand-muted">
              {mapZoneBadgeLabel}
            </Text>
          ) : null}
          <View className="mt-1 flex-row flex-wrap items-center gap-x-2 gap-y-1">
            <Text className="text-lg font-bold leading-[25px] text-brand-text">
              {eventZoneName(zone, language)}
            </Text>
            {activeEvent ? <EventChip label={surpriseMissionBadge} /> : null}
          </View>
          {room ? (
            <Text className="mt-1 text-xs font-semibold text-brand-primary">
              {memberCountLabel(liveMemberCount ?? room.memberCount)}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          onPress={onClose}
          hitSlop={8}
          className="h-7 w-7 items-center justify-center rounded-lg bg-brand-background active:opacity-80">
          <AppIcon name="x" size={14} color={ICON_COLOR_MUTED} strokeWidth={2.5} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 4,
          paddingBottom: 12,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}>
        {activeEvent ? (
          <EventMissionCard
            event={activeEvent}
            language={language}
            endsInLabel={eventEndsInLabel}
            endedLabel={eventEndedLabel}
          />
        ) : null}

        <Text className="text-sm leading-5 text-brand-text">
          {eventZoneSummary(zone, language)}
        </Text>

        <View>
          <Text className="mb-2 text-[11px] font-bold text-brand-muted">{landmarksTitle}</Text>
          <View className="gap-2">
            {zone.landmarks.map(landmark => (
              <EventLandmarkRow
                key={landmark.id}
                emoji={landmark.emoji}
                name={landmarkName(landmark, language)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View className="gap-2.5 border-t border-brand-border px-4 pt-3" style={{ paddingBottom: bottomInset }}>
        {activeEvent ? (
          <EventActionButton label={joinMissionLabel} variant="event" onPress={onJoinMission} />
        ) : null}
        <EventActionButton
          label={enterChatRoomLabel}
          variant={activeEvent ? 'ghost' : 'primary'}
          onPress={onEnterChat}
          disabled={!room}
        />
      </View>
    </View>
  );
}
