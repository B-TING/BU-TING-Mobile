import type { ReactNode } from 'react';

import type { CopyFor } from '../../../i18n';
import type { AppLanguage } from '../../../types/user';
import type { DailyItinerary } from '../../../types/travelPlan';
import { ScheduleDayChipPanel } from './ScheduleDayChipPanel';
import { ScheduleDayHeaderRow } from './ScheduleDayHeaderRow';
import { ScheduleMapZoneBadge } from './ScheduleMapZoneBadge';
import { ScheduleQuickActions } from './ScheduleQuickActions';

type Copy = CopyFor<'planDetail'>;

export type ScheduleDayChipPanelModel = {
  days: DailyItinerary[];
  selectedDayNumber: number;
  onSelect: (day: number) => void;
  language: AppLanguage;
  canAddDay: boolean;
  addDayLabel: string;
  onAddDay?: () => void;
};

type ScheduleTabMapChromeInput = {
  dayChipPanelProps: ScheduleDayChipPanelModel;
  zoneLabel: string | null;
  dayDurationLabel: string | null;
  scheduleFullExpanded: boolean;
  showQuickActions: boolean;
  copy: Copy;
  canRemoveDay: boolean;
  onOptimize: () => void;
  onAddPlace: () => void;
  onRemoveDay?: () => void;
};

export type ScheduleTabMapChromeSlots = {
  mapTopRight: ReactNode;
  mapOverlayLeading: ReactNode;
  mapOverlay: ReactNode;
  sheetHeader: ReactNode;
};

/** 일정 탭 지도 위 배지·칩·퀵액션·시트 헤더 슬롯 */
export function buildScheduleTabMapChrome({
  dayChipPanelProps,
  zoneLabel,
  dayDurationLabel,
  scheduleFullExpanded,
  showQuickActions,
  copy,
  canRemoveDay,
  onOptimize,
  onAddPlace,
  onRemoveDay,
}: ScheduleTabMapChromeInput): ScheduleTabMapChromeSlots {
  const mapQuickActions = showQuickActions ? (
    <ScheduleQuickActions
      compact
      onOptimize={onOptimize}
      onAddPlace={onAddPlace}
      optimizeLabel={copy.routeOptimize}
      addPlaceLabel={copy.addPlace}
    />
  ) : null;

  return {
    mapTopRight:
      zoneLabel || dayDurationLabel ? (
        <ScheduleMapZoneBadge zoneLabel={zoneLabel} durationLabel={dayDurationLabel} />
      ) : null,
    mapOverlayLeading: scheduleFullExpanded ? undefined : mapQuickActions,
    mapOverlay: scheduleFullExpanded ? undefined : (
      <ScheduleDayChipPanel {...dayChipPanelProps} variant="overlay" />
    ),
    sheetHeader: (
      <ScheduleDayHeaderRow
        {...dayChipPanelProps}
        showQuickActions={showQuickActions}
        onOptimize={onOptimize}
        onAddPlace={onAddPlace}
        optimizeLabel={copy.routeOptimize}
        addPlaceLabel={copy.addPlace}
        canRemoveDay={canRemoveDay}
        removeDayLabel={copy.removeDay}
        onRemoveDay={onRemoveDay}
      />
    ),
  };
}
