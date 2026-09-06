import { API_BASE_URL, ZONE_EVENT_ENDPOINTS } from '../../constants/api/apiConfig';
import type { EventZoneId } from '../../types/eventZone';
import type {
  ZoneEventAlbumPageResponse,
  ZoneEventAlbumQuery,
  ZoneEventCommentPageResponse,
  ZoneEventCommentQuery,
  ZoneEventCommentRequest,
  ZoneEventCommentResponse,
  ZoneEventDetailResponse,
  ZoneEventHistoryPageResponse,
  ZoneEventHistoryQuery,
  ZoneEventLikeResponse,
  ZoneEventParticipationJoinRequest,
  ZoneEventParticipationResponse,
  ZoneEventParticipationSubmitRequest,
  ZoneEventRoundStatusResponse,
  ZoneEventSubmitResultResponse,
  ZoneEventSummaryResponse,
  ZoneEventVisibilityUpdateRequest,
} from '../../types/zoneEventApi';
import { ApiClientError, apiDelete, apiGet, apiPatch, apiPost } from '../api/apiClient';

export class ZoneEventServiceError extends ApiClientError {
  distanceMeters?: number;
  openParticipationId?: string;

  constructor(
    message: string,
    options?: {
      status?: number;
      url?: string;
      responseBody?: unknown;
      distanceMeters?: number;
      openParticipationId?: string;
    },
  ) {
    super(message, {
      status: options?.status,
      url: options?.url,
      responseBody: options?.responseBody,
    });
    this.name = 'ZoneEventServiceError';
    this.distanceMeters = options?.distanceMeters;
    this.openParticipationId = options?.openParticipationId;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function readErrorData(body: unknown): Record<string, unknown> | null {
  const envelope = asRecord(body);
  if (!envelope) {
    return null;
  }
  return asRecord(envelope.data) ?? envelope;
}

function mapError(error: ApiClientError): ZoneEventServiceError {
  const data = readErrorData(error.responseBody);
  const distanceRaw = data?.distanceMeters;
  const distanceMeters =
    typeof distanceRaw === 'number' && Number.isFinite(distanceRaw) ? distanceRaw : undefined;
  const openParticipationId =
    typeof data?.participationId === 'string' && data.participationId.trim()
      ? data.participationId.trim()
      : undefined;
  return new ZoneEventServiceError(error.message, {
    status: error.status,
    url: error.url,
    responseBody: error.responseBody,
    distanceMeters,
    openParticipationId,
  });
}

function url(path: string) {
  return `${API_BASE_URL}${path}`;
}

function queryOptions(accessToken?: string | null) {
  return {
    accessToken: accessToken ?? undefined,
    errorMessagePrefix: 'Zone event request failed',
    mapError,
  };
}

function auth(accessToken: string) {
  return {
    accessToken,
    errorMessagePrefix: 'Zone event request failed',
    mapError,
  };
}

/** GET /api/v1/zone-events/active?zone= — 비로그인 가능, 개인화 필드는 로그인 시 */
export async function fetchActiveZoneEvents(
  zone: EventZoneId,
  accessToken?: string | null,
): Promise<ZoneEventSummaryResponse[]> {
  const requestUrl = new URL(url(ZONE_EVENT_ENDPOINTS.active));
  requestUrl.searchParams.set('zone', zone);
  const data = await apiGet<ZoneEventSummaryResponse[]>(
    requestUrl.toString(),
    queryOptions(accessToken),
  );
  return Array.isArray(data) ? data : [];
}

/** GET /api/v1/zone-events/{eventId} — 비로그인 가능, 개인화 필드는 로그인 시 */
export async function fetchZoneEventDetail(
  eventId: string,
  accessToken?: string | null,
): Promise<ZoneEventDetailResponse | undefined> {
  return apiGet<ZoneEventDetailResponse>(
    url(ZONE_EVENT_ENDPOINTS.detail(eventId)),
    queryOptions(accessToken),
  );
}

/** GET /api/v1/zone-event-rounds/current */
export async function fetchCurrentZoneEventRound(
  accessToken?: string | null,
): Promise<ZoneEventRoundStatusResponse | undefined> {
  return apiGet<ZoneEventRoundStatusResponse>(
    url(ZONE_EVENT_ENDPOINTS.currentRound),
    queryOptions(accessToken),
  );
}

/** POST /api/v1/zone-events/{eventId}/participations — 로그인 필요 */
export async function joinZoneEvent(
  accessToken: string,
  eventId: string,
  body: ZoneEventParticipationJoinRequest,
): Promise<ZoneEventParticipationResponse> {
  const data = await apiPost<ZoneEventParticipationResponse>(
    url(ZONE_EVENT_ENDPOINTS.join(eventId)),
    {
      ...auth(accessToken),
      body,
    },
  );
  if (!data?.participationId) {
    throw new ZoneEventServiceError('Zone event join failed');
  }
  return data;
}

/** GET /api/v1/zone-events/{eventId}/participations/me — 로그인 필요 */
export async function fetchMyZoneEventParticipations(
  accessToken: string,
  eventId: string,
): Promise<ZoneEventParticipationResponse[]> {
  const data = await apiGet<ZoneEventParticipationResponse[]>(
    url(ZONE_EVENT_ENDPOINTS.myParticipations(eventId)),
    auth(accessToken),
  );
  return Array.isArray(data) ? data : [];
}

const OPEN_PARTICIPATION_STATUSES = new Set(['JOINED', 'SUBMITTED', 'UNDER_REVIEW']);

export async function resolveOpenParticipationId(
  accessToken: string,
  eventId: string,
): Promise<string | undefined> {
  const list = await fetchMyZoneEventParticipations(accessToken, eventId);
  return list.find(item => OPEN_PARTICIPATION_STATUSES.has(item.status ?? ''))?.participationId;
}

/** DELETE /api/v1/zone-events/{eventId}/participations/{participationId} */
export async function cancelZoneEventParticipation(
  accessToken: string,
  eventId: string,
  participationId: string,
): Promise<void> {
  await apiDelete(url(ZONE_EVENT_ENDPOINTS.cancelParticipation(eventId, participationId)), {
    ...auth(accessToken),
    allowEmptyBody: true,
  });
}

/** POST /api/v1/zone-events/{eventId}/participations/{participationId}/submit */
export async function submitZoneEventParticipation(
  accessToken: string,
  eventId: string,
  participationId: string,
  body: ZoneEventParticipationSubmitRequest,
): Promise<ZoneEventSubmitResultResponse> {
  const data = await apiPost<ZoneEventSubmitResultResponse>(
    url(ZONE_EVENT_ENDPOINTS.submit(eventId, participationId)),
    {
      ...auth(accessToken),
      body,
    },
  );
  if (!data?.participation?.participationId) {
    throw new ZoneEventServiceError('Zone event submit failed');
  }
  return data;
}

function toQuery(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/** GET /api/v1/users/me/zone-event-participations — 로그인 필요 */
export async function fetchMyZoneEventHistory(
  accessToken: string,
  query: ZoneEventHistoryQuery = {},
): Promise<ZoneEventHistoryPageResponse> {
  const data = await apiGet<ZoneEventHistoryPageResponse>(
    url(
      `${ZONE_EVENT_ENDPOINTS.myHistory}${toQuery({
        zone: query.zone,
        type: query.type,
        status: query.status,
        from: query.from,
        to: query.to,
        cursor: query.cursor,
        size: query.size,
      })}`,
    ),
    auth(accessToken),
  );
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    nextCursor: data?.nextCursor ?? null,
    hasNext: Boolean(data?.hasNext),
  };
}

function normalizeAlbumPage(
  data: ZoneEventAlbumPageResponse | undefined,
): ZoneEventAlbumPageResponse {
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    nextCursor: data?.nextCursor ?? null,
    hasNext: Boolean(data?.hasNext),
  };
}

async function fetchAlbumPage(
  path: string,
  query: ZoneEventAlbumQuery = {},
  accessToken?: string | null,
): Promise<ZoneEventAlbumPageResponse> {
  const data = await apiGet<ZoneEventAlbumPageResponse>(
    url(
      `${path}${toQuery({
        sort: query.sort,
        cursor: query.cursor,
        size: query.size,
      })}`,
    ),
    queryOptions(accessToken),
  );
  return normalizeAlbumPage(data);
}

/** GET /api/v1/zone-events/{eventId}/album — 비로그인 가능 */
export function fetchEventAlbum(
  eventId: string,
  query: ZoneEventAlbumQuery = {},
  accessToken?: string | null,
): Promise<ZoneEventAlbumPageResponse> {
  return fetchAlbumPage(ZONE_EVENT_ENDPOINTS.eventAlbum(eventId), query, accessToken);
}

/** GET /api/v1/zones/{zoneId}/album — 비로그인 가능 */
export function fetchZoneAlbum(
  zoneId: string,
  query: ZoneEventAlbumQuery = {},
  accessToken?: string | null,
): Promise<ZoneEventAlbumPageResponse> {
  return fetchAlbumPage(ZONE_EVENT_ENDPOINTS.zoneAlbum(zoneId), query, accessToken);
}

/** GET /api/v1/zone-event-rounds/{roundId}/album — 비로그인 가능 */
export function fetchRoundAlbum(
  roundId: string,
  query: ZoneEventAlbumQuery = {},
  accessToken?: string | null,
): Promise<ZoneEventAlbumPageResponse> {
  return fetchAlbumPage(ZONE_EVENT_ENDPOINTS.roundAlbum(roundId), query, accessToken);
}

/** PATCH /api/v1/zone-event-participations/{id}/visibility — 로그인 필요 */
export async function updateZoneEventParticipationVisibility(
  accessToken: string,
  participationId: string,
  visibility: ZoneEventVisibilityUpdateRequest['visibility'],
): Promise<void> {
  await apiPatch(
    url(ZONE_EVENT_ENDPOINTS.visibility(participationId)),
    {
      ...auth(accessToken),
      body: { visibility } satisfies ZoneEventVisibilityUpdateRequest,
      allowEmptyBody: true,
    },
  );
}

/** POST /api/v1/zone-event-participations/{id}/likes — 로그인 필요 */
export async function likeZoneEventParticipation(
  accessToken: string,
  participationId: string,
): Promise<ZoneEventLikeResponse> {
  const data = await apiPost<ZoneEventLikeResponse>(
    url(ZONE_EVENT_ENDPOINTS.likes(participationId)),
    auth(accessToken),
  );
  if (!data?.likeId && data?.likeCount == null) {
    throw new ZoneEventServiceError('Zone event like failed');
  }
  return data;
}

/** DELETE /api/v1/zone-event-participations/{id}/likes — 로그인 필요 */
export async function unlikeZoneEventParticipation(
  accessToken: string,
  participationId: string,
): Promise<void> {
  await apiDelete(url(ZONE_EVENT_ENDPOINTS.likes(participationId)), {
    ...auth(accessToken),
    allowEmptyBody: true,
  });
}

/** GET /api/v1/zone-event-participations/{id}/comments — 비로그인 가능 */
export async function fetchZoneEventComments(
  participationId: string,
  query: ZoneEventCommentQuery = {},
  accessToken?: string | null,
): Promise<ZoneEventCommentPageResponse> {
  const data = await apiGet<ZoneEventCommentPageResponse>(
    url(
      `${ZONE_EVENT_ENDPOINTS.comments(participationId)}${toQuery({
        cursor: query.cursor,
        size: query.size,
      })}`,
    ),
    queryOptions(accessToken),
  );
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    nextCursor: data?.nextCursor ?? null,
    hasNext: Boolean(data?.hasNext),
  };
}

/** POST /api/v1/zone-event-participations/{id}/comments — 로그인 필요 */
export async function addZoneEventComment(
  accessToken: string,
  participationId: string,
  content: string,
): Promise<ZoneEventCommentResponse> {
  const data = await apiPost<ZoneEventCommentResponse>(
    url(ZONE_EVENT_ENDPOINTS.comments(participationId)),
    {
      ...auth(accessToken),
      body: { content } satisfies ZoneEventCommentRequest,
    },
  );
  if (!data?.commentId) {
    throw new ZoneEventServiceError('Zone event comment failed');
  }
  return data;
}

/** PATCH /api/v1/zone-event-participations/{id}/comments/{commentId} — 로그인 필요 */
export async function editZoneEventComment(
  accessToken: string,
  participationId: string,
  commentId: string,
  content: string,
): Promise<ZoneEventCommentResponse> {
  const data = await apiPatch<ZoneEventCommentResponse>(
    url(ZONE_EVENT_ENDPOINTS.commentById(participationId, commentId)),
    {
      ...auth(accessToken),
      body: { content } satisfies ZoneEventCommentRequest,
    },
  );
  if (!data?.commentId) {
    throw new ZoneEventServiceError('Zone event comment edit failed');
  }
  return data;
}

/** DELETE /api/v1/zone-event-participations/{id}/comments/{commentId} — 로그인 필요 */
export async function deleteZoneEventComment(
  accessToken: string,
  participationId: string,
  commentId: string,
): Promise<void> {
  await apiDelete(url(ZONE_EVENT_ENDPOINTS.commentById(participationId, commentId)), {
    ...auth(accessToken),
    allowEmptyBody: true,
  });
}

