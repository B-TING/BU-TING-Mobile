import { create } from 'zustand';

import { isZoneEventActive } from '../constants/eventZone/zoneEvents';
import type { MappedZoneEventRound } from '../services/eventZone/zoneEventMapper';
import type { EventZoneId, ZoneEvent } from '../types/eventZone';

type ZoneEventState = {
  /** 구역별 활성 이벤트 (구역당 1개) */
  activeEventsByZone: Partial<Record<EventZoneId, ZoneEvent>>;
  currentRound: MappedZoneEventRound | null;
  loading: boolean;
  lastFetchedAt: number | null;
  triggerEvent: (event: ZoneEvent) => void;
  replaceActiveEvents: (events: ZoneEvent[]) => void;
  setCurrentRound: (round: MappedZoneEventRound | null) => void;
  setLoading: (loading: boolean) => void;
  markFetched: (at?: number) => void;
  clearEvent: (zoneId: EventZoneId) => void;
  clearAllEvents: () => void;
  getActiveEvent: (zoneId: EventZoneId) => ZoneEvent | undefined;
};

function toActiveByZone(events: ZoneEvent[]): Partial<Record<EventZoneId, ZoneEvent>> {
  const next: Partial<Record<EventZoneId, ZoneEvent>> = {};
  for (const event of events) {
    if (next[event.zoneId]) {
      continue;
    }
    next[event.zoneId] = event;
  }
  return next;
}

export const useZoneEventStore = create<ZoneEventState>()((set, get) => ({
  activeEventsByZone: {},
  currentRound: null,
  loading: false,
  lastFetchedAt: null,
  triggerEvent: event =>
    set(state => ({
      activeEventsByZone: {
        ...state.activeEventsByZone,
        [event.zoneId]: event,
      },
    })),
  replaceActiveEvents: events =>
    set({
      activeEventsByZone: toActiveByZone(events),
    }),
  setCurrentRound: round => set({ currentRound: round }),
  setLoading: loading => set({ loading }),
  markFetched: at => set({ lastFetchedAt: at ?? Date.now() }),
  clearEvent: zoneId =>
    set(state => {
      const next = { ...state.activeEventsByZone };
      delete next[zoneId];
      return { activeEventsByZone: next };
    }),
  clearAllEvents: () => set({ activeEventsByZone: {}, currentRound: null }),
  getActiveEvent: zoneId => {
    const event = get().activeEventsByZone[zoneId];
    if (!event) {
      return undefined;
    }
    return isZoneEventActive(event) ? event : undefined;
  },
}));
