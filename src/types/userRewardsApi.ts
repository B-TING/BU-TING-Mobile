/** GET /api/v1/users/me/rewards · /users/me/point-ledger */

export type UserRewardsBadgeItemResponse = {
  code?: string | null;
  name?: string | null;
  imageUrl?: string | null;
  earnedAt?: string | null;
};

export type UserRewardsBadgeGroupResponse = {
  zoneId?: string | null;
  items?: UserRewardsBadgeItemResponse[] | null;
};

export type UserRewardsResponse = {
  pointBalance?: number | null;
  badges?: UserRewardsBadgeGroupResponse[] | null;
  coupons?: unknown[] | null;
};

export type PointLedgerItemResponse = {
  ledgerId: string;
  amount: number;
  reason?: string | null;
  grantId?: string | null;
  createdAt?: string | null;
};

export type PointLedgerPageResponse = {
  items?: PointLedgerItemResponse[] | null;
  nextCursor?: string | null;
  hasNext?: boolean;
};

export type PointLedgerQuery = {
  cursor?: string;
  size?: number;
};

export type UserRewardsBadgeItem = {
  code: string;
  name: string;
  imageUrl?: string;
  earnedAt?: string;
};

export type UserRewardsBadgeGroup = {
  zoneId: string;
  items: UserRewardsBadgeItem[];
};

export type UserRewardsSummary = {
  pointBalance: number;
  badges: UserRewardsBadgeGroup[];
};

export type PointLedgerItem = {
  ledgerId: string;
  amount: number;
  reason: string;
  grantId?: string;
  createdAt?: string;
};
