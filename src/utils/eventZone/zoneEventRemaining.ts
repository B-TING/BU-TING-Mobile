import { useEffect, useState } from 'react';

import { zoneEventEndsAt } from '../../constants/eventZone/zoneEvents';
import type { ZoneEvent } from '../../types/eventZone';
import type { AppLanguage } from '../../types/user';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** 남은 시간을 사람이 읽기 쉬운 문자열로 포맷 */
export function formatZoneEventRemaining(ms: number, language: AppLanguage): string {
  if (ms <= 0) {
    return '';
  }

  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86_400);
  const hours = Math.floor((totalSec % 86_400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (language === 'ko') {
    if (days > 0) {
      return `${days}일 ${hours}시간 ${mins}분`;
    }
    if (hours > 0) {
      return `${hours}시간 ${pad2(mins)}분 ${pad2(secs)}초`;
    }
    return `${mins}분 ${pad2(secs)}초`;
  }

  if (language === 'ja') {
    if (days > 0) {
      return `残り${days}日${hours}時間${mins}分`;
    }
    if (hours > 0) {
      return `残り${hours}:${pad2(mins)}:${pad2(secs)}`;
    }
    return `残り${mins}分${secs}秒`;
  }

  if (language === 'zh') {
    if (days > 0) {
      return `剩余 ${days}天 ${hours}小时 ${mins}分`;
    }
    if (hours > 0) {
      return `剩余 ${hours}:${pad2(mins)}:${pad2(secs)}`;
    }
    return `剩余 ${mins}分 ${secs}秒`;
  }

  // en
  if (days > 0) {
    return `${days}d ${hours}h ${mins}m left`;
  }
  if (hours > 0) {
    return `${hours}:${pad2(mins)}:${pad2(secs)} left`;
  }
  return `${mins}m ${secs}s left`;
}

export function zoneEventRemainingMs(event: ZoneEvent, now = Date.now()): number {
  if (typeof event.remainingSeconds === 'number' && event.fetchedAt != null) {
    const elapsedSec = Math.floor((now - event.fetchedAt) / 1000);
    return Math.max(0, (event.remainingSeconds - elapsedSec) * 1000);
  }
  return Math.max(0, zoneEventEndsAt(event) - now);
}

/** 1초마다 갱신되는 이벤트 남은 시간(ms) */
export function useZoneEventRemaining(event: ZoneEvent | undefined): number {
  const [remainingMs, setRemainingMs] = useState(() =>
    event ? zoneEventRemainingMs(event) : 0,
  );

  useEffect(() => {
    if (!event) {
      setRemainingMs(0);
      return;
    }

    const tick = () => setRemainingMs(zoneEventRemainingMs(event));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [event]);

  return remainingMs;
}
