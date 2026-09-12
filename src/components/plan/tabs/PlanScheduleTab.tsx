import { forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';

import { usePlanScheduleTab } from '../../../hooks/plan/usePlanScheduleTab';
import type { CopyFor } from '../../../i18n';
import type { AppLanguage } from '../../../types/user';
import type { PlaceReview } from '../../../types/travelReview';
import type { RouteItem, TravelPlan } from '../../../types/travelPlan';
import { getReviewForPlace } from '../../../utils/review/travelReview';
import { buildScheduleTabMapChrome } from '../schedule/ScheduleTabMapChrome';
import { ScheduleMapSplit } from '../schedule/ScheduleMapSplit';
import { ScheduleRouteDetailPanel } from '../schedule/ScheduleRouteDetailPanel';
import { ScheduleTabRouteList } from '../schedule/ScheduleTabRouteList';
import type {
  PlanScheduleTabHandle,
  ScheduleModalState,
} from '../schedule/planScheduleTypes';

export type { PlanScheduleTabHandle, ScheduleModalState } from '../schedule/planScheduleTypes';

type Copy = CopyFor<'planDetail'>;

type PlanScheduleTabProps = {
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
  actionBarBottomInset?: number;
  /** 일정 탭이 화면에 보일 때만 지도·시트 렌더 (탭 전환 bleed 방지) */
  isActive?: boolean;
  onNotify?: (message: string) => void;
};

export const PlanScheduleTab = forwardRef<PlanScheduleTabHandle, PlanScheduleTabProps>(
  function PlanScheduleTab(props, ref) {
    const {
      planId,
      plan,
      language,
      copy,
      planReviews,
      actionBarBottomInset = 0,
      isActive = true,
    } = props;

    const schedule = usePlanScheduleTab(props);

    useImperativeHandle(
      ref,
      () => ({
        handleRebootFabPress: schedule.openNearestReboot,
        handleRouteOptimize: schedule.handleRouteOptimize,
        handleAddPlacePress: schedule.handleAddPlacePress,
      }),
      [
        schedule.openNearestReboot,
        schedule.handleRouteOptimize,
        schedule.handleAddPlacePress,
      ],
    );

    const mapChrome = buildScheduleTabMapChrome({
      dayChipPanelProps: schedule.dayChipPanelProps,
      zoneLabel: schedule.zoneLabel,
      dayDurationLabel: schedule.dayDurationLabel,
      scheduleFullExpanded: schedule.scheduleFullExpanded,
      showQuickActions: !schedule.readOnly && !schedule.focusedRoute,
      copy,
      canRemoveDay: Boolean(schedule.canRemoveDay && !schedule.readOnly),
      onOptimize: schedule.handleRouteOptimize,
      onAddPlace: schedule.handleAddPlacePress,
      onRemoveDay:
        schedule.canRemoveDay && !schedule.readOnly && schedule.onRemoveDay
          ? () => {
              if (schedule.guardReadOnly()) {
                return;
              }
              schedule.onRemoveDay?.();
            }
          : undefined,
    });

    const detailPanel = schedule.focusedRoute ? (
      <ScheduleRouteDetailPanel
        route={schedule.focusedRoute}
        language={language}
        copy={copy}
        layout="sheetHeader"
        placeReview={getReviewForPlace(
          planReviews,
          schedule.focusedRoute.apiPlanPlaceId ?? schedule.focusedRoute.itemId,
        )}
        onToggleVisited={() => {
          if (schedule.guardReadOnly()) {
            return;
          }
          schedule.onToggleVisited(schedule.focusedRoute!.itemId);
        }}
        onWriteReview={() => {
          if (schedule.guardReadOnly()) {
            return;
          }
          schedule.onWriteReview(schedule.focusedRoute!);
        }}
        onSaveMemo={
          schedule.readOnly
            ? undefined
            : memo => schedule.onSaveRouteMemo?.(schedule.focusedRoute!, memo)
        }
      />
    ) : null;

    return (
      <View className="flex-1">
        <ScheduleMapSplit
          isActive={isActive}
          itinerary={plan.itinerary}
          selectedDayNumber={schedule.day?.dayNumber ?? 1}
          highlightItemId={schedule.mapHighlightItemId}
          onMarkerPress={schedule.handleMapMarkerPress}
          dragLabel={copy.mapDragLabel}
          mapClosedHint={copy.mapClosedHint}
          detailCloseLabel={copy.close}
          onDetailClose={() => schedule.setFocusedRoute(null)}
          onScheduleExpandChange={schedule.setScheduleFullExpanded}
          bottomInset={actionBarBottomInset}
          mapTopRight={mapChrome.mapTopRight}
          mapOverlayLeading={mapChrome.mapOverlayLeading}
          mapOverlay={mapChrome.mapOverlay}
          sheetHeader={mapChrome.sheetHeader}
          detailContent={detailPanel}>
          <ScheduleTabRouteList
            dayRoutes={schedule.dayRoutes}
            dayNumber={schedule.day?.dayNumber ?? 1}
            planReviews={planReviews}
            copy={copy}
            slotCopy={schedule.slotCopy}
            swapPickId={schedule.swapPickId}
            mapSelectedItemId={schedule.mapSelectedItemId}
            focusedItemId={schedule.focusedRoute?.itemId ?? null}
            readOnly={schedule.readOnly}
            phaseFor={schedule.phaseFor}
            onOpenRouteDetail={schedule.openRouteDetail}
            onBeginReboot={schedule.beginRebootChoose}
            onIndexPress={schedule.handleIndexPress}
            onToggleVisited={itemId => {
              schedule.dismissInteractiveUi();
              schedule.onToggleVisited(itemId);
            }}
            onWriteReview={schedule.onWriteReview}
            onQuickRating={schedule.onQuickRating}
            onDelete={schedule.handleDelete}
            onReplace={schedule.openPickModal}
            onCancelReboot={schedule.clearReboot}
            onLegModeChange={(itemId, mode) =>
              schedule.updateLegMode(planId, itemId, mode)
            }
            onGoogleDirections={(from, to) =>
              schedule.openLegDirectionsWithProvider('google', from, to)
            }
            onKakaoDirections={(from, to) =>
              schedule.openLegDirectionsWithProvider('kakao', from, to)
            }
            guardReadOnly={schedule.guardReadOnly}
          />
        </ScheduleMapSplit>
      </View>
    );
  },
);
