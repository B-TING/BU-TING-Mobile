import {
  isServerTargetId,
  mapHistoryItemToRecord,
  mapZoneEventDetail,
  mapZoneEventSummary,
} from '../src/services/eventZone/zoneEventMapper';
import type {
  ZoneEventDetailResponse,
  ZoneEventHistoryItemResponse,
  ZoneEventSummaryResponse,
} from '../src/types/zoneEventApi';

const TARGET_UUID = '11111111-1111-4111-8111-111111111111';
const TARGET_UUID_B = '22222222-2222-4222-8222-222222222222';
const PARTICIPATION_UUID = '33333333-3333-4333-8333-333333333333';
const FAKE_TARGET = 'evt-1-target';

const zone = { zoneId: 'HAEUNDAE_GIJANG', zoneName: '해운대' };

function summary(
  patch: Partial<ZoneEventSummaryResponse> = {},
): ZoneEventSummaryResponse {
  return {
    eventId: 'evt-1',
    zone,
    typeCode: 'PLACE_AUTH',
    remainingSeconds: 600,
    authTarget: {
      placeName: '해운대',
      latitude: 35.16,
      longitude: 129.16,
      radiusM: 150,
    },
    ...patch,
  };
}

function detail(
  patch: Partial<ZoneEventDetailResponse> = {},
): ZoneEventDetailResponse {
  return {
    eventId: 'evt-1',
    zone,
    typeCode: 'PLACE_AUTH',
    remainingSeconds: 600,
    slotCode: '1-A',
    deadline: '2099-09-12T12:00:00.000Z',
    endsAt: '2099-09-12T12:00:00.000Z',
    ...patch,
  };
}

describe('isServerTargetId', () => {
  it('accepts UUID only', () => {
    expect(isServerTargetId(TARGET_UUID)).toBe(true);
    expect(isServerTargetId(FAKE_TARGET)).toBe(false);
    expect(isServerTargetId(`${'evt-1'}-target`)).toBe(false);
    expect(isServerTargetId(undefined)).toBe(false);
  });
});

describe('mapZoneEventSummary', () => {
  it('leaves authTargets empty even when authTarget is present', () => {
    const mapped = mapZoneEventSummary(summary());
    expect(mapped).not.toBeNull();
    expect(mapped?.authTargets).toEqual([]);
  });
});

describe('mapZoneEventDetail', () => {
  it('maps UUID targets and drops fake ids', () => {
    const mapped = mapZoneEventDetail(
      detail({
        targets: [
          {
            targetId: TARGET_UUID,
            targetKind: 'PLACE',
            placeName: '해운대',
            latitude: 35.16,
            longitude: 129.16,
            radiusM: 120,
          },
          {
            targetId: FAKE_TARGET,
            placeName: '가짜',
            latitude: 35.17,
            longitude: 129.17,
            radiusM: 100,
          },
          {
            targetId: TARGET_UUID_B,
            targetKind: 'PLACE',
            placeName: '동백섬',
            latitude: 35.15,
            longitude: 129.15,
          },
        ],
      }),
    );

    expect(mapped?.authTargets?.map(item => item.targetId)).toEqual([
      TARGET_UUID,
      TARGET_UUID_B,
    ]);
    expect(mapped?.slotCode).toBe('1-A');
    expect(mapped?.deadline).toBe('2099-09-12T12:00:00.000Z');
  });

  it('falls back to authTarget UUID when targets is empty', () => {
    const mapped = mapZoneEventDetail(
      detail({
        targets: [],
        authTarget: {
          targetId: TARGET_UUID,
          placeName: '레거시',
          latitude: 35.16,
          longitude: 129.16,
          radiusM: 150,
        },
      }),
    );
    expect(mapped?.authTargets).toHaveLength(1);
    expect(mapped?.authTargets?.[0]?.targetId).toBe(TARGET_UUID);
  });

  it('does not invent a fake target from authTarget without UUID', () => {
    const mapped = mapZoneEventDetail(
      detail({
        authTarget: {
          targetId: FAKE_TARGET,
          placeName: '해운대',
          latitude: 35.16,
          longitude: 129.16,
        },
      }),
    );
    expect(mapped?.authTargets).toEqual([]);
  });

  it('maps myParticipation onto open id and status', () => {
    const mapped = mapZoneEventDetail(
      detail({
        myParticipation: {
          participationId: PARTICIPATION_UUID,
          status: 'FAIL',
          canResubmit: true,
        },
      }),
    );
    expect(mapped?.myParticipation).toEqual({
      participationId: PARTICIPATION_UUID,
      status: 'FAIL',
      canResubmit: true,
    });
    expect(mapped?.myOpenParticipationId).toBe(PARTICIPATION_UUID);
    expect(mapped?.myParticipationStatus).toBe('FAIL');
  });
});

describe('mapHistoryItemToRecord', () => {
  const historyBase: ZoneEventHistoryItemResponse = {
    participationId: PARTICIPATION_UUID,
    status: 'FAIL',
    event: {
      eventId: 'evt-1',
      title: '해운대 인증',
      typeCode: 'PLACE_AUTH',
      zone,
    },
    joinedAt: '2026-09-01T00:00:00.000Z',
    rejectionReason: '사물이 안 보임',
    canResubmit: true,
    submissions: [
      {
        submissionId: 'sub-1',
        attemptNo: 1,
        targetId: TARGET_UUID,
        placeName: '해운대',
        rejectionReason: '사물이 안 보임',
        submittedAt: '2026-09-01T01:00:00.000Z',
      },
    ],
  };

  it('maps rejection, resubmit flag, and submissions', () => {
    const record = mapHistoryItemToRecord(historyBase);
    expect(record?.status).toBe('rejected');
    expect(record?.rejectionReason).toBe('사물이 안 보임');
    expect(record?.canResubmit).toBe(true);
    expect(record?.targetId).toBe(TARGET_UUID);
    expect(record?.submissions).toHaveLength(1);
    expect(record?.submissions?.[0]?.submissionId).toBe('sub-1');
  });

  it('skips cancelled rows', () => {
    expect(mapHistoryItemToRecord({ ...historyBase, status: 'CANCELLED' })).toBeNull();
  });
});
