import { Text, View } from 'react-native';
import type { ComponentProps } from 'react';

import { EVENT_ZONE_BY_ID } from '../../../constants/eventZone/eventZone';
import { getScheduleDayColor } from '../../../constants/plan/scheduleDayColors';
import type { CopyFor } from '../../../i18n';
import type { PlaceReview } from '../../../types/travelReview';
import type { RouteItem, TravelLegMode } from '../../../types/travelPlan';
import { resolveEventZoneForRoute } from '../../../utils/eventZone/zoneResolver';
import {
  isLegDirectionsInputValid,
  type LegDirectionsInput,
} from '../../../utils/map/mapDirections';
import { getReviewForPlace } from '../../../utils/review/travelReview';
import { ScheduleRouteSlot, type RebootPhase } from './ScheduleRouteSlot';
import { TravelLegRow } from './TravelLegRow';

type Copy = CopyFor<'planDetail'>;
type SlotCopy = ComponentProps<typeof ScheduleRouteSlot>['copy'];

type ScheduleTabRouteListProps = {
  dayRoutes: RouteItem[];
  dayNumber: number;
  planReviews: PlaceReview[];
  copy: Copy;
  slotCopy: SlotCopy;
  swapPickId: string | null;
  mapSelectedItemId: string | null;
  focusedItemId: string | null;
  readOnly: boolean;
  phaseFor: (itemId: string) => RebootPhase;
  onOpenRouteDetail: (route: RouteItem) => void;
  onBeginReboot: (itemId: string) => void;
  onIndexPress: (itemId: string) => void;
  onToggleVisited: (itemId: string) => void;
  onWriteReview: (route: RouteItem) => void;
  onQuickRating: (route: RouteItem, rating: number) => void;
  onDelete: (route: RouteItem) => void;
  onReplace: (itemId: string) => void;
  onCancelReboot: () => void;
  onLegModeChange: (itemId: string, mode: TravelLegMode) => void;
  onGoogleDirections: (from: RouteItem, to: RouteItem) => void;
  onKakaoDirections: (from: RouteItem, to: RouteItem) => void;
  guardReadOnly: () => boolean;
};

/** 일정 시트 본문 — 경로 슬롯 + 이동 구간 */
export function ScheduleTabRouteList({
  dayRoutes,
  dayNumber,
  planReviews,
  copy,
  slotCopy,
  swapPickId,
  mapSelectedItemId,
  focusedItemId,
  readOnly,
  phaseFor,
  onOpenRouteDetail,
  onBeginReboot,
  onIndexPress,
  onToggleVisited,
  onWriteReview,
  onQuickRating,
  onDelete,
  onReplace,
  onCancelReboot,
  onLegModeChange,
  onGoogleDirections,
  onKakaoDirections,
  guardReadOnly,
}: ScheduleTabRouteListProps) {
  const dayColor = getScheduleDayColor(dayNumber);

  return (
    <>
      {swapPickId != null ? (
        <View className="mb-3 rounded-xl border border-brand-primary bg-brand-selected px-3 py-2">
          <Text className="text-xs text-brand-text">{copy.reorderActiveHint}</Text>
        </View>
      ) : null}

      {dayRoutes.map((route, index) => {
        const prevRoute = index > 0 ? dayRoutes[index - 1] : null;
        const zoneColor = EVENT_ZONE_BY_ID[resolveEventZoneForRoute(route)].baseColor;
        const directionsInput: LegDirectionsInput | null =
          prevRoute != null
            ? {
                from: {
                  lat: prevRoute.location.lat,
                  lng: prevRoute.location.lng,
                  name: prevRoute.placeName,
                  address: prevRoute.placeInfo?.address,
                },
                to: {
                  lat: route.location.lat,
                  lng: route.location.lng,
                  name: route.placeName,
                  address: route.placeInfo?.address,
                },
                mode: route.legMode ?? 'walk',
              }
            : null;

        const indexSelected = swapPickId === route.itemId;
        const isFocused =
          mapSelectedItemId === route.itemId || focusedItemId === route.itemId;
        const review = getReviewForPlace(
          planReviews,
          route.apiPlanPlaceId ?? route.itemId,
        );

        return (
          <View key={route.itemId}>
            {prevRoute != null ? (
              <TravelLegRow
                googleLabel={copy.directionsGoogleButton}
                kakaoLabel={copy.directionsKakaoButton}
                lineColor={zoneColor}
                directionsDisabled={
                  directionsInput != null && !isLegDirectionsInputValid(directionsInput)
                }
                onGooglePress={() => onGoogleDirections(prevRoute, route)}
                onKakaoPress={() => onKakaoDirections(prevRoute, route)}
              />
            ) : null}
            <ScheduleRouteSlot
              route={route}
              displayIndex={index + 1}
              dayColor={dayColor.main}
              dayColorLight={dayColor.light}
              zoneColor={zoneColor}
              phase={phaseFor(route.itemId)}
              copy={slotCopy}
              reviewRating={review?.rating ?? 0}
              isFocused={isFocused}
              onPress={() => onOpenRouteDetail(route)}
              onEdit={() => onBeginReboot(route.itemId)}
              indexSelected={indexSelected}
              indexHint={
                indexSelected ? copy.reorderHandleHintSelected : copy.reorderHandleHint
              }
              onIndexPress={() => onIndexPress(route.itemId)}
              onToggleVisited={() => {
                if (guardReadOnly()) {
                  return;
                }
                onToggleVisited(route.itemId);
              }}
              onWriteReview={() => {
                if (guardReadOnly()) {
                  return;
                }
                onWriteReview(route);
              }}
              onQuickRating={rating => {
                if (guardReadOnly()) {
                  return;
                }
                onQuickRating(route, rating);
              }}
              onLegModeChange={
                readOnly
                  ? undefined
                  : mode => onLegModeChange(route.itemId, mode)
              }
              onDelete={() => onDelete(route)}
              onReplace={() => onReplace(route.itemId)}
              onCancel={onCancelReboot}
            />
          </View>
        );
      })}

      <Text className="mt-2 text-xs text-brand-muted">{copy.reorderLongPressHint}</Text>
      <Text className="mb-4 mt-1 text-xs text-brand-muted">{copy.closedHint}</Text>
    </>
  );
}
