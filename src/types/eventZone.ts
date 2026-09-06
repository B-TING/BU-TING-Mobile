/** 백엔드 ChatZone enum 과 동일한 구역 ID */
export type EventZoneId =
  | 'HAEUNDAE_GIJANG'
  | 'SUYEONG_NAMGU'
  | 'CENTRAL_NORTH'
  | 'OLD_DOWNTOWN'
  | 'YEONGDO'
  | 'WESTERN_BUSAN';

/** REST·WebSocket 채팅 API query `zone` 파라미터 */
export type ChatZone = EventZoneId;

export type EventZoneCoordinate = {
  lat: number;
  lng: number;
};

export type EventZoneMapPoint = {
  /** assets/map/busan.svg viewBox 기준 x */
  x: number;
  /** assets/map/busan.svg viewBox 기준 y */
  y: number;
};

export type EventZoneLandmark = {
  id: string;
  nameKo: string;
  nameEn: string;
  nameJa: string;
  nameZh: string;
  /** GPS·구역 판별용 실제 좌표 */
  location: EventZoneCoordinate;
  /** busan.svg 위 마커 위치 (800×754) */
  mapPoint: EventZoneMapPoint;
  emoji: string;
};

export type EventZoneDefinition = {
  id: EventZoneId;
  nameKo: string;
  nameEn: string;
  nameJa: string;
  nameZh: string;
  summaryKo: string;
  summaryEn: string;
  summaryJa: string;
  summaryZh: string;
  baseColor: string;
  highlightColor: string;
  landmarks: EventZoneLandmark[];
  /** 위치 기반 구역 판별용 경계 상자 */
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
};

/** 구역별 앱 내 채팅방 (직접 구현) */
export type EventZoneChatRoom = {
  id: string;
  zoneId: EventZoneId;
  topicKo: string;
  topicEn: string;
  memberCount: number;
};

export type EventZoneChatMessage = {
  id: string;
  roomId: string;
  authorId: string;
  authorNickname: string;
  text: string;
  sentAt: string;
  isMine?: boolean;
};

/** 번개 이벤트 종류 (기획 확정 전 목업) */
export type ZoneEventType =
  | 'walk_conquest' // 부산 도보 정복전
  | 'receipt_auth' // 소울푸드 영수증 인증
  | 'qr_cross' // 핫플 QR 크로스
  | 'zone_battle' // 타 구역 유저와 대결
  | 'PLACE_AUTH' // 장소 인증 (카메라 + GPS)
  | 'OBJECT_AUTH' // 사물 인증 (카메라 + 검수)
  | 'MUKJJIPPA'; // 묵찌빠 (Phase 3+)

/** 이벤트 게임 타입 */
export type EventGameType = 'PLACE_AUTH' | 'OBJECT_AUTH' | 'MUKJJIPPA';

/** 슬롯 내 인증 타겟 (서버 contentId 스냅샷 대응 — 목업은 landmark 기반) */
export type ZoneEventAuthTarget = {
  targetId: string;
  kind: 'PLACE' | 'OBJECT';
  /** 백엔드 이벤트 콘텐츠 — 한국어 */
  placeNameKo: string;
  landmarkId?: string;
  latitude: number;
  longitude: number;
  radiusM: number;
  objectLabelKo?: string;
  emoji?: string;
  guideText?: string;
  exampleImageUrl?: string;
};

/** 구역에 발생하는 이벤트 VO */
export type ZoneEvent = {
  id: string;
  type: ZoneEventType;
  /** 서버 typeCode. 없으면 type과 동일 */
  typeCode?: string;
  zoneId: EventZoneId;
  /** 백엔드 이벤트 제목 — 한국어 */
  titleKo: string;
  /** 백엔드 이벤트 설명 — 한국어 */
  descriptionKo: string;
  /** ISO 8601 시작 시각 */
  startsAt: string;
  /** ISO 8601 종료 시각 (API) */
  endsAt?: string;
  /** 이벤트 지속 시간(분) */
  durationMinutes: number;
  /** 서버 remainingSeconds (수신 시각 기준) */
  remainingSeconds?: number;
  /** remainingSeconds를 받은 시각 (epoch ms) */
  fetchedAt?: number;
  status?: string;
  roundId?: string;
  myParticipationStatus?: string;
  myOpenParticipationId?: string;
  myRemainingAttempts?: number | null;
  /** 회차 번호 (예: 1) */
  roundNo?: number;
  /** 슬롯 코드 (예: 1-A) */
  slotCode?: string;
  /** 슬롯 내 인증 장소 n개 — 유저는 1곳만 선택 */
  authTargets?: ZoneEventAuthTarget[];
  /** @deprecated authTargets 사용. 단일 타겟 폴백 */
  targetLandmarkId?: string;
  /** @deprecated authTargets[].objectLabelKo */
  targetObjectLabelKo?: string;
  targetObjectLabelEn?: string;
  targetObjectLabelJa?: string;
  targetObjectLabelZh?: string;
  /** @deprecated authTargets 좌표 */
  authLatitude?: number;
  authLongitude?: number;
  authRadiusM?: number;
};