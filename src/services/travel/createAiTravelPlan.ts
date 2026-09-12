import type { PlanWizardAnswers } from '../../types/planWizard';
import type { PlanMember, TravelPlan } from '../../types/travelPlan';
import type { OnboardingProfile } from '../../types/user';
import { applyWizardPlaceTypes } from './planPlaceSync';
import {
  toAiTravelPlanGenerateRequest,
  toTravelCreateRequest,
  travelPlansResponseToPlan,
  wizardAnswersToConstraints,
} from './travelMapper';
import { createTravelRecordDraft } from './travelRecordService';
import { leaveTravelTeam } from './travelTeamService';
import { createTravel, generateAiTravelPlans } from './travelService';

export class AiTravelPlanError extends Error {
  cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'AiTravelPlanError';
    this.cause = options?.cause;
  }
}

export type CreateAiTravelPlanInput = {
  accessToken: string;
  answers: PlanWizardAnswers;
  members: PlanMember[];
  onboarding?: OnboardingProfile | null;
};

async function discardCreatedTravel(accessToken: string, travelId: string): Promise<void> {
  try {
    await leaveTravelTeam(accessToken, travelId);
  } catch (cleanupError) {
    if (__DEV__) {
      console.warn('[createAiTravelPlan] failed to discard travel after AI error', cleanupError);
    }
  }
}

/**
 * 위저드「AI가 일정 생성」— 새 Travel 생성 후 POST /ai-plans (30s).
 * 기존 travel을 덮어쓰지 않는다. 실패 시 로컬 가짜 일정은 만들지 않는다.
 * AI 생성 실패 시 방금 만든 Travel은 나가고 삭제한다.
 * 여행기 초안 실패는 일정 생성을 막지 않는다.
 */
export async function createAiTravelPlan(
  input: CreateAiTravelPlanInput,
): Promise<TravelPlan> {
  const { accessToken, answers, members, onboarding } = input;

  if (!accessToken?.trim()) {
    throw new AiTravelPlanError('로그인이 필요합니다.');
  }
  if (answers.selectedAttractions.length < 1) {
    throw new AiTravelPlanError('가고 싶은 관광지를 1곳 이상 선택해 주세요.');
  }

  const constraints = wizardAnswersToConstraints(answers);
  const travelBody = toTravelCreateRequest(answers);
  const aiBody = toAiTravelPlanGenerateRequest(answers, {
    schedulePace: onboarding?.schedulePace,
  });

  let travelId: string | undefined;
  try {
    const travel = await createTravel(accessToken, travelBody);
    travelId = travel.travelId;
    const plans = await generateAiTravelPlans(accessToken, travel.travelId, aiBody);

    try {
      await createTravelRecordDraft(accessToken, travel.travelId, {
        title: travel.title ?? travelBody.title ?? null,
      });
    } catch (draftError) {
      if (__DEV__) {
        console.warn(
          '[createAiTravelPlan] travel record draft failed (API only, no local fallback)',
          draftError,
        );
      }
    }

    return applyWizardPlaceTypes(
      travelPlansResponseToPlan(
        plans,
        members,
        constraints,
        travel.startDate,
        travel.endDate,
      ),
      answers.accommodationMode === 'booked'
        ? answers.bookedAccommodation?.placeId
        : null,
    );
  } catch (error) {
    if (travelId) {
      await discardCreatedTravel(accessToken, travelId);
    }
    const message =
      error instanceof Error ? error.message : 'AI 일정 생성에 실패했습니다.';
    throw new AiTravelPlanError(message, { cause: error });
  }
}
