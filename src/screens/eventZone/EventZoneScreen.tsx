import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  EventGameActiveBanner,
  EventGameBanner,
} from '../../components/eventGame';
import { BusanZoneMap } from '../../components/eventZone/BusanZoneMap';
import {
  EventZoneChatList,
  EventZoneMapBadge,
  EventZoneZoneDetailPanel,
} from '../../components/eventZone/EventZoneSections';
import {
  PLANNING_CHIP_BG,
  PLANNING_CHIP_TEXT,
} from '../../components/eventZone/eventZoneTheme';
import { BackButton } from '../../components/shared/buttons/BackButton';
import { TEST_ID } from '../../constants/e2e/testIds';
import { EVENT_MAP_BG } from '../../constants/eventZone/mapChrome';
import { useEventZoneScreen } from '../../hooks/eventZone/useEventZoneScreen';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EventZone'>;

/** Figma 플로우 — 지도 : 하단 시트 ≈ 47 : 53 */
const MAP_FLEX = 0.47;

export function EventZoneScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const {
    language,
    copy,
    gameCopy,
    isFocused,
    focusZoneId,
    highlightZoneId,
    isFocusedOnZone,
    currentZoneId,
    usedFallback,
    currentZone,
    selectedZone,
    currentZoneRoom,
    selectedZoneRoom,
    currentLiveMemberCount,
    selectedLiveMemberCount,
    eventZoneIds,
    chatRooms,
    liveMemberCounts,
    listActiveEventsByZone,
    currentZoneGameEvent,
    selectedZoneGameEvent,
    selectZone,
    handleCloseExpanded,
    handleEnterChat,
    handleJoinChat,
    handleOpenGameDetail,
    handleOpenParticipationHistory,
    handleOpenAlbum,
    handleOpenTitles,
    handleJoinMission,
    handleOpenRoundAlbum,
    handleRoundSlotPress,
    roundSlots,
    roundStatusLabel,
    roundRemainingLabel,
  } = useEventZoneScreen({ navigation });

  const sheetBottomInset = Math.max(12, insets.bottom);

  return (
    <View testID={TEST_ID.eventZone.screen} className="flex-1" style={{ backgroundColor: EVENT_MAP_BG }}>
      {/* 상단 맵 */}
      <View className="relative" style={{ flex: MAP_FLEX }}>
        <BusanZoneMap
          focusZoneId={focusZoneId}
          selectedZoneId={highlightZoneId}
          currentZoneId={currentZoneId}
          language={language}
          eventZoneIds={eventZoneIds}
          pulsesActive={isFocused}
          onZonePress={selectZone}
          onDismiss={handleCloseExpanded}
        />

        <View
          className="absolute left-0 right-0 flex-row items-start justify-between px-3"
          style={{ top: insets.top + 8 }}
          pointerEvents="box-none">
          <View className="flex-row items-start gap-2">
            <View className="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm">
              <BackButton
                accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
                onPress={() => navigation.goBack()}
              />
            </View>

            {!isFocusedOnZone ? (
              <EventZoneMapBadge
                zone={currentZone}
                room={currentZoneRoom}
                language={language}
                mapZoneBadgeLabel={copy.mapZoneBadgeLabel}
                noZoneLabel={copy.noZoneLabel}
                memberCountLabel={copy.chatMemberCount}
                fallbackHint={
                  usedFallback
                    ? copy.locationFallbackHint
                    : currentZoneId == null
                      ? copy.outsideBusanHint
                      : undefined
                }
                liveMemberCount={currentLiveMemberCount}
              />
            ) : null}
          </View>

          <View className="items-end gap-2">
            <View
              className="rounded-full px-3 py-1.5 shadow-sm"
              style={{ backgroundColor: PLANNING_CHIP_BG }}>
              <Text className="text-[11px] font-semibold" style={{ color: PLANNING_CHIP_TEXT }}>
                {copy.planningBadge}
              </Text>
            </View>
          </View>
        </View>

        {isFocusedOnZone && selectedZoneGameEvent ? (
          <View
            className="absolute left-0 right-0"
            style={{ top: insets.top + 56 }}
            pointerEvents="box-none">
            <EventGameBanner
              event={selectedZoneGameEvent}
              language={language}
              actionLabel={gameCopy.joinEvent}
              endsInLabel={copy.eventEndsIn}
              endedLabel={copy.eventEnded}
              onPress={() => handleOpenGameDetail(selectedZoneGameEvent.id)}
            />
          </View>
        ) : null}
      </View>

      {/* 하단 시트 — 흰 배경, 상단 라운드 */}
      <View
        style={{
          flex: 1 - MAP_FLEX,
          backgroundColor: 'white',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          overflow: 'hidden',
        }}>
        {selectedZone ? (
          <EventZoneZoneDetailPanel
            zone={selectedZone}
            room={selectedZoneRoom}
            language={language}
            landmarksTitle={copy.landmarksTitle}
            memberCountLabel={copy.chatMemberCount}
            enterChatRoomLabel={copy.enterChatRoom}
            joinMissionLabel={copy.joinMission}
            closeLabel={copy.closePanel}
            mapZoneBadgeLabel={copy.mapZoneBadgeLabel}
            isCurrentZone={focusZoneId === currentZoneId}
            activeEvent={selectedZoneGameEvent}
            eventEndsInLabel={copy.eventEndsIn}
            eventEndedLabel={copy.eventEnded}
            surpriseMissionBadge={copy.surpriseMissionBadge}
            onClose={handleCloseExpanded}
            onEnterChat={() => {
              if (focusZoneId) {
                handleEnterChat(focusZoneId);
              }
            }}
            onJoinMission={handleJoinMission}
            liveMemberCount={selectedLiveMemberCount}
            bottomInset={sheetBottomInset}
            embedded
          />
        ) : (
          <View className="flex-1">
            {currentZoneGameEvent ? (
              <View className="px-4 pt-3">
                <EventGameActiveBanner
                  message={gameCopy.nearbyEventBanner}
                  actionLabel={gameCopy.joinEvent}
                  onPress={() => handleOpenGameDetail(currentZoneGameEvent.id)}
                />
              </View>
            ) : null}
            <EventZoneChatList
              rooms={chatRooms}
              language={language}
              title={copy.chatRoomsTitle}
              memberCountLabel={copy.chatMemberCount}
              joinLabel={copy.enterChatShort}
              activeEventsByZone={listActiveEventsByZone}
              bottomInset={sheetBottomInset}
              liveMemberCounts={liveMemberCounts}
              onRoomPress={selectZone}
              onJoinPress={handleJoinChat}
              historyLabel={copy.participationHistory}
              onHistoryPress={handleOpenParticipationHistory}
              albumLabel={copy.eventAlbum}
              onAlbumPress={handleOpenAlbum}
              titlesLabel={copy.zoneTitles}
              onTitlesPress={handleOpenTitles}
              roundSlots={roundSlots}
              roundSection={
                roundSlots.length > 0
                  ? {
                      title: copy.roundStatusTitle,
                      statusLabel: roundStatusLabel,
                      remainingLabel: roundRemainingLabel,
                      albumLabel: copy.roundAlbum,
                      onPressAlbum: handleOpenRoundAlbum,
                      onPressSlot: handleRoundSlotPress,
                    }
                  : undefined
              }
              embedded
            />
          </View>
        )}
      </View>
    </View>
  );
}
