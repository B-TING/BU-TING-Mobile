import type { TravelPlan } from '../src/types/travelPlan';
import {
  listCompletedLocalPlanIds,
  listOfflineViewablePlans,
  selectLatestLocalPlan,
} from '../src/utils/plan/selectLatestLocalPlan';

jest.mock('../src/utils/api/apiServerOrigin', () => ({
  isPlanForCurrentApiServer: (plan: TravelPlan) => {
    const isApiBacked = plan.source === 'api' || Boolean(plan.apiTravelId);
    if (!isApiBacked) {
      return true;
    }
    return plan.apiServerOrigin === 'local';
  },
}));

function makePlan(overrides: Partial<TravelPlan> & Pick<TravelPlan, 'planId'>): TravelPlan {
  return {
    title: '여행',
    startDate: '2099-08-01',
    endDate: '2099-08-03',
    status: 'CONFIRMED',
    constraints: {},
    members: [],
    itinerary: [],
    createdAt: '2026-08-01T00:00:00.000Z',
    source: 'local',
    ...overrides,
  };
}

function dayWithRoute(placeName = '해운대') {
  return {
    dailyId: 'd1',
    dayNumber: 1,
    date: '2099-08-01',
    routes: [
      {
        itemId: 'r1',
        sequence: 0,
        placeId: 'p1',
        placeName,
        type: 'ATTRACTION' as const,
        location: { lat: 35.15, lng: 129.15 },
        isVisited: false,
      },
    ],
  };
}

describe('selectLatestLocalPlan', () => {
  it('returns null when there are no plans', () => {
    expect(selectLatestLocalPlan({ plans: [], activePlanId: null })).toBeNull();
  });

  it('prefers active plan when it has itinerary content', () => {
    const active = makePlan({
      planId: 'active',
      createdAt: '2026-07-01T00:00:00.000Z',
      itinerary: [dayWithRoute('광안리')],
    });
    const newer = makePlan({
      planId: 'newer',
      createdAt: '2026-08-10T00:00:00.000Z',
      itinerary: [dayWithRoute()],
    });

    expect(
      selectLatestLocalPlan({
        plans: [newer, active],
        activePlanId: 'active',
      })?.planId,
    ).toBe('active');
  });

  it('skips empty shells when a plan with routes exists', () => {
    const empty = makePlan({
      planId: 'empty',
      createdAt: '2026-08-20T00:00:00.000Z',
      itinerary: [{ dailyId: 'd0', dayNumber: 1, date: '2099-08-01', routes: [] }],
    });
    const withRoutes = makePlan({
      planId: 'with-routes',
      createdAt: '2026-08-01T00:00:00.000Z',
      itinerary: [dayWithRoute()],
    });

    expect(
      selectLatestLocalPlan({
        plans: [empty, withRoutes],
        activePlanId: 'empty',
      })?.planId,
    ).toBe('with-routes');
  });

  it('ignores api plans from another server origin', () => {
    const foreign = makePlan({
      planId: 'foreign',
      source: 'api',
      apiTravelId: 't-foreign',
      apiServerOrigin: 'live',
      createdAt: '2026-08-20T00:00:00.000Z',
      itinerary: [dayWithRoute('타서버')],
    });
    const localApi = makePlan({
      planId: 'local-api',
      source: 'api',
      apiTravelId: 't-local',
      apiServerOrigin: 'local',
      createdAt: '2026-08-01T00:00:00.000Z',
      itinerary: [dayWithRoute()],
    });

    expect(
      selectLatestLocalPlan({
        plans: [foreign, localApi],
        activePlanId: null,
      })?.planId,
    ).toBe('local-api');
  });

  it('falls back to newest plan when none have routes', () => {
    const older = makePlan({
      planId: 'older',
      createdAt: '2026-07-01T00:00:00.000Z',
    });
    const newer = makePlan({
      planId: 'newer',
      createdAt: '2026-08-01T00:00:00.000Z',
    });

    expect(
      selectLatestLocalPlan({
        plans: [older, newer],
        activePlanId: null,
      })?.planId,
    ).toBe('newer');
  });
});

describe('listOfflineViewablePlans', () => {
  it('lists content plans newest-first and excludes foreign api origin', () => {
    const foreign = makePlan({
      planId: 'foreign',
      source: 'api',
      apiTravelId: 't-foreign',
      apiServerOrigin: 'live',
      createdAt: '2026-08-20T00:00:00.000Z',
      itinerary: [dayWithRoute('타서버')],
    });
    const older = makePlan({
      planId: 'older',
      createdAt: '2026-07-01T00:00:00.000Z',
      itinerary: [dayWithRoute('광안리')],
    });
    const newer = makePlan({
      planId: 'newer',
      createdAt: '2026-08-10T00:00:00.000Z',
      itinerary: [dayWithRoute()],
    });

    expect(
      listOfflineViewablePlans({ plans: [foreign, older, newer] }).map(p => p.planId),
    ).toEqual(['newer', 'older']);
  });

  it('excludes completed plans from offline list', () => {
    const completed = makePlan({
      planId: 'done',
      travelStatus: 'COMPLETED',
      createdAt: '2026-08-20T00:00:00.000Z',
      itinerary: [dayWithRoute('완료')],
    });
    const active = makePlan({
      planId: 'active',
      travelStatus: 'PLANNED',
      startDate: '2099-09-01',
      endDate: '2099-09-03',
      createdAt: '2026-08-01T00:00:00.000Z',
      itinerary: [dayWithRoute()],
    });

    expect(
      listOfflineViewablePlans({ plans: [completed, active] }).map(p => p.planId),
    ).toEqual(['active']);
  });
});

describe('listCompletedLocalPlanIds', () => {
  it('collects completed plan ids by status or end date', () => {
    const byStatus = makePlan({
      planId: 'by-status',
      travelStatus: 'COMPLETED',
    });
    const byDate = makePlan({
      planId: 'by-date',
      startDate: '2020-01-01',
      endDate: '2020-01-03',
    });
    const active = makePlan({
      planId: 'active',
      travelStatus: 'PLANNED',
      startDate: '2099-01-01',
      endDate: '2099-01-03',
    });

    expect(listCompletedLocalPlanIds([byStatus, byDate, active]).sort()).toEqual([
      'by-date',
      'by-status',
    ]);
  });
});
