import type { ZoneEventServiceError } from '../../services/eventZone/zoneEventService';

type SubmitErrorCopy = {
  submitMediaAlreadyUsed: string;
  submitMediaStale: string;
  submitMediaForbidden: string;
  submitDeadlinePassed: string;
  captureFailed: string;
};

function matches(message: string, patterns: RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(message));
}

/** 제출 400/403/409를 앱 카피로 바꾼다. 해당 없으면 서버 메시지. */
export function zoneEventSubmitErrorCopy(
  error: ZoneEventServiceError,
  copy: SubmitErrorCopy,
): string {
  const message = error.message ?? '';

  if (error.status === 403 || matches(message, [/forbidden/i, /본인이 업로드/, /ご自身/, /本人上传/])) {
    return copy.submitMediaForbidden;
  }
  if (matches(message, [/already.+used/i, /사용된 파일/, /使用された/, /用于其他提交/])) {
    return copy.submitMediaAlreadyUsed;
  }
  if (matches(message, [/stale/i, /too long ago/i, /오래된 파일/, /時間が経ち/, /上传时间过久/])) {
    return copy.submitMediaStale;
  }
  if (
    error.status === 409 &&
    matches(message, [/ended/i, /지났/, /過ぎ/, /已结束/, /participation window/i])
  ) {
    return copy.submitDeadlinePassed;
  }

  return message.trim() || copy.captureFailed;
}

export function isRetakeRequiredSubmitError(error: ZoneEventServiceError): boolean {
  return (
    error.status === 400 ||
    error.status === 403 ||
    /already.+used|stale|too long ago|forbidden|사용된|오래된|ご自身|使用|过久|本人上传/i.test(
      error.message ?? '',
    )
  );
}
