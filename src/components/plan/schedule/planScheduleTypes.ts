import type { TravelLegMode } from '../../../types/travelPlan';

export type ScheduleModalState =
  | { kind: 'none' }
  | { kind: 'add'; legMode?: TravelLegMode }
  | { kind: 'pick'; itemId: string };

export type PlanScheduleTabHandle = {
  handleRebootFabPress: () => void;
  handleRouteOptimize: () => void;
  handleAddPlacePress: () => void;
};

export type ScheduleRebootState = {
  itemId: string;
  phase: 'choose';
} | null;
