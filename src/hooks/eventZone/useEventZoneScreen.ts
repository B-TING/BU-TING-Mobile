import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useFeatureUnavailableAlert } from '../../components/shared/modals';
import { ALPHA_FEATURE_LABELS } from '../../constants/common/alphaFeatureBlocks';
import {
  EVENT_ZONE_BY_ID,
  EVENT_ZONES,
  allZoneChatRooms,
  eventZoneName,
  getChatRoomByZoneId,
} from '../../constants/eventZone/eventZone';
import { isPhase1EventGame } from '../../constants/eventZone/eventGame';
import { isZoneEventActive } from '../../constants/eventZone/zoneEvents';
import { canQueryZoneEvents, useHydrateZoneEvents } from './useHydrateZoneEvents';
import { useLocationCache } from '../location/useLocationCache';
import { useCurrentEventZone } from '../useCurrentEventZone';
import { useAllZoneChatMemberCounts } from '../useZoneChatRoomSummary';
import { useAppLanguage, useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { useZoneEventStore } from '../../stores';
import type { EventZoneId } from '../../types/eventZone';
import type { EventRoundSlotItem } from '../../components/eventZone/EventRoundStatusCard';
import {
  formatZoneEventRemaining,
  useRemainingUntil,
} from '../../utils/eventZone/zoneEventRemaining';
import { FOCUS_ANIMATION_MS } from '../../utils/eventZone/useZoneMapCamera';

type EventZoneNavigation = NativeStackNavigationProp<RootStackParamList, 'EventZone'>;

type UseEventZoneScreenParams = {
  navigation: EventZoneNavigation;
};

export function useEventZoneScreen({ navigation }: UseEventZoneScreenParams) {
  const isFocused = useIsFocused();
  useLocationCache();
  const language = useAppLanguage();
  const copy = useCopy('eventZone');
  const gameCopy = useCopy('eventGame');
  const { showUnavailable } = useFeatureUnavailableAlert();
  const { zoneId: currentZoneId, usedFallback } = useCurrentEventZone();

  /** 카메라 줌 타겟 + 하단 패널 — 터치 즉시 */
  const [focusZoneId, setFocusZoneId] = useState<EventZoneId | null>(null);
  /** 맵 glow/dim 오버레이 — 줌 애니 이후 (베이스 Path 와 분리·지연) */
  const [highlightZoneId, setHighlightZoneId] = useState<EventZoneId | null>(null);
  const selectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFocusedOnZone = focusZoneId != null;
  /** 맵 SelectionOverlay dim 과 동일 타이밍 */
  const isSlotDimmed = highlightZoneId != null;

  const activeEventsByZone = useZoneEventStore(s => s.activeEventsByZone);
  const currentRound = useZoneEventStore(s => s.currentRound);
  useHydrateZoneEvents(isFocused);
  const eventZoneIds = useMemo(() => {
    if (!canQueryZoneEvents()) {
      return [] as EventZoneId[];
    }
    return Object.keys(activeEventsByZone) as EventZoneId[];
  }, [activeEventsByZone]);
  const chatRooms = useMemo(() => allZoneChatRooms(), []);

  const cancelPendingSelection = useCallback(() => {
    if (selectionTimerRef.current != null) {
      clearTimeout(selectionTimerRef.current);
      selectionTimerRef.current = null;
    }
  }, []);

  const selectZone = useCallback(
    (zoneId: EventZoneId) => {
      setFocusZoneId(zoneId);
      cancelPendingSelection();
      selectionTimerRef.current = setTimeout(() => {
        selectionTimerRef.current = null;
        setHighlightZoneId(zoneId);
      }, FOCUS_ANIMATION_MS);
    },
    [cancelPendingSelection],
  );

  const handleCloseExpanded = useCallback(() => {
    setFocusZoneId(null);
    setHighlightZoneId(null);
    cancelPendingSelection();
  }, [cancelPendingSelection]);

  useEffect(() => {
    return () => {
      cancelPendingSelection();
    };
  }, [cancelPendingSelection]);

  const currentZoneGameEvent = useMemo(() => {
    if (!currentZoneId) {
      return undefined;
    }
    const event = activeEventsByZone[currentZoneId];
    if (!event || !isPhase1EventGame(event) || !isZoneEventActive(event)) {
      return undefined;
    }
    return event;
  }, [activeEventsByZone, currentZoneId]);

  const selectedZoneGameEvent = useMemo(() => {
    if (!focusZoneId) {
      return undefined;
    }
    const event = activeEventsByZone[focusZoneId];
    if (!event || !isPhase1EventGame(event) || !isZoneEventActive(event)) {
      return undefined;
    }
    return event;
  }, [activeEventsByZone, focusZoneId]);

  const roundSlots = useMemo((): EventRoundSlotItem[] => {
    if (!canQueryZoneEvents() || !currentRound) {
      return [];
    }
    const byZone = new Map(currentRound.zones.map(slot => [slot.zoneId, slot]));
    return EVENT_ZONES.map(zone => {
      const slot = byZone.get(zone.id);
      const slotStatus = slot?.slotStatus || 'REST';
      const statusLabel =
        slotStatus === 'OPEN'
          ? copy.roundSlotOpen
          : slotStatus === 'UPCOMING'
            ? copy.roundSlotUpcoming
            : copy.roundSlotRest;
      return {
        zoneId: zone.id,
        zoneName: eventZoneName(zone, language),
        slotStatus,
        statusLabel,
        eventId: slot?.eventId,
      };
    });
  }, [copy.roundSlotOpen, copy.roundSlotRest, copy.roundSlotUpcoming, currentRound, language]);

  const roundCountdownIso = useMemo(() => {
    if (!currentRound) {
      return undefined;
    }
    const hasOpen = currentRound.zones.some(slot => slot.slotStatus === 'OPEN');
    return hasOpen ? currentRound.endsAt : currentRound.startsAt;
  }, [currentRound]);

  const roundRemainingMs = useRemainingUntil(roundCountdownIso);
  const roundRemainingLabel = useMemo(() => {
    if (!currentRound || roundRemainingMs <= 0) {
      return undefined;
    }
    const remaining = formatZoneEventRemaining(roundRemainingMs, language);
    const hasOpen = currentRound.zones.some(slot => slot.slotStatus === 'OPEN');
    return hasOpen ? copy.roundEndsIn(remaining) : copy.roundStartsIn(remaining);
  }, [copy, currentRound, language, roundRemainingMs]);

  const roundStatusLabel = useMemo(() => {
    if (!currentRound) {
      return '';
    }
    return currentRound.zones.some(slot => slot.slotStatus === 'OPEN')
      ? copy.roundStatusOpen
      : copy.roundStatusUpcoming;
  }, [copy.roundStatusOpen, copy.roundStatusUpcoming, currentRound]);

  const currentZone = currentZoneId ? EVENT_ZONE_BY_ID[currentZoneId] : null;
  const selectedZone = focusZoneId ? EVENT_ZONE_BY_ID[focusZoneId] : null;
  const { memberCounts: liveMemberCounts } = useAllZoneChatMemberCounts();
  const currentLiveMemberCount = currentZoneId
    ? (liveMemberCounts[currentZoneId] ?? null)
    : null;
  const selectedLiveMemberCount = focusZoneId
    ? (liveMemberCounts[focusZoneId] ?? null)
    : null;
  const currentZoneRoom = useMemo(
    () => (currentZoneId ? getChatRoomByZoneId(currentZoneId) : undefined),
    [currentZoneId],
  );
  const selectedZoneRoom = useMemo(
    () => (focusZoneId ? getChatRoomByZoneId(focusZoneId) : undefined),
    [focusZoneId],
  );

  const handleEnterChat = (zoneId: EventZoneId) => {
    const room = getChatRoomByZoneId(zoneId);
    if (room) {
      navigation.navigate('EventZoneChat', { roomId: room.id });
    }
  };

  const handleJoinChat = (roomId: string) => {
    navigation.navigate('EventZoneChat', { roomId });
  };

  const handleOpenGameDetail = (eventId: string) => {
    navigation.navigate('EventGameDetail', { eventId });
  };

  const handleOpenParticipationHistory = () => {
    navigation.navigate('EventParticipationHistory');
  };

  const handleOpenAlbum = useCallback(() => {
    navigation.navigate('EventAlbum', {
      allZones: true,
      ...(currentRound?.roundId ? { roundId: currentRound.roundId } : {}),
    });
  }, [currentRound?.roundId, navigation]);

  const handleOpenRoundAlbum = useCallback(() => {
    if (currentRound?.roundId) {
      navigation.navigate('EventAlbum', {
        allZones: true,
        roundId: currentRound.roundId,
      });
      return;
    }
    handleOpenAlbum();
  }, [currentRound?.roundId, handleOpenAlbum, navigation]);

  const handleRoundSlotPress = useCallback(
    (slot: EventRoundSlotItem) => {
      if (slot.slotStatus === 'OPEN' && slot.eventId) {
        navigation.navigate('EventGameDetail', { eventId: slot.eventId });
        return;
      }
      selectZone(slot.zoneId);
    },
    [navigation, selectZone],
  );

  const handleOpenTitles = () => {
    navigation.navigate('EventTitles');
  };

  const handleJoinMission = () => {
    if (selectedZoneGameEvent) {
      handleOpenGameDetail(selectedZoneGameEvent.id);
      return;
    }
    showUnavailable(ALPHA_FEATURE_LABELS.zoneEvent);
  };

  const zoneEventBlocked = !canQueryZoneEvents();
  const selectedActiveEvent =
    zoneEventBlocked || !focusZoneId ? undefined : activeEventsByZone[focusZoneId];
  const listActiveEventsByZone = zoneEventBlocked ? {} : activeEventsByZone;

  return {
    language,
    copy,
    gameCopy,
    isFocused,
    focusZoneId,
    highlightZoneId,
    isFocusedOnZone,
    isSlotDimmed,
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
    selectedActiveEvent,
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
    handleOpenRoundAlbum,
    handleOpenTitles,
    handleJoinMission,
    handleRoundSlotPress,
    roundSlots,
    roundStatusLabel,
    roundRemainingLabel,
  };
}
