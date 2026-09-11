import { ZoneEventServiceError } from '../src/services/eventZone/zoneEventService';
import {
  isRetakeRequiredSubmitError,
  zoneEventSubmitErrorCopy,
} from '../src/utils/eventZone/zoneEventSubmitError';

const copy = {
  submitMediaAlreadyUsed: 'already-used',
  submitMediaStale: 'stale',
  submitMediaForbidden: 'forbidden',
  submitDeadlinePassed: 'deadline',
  captureFailed: 'capture-failed',
};

function err(message: string, status?: number) {
  return new ZoneEventServiceError(message, { status });
}

describe('zoneEventSubmitErrorCopy', () => {
  it('maps reused file', () => {
    expect(zoneEventSubmitErrorCopy(err('이미 다른 제출에 사용된 파일입니다.', 400), copy)).toBe(
      'already-used',
    );
    expect(
      zoneEventSubmitErrorCopy(err('This file has already been used in another submission.', 400), copy),
    ).toBe('already-used');
  });

  it('maps stale upload', () => {
    expect(zoneEventSubmitErrorCopy(err('업로드한 지 너무 오래된 파일입니다.', 400), copy)).toBe(
      'stale',
    );
    expect(zoneEventSubmitErrorCopy(err('This file was uploaded too long ago.', 400), copy)).toBe(
      'stale',
    );
  });

  it('maps forbidden media', () => {
    expect(zoneEventSubmitErrorCopy(err('본인이 업로드한 이미지만 제출할 수 있습니다.', 403), copy)).toBe(
      'forbidden',
    );
    expect(zoneEventSubmitErrorCopy(err('nope', 403), copy)).toBe('forbidden');
  });

  it('maps ended event on 409', () => {
    expect(zoneEventSubmitErrorCopy(err('이벤트 참여 가능 시간이 지났습니다.', 409), copy)).toBe(
      'deadline',
    );
    expect(
      zoneEventSubmitErrorCopy(err("The event's participation window has ended.", 409), copy),
    ).toBe('deadline');
  });

  it('keeps unknown server message', () => {
    expect(zoneEventSubmitErrorCopy(err('다른 오류', 409), copy)).toBe('다른 오류');
    expect(zoneEventSubmitErrorCopy(err('   ', 500), copy)).toBe('capture-failed');
  });
});

describe('isRetakeRequiredSubmitError', () => {
  it('requires retake on 400 and 403', () => {
    expect(isRetakeRequiredSubmitError(err('x', 400))).toBe(true);
    expect(isRetakeRequiredSubmitError(err('x', 403))).toBe(true);
  });

  it('does not require retake on deadline 409', () => {
    expect(isRetakeRequiredSubmitError(err('이벤트 참여 가능 시간이 지났습니다.', 409))).toBe(
      false,
    );
  });
});
