/** GET /api/v1/zone-titles · /users/me/zone-titles 응답 DTO */

export type EquippedTitleResponse = {
  titleCode: string;
  titleName: string;
  zoneId: string;
  tier: number;
  style?: string | null;
  color?: string | null;
};

export type ZoneTitleDefResponse = {
  zoneId: string;
  tier: number;
  requiredSuccessCount: number;
  titleCode: string;
  titleName: string;
  style?: string | null;
  color?: string | null;
};

export type ZoneTitleItemResponse = {
  userTitleId: string;
  titleCode: string;
  titleName: string;
  tier: number;
  style?: string | null;
  color?: string | null;
  earnedAt?: string | null;
  equipped?: boolean;
};

export type ZoneTitleProgressResponse = {
  zoneId: string;
  successCount?: number;
  currentTier?: number;
  nextTier?: number | null;
  remainingToNext?: number | null;
  titles?: ZoneTitleItemResponse[] | null;
};

export type CityGradeResponse = {
  grade?: string | null;
  gradeName?: string | null;
  reachedAt?: string | null;
  next?: { grade?: string | null; condition?: string | null } | null;
};

export type MyZoneTitlesResponse = {
  equipped?: EquippedTitleResponse | null;
  cityGrade?: CityGradeResponse | null;
  zones?: ZoneTitleProgressResponse[] | null;
};
