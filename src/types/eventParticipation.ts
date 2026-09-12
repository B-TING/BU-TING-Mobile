import type { EventZoneId, ZoneEventType } from './eventZone';

/** Phase 1 참여 이력 상태 — 최종 성공/실패는 관리자 승인 */
export type EventParticipationStatus =
  | 'in_progress'
  | 'pending_review'
  | 'approved'
  | 'rejected';

export type EventParticipationRecord = {
  id: string;
  eventId: string;
  zoneId: EventZoneId;
  eventType: Extract<ZoneEventType, 'PLACE_AUTH' | 'OBJECT_AUTH'>;
  eventTitleKo: string;
  /** 슬롯 내 선택한 인증 타겟 */
  targetId?: string;
  status: EventParticipationStatus;
  /** 로컬 촬영 URI (업로드·fileKey 없음) */
  localImageUri?: string;
  createdAt: string;
  submittedAt?: string;
  rejectionReason?: string;
  canResubmit?: boolean;
  submissions?: EventParticipationSubmission[];
};

export type EventParticipationSubmission = {
  submissionId: string;
  attemptNo?: number;
  targetId?: string;
  placeName?: string;
  mediaUrl?: string;
  reviewStatus?: string;
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
};
