import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAppAlert, useFeatureUnavailableAlert } from '../../components/shared/modals';
import type { RebootPhase } from '../../components/plan/schedule/ScheduleRouteSlot';
import type {
  ScheduleModalState,
  ScheduleRebootState,
} from '../../components/plan/schedule/planScheduleTypes';
import {
  ALPHA_FEATURE_LABELS,
  isAlphaFeatureBlocked,
} from '../../constants/common/alphaFeatureBlocks';
import type { CopyFor } from '../../i18n';
import { usePlanStore } from '../../stores';
import type { PlaceReview } from '../../types/travelReview';
import type { RouteItem, TravelPlan } from '../../types/travelPlan';
import type { AppLanguage } from '../../types/user';
import {
  estimateUserLocation,
  findNearestScheduleRoute,
} from '../../utils/plan/scheduleRoute';
import { sortedRoutes } from '../../utils/plan/planItinerary';
import { countScheduleZoneSegments } from '../../utils/plan/scheduleZoneGroups';
import { computeDayTotalMinutes, formatDurationMinutes } from '../../utils/geo/tripDuration';
import {
  isLegDirectionsInputValid,
  openGoogleLegDirections,
  openKakaoLegDirections,
  type LegDirectionsInput,
} from '../../utils/map/mapDirections';

type Copy = CopyFor<'planDetail'>;

export type UsePlanScheduleTabParams = {
  planId: string;
  plan: TravelPlan;
  language: AppLanguage;
  copy: Copy;
  selectedDay: number;
  planReviews: PlaceReview[];
  onSelectDay: (day: number) => void;
  onToggleVisited: (itemId: string) => void;
  onWriteReview: (route: RouteItem) => void;
  onQuickRating: (route: RouteItem, rating: number) => void;
  onDeleteRoute: (route: RouteItem) => void;
  onSaveRouteMemo?: (route: RouteItem, memo: string | undefined) => void | Promise<void>;
  onReorderRoutes?: (dayNumber: number, orderedItemIds: string[]) => void | Promise<void>;
  onOptimizeDayRoute?: (dayNumber: number) => void | Promise<void>;
  onRouteRemoved?: (itemId: string) => void;
  onScheduleModalChange: (modal: ScheduleModalState) => void;
  onReorderActiveChange?: (active: boolean) => void;
  readOnly?: boolean;
  onReadOnlyPress?: () => void;
  canAddDay?: boolean;
  canRemoveDay?: boolean;
  onAddDay?: () => void;
  onRemoveDay?: () => void;
  onNotify?: (message: string) => void;
};

/** PlanScheduleTab 상태·핸들러 (맵 크롬·리스트는 컴포넌트에서 조합) */
export function usePlanScheduleTab({
  planId,
  plan,
  language,
  copy,
  selectedDay,
  onToggleVisited,
  onWriteReview,
  onQuickRating,
  onDeleteRoute,
  onSaveRouteMemo,
  onReorderRoutes,
  onOptimizeDayRoute,
  onRouteRemoved,
  onScheduleModalChange,
  onReorderActiveChange,
  readOnly = false,
  onReadOnlyPress,
  canAddDay = false,
  canRemoveDay = false,
  onAddDay,
  onRemoveDay,
  onSelectDay,
  onNotify,
}: UsePlanScheduleTabParams) {
  const { alert } = useAppAlert();
  const { showUnavailable } = useFeatureUnavailableAlert();
  const reorderRoutes = usePlanStore(s => s.reorderRoutesInPlan);
  const updateLegMode = usePlanStore(s => s.updateRouteLegMode);
  const optimizeDayRouteLocal = usePlanStore(s => s.optimizeDayRoute);

  const [reboot, setReboot] = useState<ScheduleRebootState>(null);
  const [focusedRoute, setFocusedRoute] = useState<RouteItem | null>(null);
  const [mapSelectedItemId, setMapSelectedItemId] = useState<string | null>(null);
  const [scheduleFullExpanded, setScheduleFullExpanded] = useState(false);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [swapPickId, setSwapPickId] = useState<string | null>(null);
  const onModalChangeRef = useRef(onScheduleModalChange);
  onModalChangeRef.current = onScheduleModalChange;
  const onReorderActiveRef = useRef(onReorderActiveChange);
  onReorderActiveRef.current = onReorderActiveChange;
  const onReadOnlyPressRef = useRef(onReadOnlyPress);
  onReadOnlyPressRef.current = onReadOnlyPress;
  const dayRoutesRef = useRef<RouteItem[]>([]);

  const guardReadOnly = useCallback(() => {
    if (!readOnly) {
      return false;
    }
    onReadOnlyPressRef.current?.();
    return true;
  }, [readOnly]);

  const day =
    plan.itinerary.find(d => d.dayNumber === selectedDay) ?? plan.itinerary[0];

  const routeIdSetKey = useMemo(() => {
    if (!day) {
      return '';
    }
    return [...day.routes.map(r => r.itemId)].sort().join('|');
  }, [day]);

  const dayRoutes = useMemo(() => {
    if (!day) {
      return [];
    }
    const sorted = sortedRoutes(day.routes);
    if (orderedIds.length === 0) {
      return sorted;
    }
    const byId = Object.fromEntries(sorted.map(r => [r.itemId, r]));
    const ordered = orderedIds
      .map(id => byId[id])
      .filter((r): r is RouteItem => r != null);
    const missing = sorted.filter(r => !orderedIds.includes(r.itemId));
    return [...ordered, ...missing];
  }, [day, orderedIds]);

  dayRoutesRef.current = dayRoutes;

  const dayDurationLabel = useMemo(() => {
    if (dayRoutes.length === 0) {
      return null;
    }
    const minutes = computeDayTotalMinutes(dayRoutes);
    return copy.dayDuration(formatDurationMinutes(minutes, language));
  }, [dayRoutes, copy, language]);

  const zoneSegmentCount = useMemo(
    () => countScheduleZoneSegments(dayRoutes),
    [dayRoutes],
  );

  const buildLegDirectionsInput = useCallback(
    (from: RouteItem, to: RouteItem): LegDirectionsInput => ({
      from: {
        lat: from.location.lat,
        lng: from.location.lng,
        name: from.placeName,
        address: from.placeInfo?.address,
      },
      to: {
        lat: to.location.lat,
        lng: to.location.lng,
        name: to.placeName,
        address: to.placeInfo?.address,
      },
      mode: to.legMode ?? 'walk',
    }),
    [],
  );

  const openLegDirectionsWithProvider = useCallback(
    (provider: 'google' | 'kakao', from: RouteItem, to: RouteItem) => {
      const input = buildLegDirectionsInput(from, to);

      if (!isLegDirectionsInputValid(input)) {
        onNotify?.(copy.directionsUnavailable);
        return;
      }

      const open =
        provider === 'google' ? openGoogleLegDirections : openKakaoLegDirections;

      void open(input).then(result => {
        if (result === 'invalid') {
          onNotify?.(copy.directionsUnavailable);
        } else if (result === 'failed') {
          onNotify?.(copy.directionsFailed);
        }
      });
    },
    [
      buildLegDirectionsInput,
      copy.directionsFailed,
      copy.directionsUnavailable,
      onNotify,
    ],
  );

  const slotCopy = useMemo(
    () => ({
      markVisited: copy.markVisited,
      editRoute: copy.editRoute,
      rebootActionSub: copy.rebootActionSub,
      rebootDelete: copy.rebootDelete,
      rebootReplace: copy.rebootReplace,
      rebootCancel: copy.rebootCancel,
      recordReview: copy.recordReview,
      quickRatingHint: copy.quickRatingHint,
      scheduleDetailLoading: copy.scheduleDetailLoading,
      placeRatingSummary: copy.placeRatingSummary,
      transportModeTitle: copy.transportModeTitle,
      legWalk: copy.legWalk,
      legDrive: copy.legDrive,
      legTransit: copy.legTransit,
    }),
    [copy],
  );

  useEffect(() => {
    setReboot(null);
    setSwapPickId(null);
    setFocusedRoute(null);
    setMapSelectedItemId(null);
    onModalChangeRef.current({ kind: 'none' });
  }, [selectedDay]);

  useEffect(() => {
    const itemId = focusedRoute?.itemId;
    if (!itemId) {
      return;
    }
    const updated = dayRoutes.find(route => route.itemId === itemId);
    if (!updated) {
      setFocusedRoute(null);
      return;
    }
    setFocusedRoute(prev => (prev?.itemId === itemId ? updated : prev));
  }, [dayRoutes, focusedRoute?.itemId]);

  useEffect(() => {
    onReorderActiveRef.current?.(swapPickId != null);
  }, [swapPickId]);

  useEffect(() => {
    if (day) {
      setOrderedIds(sortedRoutes(day.routes).map(r => r.itemId));
    } else {
      setOrderedIds([]);
    }
  }, [selectedDay, routeIdSetKey, day]);

  const clearReboot = useCallback(() => {
    setReboot(null);
  }, []);

  const dismissInteractiveUi = useCallback(() => {
    setReboot(null);
    onModalChangeRef.current({ kind: 'none' });
  }, []);

  const openPickModal = useCallback(
    (itemId: string) => {
      if (guardReadOnly()) {
        return;
      }
      onScheduleModalChange({ kind: 'pick', itemId });
    },
    [guardReadOnly, onScheduleModalChange],
  );

  const phaseFor = useCallback(
    (itemId: string): RebootPhase => {
      if (reboot?.itemId !== itemId) {
        return 'idle';
      }
      return reboot.phase;
    },
    [reboot],
  );

  const handleDelete = useCallback(
    (route: RouteItem) => {
      if (guardReadOnly()) {
        return;
      }
      onDeleteRoute(route);
      onRouteRemoved?.(route.itemId);
      if (focusedRoute?.itemId === route.itemId) {
        setFocusedRoute(null);
      }
      if (mapSelectedItemId === route.itemId) {
        setMapSelectedItemId(null);
      }
      clearReboot();
    },
    [
      clearReboot,
      focusedRoute?.itemId,
      guardReadOnly,
      mapSelectedItemId,
      onDeleteRoute,
      onRouteRemoved,
    ],
  );

  const openRouteDetail = useCallback((route: RouteItem) => {
    setReboot(null);
    setSwapPickId(null);
    onModalChangeRef.current({ kind: 'none' });
    setMapSelectedItemId(route.itemId);
    setFocusedRoute(route);
  }, []);

  const handleMapMarkerPress = useCallback(
    (itemId: string) => {
      const route = dayRoutes.find(r => r.itemId === itemId);
      if (!route) {
        return;
      }
      if (mapSelectedItemId === itemId && focusedRoute?.itemId === itemId) {
        setFocusedRoute(null);
        setMapSelectedItemId(null);
        return;
      }
      openRouteDetail(route);
    },
    [dayRoutes, mapSelectedItemId, focusedRoute?.itemId, openRouteDetail],
  );

  const mapHighlightItemId = mapSelectedItemId ?? focusedRoute?.itemId ?? null;

  const swapRoutes = useCallback(
    (idA: string, idB: string) => {
      if (!day) {
        return;
      }
      const base =
        orderedIds.length > 0
          ? orderedIds
          : dayRoutesRef.current.map(r => r.itemId);
      const indexA = base.indexOf(idA);
      const indexB = base.indexOf(idB);
      if (indexA < 0 || indexB < 0) {
        return;
      }
      const next = [...base];
      next[indexA] = idB;
      next[indexB] = idA;
      setOrderedIds(next);
      if (onReorderRoutes) {
        onReorderRoutes(day.dayNumber, next);
      } else {
        reorderRoutes(planId, day.dayNumber, next);
      }
    },
    [day, orderedIds, planId, reorderRoutes, onReorderRoutes],
  );

  const handleIndexPress = useCallback(
    (itemId: string) => {
      if (guardReadOnly()) {
        return;
      }
      if (reboot?.itemId === itemId && reboot.phase === 'choose') {
        return;
      }
      setReboot(null);
      onModalChangeRef.current({ kind: 'none' });

      if (swapPickId === itemId) {
        setSwapPickId(null);
        return;
      }
      if (swapPickId == null) {
        setSwapPickId(itemId);
        return;
      }
      swapRoutes(swapPickId, itemId);
      setSwapPickId(null);
    },
    [swapPickId, swapRoutes, reboot, guardReadOnly],
  );

  const openNearestReboot = useCallback(() => {
    if (isAlphaFeatureBlocked('reboot')) {
      showUnavailable(ALPHA_FEATURE_LABELS.reboot);
      return;
    }
    if (guardReadOnly()) {
      return;
    }
    if (dayRoutes.length === 0) {
      return;
    }
    const userLoc = estimateUserLocation(dayRoutes);
    const nearest = findNearestScheduleRoute(dayRoutes, userLoc);
    if (nearest) {
      setReboot(null);
      onScheduleModalChange({ kind: 'pick', itemId: nearest.itemId });
    }
  }, [dayRoutes, onScheduleModalChange, guardReadOnly, showUnavailable]);

  const handleRouteOptimize = useCallback(() => {
    if (guardReadOnly()) {
      return;
    }
    if (!day || dayRoutes.length < 2) {
      return;
    }
    clearReboot();
    onModalChangeRef.current({ kind: 'none' });
    if (onOptimizeDayRoute) {
      onOptimizeDayRoute(day.dayNumber);
    } else {
      optimizeDayRouteLocal(planId, day.dayNumber);
      alert({ title: copy.routeOptimize, message: copy.routeOptimized });
    }
  }, [
    day,
    dayRoutes.length,
    optimizeDayRouteLocal,
    onOptimizeDayRoute,
    planId,
    copy,
    alert,
    guardReadOnly,
    clearReboot,
  ]);

  const handleAddPlacePress = useCallback(() => {
    if (guardReadOnly()) {
      return;
    }
    clearReboot();
    onScheduleModalChange({ kind: 'add' });
  }, [onScheduleModalChange, guardReadOnly, clearReboot]);

  const beginRebootChoose = useCallback(
    (itemId: string) => {
      if (isAlphaFeatureBlocked('reboot')) {
        showUnavailable(ALPHA_FEATURE_LABELS.reboot);
        return;
      }
      if (guardReadOnly()) {
        return;
      }
      setSwapPickId(null);
      onModalChangeRef.current({ kind: 'none' });
      setReboot({ itemId, phase: 'choose' });
    },
    [guardReadOnly, showUnavailable],
  );

  const zoneLabel =
    dayRoutes.length > 0 ? copy.dayZoneCount(zoneSegmentCount) : null;

  const dayChipPanelProps = {
    days: plan.itinerary,
    selectedDayNumber: day?.dayNumber ?? 1,
    onSelect: onSelectDay,
    language,
    canAddDay: canAddDay && !readOnly,
    addDayLabel: copy.addDay,
    onAddDay,
  };

  return {
    day,
    dayRoutes,
    dayDurationLabel,
    zoneLabel,
    dayChipPanelProps,
    slotCopy,
    focusedRoute,
    setFocusedRoute,
    mapSelectedItemId,
    scheduleFullExpanded,
    setScheduleFullExpanded,
    swapPickId,
    mapHighlightItemId,
    readOnly,
    canRemoveDay,
    onRemoveDay,
    guardReadOnly,
    phaseFor,
    handleDelete,
    openRouteDetail,
    handleMapMarkerPress,
    handleIndexPress,
    openNearestReboot,
    handleRouteOptimize,
    handleAddPlacePress,
    beginRebootChoose,
    clearReboot,
    dismissInteractiveUi,
    openPickModal,
    openLegDirectionsWithProvider,
    updateLegMode,
    onToggleVisited,
    onWriteReview,
    onQuickRating,
    onSaveRouteMemo,
  };
}
