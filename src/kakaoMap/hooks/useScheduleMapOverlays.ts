import { useMemo, useRef } from 'react';

import { jsonEqual } from '../../utils/common/jsonEqual';
import type { DailyItinerary } from '../../types/travelPlan';
import {
  buildScheduleMapOverlays,
  type ScheduleMapLineOverlay,
  type ScheduleMapMarkerOverlay,
} from '../overlays/scheduleOverlays';

/**
 * 일정 오버레이. 내용이 같으면 이전 스냅샷을 재사용해 마커 깜빡임을 막는다.
 */
export function useScheduleMapOverlays(
  itinerary: DailyItinerary[],
  selectedDayNumber?: number,
): { lines: ScheduleMapLineOverlay[]; markers: ScheduleMapMarkerOverlay[] } {
  const overlaySnapshot = useMemo(
    () => buildScheduleMapOverlays(itinerary, selectedDayNumber),
    [itinerary, selectedDayNumber],
  );
  const stableRef = useRef(overlaySnapshot);
  if (!jsonEqual(stableRef.current, overlaySnapshot)) {
    stableRef.current = overlaySnapshot;
  }
  return stableRef.current;
}
