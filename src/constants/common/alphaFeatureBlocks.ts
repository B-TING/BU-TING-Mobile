/**
 * 알파 Play Store 제출용 — 미완 기능 차단 플래그.
 * true면 FeatureUnavailableAlert 로 진입을 막는다.
 */
export const ALPHA_FEATURE_BLOCKS = {
  /** 여행 피드 */
  feed: false,
  /** 여행기 작성·조회·게시 */
  travelogue: false,
  /** 다른 사용자 여행기 → 내 일정으로 가져오기 */
  importPlan: false,
  /** 팀원(일행) 초대 — QR 표시 + 인앱 스캔 합류 */
  invite: false,
  /** 구역 이벤트 (구역 채팅방은 유지) — Phase 1 API 연동 전 차단 */
  zoneEvent: true,
  /** 일정 AI 생성 (`auto`) — API 연동 작업 중 */
  planAi: false,
  /** 일정 후보 선택. API가 플랜 1개만 반환해 막음 */
  planAiCandidates: true,
  /** AI 헬프데스크 */
  helpdesk: true,
  /** 리부트(일정 장소 삭제·교체) */
  reboot: false,
} as const;

export type AlphaBlockedFeature = keyof typeof ALPHA_FEATURE_BLOCKS;

export const ALPHA_FEATURE_LABELS: Record<AlphaBlockedFeature, string> = {
  feed: '여행 피드',
  travelogue: '여행기',
  importPlan: '여행 계획 가져오기',
  invite: '일행 초대',
  zoneEvent: '구역 이벤트',
  planAi: 'AI 일정 생성',
  planAiCandidates: '일정 후보 선택',
  helpdesk: 'AI 헬프데스크',
  reboot: '리부트',
};

export function isAlphaFeatureBlocked(feature: AlphaBlockedFeature): boolean {
  return ALPHA_FEATURE_BLOCKS[feature];
}
