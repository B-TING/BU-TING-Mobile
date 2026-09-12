import { acquireDeviceCoordinates } from '../src/utils/location/acquireDeviceCoordinates';
import { useLocationStore } from '../src/stores/useLocationStore';
import * as deviceLocation from '../src/utils/location/deviceLocation';

jest.mock('../src/utils/location/deviceLocation', () => ({
  requestFineLocationPermission: jest.fn(),
  getCurrentCoordinates: jest.fn(),
  checkFineLocationPermission: jest.fn(),
}));

const requestFineLocationPermission =
  deviceLocation.requestFineLocationPermission as jest.MockedFunction<
    typeof deviceLocation.requestFineLocationPermission
  >;
const getCurrentCoordinates =
  deviceLocation.getCurrentCoordinates as jest.MockedFunction<
    typeof deviceLocation.getCurrentCoordinates
  >;

describe('acquireDeviceCoordinates', () => {
  beforeEach(() => {
    useLocationStore.getState().clear();
    jest.clearAllMocks();
  });

  it('returns consent_denied without requesting permission', async () => {
    const result = await acquireDeviceCoordinates({
      ensureLocationConsent: async () => 'declined',
    });

    expect(result).toEqual({ ok: false, reason: 'consent_denied' });
    expect(requestFineLocationPermission).not.toHaveBeenCalled();
  });

  it('returns permission_denied when fine location is denied', async () => {
    requestFineLocationPermission.mockResolvedValue('denied');

    const result = await acquireDeviceCoordinates({
      ensureLocationConsent: async () => 'accepted',
    });

    expect(result).toEqual({ ok: false, reason: 'permission_denied' });
    expect(getCurrentCoordinates).not.toHaveBeenCalled();
  });

  it('prefers a fresh cache over GPS', async () => {
    requestFineLocationPermission.mockResolvedValue('granted');
    useLocationStore.getState().setCoords({ lat: 35.1, lng: 129.1 });

    const result = await acquireDeviceCoordinates({
      ensureLocationConsent: async () => 'accepted',
    });

    expect(result).toEqual({
      ok: true,
      coords: { lat: 35.1, lng: 129.1 },
      fromCache: true,
    });
    expect(getCurrentCoordinates).not.toHaveBeenCalled();
  });

  it('fetches GPS and writes the store when cache is empty', async () => {
    requestFineLocationPermission.mockResolvedValue('granted');
    getCurrentCoordinates.mockResolvedValue({ lat: 35.2, lng: 129.2 });

    const result = await acquireDeviceCoordinates({
      ensureLocationConsent: async () => 'accepted',
    });

    expect(result).toEqual({
      ok: true,
      coords: { lat: 35.2, lng: 129.2 },
      fromCache: false,
    });
    expect(useLocationStore.getState().coords).toEqual({ lat: 35.2, lng: 129.2 });
  });

  it('returns location_unavailable when GPS fails', async () => {
    requestFineLocationPermission.mockResolvedValue('granted');
    getCurrentCoordinates.mockResolvedValue(null);

    const result = await acquireDeviceCoordinates({
      ensureLocationConsent: async () => 'accepted',
    });

    expect(result).toEqual({ ok: false, reason: 'location_unavailable' });
  });
});
