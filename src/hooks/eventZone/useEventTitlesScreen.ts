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
  return typeof value === 'string' ? value.trim() : '';
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
        const equipped = Boolean(owned?.equipped);
        return {
          key: asString(owned?.userTitleId) || `${zoneId}:${code}`,
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

  const load = useCallback(async () => {
    if (!canQueryZoneEvents()) {
      setDefs([]);
      setMine(null);
      return;
    }
    const nextDefs = await fetchZoneTitleDefs(accessToken);
    setDefs(nextDefs);
    if (!accessToken) {
      setMine(null);
      return;
    }
    setMine(await fetchMyZoneTitles(accessToken));
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
    setMine(prev => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        equipped: next,
        zones: (prev.zones ?? []).map(zone => ({
          ...zone,
          titles: (zone.titles ?? []).map(title => ({
            ...title,
            equipped: Boolean(
              next &&
                asString(title.userTitleId) &&
                asString(title.titleCode) === next.titleCode &&
                asString(zone.zoneId) === next.zoneId,
            ),
          })),
        })),
      };
    });
  }, []);

  const handlePressRow = useCallback(
    async (row: TitleRowView) => {
      if (row.status === 'locked' || busyRef.current) {
        return;
      }
      if (!accessToken) {
        navigation.navigate('Login');
        return;
      }
      busyRef.current = true;
      setBusyTitleId(row.key);
      try {
        if (row.status === 'equipped') {
          await unequipZoneTitle(accessToken);
          applyEquipped(null);
        } else if (row.userTitleId) {
          const next = await equipZoneTitle(accessToken, row.userTitleId);
          applyEquipped(next);
        }
        setMine(await fetchMyZoneTitles(accessToken));
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 401) {
          navigation.navigate('Login');
        }
      } finally {
        busyRef.current = false;
        setBusyTitleId(null);
      }
    },
    [accessToken, applyEquipped, navigation],
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
