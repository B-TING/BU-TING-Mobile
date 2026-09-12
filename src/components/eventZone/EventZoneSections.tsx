import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  EVENT_ZONE_BY_ID,
  eventZoneName,
  eventZoneSummary,
  landmarkName,
} from '../../constants/eventZone/eventZone';
import { ICON_COLOR_MUTED } from '../../constants/icons';
import { AppIcon } from '../shared/icons/AppIcon';
import { EventZoneCard } from './EventZoneCard';
import { EventMissionCard } from './EventMissionCard';
import {
  EventRoundStatusCard,
  roundSlotChipVariant,
  type EventRoundSlotItem,
} from './EventRoundStatusCard';
import {
  BRAND_BORDER,
  BRAND_HANDLE,
  BRAND_MUTED,
  BRAND_PRIMARY,
  BRAND_SHEET,
  BRAND_TEXT,
  EVENT_PINK,
} from './eventZoneTheme';
import type { AppLanguage } from '../../types/user';
import type {
  EventZoneChatRoom,
  EventZoneDefinition,
  EventZoneId,
  ZoneEvent,
} from '../../types/eventZone';

export { EVENT_PINK } from './eventZoneTheme';

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
  return (
    <View
      className="max-w-[220px] rounded-2xl border bg-white px-3 py-2.5 shadow-sm"
      style={{ borderColor: BRAND_BORDER }}>
      {zone ? (
        <>
          <Text
            className="text-[10px] font-bold leading-[14px]"
            style={{ color: BRAND_MUTED }}>
            {mapZoneBadgeLabel}
          </Text>
          <Text
            className="mt-0.5 text-[13px] font-bold leading-[18px]"
            style={{ color: BRAND_TEXT }}
            numberOfLines={1}>
            {eventZoneName(zone, language)}
          </Text>
          {room ? (
            <Text
              className="mt-0.5 text-[11px] font-bold leading-[15px]"
              style={{ color: BRAND_PRIMARY }}>
              {memberCountLabel(liveMemberCount ?? room.memberCount)}
            </Text>
          ) : null}
        </>
      ) : (
        <>
          <Text
            className="text-[13px] font-bold leading-[18px]"
            style={{ color: BRAND_TEXT }}>
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
  albumLabel?: string;
  onAlbumPress?: () => void;
  titlesLabel?: string;
  onTitlesPress?: () => void;
  surpriseMissionBadge?: string;
  roundSlots?: EventRoundSlotItem[];
  roundSection?: {
    title: string;
    statusLabel: string;
    remainingLabel?: string;
    albumLabel: string;
    onPressAlbum: () => void;
    onPressSlot: (slot: EventRoundSlotItem) => void;
  };
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
  albumLabel,
  onAlbumPress,
  titlesLabel,
  onTitlesPress,
  surpriseMissionBadge,
  roundSlots,
  roundSection,
  embedded = false,
}: EventZoneChatListProps) {
  return (
    <View
      style={[
        embedded ? panelShadow.sheet : panelShadow.card,
        !embedded ? { borderColor: BRAND_BORDER } : null,
      ]}
      className={
        embedded
          ? 'flex-1 bg-white'
          : 'flex-1 overflow-hidden rounded-3xl border bg-white'
      }>
      {embedded ? (
        <View className="items-center py-2" pointerEvents="none">
          <View
            className="h-1 w-9 rounded-full"
            style={{ backgroundColor: BRAND_HANDLE }}
          />
        </View>
      ) : null}
      <View
        className={`px-4 pb-3 ${embedded ? 'pt-1' : 'border-b pt-5'}`}
        style={!embedded ? { borderBottomColor: BRAND_BORDER } : undefined}>
        <View className="flex-row items-center justify-between gap-3">
          <Text
            className="flex-1 text-base font-bold"
            style={{ color: BRAND_TEXT }}>
            {title}
          </Text>
          <View className="flex-row flex-wrap items-center justify-end gap-2">
            {titlesLabel && onTitlesPress ? (
              <Pressable
                accessibilityRole="button"
                onPress={onTitlesPress}
                className="flex-row items-center gap-1 rounded-full border bg-white px-3 py-1.5 active:opacity-80"
                style={{ borderColor: BRAND_BORDER }}>
                <AppIcon name="star" size={14} color={ICON_COLOR_MUTED} />
                <Text
                  className="text-xs font-semibold"
                  style={{ color: BRAND_PRIMARY }}>
                  {titlesLabel}
                </Text>
              </Pressable>
            ) : null}
            {albumLabel && onAlbumPress ? (
              <Pressable
                accessibilityRole="button"
                onPress={onAlbumPress}
                className="flex-row items-center gap-1 rounded-full border bg-white px-3 py-1.5 active:opacity-80"
                style={{ borderColor: BRAND_BORDER }}>
                <AppIcon name="camera" size={14} color={ICON_COLOR_MUTED} />
                <Text
                  className="text-xs font-semibold"
                  style={{ color: BRAND_PRIMARY }}>
                  {albumLabel}
                </Text>
              </Pressable>
            ) : null}
            {historyLabel && onHistoryPress ? (
              <Pressable
                accessibilityRole="button"
                onPress={onHistoryPress}
                className="flex-row items-center gap-1 rounded-full border bg-white px-3 py-1.5 active:opacity-80"
                style={{ borderColor: BRAND_BORDER }}>
                <AppIcon name="clipboardList" size={14} color={ICON_COLOR_MUTED} />
                <Text
                  className="text-xs font-semibold"
                  style={{ color: BRAND_PRIMARY }}>
                  {historyLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 4,
          paddingBottom: bottomInset + 16,
          gap: 10,
        }}
        showsVerticalScrollIndicator={false}>
        {roundSection && roundSlots && roundSlots.length > 0 ? (
          <EventRoundStatusCard
            title={roundSection.title}
            statusLabel={roundSection.statusLabel}
            remainingLabel={roundSection.remainingLabel}
            albumLabel={roundSection.albumLabel}
            slots={roundSlots}
            onPressAlbum={roundSection.onPressAlbum}
            onPressSlot={roundSection.onPressSlot}
          />
        ) : null}
        {rooms.map(room => {
          const zone = EVENT_ZONE_BY_ID[room.zoneId];
          const activeEvent = activeEventsByZone[room.zoneId];
          const isEventRoom = activeEvent != null;
          const slot = roundSlots?.find(item => item.zoneId === room.zoneId);

          const landmarkPills = zone.landmarks
            .slice(0, 2)
            .map(l => `${l.emoji ?? '📍'} ${landmarkName(l, language)}`)
            .join('  ');
          const summary = eventZoneSummary(zone, language);

          return (
            <EventZoneCard
              key={room.id}
              zoneName={eventZoneName(zone, language)}
              summary={summary}
              landmarks={landmarkPills}
              membersLabel={memberCountLabel(liveMemberCounts?.[room.zoneId] ?? room.memberCount)}
              joinLabel={joinLabel}
              isEvent={isEventRoom}
              eventChipLabel={surpriseMissionBadge}
              slotChipLabel={slot?.statusLabel}
              slotChipVariant={
                slot ? roundSlotChipVariant(slot.slotStatus) : undefined
              }
              onPress={() => onRoomPress(room.zoneId)}
              onJoin={() => onJoinPress(room.id)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

type EventZoneZoneDetailPanelProps = {
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

export function EventZoneZoneDetailPanel({
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
}: EventZoneZoneDetailPanelProps) {
  return (
    <View
      style={[
        embedded ? panelShadow.sheet : panelShadow.card,
        !embedded ? { borderColor: BRAND_BORDER } : null,
      ]}
      className={
        embedded
          ? 'flex-1 bg-white'
          : 'flex-1 overflow-hidden rounded-3xl border bg-white'
      }>
      <View
        className={`flex-row items-start justify-between px-4 pb-3 ${
          embedded ? 'pt-3' : 'border-b pt-5'
        }`}
        style={!embedded ? { borderBottomColor: BRAND_BORDER } : undefined}>
        <View className="min-w-0 flex-1 pr-2">
          <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
            <Text className="text-[15px] font-bold" style={{ color: BRAND_TEXT }}>
              {eventZoneName(zone, language)}
            </Text>
            {activeEvent ? (
              <View
                className="rounded-full px-2.5 py-0.5"
                style={{ backgroundColor: EVENT_PINK }}>
                <Text className="text-[10px] font-bold text-white">{surpriseMissionBadge}</Text>
              </View>
            ) : null}
          </View>
          {room ? (
            <Text
              className="mt-1 text-[11px] font-bold"
              style={{ color: BRAND_PRIMARY }}>
              {memberCountLabel(liveMemberCount ?? room.memberCount)}
            </Text>
          ) : null}
          {isCurrentZone ? (
            <Text className="mt-1 text-[10px] font-semibold text-amber-700">{mapZoneBadgeLabel}</Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          onPress={onClose}
          hitSlop={8}
          className="h-7 w-7 items-center justify-center rounded-lg active:opacity-80"
          style={{ backgroundColor: BRAND_SHEET }}>
          <AppIcon name="x" size={14} color={ICON_COLOR_MUTED} strokeWidth={2.5} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: bottomInset + 16,
          gap: 14,
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

        <View>
          <Text
            className="mb-2 text-xs font-bold uppercase tracking-wide"
            style={{ color: BRAND_MUTED }}>
            {landmarksTitle}
          </Text>
          <View className="gap-2">
            {zone.landmarks.map(landmark => (
              <View
                key={landmark.id}
                className="flex-row items-center rounded-xl border bg-white px-3 py-2.5"
                style={{ borderColor: BRAND_BORDER }}>
                <Text className="mr-2.5 text-[14px]">{landmark.emoji}</Text>
                <Text
                  className="flex-1 text-[13px] font-medium"
                  style={{ color: BRAND_TEXT }}>
                  {landmarkName(landmark, language)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {activeEvent ? (
          <View className="flex-row gap-2.5">
            <Pressable
              accessibilityRole="button"
              onPress={onJoinMission}
              className="flex-1 items-center rounded-xl py-3.5 active:opacity-90"
              style={{ backgroundColor: EVENT_PINK }}>
              <Text className="text-[15px] font-bold text-white">{joinMissionLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onEnterChat}
              disabled={!room}
              className="flex-1 items-center rounded-xl py-3.5 active:opacity-90"
              style={{ backgroundColor: room ? BRAND_PRIMARY : BRAND_BORDER }}>
              <Text className="text-[15px] font-bold text-white">{enterChatRoomLabel}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={onEnterChat}
            disabled={!room}
            className="items-center rounded-xl py-3.5 active:opacity-90"
            style={{ backgroundColor: room ? BRAND_PRIMARY : BRAND_BORDER }}>
            <Text className="text-[15px] font-bold text-white">{enterChatRoomLabel}</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
