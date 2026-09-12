import { BUSAN_SVG_VIEWBOX } from '../../constants/eventZone/busanMapPaths';
import { EVENT_ZONE_BY_ID } from '../../constants/eventZone/eventZone';
import type { EventZoneId } from '../../types/eventZone';

export type MapFocusRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const FULL_MAP_FOCUS: MapFocusRect = {
  x: 0,
  y: 0,
  width: BUSAN_SVG_VIEWBOX.width,
  height: BUSAN_SVG_VIEWBOX.height,
};

/** 패널(우하단) 공간 확보 — 구역 중심을 화면 왼쪽~중앙에 배치 */
const LANDMARK_SCREEN_ANCHOR_X = 0.24;
const LANDMARK_SCREEN_ANCHOR_Y = 0.32;

const MIN_FOCUS_ZOOM_WIDTH = 220;
const MIN_FOCUS_ZOOM_HEIGHT = 220;

export function focusRectToViewBox(rect: MapFocusRect): string {
  return `${rect.x} ${rect.y} ${rect.width} ${rect.height}`;
}

/**
 * Fixed viewBox(0,0,FW,FH) + layout meet 기준으로,
 * focus rect 가 화면에 맞도록 Animated.View transform 을 계산한다.
 *
 * 값은 RN 기본 transformOrigin(center) 기준이다.
 * (top-left 수학 → center 보정: t' = t - c*(1-s))
 */
export function focusRectToCameraTransform(
  rect: MapFocusRect,
  layout: { width: number; height: number },
): { scale: number; translateX: number; translateY: number } {
  const LW = Math.max(1, layout.width);
  const LH = Math.max(1, layout.height);
  const FW = BUSAN_SVG_VIEWBOX.width;
  const FH = BUSAN_SVG_VIEWBOX.height;

  const fit = Math.min(LW / FW, LH / FH);
  const ox = (LW - FW * fit) / 2;
  const oy = (LH - FH * fit) / 2;

  const scale = Math.min(LW / (rect.width * fit), LH / (rect.height * fit));

  const zoomedW = rect.width * fit * scale;
  const zoomedH = rect.height * fit * scale;
  const targetOx = (LW - zoomedW) / 2;
  const targetOy = (LH - zoomedH) / 2;

  const srcX = ox + rect.x * fit;
  const srcY = oy + rect.y * fit;

  const translateXTopLeft = targetOx - srcX * scale;
  const translateYTopLeft = targetOy - srcY * scale;
  const cx = LW / 2;
  const cy = LH / 2;

  return {
    scale,
    translateX: translateXTopLeft - cx * (1 - scale),
    translateY: translateYTopLeft - cy * (1 - scale),
  };
}

/** SVG 좌표 → 레이아웃 픽셀 (meet, transform 적용 전) */
export function svgPointToLayout(
  point: { x: number; y: number },
  layout: { width: number; height: number },
): { left: number; top: number } {
  const LW = Math.max(1, layout.width);
  const LH = Math.max(1, layout.height);
  const FW = BUSAN_SVG_VIEWBOX.width;
  const FH = BUSAN_SVG_VIEWBOX.height;
  const fit = Math.min(LW / FW, LH / FH);
  const ox = (LW - FW * fit) / 2;
  const oy = (LH - FH * fit) / 2;
  return {
    left: ox + point.x * fit,
    top: oy + point.y * fit,
  };
}

export function getLandmarkCentroid(zoneId: EventZoneId): { x: number; y: number } {
  const zone = EVENT_ZONE_BY_ID[zoneId];
  const points = zone.landmarks.map(landmark => landmark.mapPoint);

  if (points.length === 0) {
    return {
      x: BUSAN_SVG_VIEWBOX.width / 2,
      y: BUSAN_SVG_VIEWBOX.height / 2,
    };
  }

  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

export function getZoneFocusRect(
  zoneId: EventZoneId,
  options?: { layoutForPanel?: boolean },
): MapFocusRect {
  const zone = EVENT_ZONE_BY_ID[zoneId];
  const landmarkPoints = zone.landmarks.map(landmark => landmark.mapPoint);

  if (landmarkPoints.length === 0) {
    return FULL_MAP_FOCUS;
  }

  const centroid = getLandmarkCentroid(zoneId);

  let minX = Math.min(...landmarkPoints.map(point => point.x));
  let maxX = Math.max(...landmarkPoints.map(point => point.x));
  let minY = Math.min(...landmarkPoints.map(point => point.y));
  let maxY = Math.max(...landmarkPoints.map(point => point.y));

  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const padX = Math.max(80, spanX * 0.65);
  const padY = Math.max(80, spanY * 0.65);

  let width = Math.max(MIN_FOCUS_ZOOM_WIDTH, maxX - minX + padX * 3);
  let height = Math.max(MIN_FOCUS_ZOOM_HEIGHT, maxY - minY + padY * 3);

  let x: number;
  let y: number;

  if (options?.layoutForPanel) {
    x = centroid.x - LANDMARK_SCREEN_ANCHOR_X * width;
    y = centroid.y - LANDMARK_SCREEN_ANCHOR_Y * height;
  } else {
    x = centroid.x - width / 2;
    y = centroid.y - height / 2;
  }

  return clampFocusRect({ x, y, width, height });
}

const MIN_FOCUS_WIDTH = 100;
const MIN_FOCUS_HEIGHT = 100;

export function clampFocusRect(rect: MapFocusRect): MapFocusRect {
  let { x, y, width, height } = rect;

  width = Math.max(MIN_FOCUS_WIDTH, Math.min(BUSAN_SVG_VIEWBOX.width, width));
  height = Math.max(MIN_FOCUS_HEIGHT, Math.min(BUSAN_SVG_VIEWBOX.height, height));

  x = Math.max(0, Math.min(BUSAN_SVG_VIEWBOX.width - width, x));
  y = Math.max(0, Math.min(BUSAN_SVG_VIEWBOX.height - height, y));

  return { x, y, width, height };
}

export function resolveMapFocusRect(
  selectedZoneId: EventZoneId | null,
  options?: { layoutForPanel?: boolean },
): MapFocusRect {
  if (!selectedZoneId) {
    return FULL_MAP_FOCUS;
  }

  return getZoneFocusRect(selectedZoneId, {
    layoutForPanel: options?.layoutForPanel,
  });
}

export function getHomeWidgetZoneFocusRect(zoneId: EventZoneId): MapFocusRect {
  const base = getZoneFocusRect(zoneId);
  const centroid = getLandmarkCentroid(zoneId);
  /** 구역을 왼쪽에 두고 우측 채팅 오버레이 공간 확보 */
  const HOME_WIDGET_ANCHOR_X = 0.1;
  const HOME_WIDGET_ANCHOR_Y = 0.6;
  const shrink = 1.0;
  const width = Math.max(MIN_FOCUS_WIDTH, base.width * shrink);
  const height = Math.max(MIN_FOCUS_HEIGHT, base.height * shrink);

  return clampFocusRect({
    x: centroid.x - HOME_WIDGET_ANCHOR_X * width,
    y: centroid.y - HOME_WIDGET_ANCHOR_Y * height,
    width,
    height,
  });
}

export function interpolateFocusRect(
  from: MapFocusRect,
  to: MapFocusRect,
  progress: number,
): MapFocusRect {
  const t = Math.max(0, Math.min(1, progress));
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    width: from.width + (to.width - from.width) * t,
    height: from.height + (to.height - from.height) * t,
  };
}
