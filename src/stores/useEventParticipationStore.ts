import { create } from 'zustand';

import type {
  EventParticipationRecord,
  EventParticipationStatus,
} from '../types/eventParticipation';
import type { EventZoneId, ZoneEvent } from '../types/eventZone';

export const EMPTY_PARTICIPATION_RECORDS: EventParticipationRecord[] = [];

type EventParticipationState = {
  records: EventParticipationRecord[];
  upsertRecord: (record: EventParticipationRecord) => void;
  updateStatus: (
    id: string,
    status: EventParticipationStatus,
    patch?: Partial<Pick<EventParticipationRecord, 'localImageUri' | 'submittedAt'>>,
  ) => void;
  beginParticipation: (
    event: ZoneEvent,
    targetId: string | null | undefined,
    participationId: string,
  ) => 'ok' | 'blocked';
  submitForReview: (
    event: ZoneEvent,
    localImageUri: string,
    targetId?: string | null,
  ) => void;
  getByEventId: (eventId: string) => EventParticipationRecord | undefined;
  /** imperative only — React 셀렉터로 쓰지 말 것 (정렬 복사본) */
  listAll: () => EventParticipationRecord[];
  /** imperative only — React 셀렉터로 쓰지 말 것 */
  listByZone: (zoneId: EventZoneId) => EventParticipationRecord[];
  clearAll: () => void;
};

function createParticipationId(): string {
  return `ep-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isPhase1AuthEvent(
  event: ZoneEvent,
): event is ZoneEvent & { type: 'PLACE_AUTH' | 'OBJECT_AUTH' } {
  return event.type === 'PLACE_AUTH' || event.type === 'OBJECT_AUTH';
}

/** 제출/생성 시각 기준 최신순. React에서는 records 구독 + useMemo로 사용. */
export function sortParticipationRecordsNewestFirst(
  records: EventParticipationRecord[],
): EventParticipationRecord[] {
  if (records.length === 0) {
    return EMPTY_PARTICIPATION_RECORDS;
  }
  return [...records].sort((a, b) => {
    const aTime = Date.parse(a.submittedAt ?? a.createdAt);
    const bTime = Date.parse(b.submittedAt ?? b.createdAt);
    return bTime - aTime;
  });
}

export const useEventParticipationStore = create<EventParticipationState>()(
  (set, get) => ({
    records: EMPTY_PARTICIPATION_RECORDS,
    upsertRecord: record =>
      set(state => {
        const index = state.records.findIndex(
          item => item.id === record.id || item.eventId === record.eventId,
        );
        if (index < 0) {
          return { records: [record, ...state.records] };
        }
        const next = [...state.records];
        next[index] = record;
        return { records: next };
      }),
    updateStatus: (id, status, patch) =>
      set(state => ({
        records: state.records.map(item =>
          item.id === id ? { ...item, ...patch, status } : item,
        ),
      })),
    beginParticipation: (event, targetId, participationId) => {
      if (!isPhase1AuthEvent(event) || !participationId) {
        return 'blocked';
      }

      const existing = get().getByEventId(event.id);
      if (
        existing &&
        existing.status !== 'in_progress'
      ) {
        return 'blocked';
      }

      const now = new Date().toISOString();
      get().upsertRecord({
        id: participationId,
        eventId: event.id,
        zoneId: event.zoneId,
        eventType: event.type,
        eventTitleKo: event.titleKo,
        targetId: targetId ?? existing?.targetId,
        status: 'in_progress',
        localImageUri: existing?.localImageUri,
        createdAt: existing?.createdAt ?? now,
        submittedAt: existing?.submittedAt,
      });
      return 'ok';
    },
    submitForReview: (event, localImageUri, targetId) => {
      if (!isPhase1AuthEvent(event)) {
        return;
      }

      const existing = get().getByEventId(event.id);
      const now = new Date().toISOString();
      get().upsertRecord({
        id: existing?.id ?? createParticipationId(),
        eventId: event.id,
        zoneId: event.zoneId,
        eventType: event.type,
        eventTitleKo: event.titleKo,
        targetId: targetId ?? existing?.targetId,
        status: 'pending_review',
        localImageUri,
        createdAt: existing?.createdAt ?? now,
        submittedAt: now,
      });
    },
    getByEventId: eventId =>
      get().records.find(item => item.eventId === eventId),
    listAll: () => sortParticipationRecordsNewestFirst(get().records),
    listByZone: zoneId =>
      sortParticipationRecordsNewestFirst(
        get().records.filter(item => item.zoneId === zoneId),
      ),
    clearAll: () => set({ records: EMPTY_PARTICIPATION_RECORDS }),
  }),
);

export function selectParticipationRecords(state: EventParticipationState) {
  return state.records;
}
