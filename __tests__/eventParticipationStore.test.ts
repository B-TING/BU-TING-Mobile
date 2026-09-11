import type { EventParticipationRecord } from '../src/types/eventParticipation';
import type { ZoneEvent } from '../src/types/eventZone';
import { useEventParticipationStore } from '../src/stores/useEventParticipationStore';

const baseEvent: ZoneEvent = {
  id: 'evt-history-1',
  type: 'PLACE_AUTH',
  zoneId: 'HAEUNDAE_GIJANG',
  titleKo: '테스트 이벤트',
  descriptionKo: '설명',
  startsAt: new Date().toISOString(),
  durationMinutes: 60,
};

describe('useEventParticipationStore', () => {
  beforeEach(() => {
    useEventParticipationStore.getState().clearAll();
  });

  it('tracks in_progress then pending_review for one event', () => {
    expect(
      useEventParticipationStore.getState().beginParticipation(baseEvent, 't1', 'p-1'),
    ).toBe('ok');
    const inProgress = useEventParticipationStore.getState().getByEventId(baseEvent.id);
    expect(inProgress?.status).toBe('in_progress');
    expect(inProgress?.targetId).toBe('t1');
    expect(inProgress?.id).toBe('p-1');

    useEventParticipationStore
      .getState()
      .submitForReview(baseEvent, 'file://photo.jpg', 't1');
    const pending = useEventParticipationStore.getState().getByEventId(baseEvent.id);
    expect(pending?.status).toBe('pending_review');
    expect(pending?.localImageUri).toBe('file://photo.jpg');
    expect(pending?.id).toBe(inProgress?.id);
  });

  it('blocks new participation after pending review', () => {
    useEventParticipationStore.getState().submitForReview(baseEvent, 'file://photo.jpg');
    expect(
      useEventParticipationStore.getState().beginParticipation(baseEvent, 't1', 'p-1'),
    ).toBe('blocked');
  });

  it('allows camera reentry on rejected participation when canResubmit', () => {
    const event: ZoneEvent = {
      ...baseEvent,
      myParticipation: {
        participationId: 'p-fail',
        status: 'FAIL',
        canResubmit: true,
      },
    };
    useEventParticipationStore.getState().upsertRecord({
      id: 'p-fail',
      eventId: event.id,
      zoneId: event.zoneId,
      eventType: 'PLACE_AUTH',
      eventTitleKo: event.titleKo,
      targetId: 't1',
      status: 'rejected',
      canResubmit: true,
      createdAt: '2026-09-01T00:00:00.000Z',
    });

    expect(
      useEventParticipationStore.getState().beginParticipation(event, 't2', 'p-fail'),
    ).toBe('ok');
    const resumed = useEventParticipationStore.getState().getByEventId(event.id);
    expect(resumed?.id).toBe('p-fail');
    expect(resumed?.status).toBe('in_progress');
    expect(resumed?.targetId).toBe('t2');
  });

  it('blocks camera reentry after success', () => {
    const event: ZoneEvent = {
      ...baseEvent,
      myParticipation: {
        participationId: 'p-ok',
        status: 'SUCCESS',
        canResubmit: false,
      },
    };
    useEventParticipationStore.getState().upsertRecord({
      id: 'p-ok',
      eventId: event.id,
      zoneId: event.zoneId,
      eventType: 'PLACE_AUTH',
      eventTitleKo: event.titleKo,
      status: 'approved',
      createdAt: '2026-09-01T00:00:00.000Z',
    });
    expect(
      useEventParticipationStore.getState().beginParticipation(event, 't1', 'p-ok'),
    ).toBe('blocked');
  });

  it('lists records newest first', () => {
    const older: EventParticipationRecord = {
      id: 'old',
      eventId: 'evt-old',
      zoneId: 'HAEUNDAE_GIJANG',
      eventType: 'PLACE_AUTH',
      eventTitleKo: 'Old',
      status: 'pending_review',
      createdAt: '2026-01-01T00:00:00.000Z',
      submittedAt: '2026-01-01T00:00:00.000Z',
    };
    const newer: EventParticipationRecord = {
      id: 'new',
      eventId: 'evt-new',
      zoneId: 'YEONGDO',
      eventType: 'OBJECT_AUTH',
      eventTitleKo: 'New',
      status: 'in_progress',
      createdAt: '2026-02-01T00:00:00.000Z',
    };
    useEventParticipationStore.getState().upsertRecord(older);
    useEventParticipationStore.getState().upsertRecord(newer);

    const list = useEventParticipationStore.getState().listAll();
    expect(list[0]?.id).toBe('new');
    expect(list[1]?.id).toBe('old');
  });
});
