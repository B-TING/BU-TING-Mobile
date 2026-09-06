import { API_BASE_URL, ZONE_TITLE_ENDPOINTS } from '../../constants/api/apiConfig';
import type {
  EquippedTitleResponse,
  MyZoneTitlesResponse,
  ZoneTitleDefResponse,
} from '../../types/zoneTitleApi';
import { ApiClientError, apiDelete, apiGet, apiPatch } from '../api/apiClient';

function url(path: string) {
  return `${API_BASE_URL}${path}`;
}

function mapError(error: ApiClientError): ApiClientError {
  return error;
}

function queryOptions(accessToken?: string | null) {
  return {
    accessToken: accessToken ?? undefined,
    errorMessagePrefix: 'Zone title request failed',
    mapError,
  };
}

function auth(accessToken: string) {
  return {
    accessToken,
    errorMessagePrefix: 'Zone title request failed',
    mapError,
  };
}

/** GET /api/v1/zone-titles — 비로그인 가능 */
export async function fetchZoneTitleDefs(
  accessToken?: string | null,
): Promise<ZoneTitleDefResponse[]> {
  const data = await apiGet<ZoneTitleDefResponse[]>(
    url(ZONE_TITLE_ENDPOINTS.list),
    queryOptions(accessToken),
  );
  return Array.isArray(data) ? data : [];
}

/** GET /api/v1/users/me/zone-titles — 로그인 필요 */
export async function fetchMyZoneTitles(
  accessToken: string,
): Promise<MyZoneTitlesResponse> {
  const data = await apiGet<MyZoneTitlesResponse>(
    url(ZONE_TITLE_ENDPOINTS.me),
    auth(accessToken),
  );
  return {
    equipped: data?.equipped ?? null,
    cityGrade: data?.cityGrade ?? null,
    zones: Array.isArray(data?.zones) ? data.zones : [],
  };
}

/** PATCH /api/v1/users/me/zone-titles/{userTitleId}/equip — 로그인 필요 */
export async function equipZoneTitle(
  accessToken: string,
  userTitleId: string,
): Promise<EquippedTitleResponse> {
  const data = await apiPatch<EquippedTitleResponse>(
    url(ZONE_TITLE_ENDPOINTS.equip(userTitleId)),
    auth(accessToken),
  );
  if (!data?.titleCode) {
    throw new ApiClientError('Zone title equip failed');
  }
  return data;
}

/** DELETE /api/v1/users/me/zone-titles/equipped — 로그인 필요 */
export async function unequipZoneTitle(accessToken: string): Promise<void> {
  await apiDelete(url(ZONE_TITLE_ENDPOINTS.unequip), {
    ...auth(accessToken),
    allowEmptyBody: true,
  });
}
