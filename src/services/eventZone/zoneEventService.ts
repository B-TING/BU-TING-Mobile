import { API_BASE_URL, ZONE_EVENT_ENDPOINTS } from '../../constants/api/apiConfig';
import type { EventZoneId } from '../../types/eventZone';
import type {
  ZoneEventDetailResponse,
  ZoneEventParticipationJoinRequest,
  ZoneEventParticipationResponse,
  ZoneEventRoundStatusResponse,
  ZoneEventSummaryResponse,
} from '../../types/zoneEventApi';
import { ApiClientError, apiDelete, apiGet, apiPost } from '../api/apiClient';

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
