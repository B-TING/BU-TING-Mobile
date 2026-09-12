import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

import type { EventZoneCoordinate } from '../../types/eventZone';

export type LocationPermissionResult = 'granted' | 'denied' | 'unavailable';

/**
 * Android: ACCESS_FINE_LOCATION 런타임 요청.
 * iOS: Info.plist WhenInUse 문구 기준으로 getCurrentPosition 시 시스템 다이얼로그가 뜸.
 */
export async function requestFineLocationPermission(): Promise<LocationPermissionResult> {
  if (Platform.OS !== 'android') {
    return 'granted';
  }

  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    if (result === PermissionsAndroid.RESULTS.GRANTED) {
      return 'granted';
    }
    return 'denied';
  } catch {
    return 'unavailable';
  }
}

/** 이미 허용된 경우만. 폴링에서 권한 다이얼로그를 띄우지 않는다. */
export async function checkFineLocationPermission(): Promise<LocationPermissionResult> {
  if (Platform.OS !== 'android') {
    return 'granted';
  }

  try {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return granted ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}

/** 앱 사용 중(foreground) 현재 좌표. 실패 시 null. */
export function getCurrentCoordinates(): Promise<EventZoneCoordinate | null> {
  const readOnce = (enableHighAccuracy: boolean) =>
    new Promise<EventZoneCoordinate | null>(resolve => {
      Geolocation.getCurrentPosition(
        position => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => resolve(null),
        {
          enableHighAccuracy,
          timeout: enableHighAccuracy ? 8_000 : 5_000,
          // 10초 이내 캐시 재사용으로 응답 속도 개선 (구역 판별 오차 허용 범위)
          maximumAge: 10_000,
        },
      );
    });

  return readOnce(true).then(coords => coords ?? readOnce(false));
}
