import { useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { BUSAN_SVG_VIEWBOX } from '../../constants/eventZone/busanMapPaths';
import { EVENT_MAP_BG } from '../../constants/eventZone/mapChrome';
import { EVENT_ZONE_BY_ID } from '../../constants/eventZone/eventZone';
import type { AppLanguage } from '../../types/user';
import type { EventZoneId } from '../../types/eventZone';
import { resolveLandmarkMapPoint } from '../../utils/eventZone/landmarkMapPoint';
import { useZoneMapCamera } from '../../utils/eventZone/useZoneMapCamera';
import { svgPointToLayout } from '../../utils/eventZone/zoneMapFocus';
import {
  BaseDistrictLayer,
  LandmarkLayer,
  SelectionLandmarkLabels,
  SelectionOverlay,
} from './BusanZoneMapLayers';
import { EventPulseMarker } from './EventPulseMarker';

const MAX_EVENT_PULSES = 3;

type BusanZoneMapProps = {
  /** 카메라 줌 타겟 (터치 즉시) */
  focusZoneId?: EventZoneId | null;
  /** 구 하이라이트·랜드마크 (줌 애니 이후) */
  selectedZoneId: EventZoneId | null;
  currentZoneId: EventZoneId | null;
  language: AppLanguage;
  /** 이벤트가 발생한 구역들 (glow 강조) */
  eventZoneIds?: readonly EventZoneId[];
  /** false 이면 pulse 애니메이션 정지 */
  pulsesActive?: boolean;
  onZonePress: (zoneId: EventZoneId) => void;
  /** dim / 맵 배경 탭 시 선택 해제 */
  onDismiss?: () => void;
};

export function BusanZoneMap({
  focusZoneId,
  selectedZoneId,
  currentZoneId,
  language,
  eventZoneIds = [],
  pulsesActive = true,
  onZonePress,
  onDismiss,
}: BusanZoneMapProps) {
  const cameraZoneId = focusZoneId !== undefined ? focusZoneId : selectedZoneId;
  // 상세 패널은 하단 슬롯 — 맵 위 플로팅이 아니므로 중앙 포커스
  const { cameraStyle, panHandlers, onLayout, fixedViewBox, layoutSize } =
    useZoneMapCamera({
      selectedZoneId: cameraZoneId,
      panelOpen: false,
      interactive: true,
    });

  const eventCenters = useMemo(() => {
    const centers = eventZoneIds
      .map(zoneId => ({ zoneId, center: zoneMapCenter(zoneId) }))
      .filter(
        (item): item is { zoneId: EventZoneId; center: { x: number; y: number } } =>
          item.center != null,
      );
    return centers.slice(0, MAX_EVENT_PULSES);
  }, [eventZoneIds]);

  const pulseLayoutPoints = useMemo(
    () =>
      eventCenters.map(({ zoneId, center }) => ({
        zoneId,
        ...svgPointToLayout(center, layoutSize),
      })),
    [eventCenters, layoutSize],
  );

  return (
    <View
      style={[styles.root, { backgroundColor: EVENT_MAP_BG }]}
      className="flex-1 overflow-hidden"
      onLayout={onLayout}
      {...panHandlers}>
      <Animated.View style={cameraStyle}>
        <Svg
          width="100%"
          height="100%"
          viewBox={fixedViewBox}
          preserveAspectRatio="xMidYMid meet">
          <Rect
            x={0}
            y={0}
            width={BUSAN_SVG_VIEWBOX.width}
            height={BUSAN_SVG_VIEWBOX.height}
            fill={EVENT_MAP_BG}
          />
          <BaseDistrictLayer
            currentZoneId={currentZoneId}
            eventZoneIds={eventZoneIds}
            onZonePress={onZonePress}
          />
          <SelectionOverlay
            selectedZoneId={selectedZoneId}
            onDismiss={onDismiss}
          />
          <LandmarkLayer />
          <SelectionLandmarkLabels
            selectedZoneId={selectedZoneId}
            language={language}
          />
        </Svg>

        {pulseLayoutPoints.map(({ zoneId, left, top }) => (
          <EventPulseMarker
            key={`event-pulse-${zoneId}`}
            left={left}
            top={top}
            active={pulsesActive}
          />
        ))}
      </Animated.View>
    </View>
  );
}

function zoneMapCenter(zoneId: EventZoneId): { x: number; y: number } | null {
  const zone = EVENT_ZONE_BY_ID[zoneId];
  if (!zone || zone.landmarks.length === 0) {
    return null;
  }
  const points = zone.landmarks.map(landmark => resolveLandmarkMapPoint(landmark));
  const sum = points.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 },
  );
  return { x: sum.x / points.length, y: sum.y / points.length };
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
});
