import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { CompactBusanZoneMap } from '../../eventZone/CompactBusanZoneMap';
import { MapEdgeFadeOverlay } from '../../eventZone/MapEdgeFadeOverlay';
import {
  EVENT_ZONE_BY_ID,
  eventZoneName,
  getChatRoomByZoneId,
  landmarkName,
} from '../../../constants/eventZone/eventZone';
import { useAppLanguage, useCopy } from '../../../i18n';
import { useCurrentEventZone } from '../../../hooks/useCurrentEventZone';
import { useEventZoneCarousel } from '../../../hooks/useEventZoneCarousel';
import { useZoneChatRoomSummary } from '../../../hooks/useZoneChatRoomSummary';
import { useZoneEventStore } from '../../../stores';
import type { EventZoneId, ZoneEventType } from '../../../types/eventZone';
import { canQueryZoneEvents, useHydrateZoneEvents } from '../../../hooks/eventZone/useHydrateZoneEvents';
import { ZONE_EVENT_TYPE_META, zoneEventTypeCode } from '../../../constants/eventZone/zoneEvents';
import { TEST_ID } from '../../../constants/e2e/testIds';
import { GUIDE_TARGET } from '../../guide/guideTypes';
import { GuideTarget } from '../../guide/GuideTarget';
import {
  formatZoneEventRemaining,
  useZoneEventRemaining,
} from '../../../utils/eventZone/zoneEventRemaining';

const WIDGET_BODY_HEIGHT = 210;
const CHAT_PANEL_WIDTH_RATIO = 0.54;

type HomeEventZoneSectionProps = {
  onMapPress: () => void;
  onEnterChat: (zoneId: EventZoneId) => void;
};

const panelShadow = StyleSheet.create({
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
  },
});

export function HomeEventZoneSection({
  onMapPress,
  onEnterChat,
}: HomeEventZoneSectionProps) {
  const language = useAppLanguage();
  const copy = useCopy('homeEventZone');
  const zoneCopy = useCopy('eventZone');
  const { zoneId: userZoneId, usedFallback, status } = useCurrentEventZone();

  /** 부산 밖이거나 위치를 모를 때 → 미소속, 구역 미리보기 캐러셀 */
  const isUnaffiliated = userZoneId == null;

  const { mapZoneId, chatZoneId, fadeAnim, carouselIndex, zoneCount, isCycling } =
    useEventZoneCarousel(isUnaffiliated, userZoneId);

  const zone = EVENT_ZONE_BY_ID[chatZoneId];
  const room = getChatRoomByZoneId(chatZoneId);
  const { memberCount: liveMemberCount } = useZoneChatRoomSummary(chatZoneId);
  const landmarks = zone.landmarks.slice(0, 3);

  useHydrateZoneEvents(canQueryZoneEvents());
  const activeEventRaw = useZoneEventStore(s => s.activeEventsByZone[chatZoneId]);
  const activeEvent = canQueryZoneEvents() ? activeEventRaw : undefined;
  const remainingMs = useZoneEventRemaining(activeEvent);
  const typeCode = activeEvent ? zoneEventTypeCode(activeEvent) : undefined;
  const typeLabel =
    typeCode && typeCode in ZONE_EVENT_TYPE_META
      ? ZONE_EVENT_TYPE_META[typeCode as ZoneEventType].labelKo
      : typeCode;
  const remainingText =
    activeEvent && remainingMs > 0 ? formatZoneEventRemaining(remainingMs, language) : '';

  return (
    <GuideTarget id={GUIDE_TARGET.homeEventZone} className="mb-6">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-bold text-brand-text">{copy.sectionTitle}</Text>
        {status === 'loading' ? (
          <Text className="text-xs font-semibold text-brand-muted">…</Text>
        ) : isCycling ? (
          <View className="flex-row items-center gap-1">
            {Array.from({ length: zoneCount }).map((_, index) => (
              <View
                key={index}
                className={`h-1.5 rounded-full ${
                  index === carouselIndex ? 'w-3 bg-brand-primary' : 'w-1.5 bg-brand-border'
                }`}
              />
            ))}
          </View>
        ) : (
          <Text className="text-xs font-semibold text-brand-primary">
            {zoneCopy.currentZoneLabel}
          </Text>
        )}
      </View>

      {isCycling && status !== 'loading' ? (
        <Text className="mb-2 text-xs font-semibold text-brand-muted">
          {usedFallback ? zoneCopy.locationFallbackHint : copy.outsideBusanHint}
        </Text>
      ) : null}

      <View className="relative w-full" style={{ height: WIDGET_BODY_HEIGHT }}>
        <View className="absolute inset-0 overflow-hidden">
          <Pressable
            onPress={onMapPress}
            testID={TEST_ID.home.eventZoneMap}
            className="h-full w-full active:opacity-95"
            accessibilityRole="button"
            accessibilityLabel={copy.mapA11y}>
            <CompactBusanZoneMap highlightedZoneId={mapZoneId} />
          </Pressable>
          <MapEdgeFadeOverlay fadeRatio={0.05} />
        </View>

        <Animated.View
          className="absolute inset-y-2 right-0 justify-between overflow-hidden rounded-2xl border border-brand-border bg-brand-surface px-3 py-2.5"
          style={[
            panelShadow.card,
            {
              width: `${CHAT_PANEL_WIDTH_RATIO * 100}%`,
              opacity: fadeAnim,
            },
          ]}>
          <View>
            <View className="flex-row items-center gap-1">
              <Text className="flex-1 text-sm font-bold text-brand-text" numberOfLines={1}>
                {eventZoneName(zone, language)}
              </Text>
              {activeEvent ? (
                <View className="rounded-full bg-pink-600 px-1.5 py-0.5">
                  <Text className="text-[9px] font-bold text-white">{zoneCopy.eventActiveBadge}</Text>
                </View>
              ) : null}
            </View>
            
            <View className="flex-row justify-between gap-1 w-full">
            {room ? (
              <Text className="mt-0.5 text-[10px] font-semibold text-brand-primary">
                {zoneCopy.chatMemberCount(liveMemberCount ?? room.memberCount)}
              </Text>
            ) : null}
            {activeEvent ? (
              <Text className="mt-0.5 text-[10px] font-semibold text-pink-600 ellipsis" numberOfLines={1}>
                ⚡ {activeEvent.titleKo}
                {typeLabel ? ` · ${typeLabel}` : ''}
                {remainingText ? ` · ${remainingText}` : ''}
              </Text>
            ) : null}
            </View>
            <Text className="mb-1.5 mt-2 text-[10px] font-bold uppercase tracking-wide text-brand-muted">
              {copy.landmarksTitle}
            </Text>
            <View className="gap-1">
              {landmarks.map(landmark => (
                <View
                  key={landmark.id}
                  className="flex-row items-center rounded-lg bg-brand-background px-2 py-1">
                  <Text className="mr-1.5 text-xs">{landmark.emoji}</Text>
                  <Text className="flex-1 text-[11px] font-medium text-brand-text" numberOfLines={1}>
                    {landmarkName(landmark, language)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Pressable
            onPress={() => onEnterChat(chatZoneId)}
            disabled={!room}
            testID={TEST_ID.home.eventZoneChat}
            className={`mt-2 items-center rounded-xl py-2 active:opacity-90 ${
              room ? 'bg-brand-primary' : 'bg-brand-border'
            }`}
            accessibilityRole="button">
            <Text className="text-xs font-bold text-white">{zoneCopy.enterChat}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </GuideTarget>
  );
}
