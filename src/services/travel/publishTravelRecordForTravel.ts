import { usePlanStore } from '../../stores/usePlanStore';
import { useTravelRecordStore } from '../../stores/useTravelRecordStore';
import type { TravelPlan } from '../../types/travelPlan';
import { mapTravelRecordResponse } from '../../types/travelRecordApi';
import type { TravelRecord, TravelRecordStatus } from '../../types/travelReview';
import { overallRatingToApi } from '../../utils/review/travelReview';
import {
  createTravelRecordDraft,
  fetchMyTravelRecord,
  fetchMyTravelRecords,
  fetchTravelRecordDraft,
  hideMyTravelRecord,
  publishTravelRecord,
  updateTravelRecordDraft,
} from './travelRecordService';
import { updateTravelStatus } from './travelService';

export class PublishTravelRecordError extends Error {
  cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'PublishTravelRecordError';
    this.cause = options?.cause;
  }
}

export type PublishTravelRecordInput = {
  accessToken: string;
  plan: TravelPlan;
  authorNickname: string;
  title: string;
  content: string;
  status: Extract<TravelRecordStatus, 'PUBLISHED' | 'HIDDEN'>;
  /** 미전달 시 서버가 imageUrls[0]으로 대표 지정 */
  coverImageUrl?: string | null;
  imageUrls?: string[] | null;
  overallRating: number;
};

function travelIdOf(plan: TravelPlan): string {
  return plan.apiTravelId ?? plan.planId;
}

function isTravelCompleted(plan: TravelPlan): boolean {
  return plan.status === 'COMPLETED' || plan.travelStatus === 'COMPLETED';
}

/** 게시 전 여행을 COMPLETED로 맞춤 (이미 완료면 no-op) */
async function ensureTravelCompleted(
  accessToken: string,
  plan: TravelPlan,
): Promise<void> {
  if (isTravelCompleted(plan)) {
    return;
  }

  const travelId = travelIdOf(plan);
  await updateTravelStatus(accessToken, travelId, { status: 'COMPLETED' });
  usePlanStore.getState().completePlan(plan.planId);
}

async function resolveOrCreateDraft(
  accessToken: string,
  plan: TravelPlan,
  authorNickname: string,
  title: string,
): Promise<TravelRecord> {
  const travelId = travelIdOf(plan);
  const placeReviews = useTravelRecordStore.getState().getReviewsForTravel(travelId);

  const loadDetail = async (travelRecordId: string): Promise<TravelRecord | null> => {
    try {
      const detail = await fetchTravelRecordDraft(accessToken, travelId, travelRecordId);
      return mapTravelRecordResponse(detail, {
        authorNickname,
        placeReviews,
      });
    } catch {
      try {
        const detail = await fetchMyTravelRecord(accessToken, travelRecordId);
        return mapTravelRecordResponse(detail, {
          authorNickname,
          placeReviews,
        });
      } catch {
        return null;
      }
    }
  };

  const mine = await fetchMyTravelRecords(accessToken);
  const match = mine.find(item => item.travelId === travelId);
  if (match) {
    const fromList = await loadDetail(match.travelRecordId);
    if (fromList) {
      return fromList;
    }
  }

  const created = await createTravelRecordDraft(accessToken, travelId, { title });
  return mapTravelRecordResponse(created, {
    authorNickname,
    placeReviews,
  });
}

/**
 * 여행 완료 처리 → 여행기 제목/본문 저장 → 게시(또는 비공개).
 * 결과는 반환만 하며 여행기 스토어에 저장하지 않음.
 */
export async function publishTravelRecordForTravel(
  input: PublishTravelRecordInput,
): Promise<TravelRecord> {
  const {
    accessToken,
    plan,
    authorNickname,
    title,
    content,
    status,
    coverImageUrl,
    imageUrls,
    overallRating,
  } = input;

  if (!accessToken?.trim()) {
    throw new PublishTravelRecordError('로그인이 필요합니다.');
  }
  if (plan.source !== 'api' || !plan.apiTravelId) {
    throw new PublishTravelRecordError('서버 일정에서만 여행기를 게시할 수 있어요.');
  }

  const travelId = travelIdOf(plan);

  try {
    await ensureTravelCompleted(accessToken, plan);

    const draft = await resolveOrCreateDraft(
      accessToken,
      plan,
      authorNickname,
      title,
    );

    const draftBody: Parameters<typeof updateTravelRecordDraft>[3] = {
      title,
      content: content || null,
      overallRating: overallRatingToApi(overallRating),
      imageUrls: imageUrls ?? [],
    };
    if (coverImageUrl !== undefined) {
      draftBody.coverImageUrl = coverImageUrl;
    }

    await updateTravelRecordDraft(accessToken, travelId, draft.travelRecordId, draftBody);

    let dto = await publishTravelRecord(
      accessToken,
      travelId,
      draft.travelRecordId,
    );

    if (status === 'HIDDEN') {
      dto = await hideMyTravelRecord(accessToken, draft.travelRecordId);
    }

    return mapTravelRecordResponse(dto, {
      authorNickname,
      placeReviews: useTravelRecordStore.getState().getReviewsForTravel(travelId),
    });
  } catch (error) {
    if (error instanceof PublishTravelRecordError) {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : '여행기 게시에 실패했습니다.';
    throw new PublishTravelRecordError(message, { cause: error });
  }
}
