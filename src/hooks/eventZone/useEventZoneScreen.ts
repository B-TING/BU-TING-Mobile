import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useFeatureUnavailableAlert } from '../../components/shared/modals';
import { ALPHA_FEATURE_LABELS } from '../../constants/common/alphaFeatureBlocks';
import {
  EVENT_ZONE_BY_ID,
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
  const { refresh: refreshZoneEvents } = useHydrateZoneEvents(isFocused);
  const eventZoneIds = useMemo(() => {
    if (!canQueryZoneEvents()) {
      return [] as EventZoneId[];
    }
    return Object.keys(activeEventsByZone) as EventZoneId[];
  }, [activeEventsByZone]);
  const chatRooms = useMemo(() => allZoneChatRooms(), []);

  const [toastText, setToastText] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const showToast = (text: string) => {
    setToastText(text);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    Animated.timing(toastOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setToastText(null));
    }, 3000);
  };

  useEffect(() => {
    return () => {
      cancelPendingSelection();
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, [cancelPendingSelection]);

  const handleTriggerEvent = async () => {
    if (!canQueryZoneEvents()) {
      showUnavailable(ALPHA_FEATURE_LABELS.zoneEvent);
      return;
    }
    try {
      await refreshZoneEvents(true);
      const events = Object.values(useZoneEventStore.getState().activeEventsByZone);
      const event = events.find(item => item && isPhase1EventGame(item) && isZoneEventActive(item));
      if (!event) {
        return;
      }
      showToast(
        copy.eventToast(
          eventZoneName(EVENT_ZONE_BY_ID[event.zoneId], language),
          event.titleKo,
        ),
      );
    } catch {
      showUnavailable(ALPHA_FEATURE_LABELS.zoneEvent);
    }
  };

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
    toastText,
    toastOpacity,
    liveMemberCounts,
    selectedActiveEvent,
    listActiveEventsByZone,
    currentZoneGameEvent,
    selectedZoneGameEvent,
    selectZone,
    handleCloseExpanded,
    handleTriggerEvent,
    handleEnterChat,
    handleJoinChat,
    handleOpenGameDetail,
    handleOpenParticipationHistory,
    handleJoinMission,
  };
}
