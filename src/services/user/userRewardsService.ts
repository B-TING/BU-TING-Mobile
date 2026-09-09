import { API_BASE_URL, USER_ENDPOINTS } from '../../constants/api/apiConfig';
import type {
  PointLedgerItem,
  PointLedgerItemResponse,
  PointLedgerPageResponse,
  PointLedgerQuery,
  UserRewardsBadgeGroup,
  UserRewardsBadgeGroupResponse,
  UserRewardsBadgeItem,
  UserRewardsBadgeItemResponse,
  UserRewardsResponse,
  UserRewardsSummary,
} from '../../types/userRewardsApi';
import { ApiClientError, apiGet } from '../api/apiClient';

function url(path: string) {
  return `${API_BASE_URL}${path}`;
}

function auth(accessToken: string) {
  return {
    accessToken,
    errorMessagePrefix: 'User rewards request failed',
    mapError: (error: ApiClientError) => error,
  };
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return undefined;
}

function mapBadgeItem(dto: UserRewardsBadgeItemResponse): UserRewardsBadgeItem | null {
  const name = asString(dto.name);
  const code = asString(dto.code);
  if (!name && !code) {
    return null;
  }
  return {
    code: code || name,
    name: name || code,
    imageUrl: asString(dto.imageUrl) || undefined,
    earnedAt: asString(dto.earnedAt) || undefined,
  };
}

function mapBadgeGroup(dto: UserRewardsBadgeGroupResponse): UserRewardsBadgeGroup | null {
  const zoneId = asString(dto.zoneId) || 'UNKNOWN';
  const items = (dto.items ?? [])
    .map(mapBadgeItem)
    .filter((item): item is UserRewardsBadgeItem => item != null);
  if (items.length === 0) {
    return null;
  }
  return { zoneId, items };
}

function mapLedgerItem(dto: PointLedgerItemResponse): PointLedgerItem | null {
  const ledgerId = asString(dto.ledgerId);
  const amount = asNumber(dto.amount);
  if (!ledgerId || amount == null) {
    return null;
  }
  return {
    ledgerId,
    amount,
    reason: asString(dto.reason) || 'BASE',
    grantId: asString(dto.grantId) || undefined,
    createdAt: asString(dto.createdAt) || undefined,
  };
}

function toQuery(query: PointLedgerQuery): string {
  const params = new URLSearchParams();
  if (query.cursor) {
    params.set('cursor', query.cursor);
  }
  if (query.size != null) {
    params.set('size', String(query.size));
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : '';
}

/** GET /api/v1/users/me/rewards — 로그인 필요 */
export async function fetchMyRewards(accessToken: string): Promise<UserRewardsSummary> {
  const data = await apiGet<UserRewardsResponse>(url(USER_ENDPOINTS.rewards), auth(accessToken));
  return {
    pointBalance: asNumber(data?.pointBalance) ?? 0,
    badges: (data?.badges ?? [])
      .map(mapBadgeGroup)
      .filter((group): group is UserRewardsBadgeGroup => group != null),
  };
}

/** GET /api/v1/users/me/point-ledger — 로그인 필요 */
export async function fetchMyPointLedger(
  accessToken: string,
  query: PointLedgerQuery = {},
): Promise<{ items: PointLedgerItem[]; nextCursor: string | null; hasNext: boolean }> {
  const data = await apiGet<PointLedgerPageResponse>(
    url(`${USER_ENDPOINTS.pointLedger}${toQuery(query)}`),
    auth(accessToken),
  );
  return {
    items: (data?.items ?? [])
      .map(mapLedgerItem)
      .filter((item): item is PointLedgerItem => item != null),
    nextCursor: asString(data?.nextCursor) || null,
    hasNext: Boolean(data?.hasNext),
  };
}
