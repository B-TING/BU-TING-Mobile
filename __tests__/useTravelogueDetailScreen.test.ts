jest.mock('../src/hooks/feed/useTravelogueSocialActions', () => ({
  TravelogueSocialError: class TravelogueSocialError extends Error {},
  useTravelogueSocialActions: () => ({}),
}));

jest.mock('../src/components/shared/modals', () => ({
  useAppAlert: () => ({ alert: jest.fn() }),
}));

jest.mock('../src/i18n', () => ({
  useAppLanguage: () => 'ko',
  useCopy: () => ({}),
}));

jest.mock('../src/services/travel/deletePlaceReviewForTravel', () => ({
  deletePlaceReviewForTravel: jest.fn(),
}));
jest.mock('../src/services/travel/loadTravelRecordDetail', () => ({
  loadTravelRecordDetail: jest.fn(),
}));
jest.mock('../src/services/travel/savePlaceReviewForTravel', () => ({
  PlaceReviewSyncError: class PlaceReviewSyncError extends Error {},
  savePlaceReviewForTravel: jest.fn(),
}));
jest.mock('../src/services/travel/updateTravelRecordForTravel', () => ({
  updateTravelRecordForTravel: jest.fn(),
}));

jest.mock('../src/stores', () => ({
  useAuthStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ accessToken: null }),
  usePlanStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ plans: [], getPlanById: () => null }),
}));

jest.mock('../src/stores/useAuthStore', () => ({
  selectReusableAccessToken: () => null,
}));

jest.mock('../src/constants/eventZone/eventZone', () => ({
  EVENT_ZONE_BY_ID: {
    zone_a: { baseColor: '#111111' },
  },
}));

jest.mock('../src/utils/eventZone/zoneResolver', () => ({
  resolveEventZoneForRoute: () => 'zone_a',
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import {
  isTravelRecordPlaceVisited,
  TRAVELOGUE_MAP_HEIGHT,
  zoneBaseColorForRoute,
} from '../src/hooks/feed/useTravelogueDetailScreen';
import type { RouteItem } from '../src/types/travelPlan';
import type { TravelRecordPlace } from '../src/types/travelReview';

describe('useTravelogueDetailScreen helpers', () => {
  it('exposes map height constant', () => {
    expect(TRAVELOGUE_MAP_HEIGHT).toBe(200);
  });

  describe('isTravelRecordPlaceVisited', () => {
    it('returns true only when visited is explicitly true', () => {
      expect(isTravelRecordPlaceVisited({ visited: true } as TravelRecordPlace)).toBe(true);
      expect(isTravelRecordPlaceVisited({ visited: false } as TravelRecordPlace)).toBe(false);
      expect(isTravelRecordPlaceVisited({} as TravelRecordPlace)).toBe(false);
    });
  });

  describe('zoneBaseColorForRoute', () => {
    it('returns the base color for the resolved event zone', () => {
      expect(zoneBaseColorForRoute({ placeId: 'p1' } as RouteItem)).toBe('#111111');
    });
  });
});
