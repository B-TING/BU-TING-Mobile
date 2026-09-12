import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { EventZoneLayerToggle } from '../../components/kakaoMap/EventZoneLayerToggle';
import { useAppStore } from '../../stores';
import { KAKAO_MAP_JS_KEY } from '../config';
import type { KakaoMapOverlay } from '../overlays/types';
import { kakaoOverlaysFromEventZones } from '../overlays/zoneOverlays';
import {
  buildKakaoMapHtml,
  buildKakaoMapMoveScript,
  buildKakaoMapOverlaysScript,
} from './buildMapHtml';
import { cameraFromPoints, type MapCamera, type MapPoint } from './camera';

export type KakaoMapShellSize = 'compact' | 'fullscreen' | 'fill';

type KakaoMapShellProps = {
  points: MapPoint[];
  focusPoint?: MapPoint | null;
  overlays?: KakaoMapOverlay[];
  onOverlayPress?: (id: string) => void;
  onCenterChange?: (center: MapPoint) => void;
  size?: KakaoMapShellSize;
  onPress?: () => void;
  tapHint?: string;
  footer?: { title: string; subtitle: string };
  emptySubtitle?: string;
  /** 고정 지도 스케일(km) — Day 선택 포커스 등 */
  cameraKmSpan?: number;
  /** false면 마커 목록 변경 시 전체 bbox로 줌 재조정하지 않음 */
  fitPointsToCamera?: boolean;
  /** 장소 포커스 시 하단 UI 가림 보정 (px) */
  focusPanOffsetY?: number;
  /** false면 시트 높이 측정 전 카메라 이동 보류 */
  viewportInsetReady?: boolean;
  /** 6개 행사 구역 색상·구분선 토글 (기본 꺼짐) */
  eventZoneToggle?: boolean;
};

function pointsSignature(points: MapPoint[]): string {
  return points.map(point => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`).join('|');
}

function syncMapCamera(webViewRef: RefObject<WebView | null>, camera: MapCamera) {
  webViewRef.current?.injectJavaScript(buildKakaoMapMoveScript(camera));
}

function syncMapOverlays(webViewRef: RefObject<WebView | null>, overlays: KakaoMapOverlay[]) {
  webViewRef.current?.injectJavaScript(buildKakaoMapOverlaysScript(overlays));
}

function overlaysSignature(overlays: KakaoMapOverlay[]): string {
  return JSON.stringify(overlays);
}

export function KakaoMapShell({
  points,
  focusPoint,
  overlays = [],
  onOverlayPress,
  onCenterChange,
  size = 'compact',
  onPress,
  tapHint,
  footer,
  emptySubtitle,
  cameraKmSpan,
  fitPointsToCamera = true,
  focusPanOffsetY = 0,
  viewportInsetReady = true,
  eventZoneToggle = true,
}: KakaoMapShellProps) {
  const webViewRef = useRef<WebView>(null);
  const mapReadyRef = useRef(false);
  const bootstrapHtmlRef = useRef<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [eventZonesVisible, setEventZonesVisible] = useState(false);
  const language = useAppStore(state => state.language) ?? 'ko';
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const zoneOverlays = useMemo(() => kakaoOverlaysFromEventZones(), []);
  const mergedOverlays = useMemo(() => {
    if (!eventZoneToggle || !eventZonesVisible) {
      return overlays;
    }
    return [...zoneOverlays, ...overlays];
  }, [eventZoneToggle, eventZonesVisible, overlays, zoneOverlays]);

  const mapWidth = size === 'fullscreen' ? screenWidth : screenWidth - (size === 'fill' ? 0 : 48);
  const mapHeight =
    size === 'fullscreen' ? Math.round(screenHeight * 0.72) : size === 'fill' ? undefined : 160;

  const regionSyncKey = pointsSignature(points);

  const targetCamera = useMemo<MapCamera | null>(() => {
    const pan =
      focusPanOffsetY > 0 ? { panOffsetY: focusPanOffsetY } : undefined;
    if (focusPoint) {
      return {
        ...cameraFromPoints(points, {
          focus: focusPoint,
          ...(cameraKmSpan != null ? { kmSpan: cameraKmSpan } : {}),
        }),
        ...pan,
      };
    }
    if (!fitPointsToCamera) {
      return null;
    }
    return {
      ...cameraFromPoints(points, {
        ...(cameraKmSpan != null ? { kmSpan: cameraKmSpan } : {}),
      }),
      ...pan,
    };
  }, [points, focusPoint, cameraKmSpan, fitPointsToCamera, focusPanOffsetY]);

  const overlayKey = overlaysSignature(mergedOverlays);
  const pointsSyncKey = fitPointsToCamera ? regionSyncKey : null;
  const lastCameraKeyRef = useRef<string | null>(null);
  const lastOverlayKeyRef = useRef<string | null>(null);
  const mergedOverlaysRef = useRef(mergedOverlays);
  mergedOverlaysRef.current = mergedOverlays;

  if (bootstrapHtmlRef.current === null && KAKAO_MAP_JS_KEY && points.length > 0) {
    const bootstrapCamera =
      targetCamera ??
      cameraFromPoints(points, {
        ...(cameraKmSpan != null ? { kmSpan: cameraKmSpan } : {}),
      });
    bootstrapHtmlRef.current = buildKakaoMapHtml(KAKAO_MAP_JS_KEY, bootstrapCamera);
  }

  useEffect(() => {
    if (points.length === 0) {
      bootstrapHtmlRef.current = null;
      mapReadyRef.current = false;
      lastCameraKeyRef.current = null;
      lastOverlayKeyRef.current = null;
      setMapReady(false);
    }
  }, [points.length]);

  useEffect(() => {
    if (mapReady || mapError || !bootstrapHtmlRef.current) {
      return;
    }
    const timer = setTimeout(() => {
      if (!mapReadyRef.current) {
        setMapError(
          '카카오맵 응답이 없습니다. Kakao Developers → Web 플랫폼에 localhost 도메인을 등록하세요.',
        );
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, [mapReady, mapError, regionSyncKey]);

  useEffect(() => {
    if (!mapReady || !targetCamera || !viewportInsetReady) {
      return;
    }

    const panKey = targetCamera.panOffsetY ?? 0;
    const cameraKey = focusPoint
      ? [
          focusPoint.lat.toFixed(6),
          focusPoint.lng.toFixed(6),
          targetCamera.zoomLevel,
          panKey,
        ].join('|')
      : [
          targetCamera.lat.toFixed(6),
          targetCamera.lng.toFixed(6),
          targetCamera.zoomLevel,
          pointsSyncKey ?? '',
          panKey,
        ].join('|');

    if (lastCameraKeyRef.current === cameraKey) {
      return;
    }
    lastCameraKeyRef.current = cameraKey;

    syncMapCamera(webViewRef, targetCamera);

    // 포커스 이동은 한 번만 — 중복 setCenter가 흔들림 유발
    if (focusPoint) {
      return;
    }

    const retryTimers = [150, 400].map(delay =>
      setTimeout(() => syncMapCamera(webViewRef, targetCamera), delay),
    );

    return () => {
      retryTimers.forEach(clearTimeout);
    };
  }, [mapReady, targetCamera, pointsSyncKey, focusPoint, viewportInsetReady]);

  useEffect(() => {
    if (!mapReady) {
      return;
    }
    if (lastOverlayKeyRef.current === overlayKey) {
      return;
    }
    lastOverlayKeyRef.current = overlayKey;

    syncMapOverlays(webViewRef, mergedOverlaysRef.current);

    const retryTimers = [150, 400].map(delay =>
      setTimeout(() => syncMapOverlays(webViewRef, mergedOverlaysRef.current), delay),
    );

    return () => {
      retryTimers.forEach(clearTimeout);
    };
  }, [mapReady, overlayKey]);

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        message?: string;
        id?: string;
        lat?: number;
        lng?: number;
      };
      if (payload.type === 'ready') {
        mapReadyRef.current = true;
        setMapReady(true);
        setMapError(null);
        if (targetCamera) {
          syncMapCamera(webViewRef, targetCamera);
        }
        syncMapOverlays(webViewRef, mergedOverlays);
        return;
      }
      if (payload.type === 'overlayPress' && payload.id && onOverlayPress) {
        onOverlayPress(payload.id);
        return;
      }
      if (
        payload.type === 'centerChange' &&
        onCenterChange &&
        Number.isFinite(payload.lat) &&
        Number.isFinite(payload.lng)
      ) {
        onCenterChange({ lat: payload.lat as number, lng: payload.lng as number });
        return;
      }
      if (payload.type === 'error') {
        setMapError(payload.message ?? '카카오맵을 불러오지 못했습니다.');
      }
    } catch {
      // ignore malformed messages
    }
  };

  if (points.length === 0) {
    return (
      <View className="items-center justify-center rounded-2xl border border-brand-border bg-[#E8F0F8] p-6">
        <Text className="text-sm text-brand-muted">{emptySubtitle ?? footer?.subtitle}</Text>
      </View>
    );
  }

  if (!KAKAO_MAP_JS_KEY || !bootstrapHtmlRef.current) {
    return (
      <View className="items-center justify-center rounded-2xl border border-brand-border bg-[#E8F0F8] p-6">
        <Text className="text-center text-sm text-brand-muted">
          카카오맵 JavaScript 키가 설정되지 않았습니다.{'\n'}.env에 KAKAO_JAVASCRIPT_KEY를 추가한 뒤
          npm run kakao:sync 를 실행하세요.
        </Text>
      </View>
    );
  }

  const interactive = size !== 'compact' || !onPress;

  const containerStyle =
    size === 'fill'
      ? { flex: 1, width: '100%' as const }
      : { width: mapWidth, height: mapHeight };

  const mapBody = (
    <View
      className={
        size === 'fullscreen' || size === 'fill'
          ? 'flex-1 bg-[#E8F0F8]'
          : 'overflow-hidden rounded-2xl border border-brand-border bg-[#E8F0F8]'
      }>
      <View style={containerStyle} className="relative">
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{
            html: bootstrapHtmlRef.current,
            // Kakao JS SDK domain check — register localhost on Web platform
            baseUrl: 'https://localhost',
          }}
          style={
            mapHeight != null
              ? { width: mapWidth, height: mapHeight }
              : { flex: 1, width: '100%' }
          }
          scrollEnabled={interactive}
          bounces={false}
          overScrollMode="never"
          nestedScrollEnabled={Platform.OS === 'android'}
          pointerEvents={interactive ? 'auto' : 'none'}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          setSupportMultipleWindows={false}
          onMessage={handleWebViewMessage}
          onLoad={() => {
            setMapError(null);
            // Bridge may become ready after HTML onload — re-ask for ready.
            webViewRef.current?.injectJavaScript(`
              (function () {
                if (window.kakaoMap && window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
                }
                return true;
              })();
            `);
          }}
          onError={() => setMapError('WebView 로드 중 오류가 발생했습니다.')}
          onHttpError={() =>
            setMapError('카카오맵 SDK를 불러오지 못했습니다. 네트워크 또는 도메인을 확인하세요.')
          }
        />
        {!mapReady && !mapError ? (
          <View
            pointerEvents="none"
            className="absolute inset-0 items-center justify-center bg-[#E8F0F8]">
            <Text className="text-xs text-brand-muted">지도 불러오는 중…</Text>
          </View>
        ) : null}
        {mapError ? (
          <View className="absolute inset-0 items-center justify-center bg-[#E8F0F8] px-4">
            <Text className="text-center text-xs text-brand-muted">{mapError}</Text>
            <Text className="mt-2 text-center text-[10px] text-brand-muted">
              Kakao Developers → Web 플랫폼 · JavaScript 키 · SDK 도메인(http://localhost) 확인
            </Text>
          </View>
        ) : null}
        {onPress && tapHint && size === 'compact' ? (
          <View
            pointerEvents="none"
            className="absolute right-2 top-2 rounded-md bg-black/50 px-2 py-1">
            <Text className="text-[10px] font-semibold text-white">{tapHint}</Text>
          </View>
        ) : null}
        {eventZoneToggle ? (
          <View className="absolute left-2 top-2 z-10">
            <EventZoneLayerToggle
              visible={eventZonesVisible}
              onToggle={() => setEventZonesVisible(current => !current)}
            />
          </View>
        ) : null}
      </View>
      {footer ? (
        <View className="border-t border-brand-border bg-brand-surface px-3 py-2">
          <Text className="text-xs font-semibold text-brand-text">{footer.title}</Text>
          <Text className="text-[11px] text-brand-muted">{footer.subtitle}</Text>
        </View>
      ) : null}
    </View>
  );

  if (onPress && size === 'compact') {
    return (
      <Pressable onPress={onPress} className="active:opacity-90">
        {mapBody}
      </Pressable>
    );
  }

  return mapBody;
}
