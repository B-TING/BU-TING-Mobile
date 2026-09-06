import { API_BASE_URL, ZONE_EVENT_ENDPOINTS } from '../../constants/api/apiConfig';
import type { EventZoneId } from '../../types/eventZone';
import type {
  ZoneEventDetailResponse,
  ZoneEventRoundStatusResponse,
  ZoneEventSummaryResponse,
} from '../../types/zoneEventApi';
import { ApiClientError, apiGet } from '../api/apiClient';

export class ZoneEventServiceError extends ApiClientError {
  constructor(message: string, options?: { status?: number; url?: string; responseBody?: unknown }) {
    super(message, {
      status: options?.status,
      url: options?.url,
      responseBody: options?.responseBody,
    });
    this.name = 'ZoneEventServiceError';
  }
}

function mapError(error: ApiClientError): ZoneEventServiceError {
  return new ZoneEventServiceError(error.message, {
    status: error.status,
    url: error.url,
    responseBody: error.responseBody,
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
