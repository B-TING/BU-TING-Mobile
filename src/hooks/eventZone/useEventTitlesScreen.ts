import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { EVENT_ZONES } from '../../constants/eventZone/eventZone';
import { useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { isEventZoneId } from '../../services/eventZone/zoneEventMapper';
import {
  equipZoneTitle,
  fetchMyZoneTitles,
  fetchZoneTitleDefs,
  unequipZoneTitle,
} from '../../services/eventZone/zoneTitleService';
import { useEventAlbumStore } from '../../stores';
import { selectAuthUser, selectReusableAccessToken, useAuthStore } from '../../stores/useAuthStore';
import type { EventZoneId } from '../../types/eventZone';
import type {
  CityGradeResponse,
  EquippedTitleResponse,
  MyZoneTitlesResponse,
  ZoneTitleDefResponse,
  ZoneTitleItemResponse,
} from '../../types/zoneTitleApi';
import { canQueryZoneEvents } from './useHydrateZoneEvents';
import { ApiClientError } from '../../services/api/apiClient';

export type TitleRowStatus = 'equipped' | 'owned' | 'locked';

export type TitleRowView = {
  key: string;
  zoneId: EventZoneId;
  titleCode: string;
  titleName: string;
  tier: number;
  requiredSuccessCount: number;
  status: TitleRowStatus;
  userTitleId?: string;
};

export type TitleZoneSection = {
  zoneId: EventZoneId;
  successCount: number;
  remainingToNext: number | null;
  rows: TitleRowView[];
};

type Navigation = NativeStackNavigationProp<RootStackParamList, 'EventTitles'>;

function asString(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

function isRowEquipped(
  owned: ZoneTitleItemResponse | undefined,
  equipped: EquippedTitleResponse | null | undefined,
  titleCode: string,
): boolean {
  if (!owned) {
    return false;
  }
  const item = owned as ZoneTitleItemResponse & { isEquipped?: boolean };
  if (item.equipped === true || item.isEquipped === true) {
    return true;
  }
  return Boolean(equipped && asString(equipped.titleCode) === titleCode);
}

function withEquipped(
  mine: MyZoneTitlesResponse,
  next: EquippedTitleResponse | null,
): MyZoneTitlesResponse {
  return {
    ...mine,
    equipped: next,
    zones: (mine.zones ?? []).map(zone => ({
      ...zone,
      titles: (zone.titles ?? []).map(title => ({
        ...title,
        equipped: Boolean(
          next &&
            asString(title.titleCode) === next.titleCode &&
            asString(zone.zoneId) === next.zoneId,
        ),
      })),
    })),
  };
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function buildSections(
  defs: ZoneTitleDefResponse[],
  mine: MyZoneTitlesResponse | null,
): TitleZoneSection[] {
  const defsByZone = new Map<string, ZoneTitleDefResponse[]>();
  for (const def of defs) {
    const zoneId = asString(def.zoneId);
    if (!isEventZoneId(zoneId)) {
      continue;
    }
    const list = defsByZone.get(zoneId) ?? [];
    list.push(def);
    defsByZone.set(zoneId, list);
  }

  const progressByZone = new Map(
    (mine?.zones ?? [])
      .map(zone => [asString(zone.zoneId), zone] as const)
      .filter(([zoneId]) => isEventZoneId(zoneId)),
  );

  const zoneIds: EventZoneId[] = EVENT_ZONES.map(zone => zone.id).filter(id =>
    defsByZone.has(id),
  );
  for (const id of defsByZone.keys()) {
    if (isEventZoneId(id) && !zoneIds.includes(id)) {
      zoneIds.push(id);
    }
  }

  return zoneIds.map(zoneId => {
    const progress = progressByZone.get(zoneId);
    const ownedByCode = new Map<string, ZoneTitleItemResponse>();
    for (const title of progress?.titles ?? []) {
      const code = asString(title.titleCode);
      if (code) {
        ownedByCode.set(code, title);
      }
    }
    const rows = (defsByZone.get(zoneId) ?? [])
      .slice()
      .sort((a, b) => asNumber(a.tier) - asNumber(b.tier))
      .map(def => {
        const code = asString(def.titleCode) || `${zoneId}:${def.tier}`;
        const owned = ownedByCode.get(code);
        const equipped = isRowEquipped(owned, mine?.equipped, code);
        return {
          key: asString(owned?.userTitleId) || `${zoneId}:${code}`,
          zoneId,
          titleCode: code,
          titleName: asString(def.titleName) || code,
          tier: asNumber(def.tier),
          requiredSuccessCount: asNumber(def.requiredSuccessCount),
          status: (owned ? (equipped ? 'equipped' : 'owned') : 'locked') as TitleRowStatus,
          userTitleId: asString(owned?.userTitleId) || undefined,
        };
      });
    return {
      zoneId,
      successCount: asNumber(progress?.successCount),
      remainingToNext:
        typeof progress?.remainingToNext === 'number' ? progress.remainingToNext : null,
      rows,
    };
  });
}

export function useEventTitlesScreen(navigation: Navigation) {
  const copy = useCopy('zoneTitles');
  const authUser = useAuthStore(selectAuthUser);
  const accessToken = useAuthStore(selectReusableAccessToken);
  const [defs, setDefs] = useState<ZoneTitleDefResponse[]>([]);
  const [mine, setMine] = useState<MyZoneTitlesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyTitleId, setBusyTitleId] = useState<string | null>(null);
  const busyRef = useRef(false);
  const loadSeqRef = useRef(0);

  const load = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    if (!canQueryZoneEvents()) {
      if (seq === loadSeqRef.current) {
        setDefs([]);
        setMine(null);
      }
      return;
    }
    const nextDefs = await fetchZoneTitleDefs(accessToken);
    if (seq !== loadSeqRef.current) {
      return;
    }
    setDefs(nextDefs);
    if (!accessToken) {
      setMine(null);
      return;
    }
    const nextMine = await fetchMyZoneTitles(accessToken);
    if (seq === loadSeqRef.current) {
      setMine(nextMine);
    }
  }, [accessToken]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } catch {
      // keep current
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      void load()
        .catch(() => {
          if (!cancelled) {
            setDefs([]);
            setMine(null);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }, [load]),
  );

  const sections = useMemo(() => buildSections(defs, mine), [defs, mine]);
  const equipped = mine?.equipped ?? null;
  const cityGrade: CityGradeResponse | null = mine?.cityGrade ?? null;

  const highlightZoneId = useMemo(() => {
    if (equipped && isEventZoneId(equipped.zoneId)) {
      return equipped.zoneId;
    }
    return sections.reduce<EventZoneId | null>((best, section) => {
      if (!best) {
        return section.zoneId;
      }
      const bestSection = sections.find(item => item.zoneId === best);
      return section.successCount > (bestSection?.successCount ?? 0)
        ? section.zoneId
        : best;
    }, null);
  }, [equipped, sections]);

  const highlightSuccess = sections.find(item => item.zoneId === highlightZoneId)?.successCount ?? 0;

  const applyEquipped = useCallback((next: EquippedTitleResponse | null) => {
    setMine(prev => (prev ? withEquipped(prev, next) : prev));
  }, []);

  const syncAlbumTitle = useCallback((next: EquippedTitleResponse | null) => {
    const authorId = authUser?.userId;
    if (!authorId) {
      return;
    }
    useEventAlbumStore.getState().setAuthorEquippedTitle(authorId, next ?? undefined);
  }, [authUser?.userId]);

  const handlePressRow = useCallback(
    async (row: TitleRowView) => {
      if (row.status === 'locked' || busyRef.current) {
        return 'idle' as const;
      }
      if (!accessToken) {
        navigation.navigate('Login');
        return 'login' as const;
      }
      const userTitleId =
        asString(row.userTitleId) ||
        asString(
          (mine?.zones ?? [])
            .find(zone => asString(zone.zoneId) === row.zoneId)
            ?.titles?.find(title => asString(title.titleCode) === row.titleCode)
            ?.userTitleId,
        );
      if (row.status !== 'equipped' && !userTitleId) {
        return 'failed' as const;
      }
      busyRef.current = true;
      setBusyTitleId(row.key);
      const fromRow: EquippedTitleResponse = {
        titleCode: row.titleCode,
        titleName: row.titleName,
        zoneId: row.zoneId,
        tier: row.tier,
      };
      try {
        if (row.status === 'equipped') {
          applyEquipped(null);
          syncAlbumTitle(null);
          loadSeqRef.current += 1;
          await unequipZoneTitle(accessToken);
        } else if (userTitleId) {
          applyEquipped(fromRow);
          syncAlbumTitle(fromRow);
          loadSeqRef.current += 1;
          // 다른 칭호가 장착 중이면 먼저 해제한다. 같은 요청에서 바꾸면
          // 서버가 거절하는 경우가 있어, 해제를 별도 요청으로 끝낸 뒤 장착한다.
          if (mine?.equipped && asString(mine.equipped.titleCode) !== row.titleCode) {
            await unequipZoneTitle(accessToken);
          }
          const next = await equipZoneTitle(accessToken, userTitleId);
          const confirmed =
            next.titleCode && asString(next.titleCode) === row.titleCode ? next : fromRow;
          applyEquipped(confirmed);
          syncAlbumTitle(confirmed);
        }
        const refreshed = await fetchMyZoneTitles(accessToken);
        const expectedCode = row.status === 'equipped' ? '' : row.titleCode;
        const matches =
          expectedCode === ''
            ? !refreshed.equipped
            : asString(refreshed.equipped?.titleCode) === expectedCode;
        setMine(matches ? refreshed : withEquipped(refreshed, expectedCode ? fromRow : null));
        if (!matches) {
          syncAlbumTitle(expectedCode ? fromRow : null);
        }
        return 'ok' as const;
      } catch (error) {
        try {
          setMine(await fetchMyZoneTitles(accessToken));
        } catch {
          // keep optimistic until the next focus reload
        }
        if (error instanceof ApiClientError && error.status === 401) {
          navigation.navigate('Login');
          return 'login' as const;
        }
        return 'failed' as const;
      } finally {
        busyRef.current = false;
        setBusyTitleId(null);
      }
    },
    [accessToken, applyEquipped, mine, navigation, syncAlbumTitle],
  );

  return {
    copy,
    nickname: authUser?.nickname?.trim() || copy.guestName,
    isAuthenticated: Boolean(accessToken),
    loading,
    refreshing,
    busyTitleId,
    sections,
    equipped,
    cityGrade,
    highlightZoneId,
    highlightSuccess,
    refresh,
    handlePressRow,
    goBack: () => navigation.goBack(),
    goLogin: () => navigation.navigate('Login'),
  };
}
