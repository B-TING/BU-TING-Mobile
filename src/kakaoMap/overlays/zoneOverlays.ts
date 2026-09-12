import { EVENT_ZONE_DISTRICT_IDS } from '../../constants/eventZone/busanMapPaths';
import { BUSAN_DISTRICT_BOUNDARIES } from '../../constants/eventZone/busanDistrictBoundaries';
import { EVENT_ZONES, KAKAO_ZONE_POLYGON_OFFSET } from '../../constants/eventZone/eventZone';
import type { EventZoneCoordinate } from '../../types/eventZone';
import type { KakaoMapPolygonOverlay } from './types';

const boundariesByDistrictId = Object.fromEntries(
  BUSAN_DISTRICT_BOUNDARIES.map(boundary => [boundary.districtId, boundary]),
);

function applyPolygonOffset(point: EventZoneCoordinate): EventZoneCoordinate {
  return {
    lat: point.lat + KAKAO_ZONE_POLYGON_OFFSET.lat,
    lng: point.lng + KAKAO_ZONE_POLYGON_OFFSET.lng,
  };
}

function districtLatLngPaths(districtId: string): EventZoneCoordinate[][] {
  const rings = boundariesByDistrictId[districtId]?.rings ?? [];
  return rings.map(ring => ring.map(applyPolygonOffset));
}

/** 6개 행사 구역 폴리곤 — 통계청 시군구 경계(WGS84) + 구역별 색상·구분선 */
export function kakaoOverlaysFromEventZones(): KakaoMapPolygonOverlay[] {
  return EVENT_ZONES.map(zone => {
    const paths: EventZoneCoordinate[][] = [];

    for (const districtId of EVENT_ZONE_DISTRICT_IDS[zone.id]) {
      paths.push(...districtLatLngPaths(districtId));
    }

    return {
      kind: 'polygon' as const,
      id: `event-zone-${zone.id}`,
      paths,
      fillColor: zone.baseColor,
      fillOpacity: 0.25,
      strokeColor: zone.highlightColor,
      strokeOpacity: 1,
      strokeWeight: 1,
      zIndex: 0,
    };
  }).filter(overlay => overlay.paths.length > 0);
}
