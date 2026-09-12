import type { AppLanguage } from '../../types/user';
import type { EventParticipationStatus } from '../../types/eventParticipation';

const LOCALE_BY_LANGUAGE: Record<AppLanguage, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  ja: 'ja-JP',
  zh: 'zh-CN',
};

export function formatParticipationTimestamp(
  iso: string | undefined,
  language: AppLanguage,
): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString(LOCALE_BY_LANGUAGE[language], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export type ParticipationStatusStyle = {
  backgroundColor: string;
  textColor: string;
};

export const PARTICIPATION_STATUS_STYLES: Record<
  EventParticipationStatus,
  ParticipationStatusStyle
> = {
  in_progress: { backgroundColor: '#FEF3C7', textColor: '#B45309' },
  pending_review: { backgroundColor: '#DBEAFE', textColor: '#1D4ED8' },
  approved: { backgroundColor: '#DCFCE7', textColor: '#15803D' },
  rejected: { backgroundColor: '#FEE2E2', textColor: '#B91C1C' },
};

export function participationStatusLabel(
  status: EventParticipationStatus,
  copy: {
    statusInProgress: string;
    statusPendingReview: string;
    statusCompleted: string;
    statusRejected: string;
  },
): string {
  switch (status) {
    case 'in_progress':
      return copy.statusInProgress;
    case 'pending_review':
      return copy.statusPendingReview;
    case 'approved':
      return copy.statusCompleted;
    case 'rejected':
      return copy.statusRejected;
    default:
      return copy.statusInProgress;
  }
}
