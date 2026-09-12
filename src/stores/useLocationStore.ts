import { create } from 'zustand';

import type { EventZoneCoordinate } from '../types/eventZone';
import { isFreshLocationCache } from '../utils/location/locationCache';

type LocationCacheState = {
  coords: EventZoneCoordinate | null;
  updatedAt: number | null;
  setCoords: (coords: EventZoneCoordinate, updatedAt?: number) => void;
  clear: () => void;
};

/** 포그라운드 위치 캐시. persist 하지 않음 (세션 한정, 추적 아님). */
export const useLocationStore = create<LocationCacheState>()(set => ({
  coords: null,
  updatedAt: null,
  setCoords: (coords, updatedAt = Date.now()) => set({ coords, updatedAt }),
  clear: () => set({ coords: null, updatedAt: null }),
}));

export function getCachedCoordinates(
  maxAgeMs?: number,
): EventZoneCoordinate | null {
  const { coords, updatedAt } = useLocationStore.getState();
  if (!coords || !isFreshLocationCache(updatedAt, Date.now(), maxAgeMs)) {
    return null;
  }
  return coords;
}
