const mockCloneTravelFromRecord = jest.fn();
const mockShowUnavailable = jest.fn();
const mockAddPlan = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../src/components/shared/modals', () => ({
  useFeatureUnavailableAlert: () => ({ showUnavailable: mockShowUnavailable }),
}));

jest.mock('../src/constants/common/alphaFeatureBlocks', () => ({
  ALPHA_FEATURE_LABELS: { importPlan: '여행 계획 가져오기' },
  isAlphaFeatureBlocked: () => false,
}));

jest.mock('../src/services/travel/cloneTravelFromRecord', () => ({
  cloneTravelFromRecord: (...args: unknown[]) => mockCloneTravelFromRecord(...args),
}));

jest.mock('../src/services/travel/travelRecordService', () => ({
  fetchTravelRecordComments: jest.fn(async () => []),
  createTravelRecordComment: jest.fn(),
  deleteTravelRecordComment: jest.fn(),
  likeTravelRecord: jest.fn(),
  unlikeTravelRecord: jest.fn(),
  updateTravelRecordComment: jest.fn(),
}));

jest.mock('../src/navigation/navigateToMainTab', () => ({
  navigateToMainTab: jest.fn(),
}));

jest.mock('../src/stores/useTravelRecordBookmarkStore', () => ({
  useTravelRecordBookmarkStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      isBookmarked: () => false,
      hydrate: jest.fn(async () => undefined),
      toggleBookmark: jest.fn(),
    }),
}));

jest.mock('../src/stores/useAuthStore', () => ({
  selectAuthUser: (state: { user: unknown }) => state.user,
  selectReusableAccessToken: (state: { accessToken: string | null }) => state.accessToken,
}));

const mockAuthState = {
  accessToken: 'token' as string | null,
  user: { userId: 'u1', nickname: 'Tester' } as {
    userId: string;
    nickname: string;
  } | null,
};

const mockPlanState = {
  plans: [] as Array<{ planId: string; title: string; status: string }>,
  activePlanId: null as string | null,
  addPlan: mockAddPlan,
};

jest.mock('../src/stores/usePlanStore', () => ({
  usePlanStore: Object.assign(
    (selector: (s: typeof mockPlanState) => unknown) => selector(mockPlanState),
    { getState: () => mockPlanState },
  ),
  selectActivePlan: (state: typeof mockPlanState) => {
    if (!state.activePlanId) {
      return null;
    }
    return state.plans.find(p => p.planId === state.activePlanId) ?? null;
  },
  selectHomeFeaturedPlan: () => null,
}));

jest.mock('../src/stores', () => ({
  selectActivePlan: (state: typeof mockPlanState) => {
    if (!state.activePlanId) {
      return null;
    }
    return state.plans.find(p => p.planId === state.activePlanId) ?? null;
  },
  useAppStore: (selector: (s: { language: string }) => unknown) =>
    selector({ language: 'ko' }),
  useAuthStore: (selector: (s: typeof mockAuthState) => unknown) => selector(mockAuthState),
  usePlanStore: (selector: (s: typeof mockPlanState) => unknown) => selector(mockPlanState),
}));

import { TRAVEL_REVIEW_COPY } from '../src/constants/review/travelReview';
import { useTravelogueSocialActions } from '../src/components/feed/useTravelogueSocialActions';
import type { TravelRecord } from '../src/types/travelReview';
import { act, renderHook } from './helpers/renderHook';

const copy = TRAVEL_REVIEW_COPY.ko;

function makeRecord(overrides?: Partial<TravelRecord>): TravelRecord {
  return {
    travelRecordId: 'record-1',
    travelId: 'travel-src',
    authorId: 'author-1',
    authorNickname: 'Author',
    title: '부산 2박 3일',
    content: null,
    coverImageUrl: null,
    imageUrls: [],
    overallRating: null,
    travelStartDate: '2026-08-01',
    travelEndDate: '2026-08-02',
    status: 'PUBLISHED',
    publishedAt: '2026-08-03T00:00:00Z',
    likeCount: 0,
    viewCount: 0,
    days: [
      {
        travelRecordDayId: 'day-1',
        originalPlanId: null,
        dayNumber: 1,
        visitDate: '2026-08-01',
        places: [
          {
            travelRecordPlaceId: 'place-1',
            planPlaceId: null,
            sequence: 1,
            placeName: '해동용궁사',
            address: null,
            latitude: 35.1,
            longitude: 129.1,
            provider: 'KAKAO',
            providerPlaceId: '126081',
            durationMinutes: null,
            memo: null,
            scheduledTime: null,
            visited: null,
            routeToNext: null,
          },
        ],
      },
      {
        travelRecordDayId: 'day-2',
        originalPlanId: null,
        dayNumber: 2,
        visitDate: '2026-08-02',
        places: [],
      },
    ],
    placeReviews: [],
    ...overrides,
  };
}

async function flushAsync() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useTravelogueSocialActions import plan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.accessToken = 'token';
    mockAuthState.user = { userId: 'u1', nickname: 'Tester' };
    mockPlanState.plans = [];
    mockPlanState.activePlanId = null;
    mockCloneTravelFromRecord.mockResolvedValue({
      planId: 'travel-new',
      title: '부산 2박 3일',
      startDate: '2026-09-10',
      endDate: '2026-09-11',
      status: 'CONFIRMED',
      constraints: {},
      members: [],
      itinerary: [],
      createdAt: '2026-09-01T00:00:00Z',
      source: 'api',
    });
  });

  it('moves confirm → datePick and previews end date from day count', async () => {
    const { result } = renderHook(() =>
      useTravelogueSocialActions(makeRecord(), copy, { navigate: mockNavigate }),
    );
    await flushAsync();

    act(() => {
      result.current.handleImportPlan();
    });
    expect(result.current.importModalProps.phase).toBe('confirm');
    expect(result.current.importModalProps.dayCount).toBe(2);

    act(() => {
      result.current.importModalProps.onConfirm();
    });
    expect(result.current.importModalProps.phase).toBe('datePick');
    expect(result.current.importModalProps.startDateValid).toBe(true);
    expect(result.current.importModalProps.computedEndDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('allows import from feed items even when days are empty (API has snapshot)', async () => {
    const { result } = renderHook(() =>
      useTravelogueSocialActions(
        makeRecord({
          days: [],
          travelStartDate: '2026-08-01',
          travelEndDate: '2026-08-03',
        }),
        copy,
        { navigate: mockNavigate },
      ),
    );
    await flushAsync();

    act(() => {
      result.current.handleImportPlan();
    });
    expect(result.current.importModalProps.phase).toBe('confirm');
    expect(result.current.importModalProps.dayCount).toBe(3);
    expect(mockCloneTravelFromRecord).not.toHaveBeenCalled();
  });

  it('warns when an active plan exists before calling API', async () => {
    mockPlanState.plans = [
      { planId: 'active-1', title: '진행 중 여행', status: 'CONFIRMED' },
    ];
    mockPlanState.activePlanId = 'active-1';

    const { result } = renderHook(() =>
      useTravelogueSocialActions(makeRecord(), copy, { navigate: mockNavigate }),
    );
    await flushAsync();

    act(() => {
      result.current.handleImportPlan();
      result.current.importModalProps.onConfirm();
    });
    act(() => {
      result.current.importModalProps.onChangeStartDate('2026-09-10');
    });
    act(() => {
      result.current.importModalProps.onConfirmDate();
    });

    expect(result.current.importModalProps.phase).toBe('activePlanWarning');
    expect(mockCloneTravelFromRecord).not.toHaveBeenCalled();
  });

  it('clones via API and stores the new plan on success', async () => {
    const { result } = renderHook(() =>
      useTravelogueSocialActions(makeRecord(), copy, { navigate: mockNavigate }),
    );
    await flushAsync();

    act(() => {
      result.current.handleImportPlan();
      result.current.importModalProps.onConfirm();
      result.current.importModalProps.onChangeStartDate('2026-09-10');
      result.current.importModalProps.onChangePlanTitle('새 부산 여행');
    });

    await act(async () => {
      result.current.importModalProps.onConfirmDate();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockCloneTravelFromRecord).toHaveBeenCalledWith({
      accessToken: 'token',
      travelRecordId: 'record-1',
      members: [{ userId: 'u1', nickname: 'Tester', role: 'LEADER' }],
      request: { startDate: '2026-09-10', title: '새 부산 여행' },
    });
    expect(mockAddPlan).toHaveBeenCalledWith(
      expect.objectContaining({ planId: 'travel-new' }),
    );
    expect(result.current.importModalProps.phase).toBe('success');
  });

  it('shows login error when not authenticated', async () => {
    mockAuthState.accessToken = null;
    mockAuthState.user = null;

    const { result } = renderHook(() =>
      useTravelogueSocialActions(makeRecord(), copy, { navigate: mockNavigate }),
    );
    await flushAsync();

    act(() => {
      result.current.handleImportPlan();
      result.current.importModalProps.onConfirm();
      result.current.importModalProps.onChangeStartDate('2026-09-10');
    });

    await act(async () => {
      result.current.importModalProps.onConfirmDate();
      await Promise.resolve();
    });

    expect(mockCloneTravelFromRecord).not.toHaveBeenCalled();
    expect(result.current.importModalProps.phase).toBe('error');
    expect(result.current.importModalProps.errorMessage).toBe(copy.socialLoginRequired);
  });

  it('shows API error message on failure', async () => {
    mockCloneTravelFromRecord.mockRejectedValue(new Error('Travel record not found'));

    const { result } = renderHook(() =>
      useTravelogueSocialActions(makeRecord(), copy, { navigate: mockNavigate }),
    );
    await flushAsync();

    act(() => {
      result.current.handleImportPlan();
      result.current.importModalProps.onConfirm();
      result.current.importModalProps.onChangeStartDate('2026-09-10');
    });

    await act(async () => {
      result.current.importModalProps.onConfirmDate();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.importModalProps.phase).toBe('error');
    expect(result.current.importModalProps.errorMessage).toBe('Travel record not found');
  });
});
