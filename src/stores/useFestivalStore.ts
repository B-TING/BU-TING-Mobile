import { create } from 'zustand';

import type { BusanFestival } from '../constants/festival/festivalCalendar';
import {
  festivalsInMonth,
  sortFestivalsByStatus,
  todayIso,
} from '../constants/festival/festivalCalendar';
import {
  fetchFestivalDetail,
  searchFestivals,
} from '../services/places/placesApiService';
import {
  monthDateRangeYyyymmdd,
  monthKey,
  toYyyymmdd,
} from '../utils/places/festivalApiMapper';
import { logPlacesApiError } from '../utils/places/placesApiLogger';

const EMPTY_FESTIVALS: BusanFestival[] = [];

type FestivalCacheEntry = {
  festivals: BusanFestival[];
  error: string | null;
};

type FestivalState = {
  cacheByMonth: Record<string, FestivalCacheEntry>;
  festivalsById: Record<string, BusanFestival>;
  homeFestivals: BusanFestival[];
  loadingByMonth: Record<string, boolean>;
  loadingHome: boolean;
  loadingDetailById: Record<string, boolean>;
  homeError: string | null;
  getById: (id: string) => BusanFestival | undefined;
  getFestivalsForMonth: (year: number, month: number) => BusanFestival[];
  isMonthLoading: (year: number, month: number) => boolean;
  getMonthError: (year: number, month: number) => string | null;
  fetchFestivalsForMonth: (
    year: number,
    month: number,
    emptyErrorFallback: string,
  ) => Promise<void>;
  fetchHomeFestivals: (emptyErrorFallback: string) => Promise<void>;
  loadFestivalDetail: (id: string, emptyErrorFallback: string) => Promise<BusanFestival | null>;
};

function mergeFestivalsById(
  current: Record<string, BusanFestival>,
  festivals: BusanFestival[],
): Record<string, BusanFestival> {
  const next = { ...current };
  for (const festival of festivals) {
    next[festival.id] = festival;
  }
  return next;
}

function homeDateRange(): { eventStartDate: string; eventEndDate: string } {
  const today = todayIso();
  const end = new Date();
  end.setDate(end.getDate() + 90);
  const eventEndDate = toYyyymmdd(
    `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`,
  );
  return { eventStartDate: toYyyymmdd(today), eventEndDate };
}

export const useFestivalStore = create<FestivalState>()((set, get) => ({
  cacheByMonth: {},
  festivalsById: {},
  homeFestivals: EMPTY_FESTIVALS,
  loadingByMonth: {},
  loadingHome: false,
  loadingDetailById: {},
  homeError: null,

  getById: id => get().festivalsById[id],

  getFestivalsForMonth: (year, month) => {
    const entry = get().cacheByMonth[monthKey(year, month)];
    if (!entry) {
      return EMPTY_FESTIVALS;
    }
    const filtered = festivalsInMonth(entry.festivals, year, month);
    return filtered.length === 0 ? EMPTY_FESTIVALS : filtered;
  },

  isMonthLoading: (year, month) => get().loadingByMonth[monthKey(year, month)] ?? false,

  getMonthError: (year, month) => get().cacheByMonth[monthKey(year, month)]?.error ?? null,

  fetchFestivalsForMonth: async (year, month, emptyErrorFallback) => {
    const key = monthKey(year, month);
    if (get().loadingByMonth[key]) {
      return;
    }
    const cached = get().cacheByMonth[key];
    if (cached && !cached.error) {
      return;
    }

    set(state => ({
      loadingByMonth: { ...state.loadingByMonth, [key]: true },
    }));

    const { eventStartDate, eventEndDate } = monthDateRangeYyyymmdd(year, month);

    try {
      const result = await searchFestivals({
        eventStartDate,
        eventEndDate,
        page: 1,
        size: 100,
        arrange: 'C',
      });

      set(state => ({
        cacheByMonth: {
          ...state.cacheByMonth,
          [key]: {
            festivals: result.festivals,
            error: null,
          },
        },
        festivalsById: mergeFestivalsById(state.festivalsById, result.festivals),
        loadingByMonth: { ...state.loadingByMonth, [key]: false },
      }));
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : emptyErrorFallback;

      logPlacesApiError('GET', '(festivals-month)', fetchError, {
        year,
        month,
        eventStartDate,
        eventEndDate,
      });

      set(state => ({
        cacheByMonth: {
          ...state.cacheByMonth,
          [key]: {
            festivals: [],
            error: message,
          },
        },
        loadingByMonth: { ...state.loadingByMonth, [key]: false },
      }));
    }
  },

  fetchHomeFestivals: async emptyErrorFallback => {
    if (get().loadingHome) {
      return;
    }
    if (get().homeFestivals.length > 0) {
      return;
    }

    set({ loadingHome: true, homeError: null });

    const { eventStartDate, eventEndDate } = homeDateRange();

    try {
      const result = await searchFestivals({
        eventStartDate,
        eventEndDate,
        page: 1,
        size: 20,
        arrange: 'C',
      });
      const homeFestivalsRaw = sortFestivalsByStatus(result.festivals).slice(0, 6);
      const homeFestivals = await Promise.all(
        homeFestivalsRaw.map(async festival => {
          if (festival.imageUri) {
            return festival;
          }
          try {
            return await fetchFestivalDetail(festival);
          } catch {
            return festival;
          }
        }),
      );

      set(state => ({
        homeFestivals,
        homeError: null,
        loadingHome: false,
        festivalsById: mergeFestivalsById(state.festivalsById, homeFestivals),
      }));
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : emptyErrorFallback;

      logPlacesApiError('GET', '(festivals-home)', fetchError, {
        eventStartDate,
        eventEndDate,
      });

      set({
        homeFestivals: EMPTY_FESTIVALS,
        homeError: message,
        loadingHome: false,
      });
    }
  },

  loadFestivalDetail: async (id, emptyErrorFallback) => {
    const cached = get().festivalsById[id];
    if (!cached) {
      return null;
    }
    if (get().loadingDetailById[id]) {
      return cached;
    }

    set(state => ({
      loadingDetailById: { ...state.loadingDetailById, [id]: true },
    }));

    try {
      const enriched = await fetchFestivalDetail(cached);
      set(state => ({
        festivalsById: { ...state.festivalsById, [id]: enriched },
        loadingDetailById: { ...state.loadingDetailById, [id]: false },
      }));
      return enriched;
    } catch (fetchError) {
      logPlacesApiError('GET', '(festival-detail)', fetchError, { contentId: id });
      set(state => ({
        loadingDetailById: { ...state.loadingDetailById, [id]: false },
      }));
      if (fetchError instanceof Error) {
        throw new Error(fetchError.message || emptyErrorFallback);
      }
      throw new Error(emptyErrorFallback);
    }
  },
}));
