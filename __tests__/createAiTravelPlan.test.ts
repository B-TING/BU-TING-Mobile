const mockCreateTravel = jest.fn();
const mockGenerateAiTravelPlans = jest.fn();
const mockCreateTravelRecordDraft = jest.fn();
const mockLeaveTravelTeam = jest.fn();

jest.mock('../src/services/travel/travelService', () => ({
  createTravel: (...args: unknown[]) => mockCreateTravel(...args),
  generateAiTravelPlans: (...args: unknown[]) => mockGenerateAiTravelPlans(...args),
}));

jest.mock('../src/services/travel/travelRecordService', () => ({
  createTravelRecordDraft: (...args: unknown[]) => mockCreateTravelRecordDraft(...args),
}));

jest.mock('../src/services/travel/travelTeamService', () => ({
  leaveTravelTeam: (...args: unknown[]) => mockLeaveTravelTeam(...args),
}));

jest.mock('../src/utils/api/apiServerOrigin', () => ({
  getCurrentApiServerOrigin: () => 'local',
}));

import { createAiTravelPlan } from '../src/services/travel/createAiTravelPlan';
import type { PlanWizardAnswers } from '../src/types/planWizard';

const answers = (): PlanWizardAnswers => ({
  title: '해운대 주말',
  startDate: '2026-08-23',
  endDate: '2026-08-24',
  companionCount: 2,
  companionTypes: ['friends'],
  travelStyleIds: ['nature'],
  hasHeavyBaggage: false,
  hasPets: false,
  otherConstraintIds: [],
  attractionIds: ['126081'],
  selectedAttractions: [
    {
      placeId: '126081',
      placeName: '해동용궁사',
      location: { lat: 35.1882, lng: 129.2232 },
      address: '부산 기장군 기장읍 용궁길 86',
    },
  ],
  foodIds: ['milmyeon'],
  accommodationMode: 'booked',
  accommodationPlaceId: 'stay_1',
  accommodationName: '해운대 호텔',
  bookedAccommodation: {
    placeId: 'stay_1',
    placeName: '해운대 호텔',
    location: { lat: 35.16, lng: 129.16 },
  },
  accommodationAreaIds: [],
  generationMode: 'auto',
});

const members = [{ userId: 'u1', nickname: 'Traveler', role: 'LEADER' as const }];

describe('createAiTravelPlan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateTravel.mockResolvedValue({
      travelId: 'travel-1',
      title: '해운대 주말',
      startDate: '2026-08-23',
      endDate: '2026-08-24',
      status: 'PLANNED',
    });
    mockGenerateAiTravelPlans.mockResolvedValue({
      travelId: 'travel-1',
      title: '해운대 주말',
      days: [
        {
          planId: 'plan-1',
          dayNumber: 1,
          visitDate: '2026-08-23',
          places: [
            {
              planPlaceId: 'pp-1',
              sequence: 1,
              placeName: '해동용궁사',
              address: '부산 기장군 기장읍 용궁길 86',
              latitude: 35.1882,
              longitude: 129.2232,
              provider: 'GOOGLE',
              providerPlaceId: '126081',
              visited: false,
            },
            {
              planPlaceId: 'pp-2',
              sequence: 2,
              placeName: '해운대 호텔',
              address: '부산 해운대구',
              latitude: 35.16,
              longitude: 129.16,
              provider: 'GOOGLE',
              providerPlaceId: 'stay_1',
              visited: false,
            },
          ],
        },
      ],
    });
    mockCreateTravelRecordDraft.mockResolvedValue({ travelRecordId: 'record-1' });
    mockLeaveTravelTeam.mockResolvedValue(undefined);
  });

  it('creates a new travel then requests AI plans without seeding empty days', async () => {
    const plan = await createAiTravelPlan({
      accessToken: 'token',
      answers: answers(),
      members,
    });

    expect(mockCreateTravel).toHaveBeenCalledTimes(1);
    expect(mockGenerateAiTravelPlans).toHaveBeenCalledWith(
      'token',
      'travel-1',
      expect.objectContaining({
        selectedPlaces: [
          expect.objectContaining({
            provider: 'GOOGLE',
            providerPlaceId: '126081',
          }),
        ],
        bookedAccommodation: '해운대 호텔',
      }),
    );
    expect(plan.apiTravelId).toBe('travel-1');
    expect(mockLeaveTravelTeam).not.toHaveBeenCalled();
    expect(plan.itinerary[0]?.routes).toHaveLength(2);
    expect(plan.itinerary[0]?.routes.find(route => route.placeId === 'stay_1')?.type).toBe(
      'ACCOMMODATION',
    );
  });

  it('does not fail the plan when the travel-record draft fails', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockCreateTravelRecordDraft.mockRejectedValue(new Error('draft down'));

    const plan = await createAiTravelPlan({
      accessToken: 'token',
      answers: answers(),
      members,
    });

    expect(plan.apiTravelId).toBe('travel-1');
    warn.mockRestore();
  });

  it('does not create a travel when no places are selected', async () => {
    await expect(
      createAiTravelPlan({
        accessToken: 'token',
        answers: { ...answers(), selectedAttractions: [] },
        members,
      }),
    ).rejects.toThrow('가고 싶은 관광지를 1곳 이상 선택해 주세요.');

    expect(mockCreateTravel).not.toHaveBeenCalled();
    expect(mockGenerateAiTravelPlans).not.toHaveBeenCalled();
    expect(mockLeaveTravelTeam).not.toHaveBeenCalled();
  });

  it('does not fall back to a local fake itinerary when AI generation fails', async () => {
    mockGenerateAiTravelPlans.mockRejectedValue(
      new Error('일정 생성 시간이 초과되었습니다. 다시 시도해 주세요.'),
    );

    await expect(
      createAiTravelPlan({
        accessToken: 'token',
        answers: answers(),
        members,
      }),
    ).rejects.toThrow('일정 생성 시간이 초과되었습니다. 다시 시도해 주세요.');

    expect(mockLeaveTravelTeam).toHaveBeenCalledWith('token', 'travel-1');
  });

  it('still reports the AI error if discarding the empty travel fails', async () => {
    mockGenerateAiTravelPlans.mockRejectedValue(new Error('서버 내부 오류가 발생했습니다.'));
    mockLeaveTravelTeam.mockRejectedValue(new Error('나가기 실패'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(
      createAiTravelPlan({
        accessToken: 'token',
        answers: answers(),
        members,
      }),
    ).rejects.toThrow('서버 내부 오류가 발생했습니다.');

    warn.mockRestore();
  });
});
