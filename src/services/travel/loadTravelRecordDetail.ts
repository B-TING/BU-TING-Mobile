import type {
  PlaceReviewResponse,
  PlaceReviewSummaryItemResponse,
  TravelRecordResponse,
} from '../../types/travelRecordApi';
import { mapTravelRecordResponse } from '../../types/travelRecordApi';
import type { PlaceReview, TravelRecord, TravelRecordPlace } from '../../types/travelReview';
import {
  mediaFromApiUrls,
  resolveDisplayMediaUrl,
  resolveReviewMediaList,
} from '../../utils/media/resolveMediaUrl';
import {
  fetchMyTravelRecord,
  fetchPlaceReview,
  fetchPlaceReviewSummary,
  fetchPublicTravelRecord,
} from './travelRecordService';

async function mapDtoToPlaceReview(
  dto: PlaceReviewResponse,
  place: TravelRecordPlace,
  accessToken?: string | null,
): Promise<PlaceReview> {
  return {
    placeReviewId: dto.placeReviewId,
    planPlaceId: dto.planPlaceId ?? place.planPlaceId,
    travelRecordPlaceId: dto.travelRecordPlaceId ?? place.travelRecordPlaceId,
    rating: dto.rating,
    stayMinutes: dto.stayMinutes ?? null,
    content: dto.content,
    tags: dto.tags ?? [],
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    placeName: place.placeName,
    media: await resolveReviewMediaList(
      mediaFromApiUrls(dto.placeReviewId, dto.mediaUrls),
      accessToken,
    ),
  };
}

async function mapSummaryItemToPlaceReview(
  item: PlaceReviewSummaryItemResponse,
  accessToken?: string | null,
): Promise<PlaceReview> {
  return {
    placeReviewId: item.placeReviewId,
    planPlaceId: null,
    travelRecordPlaceId: item.travelRecordPlaceId,
    rating: item.rating,
    stayMinutes: item.stayMinutes ?? null,
    content: item.content,
    tags: item.tags ?? [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    placeName: item.placeName,
    media: await resolveReviewMediaList(
      mediaFromApiUrls(item.placeReviewId, item.mediaUrls),
      accessToken,
    ),
  };
}

function flattenPlaces(record: TravelRecord): TravelRecordPlace[] {
  return record.days?.flatMap(day => day.places) ?? [];
}

/**
 * 작성자 권한이 있으면 PlanPlace 후기 GET,
 * 없으면(공개 피드) places/reviews 집계에서 해당 travelRecordId만 필터.
 */
async function fetchPlaceReviewsForRecord(options: {
  travelRecord: TravelRecord;
  accessToken?: string | null;
}): Promise<PlaceReview[]> {
  const { travelRecord, accessToken } = options;
  const places = flattenPlaces(travelRecord);
  if (places.length === 0) {
    return [];
  }

  const travelId = travelRecord.travelId;
  const canUseAuthorApi = Boolean(accessToken?.trim() && travelId);

  if (canUseAuthorApi) {
    const results = await Promise.all(
      places.map(async place => {
        const planPlaceId = place.planPlaceId;
        if (!planPlaceId) {
          return null;
        }
        try {
          const dto = await fetchPlaceReview(accessToken!, travelId!, planPlaceId);
          return mapDtoToPlaceReview(dto, place, accessToken);
        } catch {
          return null;
        }
      }),
    );
    const authorReviews = results.filter((r): r is PlaceReview => r != null);
    if (authorReviews.length > 0) {
      return authorReviews;
    }
  }

  const providerIds = [
    ...new Set(places.map(p => p.providerPlaceId).filter(Boolean)),
  ];
  if (providerIds.length === 0) {
    return [];
  }

  const summaries = await Promise.all(
    providerIds.map(async placeId => {
      try {
        return await fetchPlaceReviewSummary(placeId);
      } catch {
        return null;
      }
    }),
  );

  const matched: PlaceReview[] = [];
  for (const summary of summaries) {
    if (!summary?.reviews) {
      continue;
    }
    for (const item of summary.reviews) {
      if (item.travelRecordId === travelRecord.travelRecordId) {
        matched.push(await mapSummaryItemToPlaceReview(item, accessToken));
      }
    }
  }

  if (matched.length > 0) {
    return matched;
  }

  return [];
}

export type LoadTravelRecordDetailInput = {
  travelRecordId: string;
  accessToken?: string | null;
};

export type LoadTravelRecordDetailResult = {
  record: TravelRecord;
  /** GET /travel-records/me/{id} 성공 → 작성자 본인 */
  loadedAsOwner: boolean;
};

/**
 * 공개/내 여행기 상세 + 장소 후기 — API만 사용 (로컬 시드/스토어 병합 없음).
 */
export async function loadTravelRecordDetail(
  input: LoadTravelRecordDetailInput,
): Promise<LoadTravelRecordDetailResult> {
  const { travelRecordId, accessToken } = input;

  let dto: TravelRecordResponse | null = null;
  let loadedAsOwner = false;

  if (accessToken?.trim()) {
    try {
      dto = await fetchMyTravelRecord(accessToken, travelRecordId);
      loadedAsOwner = true;
    } catch {
      // 작성자가 아니면 공개 상세로
    }
  }

  if (!dto) {
    dto = await fetchPublicTravelRecord(travelRecordId);
    loadedAsOwner = false;
  }

  let record = mapTravelRecordResponse(dto);

  if (record.coverImageUrl) {
    record = {
      ...record,
      coverImageUrl: await resolveDisplayMediaUrl(record.coverImageUrl, {
        accessToken,
      }),
    };
  }

  if (record.imageUrls.length > 0) {
    const resolvedImageUrls = await Promise.all(
      record.imageUrls.map(uri =>
        resolveDisplayMediaUrl(uri, { accessToken }),
      ),
    );
    record = { ...record, imageUrls: resolvedImageUrls };
  }

  const placeReviews = await fetchPlaceReviewsForRecord({
    travelRecord: record,
    accessToken,
  });

  return {
    record: { ...record, placeReviews },
    loadedAsOwner,
  };
}

/** 내 여행기들에 등록된 장소 방문 후기 총개수 */
export async function countPlaceReviewsForMyTravelRecords(
  accessToken: string,
  travelRecordIds: string[],
): Promise<number> {
  if (!accessToken.trim() || travelRecordIds.length === 0) {
    return 0;
  }

  const counts = await Promise.all(
    travelRecordIds.map(async travelRecordId => {
      try {
        const { record } = await loadTravelRecordDetail({
          travelRecordId,
          accessToken,
        });
        return record.placeReviews.length;
      } catch {
        return 0;
      }
    }),
  );

  return counts.reduce((sum, n) => sum + n, 0);
}
