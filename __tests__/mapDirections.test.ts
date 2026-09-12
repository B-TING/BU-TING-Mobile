import { Linking } from 'react-native';

import {
  buildGoogleMapsDirectionsAppUrl,
  buildGoogleMapsDirectionsWebUrl,
  buildKakaoMapDirectionsAppUrl,
  buildKakaoMapDirectionsMobileWebUrl,
  buildKakaoMapDirectionsWebUrl,
  buildLegDirectionsFallbackUrls,
  isLegDirectionsInputValid,
  isValidMapCoordinate,
  openLegDirections,
  resolveGoogleDirectionsLabel,
} from '../src/utils/map/mapDirections';

const sampleLeg = {
  from: { lat: 35.1587, lng: 129.1604, name: '해운대' },
  to: { lat: 35.1796, lng: 129.0756, name: '서면' },
  mode: 'walk' as const,
};

const sampleLegWithAddress = {
  from: {
    lat: 35.1587,
    lng: 129.1604,
    name: '해운대해수욕장',
    address: '부산 해운대구 우동 264',
  },
  to: {
    lat: 35.1796,
    lng: 129.0756,
    name: '서면',
    address: '부산 부산진구 부전동',
  },
  mode: 'walk' as const,
};

describe('mapDirections', () => {
  it('validates coordinates', () => {
    expect(isValidMapCoordinate(35.1, 129.1)).toBe(true);
    expect(isValidMapCoordinate(0, 0)).toBe(false);
    expect(isValidMapCoordinate(Number.NaN, 129)).toBe(false);
  });

  it('validates leg input with coordinates or address', () => {
    expect(isLegDirectionsInputValid(sampleLeg)).toBe(true);
    expect(isLegDirectionsInputValid(sampleLegWithAddress)).toBe(true);
    expect(
      isLegDirectionsInputValid({
        ...sampleLeg,
        to: { ...sampleLeg.to, lat: 0, lng: 0, name: '', address: '' },
      }),
    ).toBe(false);
    expect(
      isLegDirectionsInputValid({
        ...sampleLeg,
        to: { ...sampleLeg.to, lat: 0, lng: 0, name: '서면', address: '' },
      }),
    ).toBe(true);
  });

  it('prefers address, then coordinates, then name for Google label', () => {
    expect(resolveGoogleDirectionsLabel(sampleLegWithAddress.from)).toBe(
      '부산 해운대구 우동 264',
    );
    expect(
      resolveGoogleDirectionsLabel({
        lat: 35.1587,
        lng: 129.1604,
        name: '해운대',
        address: '',
      }),
    ).toBe('35.1587,129.1604');
    expect(
      resolveGoogleDirectionsLabel({
        lat: 0,
        lng: 0,
        name: '해운대',
        address: '',
      }),
    ).toBe('해운대');
  });

  it('builds Google app url with address when available', () => {
    expect(buildGoogleMapsDirectionsAppUrl(sampleLegWithAddress)).toBe(
      'comgooglemaps://?saddr=%EB%B6%80%EC%82%B0%20%ED%95%B4%EC%9A%B4%EB%8C%80%EA%B5%AC%20%EC%9A%B0%EB%8F%99%20264&daddr=%EB%B6%80%EC%82%B0%20%EB%B6%80%EC%82%B0%EC%A7%84%EA%B5%AC%20%EB%B6%80%EC%A0%84%EB%8F%99&directionsmode=walking',
    );
  });

  it('builds Google app url with coordinates when no address', () => {
    expect(buildGoogleMapsDirectionsAppUrl(sampleLeg)).toBe(
      'comgooglemaps://?saddr=35.1587%2C129.1604&daddr=35.1796%2C129.0756&directionsmode=walking',
    );
  });

  it('builds Google web url with transit mode', () => {
    const url = buildGoogleMapsDirectionsWebUrl({ ...sampleLegWithAddress, mode: 'transit' });
    expect(url).toContain('travelmode=transit');
    expect(url).toContain(
      encodeURIComponent('부산 해운대구 우동 264'),
    );
  });

  it('builds Kakao app url with lowercase travel mode and raw coords', () => {
    expect(buildKakaoMapDirectionsAppUrl({ ...sampleLeg, mode: 'drive' })).toBe(
      'kakaomap://route?sp=35.1587,129.1604&ep=35.1796,129.0756&by=car&sn=35.1587%2C129.1604&en=35.1796%2C129.0756',
    );
  });

  it('builds Kakao mobile web scheme url', () => {
    expect(buildKakaoMapDirectionsMobileWebUrl(sampleLeg)).toContain(
      'http://m.map.kakao.com/scheme/route?sp=35.1587,129.1604',
    );
    expect(buildKakaoMapDirectionsMobileWebUrl(sampleLeg)).toContain('by=foot');
  });

  it('builds Kakao web url with official link/by pattern', () => {
    const url = buildKakaoMapDirectionsWebUrl(sampleLegWithAddress);
    expect(url).toContain('https://map.kakao.com/link/by/walk/');
    expect(url).toContain(
      encodeURIComponent('부산 해운대구 우동 264'),
    );
    expect(url).not.toContain('/link/route/');
  });

  it('returns fallback chain google-first', () => {
    const urls = buildLegDirectionsFallbackUrls(sampleLeg);
    expect(urls).toHaveLength(5);
    expect(urls[0]).toContain('comgooglemaps://');
    expect(urls[1]).toContain('google.com/maps/dir');
    expect(urls[2]).toContain('kakaomap://');
    expect(urls[3]).toContain('m.map.kakao.com/scheme/route');
    expect(urls[4]).toContain('map.kakao.com/link/by/walk');
  });

  it('maps transit mode on Google and Kakao urls', () => {
    const transit = { ...sampleLeg, mode: 'transit' as const };
    expect(buildGoogleMapsDirectionsAppUrl(transit)).toContain('directionsmode=transit');
    expect(buildKakaoMapDirectionsAppUrl(transit)).toContain('by=publictransit');
    expect(buildKakaoMapDirectionsWebUrl(transit)).toContain('/link/by/traffic/');
  });

  it('uses place name when address and coordinates are missing', () => {
    const namedOnly = {
      lat: 0,
      lng: 0,
      name: '해운대',
      address: '',
    };
    expect(resolveGoogleDirectionsLabel(namedOnly)).toBe('해운대');
    expect(
      isLegDirectionsInputValid({
        from: namedOnly,
        to: { lat: 0, lng: 0, name: '서면', address: '' },
        mode: 'walk',
      }),
    ).toBe(true);
    expect(buildKakaoMapDirectionsWebUrl({
      from: namedOnly,
      to: { lat: 0, lng: 0, name: '서면', address: '' },
      mode: 'walk',
    })).toContain(encodeURIComponent('해운대'));
  });

  it('rejects out-of-range coordinates', () => {
    expect(isValidMapCoordinate(91, 129)).toBe(false);
    expect(isValidMapCoordinate(35, 181)).toBe(false);
  });
});

describe('openLegDirections', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns invalid when both endpoints are empty', async () => {
    await expect(
      openLegDirections({
        from: { lat: 0, lng: 0, name: '', address: '' },
        to: { lat: 0, lng: 0, name: '', address: '' },
        mode: 'walk',
      }),
    ).resolves.toBe('invalid');
  });

  it('opens the first fallback url that can open', async () => {
    jest
      .spyOn(Linking, 'canOpenURL')
      .mockImplementation(async (url: string) => url.includes('google.com/maps/dir'));
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);

    await expect(openLegDirections(sampleLeg)).resolves.toBe('opened');
    expect(open).toHaveBeenCalledTimes(1);
    expect(String(open.mock.calls[0]?.[0])).toContain('google.com/maps/dir');
  });

  it('returns failed when no fallback url can open', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('blocked'));

    await expect(openLegDirections(sampleLeg)).resolves.toBe('failed');
  });
});
