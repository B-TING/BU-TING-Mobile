import type { AppLanguage } from '../../types/user';
import type {
  EventZoneChatMessage,
  EventZoneChatRoom,
  EventZoneDefinition,
  EventZoneId,
  EventZoneLandmark,
} from '../../types/eventZone';

export const BUSAN_MAP_BOUNDS = {
  minLat: 35.04,
  maxLat: 35.3,
  minLng: 128.92,
  maxLng: 129.24,
} as const;

/**
 * 카카오맵 행사 구역 폴리곤 미세 위치 보정.
 * 동남쪽(오른쪽·아래)으로 옮기려면 lat을 줄이고 lng를 늘리세요.
 * 대략 0.0001° ≈ 11m (위도), 부산 기준 경도 0.0001° ≈ 9m
 */
export const KAKAO_ZONE_POLYGON_OFFSET = {
  lat: -0.003,
  lng: 0.002,
} as const;

export { BUSAN_SVG_VIEWBOX as BUSAN_MAP_VIEWBOX } from './busanMapPaths';

export const EVENT_ZONES: EventZoneDefinition[] = [
  {
    id: 'HAEUNDAE_GIJANG',
    nameKo: '해운대·기장',
    nameEn: 'Haeundae · Gijang',
    nameJa: '海雲台·機張',
    nameZh: '海云台·机张',
    summaryKo: '부산의 대표 해변과 럭셔리 쇼핑을 한 번에',
    summaryEn: 'Busan\'s iconic beach meets luxury shopping',
    summaryJa: '釜山を代表するビーチとショッピングが一か所に',
    summaryZh: '釜山标志性海滩与奢华购物的完美结合',
    baseColor: '#38BDF8',
    highlightColor: '#0EA5E9',
    bounds: { minLat: 35.19, maxLat: 35.32, minLng: 129.12, maxLng: 129.26 },
    landmarks: [
      {
        id: 'haeundae-beach',
        nameKo: '해운대 해수욕장',
        nameEn: 'Haeundae Beach',
        nameJa: '海雲台海水浴場',
        nameZh: '海云台海水浴场',
        emoji: '🏖️',
        location: { lat: 35.1587, lng: 129.1604 },
        mapPoint: { x: 560, y: 400 },
      },
      {
        id: 'haedong-yonggungsa',
        nameKo: '해동용궁사',
        nameEn: 'Haedong Yonggungsa',
        nameJa: '海東龍宮寺',
        nameZh: '海东龙宫寺',
        emoji: '🛕',
        location: { lat: 35.1885, lng: 129.223 },
        mapPoint: { x: 638, y: 350 },
      },
      {
        id: 'centum-city',
        nameKo: '센텀시티',
        nameEn: 'Centum City',
        nameJa: 'センタムシティ',
        nameZh: 'Centum City',
        emoji: '🏬',
        location: { lat: 35.1694, lng: 129.1314 },
        mapPoint: { x: 518, y: 370 },
      },
    ],
  },
  {
    id: 'SUYEONG_NAMGU',
    nameKo: '수영·남구',
    nameEn: 'Suyeong · Nam',
    nameJa: '水营·南区',
    nameZh: '水营·南区',
    summaryKo: '광안대교 야경이 빛나는 낭만 해안 산책로',
    summaryEn: 'Romantic waterfront walk under Gwangan Bridge lights',
    summaryJa: '広安大橋の夜景が輝くロマンティックな海沿い遊歩道',
    summaryZh: '广安大桥夜景璀璨的浪漫海滨步道',
    baseColor: '#A78BFA',
    highlightColor: '#8B5CF6',
    bounds: { minLat: 35.11, maxLat: 35.19, minLng: 129.1, maxLng: 129.18 },
    landmarks: [
      {
        id: 'gwangalli-beach',
        nameKo: '광안리 해수욕장',
        nameEn: 'Gwangalli Beach',
        nameJa: '広安里海水浴場',
        nameZh: '广安里海水浴场',
        emoji: '🌉',
        location: { lat: 35.1532, lng: 129.1186 },
        mapPoint: { x: 500, y: 420 },
      },
      {
        id: 'millak-park',
        nameKo: '민락수변공원',
        nameEn: 'Millak Waterside Park',
        nameJa: '民楽水辺公園',
        nameZh: '民乐水边公园',
        emoji: '🌊',
        location: { lat: 35.155, lng: 129.127 },
        mapPoint: { x: 530, y: 420 },
      },
      {
        id: 'oryukdo-skywalk',
        nameKo: '오륙도 스카이워크',
        nameEn: 'Oryukdo Skywalk',
        nameJa: '五六島スカイウォーク',
        nameZh: '五六岛天空步道',
        emoji: '🚶',
        location: { lat: 35.0945, lng: 129.124 },
        mapPoint: { x: 508, y: 532 },
      },
    ],
  },
  {
    id: 'CENTRAL_NORTH',
    nameKo: '금정·동래·연제·부산진',
    nameEn: 'Geumjeong · Dongnae · Yeonje · Busanjin',
    nameJa: '金井·東莱·莲堤·釜山镇',
    nameZh: '金井·东莱·莲堤·釜山镇',
    summaryKo: '카페 골목부터 고찰까지, 부산의 도심 속 여유',
    summaryEn: 'From trendy cafes to ancient temples in the city',
    summaryJa: 'おしゃれなカフェから古刹まで、都会の中の余裕',
    summaryZh: '从咖啡小巷到千年古刹，闹市中的悠然时光',
    baseColor: '#FBBF24',
    highlightColor: '#F59E0B',
    bounds: { minLat: 35.14, maxLat: 35.22, minLng: 129.03, maxLng: 129.1 },
    landmarks: [
      {
        id: 'SeomyeonJeonpo',
        nameKo: '서면 젊음의거리, 전포 카페거리',
        nameEn: 'Seomyeon Young Street, Jeonpo Cafe Street',
        nameJa: '西面 若者の街, 田浦 カフェ街',
        nameZh: '西面 年轻人街区, 田浦 咖啡街区',
        emoji: '☕',
        location: { lat: 35.1578, lng: 129.0595 },
        mapPoint: { x: 398, y: 408 },
      },
      {
        id: 'sajik-stadium',
        nameKo: '사직구장',
        nameEn: 'Sajik Baseball Stadium',
        nameJa: '社稷球場',
        nameZh: '社稷球场',
        emoji: '⚾',
        location: { lat: 35.194, lng: 129.061 },
        mapPoint: { x: 442, y: 328 },
      },
      {
        id: 'beomeosa',
        nameKo: '범어사',
        nameEn: 'Beomeosa Temple',
        nameJa: '梵鱼寺',
        nameZh: '梵鱼寺',
        emoji: '⛩️',
        location: { lat: 35.259, lng: 129.082 },
        mapPoint: { x: 462, y: 268 },
      },
    ],
  },
  {
    id: 'OLD_DOWNTOWN',
    nameKo: '서·중·동구',
    nameEn: 'Seo · Jung · Dong',
    nameJa: '西·中·東区',
    nameZh: '西·中·东区',
    summaryKo: '신선한 해산물과 옛 정취가 살아 숨 쉬는 원도심',
    summaryEn: 'Fresh seafood and old-town charm in the historic center',
    summaryJa: '新鮮な海の幸と昔の情緒が息づく旧市街',
    summaryZh: '新鲜海鲜与老城风情交织的历史中心',
    baseColor: '#FB7185',
    highlightColor: '#F43F5E',
    bounds: { minLat: 35.09, maxLat: 35.13, minLng: 129.01, maxLng: 129.06 },
    landmarks: [
      {
        id: 'jagalchi-market',
        nameKo: '자갈치시장',
        nameEn: 'Jagalchi Market',
        nameJa: '札幌市場',
        nameZh: '札嘎其市场',
        emoji: '🐟',
        location: { lat: 35.0966, lng: 129.0308 },
        mapPoint: { x: 402, y: 502 },
      },
      {
        id: 'gukje-market',
        nameKo: '국제시장',
        nameEn: 'Gukje Market',
        nameJa: '国際市場',
        nameZh: '国际市场',
        emoji: '🏮',
        location: { lat: 35.102, lng: 129.026 },
        mapPoint: { x: 378, y: 486 },
      },
      {
        id: 'yongdusan-park',
        nameKo: '용두산공원',
        nameEn: 'Yongdusan Park',
        nameJa: '龙头山公園',
        nameZh: '龙头山公园',
        emoji: '🗼',
        location: { lat: 35.099, lng: 129.032 },
        mapPoint: { x: 408, y: 478 },
      },
    ],
  },
  {
    id: 'YEONGDO',
    nameKo: '영도',
    nameEn: 'Yeongdo',
    nameJa: '影岛',
    nameZh: '影岛',
    summaryKo: '절벽 위 마을과 등대가 만드는 영화 같은 풍경',
    summaryEn: 'Cinematic cliffside villages and lighthouse scenery',
    summaryJa: '崖の上の村と灯台が織りなす映画のような絶景',
    summaryZh: '悬崖上的村庄与灯塔构成的如画风景',
    baseColor: '#34D399',
    highlightColor: '#10B981',
    bounds: { minLat: 35.04, maxLat: 35.09, minLng: 129.03, maxLng: 129.1 },
    landmarks: [
      {
        id: 'huinnyeoul',
        nameKo: '흰여울문화마을',
        nameEn: 'Huinnyeoul Culture Village',
        nameJa: '白い波文化村',
        nameZh: '白浪文化村',
        emoji: '🏘️',
        location: { lat: 35.077, lng: 129.045 },
        mapPoint: { x: 430, y: 518 },
      },
      {
        id: 'taejongdae',
        nameKo: '태종대',
        nameEn: 'Taejongdae',
        nameJa: '太宗台',
        nameZh: '太宗台',
        emoji: '🌅',
        location: { lat: 35.051, lng: 129.086 },
        mapPoint: { x: 448, y: 585 },
      },
    ],
  },
  {
    id: 'WESTERN_BUSAN',
    nameKo: '강서·사상·사하·북구',
    nameEn: 'Gangseo · Sasang · Saha · Buk',
    nameJa: '江西·沙上·沙下·北区',
    nameZh: '江西·沙上·沙下·北区',
    summaryKo: '알록달록 감천마을과 탁 트인 다대포 일몰',
    summaryEn: 'Colorful Gamcheon village and sweeping Dadaepo sunsets',
    summaryJa: 'カラフルな甘川文化村と広がる多大浦の夕日',
    summaryZh: '色彩斑斓的甘川文化村与开阔的多大浦日落',
    baseColor: '#818CF8',
    highlightColor: '#6366F1',
    bounds: { minLat: 35.04, maxLat: 35.2, minLng: 128.92, maxLng: 129.02 },
    landmarks: [
      {
        id: 'gamcheon-village',
        nameKo: '감천문화마을',
        nameEn: 'Gamcheon Culture Village',
        nameJa: '甘川文化村',
        nameZh: '甘川文化村',
        emoji: '🎨',
        location: { lat: 35.097, lng: 128.968 },
        mapPoint: { x: 342, y: 502 },
      },
      {
        id: 'dadaepo-beach',
        nameKo: '다대포 해수욕장',
        nameEn: 'Dadaepo Beach',
        nameJa: '多大浦海水浴場',
        nameZh: '多大浦海水浴场',
        emoji: '🌤️',
        location: { lat: 35.051, lng: 128.966 },
        mapPoint: { x: 318, y: 548 },
      },
      {
        id: 'gimhae-airport',
        nameKo: '김해국제공항',
        nameEn: 'Gimhae International Airport',
        nameJa: '金海国際空港',
        nameZh: '金海国际机场',
        emoji: '✈️',
        location: { lat: 35.179, lng: 128.938 },
        mapPoint: { x: 287, y: 490 },
      },
    ],
  },
];

export const EVENT_ZONE_BY_ID: Record<EventZoneId, EventZoneDefinition> = EVENT_ZONES.reduce(
  (acc, zone) => {
    acc[zone.id] = zone;
    return acc;
  },
  {} as Record<EventZoneId, EventZoneDefinition>,
);

/** @deprecated Use useCopy('eventZoneMapLayer') from src/i18n */
export const EVENT_ZONE_MAP_LAYER_COPY: Record<
  AppLanguage,
  { showZones: string; hideZones: string }
> = {
  ko: { showZones: '구역 표시', hideZones: '구역 숨기기' },
  en: { showZones: 'Show zones', hideZones: 'Hide zones' },
  ja: { showZones: '区域表示', hideZones: '区域非表示' },
  zh: { showZones: '显示区域', hideZones: '隐藏区域' },
};

/** GPS 미연동 시 부산역 인근 기본 좌표 */
export const DEFAULT_USER_LOCATION_SEOUL = { lat: 37.5665, lng: 126.9780 };
export const DEFAULT_USER_LOCATION_BUSAN = { lat: 35.1152, lng: 129.0422 };

export const MOCK_ZONE_CHAT_ROOMS: EventZoneChatRoom[] = [
  {
    id: 'chat-haeundae-meetup',
    zoneId: 'HAEUNDAE_GIJANG',
    topicKo: '오늘 해운대에서 만날 분 구해요',
    topicEn: 'Looking for company at Haeundae today',
    memberCount: 24,
  },
  {
    id: 'chat-gwangan-info',
    zoneId: 'SUYEONG_NAMGU',
    topicKo: '광안대교 야경·맛집 정보 공유',
    topicEn: 'Share Gwangan night views and food spots',
    memberCount: 18,
  },
  {
    id: 'chat-seomyeon-game',
    zoneId: 'CENTRAL_NORTH',
    topicKo: '구역 미니게임 매칭 대기',
    topicEn: 'Zone mini-game matchmaking lobby',
    memberCount: 31,
  },
  {
    id: 'chat-jagalchi-market',
    zoneId: 'OLD_DOWNTOWN',
    topicKo: '자갈치·국제시장 같이 돌아요',
    topicEn: 'Explore Jagalchi and Gukje Market together',
    memberCount: 12,
  },
  {
    id: 'chat-yeongdo-walk',
    zoneId: 'YEONGDO',
    topicKo: '흰여울·태종대 산책 모임',
    topicEn: 'Huinnyeoul and Taejongdae walk group',
    memberCount: 9,
  },
  {
    id: 'chat-gamcheon-art',
    zoneId: 'WESTERN_BUSAN',
    topicKo: '감천마을 포토 미션 진행 중',
    topicEn: 'Gamcheon photo mission in progress',
    memberCount: 15,
  },
];

export const MOCK_ZONE_CHAT_MESSAGES: EventZoneChatMessage[] = [
  {
    id: 'msg-1',
    roomId: 'chat-haeundae-meetup',
    authorId: 'user-a',
    authorNickname: '바다좋아',
    text: '오늘 저녁 6시쯤 해수욕장 입구에서 만날 분 있나요?',
    sentAt: '2026-06-28T09:10:00.000Z',
  },
  {
    id: 'msg-2',
    roomId: 'chat-haeundae-meetup',
    authorId: 'user-b',
    authorNickname: '부산여행러',
    text: '저 가능해요! 센텀에서 출발합니다.',
    sentAt: '2026-06-28T09:12:00.000Z',
  },
  {
    id: 'msg-3',
    roomId: 'chat-gwangan-info',
    authorId: 'user-c',
    authorNickname: '야경덕후',
    text: '광안리 민락쪽 카페 중 뷰 좋은 곳 추천해 주세요.',
    sentAt: '2026-06-28T08:40:00.000Z',
  },
  {
    id: 'msg-4',
    roomId: 'chat-jagalchi-market',
    authorId: 'user-d',
    authorNickname: '회먹고싶다',
    text: '점심에 자갈치 회 먹을 분~',
    sentAt: '2026-06-28T07:30:00.000Z',
  },
];

/** @deprecated Use useCopy('eventZone') from src/i18n */
export const EVENT_ZONE_COPY: Record<
  AppLanguage,
  {
    screenTitle: string;
    currentZoneLabel: string;
    mapZoneBadgeLabel: string;
    mapHint: string;
    landmarksTitle: string;
    chatRoomsTitle: string;
    chatFeatureHint: string;
    chatMemberCount: (n: number) => string;
    selectZoneHint: string;
    planningBadge: string;
    locationFallbackHint: string;
    noZoneLabel: string;
    outsideBusanHint: string;
    enterChat: string;
    enterChatShort: string;
    enterChatRoom: string;
    joinMission: string;
    emptyChatRooms: string;
    selectZoneTitle: string;
    closePanel: string;
    eventEndsIn: (remaining: string) => string;
    eventEnded: string;
    eventActiveBadge: string;
    surpriseMissionBadge: string;
    devEventTrigger: string;
    devEventTriggerA11y: string;
    participationHistory: string;
    eventAlbum: string;
    zoneTitles: string;
    roundStatusTitle: string;
    roundStatusOpen: string;
    roundStatusUpcoming: string;
    roundSlotOpen: string;
    roundSlotRest: string;
    roundSlotUpcoming: string;
    roundAlbum: string;
    roundEndsIn: (remaining: string) => string;
    roundStartsIn: (remaining: string) => string;
    eventToast: (zoneName: string, eventTitle: string) => string;
  }
> = {
  ko: {
    screenTitle: '이벤트 존',
    currentZoneLabel: '현재 부산에 있습니다!',
    mapZoneBadgeLabel: '현재 구역',
    mapHint: '구역을 눌러 하이라이트하고 랜드마크를 확인하세요',
    landmarksTitle: '주요 관광지',
    chatRoomsTitle: '구역 채팅',
    chatFeatureHint: '구역별 실시간 채팅 (로컬 백엔드 테스트)',
    chatMemberCount: n => `채팅 ${n}명`,
    selectZoneHint: '지도에서 구역을 선택해 주세요',
    planningBadge: '기획 미리보기',
    locationFallbackHint: '위치를 확인할 수 없어 기본 구역을 표시해요',
    noZoneLabel: '소속 구역 없음',
    outsideBusanHint: '부산 외 지역이라 채팅 구역에 속하지 않아요',
    enterChat: '입장하기',
    enterChatShort: '입장',
    enterChatRoom: '채팅 입장',
    joinMission: '미션 참여',
    emptyChatRooms: '이 구역에 열린 채팅방이 없어요',
    selectZoneTitle: '구역 선택하기',
    closePanel: '닫기',
    eventEndsIn: remaining => `종료까지 ${remaining}`,
    eventEnded: '이벤트가 종료되었습니다',
    eventActiveBadge: '🔥 이벤트',
    surpriseMissionBadge: '번개 미션',
    devEventTrigger: '🎲 이벤트 발생',
    devEventTriggerA11y: '개발용 번개 이벤트 발생',
    participationHistory: '참여 이력',
    eventAlbum: '앨범',
    zoneTitles: '칭호',
    roundStatusTitle: '회차 현황',
    roundStatusOpen: '진행 중',
    roundStatusUpcoming: '다음 회차',
    roundSlotOpen: 'OPEN',
    roundSlotRest: 'REST',
    roundSlotUpcoming: '예정',
    roundAlbum: '회차 앨범',
    roundEndsIn: remaining => `종료까지 ${remaining}`,
    roundStartsIn: remaining => `시작까지 ${remaining}`,
    eventToast: (zoneName, eventTitle) => `${zoneName}에 ${eventTitle} 이벤트 발생!`,
  },
  en: {
    screenTitle: 'Event Zone',
    currentZoneLabel: 'You are currently in Busan!',
    mapZoneBadgeLabel: 'Current zone',
    mapHint: 'Tap a zone to highlight it and view landmarks',
    landmarksTitle: 'Landmarks',
    chatRoomsTitle: 'Zone chat',
    chatFeatureHint: 'Zone live chat (local backend test)',
    chatMemberCount: n => `${n} in chat`,
    selectZoneHint: 'Select a zone on the map',
    planningBadge: 'Planning preview',
    locationFallbackHint: 'Showing a default zone — location unavailable',
    noZoneLabel: 'Not in a zone',
    outsideBusanHint: 'Outside Busan — you are not in a chat zone',
    enterChat: 'Join',
    enterChatShort: 'Join',
    enterChatRoom: 'Enter chat',
    joinMission: 'Join mission',
    emptyChatRooms: 'No open chat rooms in this zone',
    selectZoneTitle: 'Select zone',
    closePanel: 'Close',
    eventEndsIn: remaining => `${remaining} left`,
    eventEnded: 'This event has ended',
    eventActiveBadge: '🔥 Event',
    surpriseMissionBadge: 'Flash mission',
    devEventTrigger: '🎲 Trigger event',
    devEventTriggerA11y: 'Dev random event trigger',
    participationHistory: 'Participation history',
    eventAlbum: 'Album',
    zoneTitles: 'Titles',
    roundStatusTitle: 'Round status',
    roundStatusOpen: 'Open now',
    roundStatusUpcoming: 'Next round',
    roundSlotOpen: 'OPEN',
    roundSlotRest: 'REST',
    roundSlotUpcoming: 'Soon',
    roundAlbum: 'Round album',
    roundEndsIn: remaining => `${remaining} left`,
    roundStartsIn: remaining => `Starts in ${remaining}`,
    eventToast: (zoneName, eventTitle) => `${eventTitle} started in ${zoneName}!`,
  },
  ja: {
    screenTitle: 'イベントゾーン',
    currentZoneLabel: '現在、バウシンにいます！',
    mapZoneBadgeLabel: '現在のエリア',
    mapHint: 'エリアをタップしてランドマークを表示',
    landmarksTitle: '主要観光地',
    chatRoomsTitle: 'エリアチャット',
    chatFeatureHint: 'アプリ内チャット（リアルタイム連携準備中）',
    chatMemberCount: n => `チャット ${n}人`,
    selectZoneHint: '地図でエリアを選択してください',
    planningBadge: '企画プレビュー',
    locationFallbackHint: '現在地基準（GPS連携予定）',
    noZoneLabel: '所属エリアなし',
    outsideBusanHint: '釜山外のためチャットゾーンに所属していません',
    enterChat: '入室',
    enterChatShort: '入室',
    enterChatRoom: 'チャット入室',
    joinMission: 'ミッション参加',
    emptyChatRooms: 'このエリアに開いているチャットはありません',
    selectZoneTitle: 'エリアを選択',
    closePanel: '閉じる',
    eventEndsIn: remaining => `終了まで ${remaining}`,
    eventEnded: 'イベントは終了しました',
    eventActiveBadge: '🔥 イベント',
    surpriseMissionBadge: 'サプライズミッション',
    devEventTrigger: '🎲 イベント発生',
    devEventTriggerA11y: '開発用ランダムイベント',
    participationHistory: '参加履歴',
    eventAlbum: 'アルバム',
    zoneTitles: '称号',
    roundStatusTitle: '回次状況',
    roundStatusOpen: '開催中',
    roundStatusUpcoming: '次の回次',
    roundSlotOpen: 'OPEN',
    roundSlotRest: 'REST',
    roundSlotUpcoming: '予定',
    roundAlbum: '回次アルバム',
    roundEndsIn: remaining => `終了まで ${remaining}`,
    roundStartsIn: remaining => `開始まで ${remaining}`,
    eventToast: (zoneName, eventTitle) => `${zoneName}で${eventTitle}が始まりました!`,
  },
  zh: {
    screenTitle: '活动区域',
    currentZoneLabel: '您现在在釜山！',
    mapZoneBadgeLabel: '当前区域',
    mapHint: '点击区域高亮并查看地标',
    landmarksTitle: '主要景点',
    chatRoomsTitle: '区域聊天',
    chatFeatureHint: '应用内聊天（实时同步筹备中）',
    chatMemberCount: n => `聊天 ${n} 人`,
    selectZoneHint: '请在地图上选择区域',
    planningBadge: '策划预览',
    locationFallbackHint: '基于当前位置（GPS 接入待定）',
    noZoneLabel: '未加入区域',
    outsideBusanHint: '不在釜山，不属于任何聊天区域',
    enterChat: '进入',
    enterChatShort: '进入',
    enterChatRoom: '进入聊天',
    joinMission: '参与任务',
    emptyChatRooms: '该区域暂无开放的聊天室',
    selectZoneTitle: '选择区域',
    closePanel: '关闭',
    eventEndsIn: remaining => `剩余 ${remaining}`,
    eventEnded: '活动已结束',
    eventActiveBadge: '🔥 活动',
    surpriseMissionBadge: '闪电任务',
    devEventTrigger: '🎲 触发活动',
    devEventTriggerA11y: '开发用随机活动',
    participationHistory: '参与记录',
    eventAlbum: '相册',
    zoneTitles: '称号',
    roundStatusTitle: '轮次状态',
    roundStatusOpen: '进行中',
    roundStatusUpcoming: '下一轮',
    roundSlotOpen: 'OPEN',
    roundSlotRest: 'REST',
    roundSlotUpcoming: '即将开始',
    roundAlbum: '本轮相册',
    roundEndsIn: remaining => `剩余 ${remaining}`,
    roundStartsIn: remaining => `${remaining}后开始`,
    eventToast: (zoneName, eventTitle) => `${zoneName}开始了${eventTitle}!`,
  },
};

/** @deprecated Use useCopy('zoneChat') from src/i18n */
export const ZONE_CHAT_COPY: Record<
  AppLanguage,
  {
    inputPlaceholder: string;
    send: string;
    emptyMessages: string;
    memberCount: (n: number) => string;
    localOnlyHint: string;
  }
> = {
  ko: {
    inputPlaceholder: '메시지를 입력하세요',
    send: '전송',
    emptyMessages: '아직 메시지가 없어요. 첫 인사를 남겨보세요!',
    memberCount: n => `${n}명 참여 중`,
    localOnlyHint: '로그인 후 로컬 백엔드 채팅 서버에 연결됩니다.',
  },
  en: {
    inputPlaceholder: 'Type a message',
    send: 'Send',
    emptyMessages: 'No messages yet. Say hello!',
    memberCount: n => `${n} joined`,
    localOnlyHint: 'Sign in to connect to the local backend chat server.',
  },
  ja: {
    inputPlaceholder: 'メッセージを入力',
    send: '送信',
    emptyMessages: 'まだメッセージがありません',
    memberCount: n => `${n}人参加中`,
    localOnlyHint: '現在は端末内モックチャットです',
  },
  zh: {
    inputPlaceholder: '输入消息',
    send: '发送',
    emptyMessages: '还没有消息，来打个招呼吧',
    memberCount: n => `${n} 人参与中`,
    localOnlyHint: '当前为本地模拟聊天，实时同步筹备中',
  },
};

export function eventZoneName(
  zone: EventZoneDefinition,
  language: AppLanguage,
): string {
  if (language === 'ko') return zone.nameKo;
  if (language === 'ja') return zone.nameJa;
  if (language === 'zh') return zone.nameZh;
  return zone.nameEn;
}

export function eventZoneSummary(
  zone: EventZoneDefinition,
  language: AppLanguage,
): string {
  if (language === 'ko') return zone.summaryKo;
  if (language === 'ja') return zone.summaryJa;
  if (language === 'zh') return zone.summaryZh;
  return zone.summaryEn;
}

export function landmarkName(
  landmark: EventZoneLandmark,
  language: AppLanguage,
): string {
  if (language === 'ko') return landmark.nameKo;
  if (language === 'ja') return landmark.nameJa;
  if (language === 'zh') return landmark.nameZh;
  return landmark.nameEn;
}

export function chatRoomTitle(
  room: EventZoneChatRoom,
  language: AppLanguage,
): string {
  return eventZoneName(EVENT_ZONE_BY_ID[room.zoneId], language);
}

export function chatRoomTopic(
  room: EventZoneChatRoom,
  language: AppLanguage,
): string {
  return language === 'ko' ? room.topicKo : room.topicEn;
}

export function getChatRoomById(roomId: string): EventZoneChatRoom | undefined {
  return MOCK_ZONE_CHAT_ROOMS.find(room => room.id === roomId);
}

export function chatMessagesForRoom(roomId: string): EventZoneChatMessage[] {
  return MOCK_ZONE_CHAT_MESSAGES.filter(message => message.roomId === roomId).sort(
    (a, b) => a.sentAt.localeCompare(b.sentAt),
  );
}

export function chatRoomsForZone(zoneId: EventZoneId): EventZoneChatRoom[] {
  return MOCK_ZONE_CHAT_ROOMS.filter(room => room.zoneId === zoneId);
}

export function allZoneChatRooms(): EventZoneChatRoom[] {
  return EVENT_ZONES.map(
    zone => MOCK_ZONE_CHAT_ROOMS.find(room => room.zoneId === zone.id)!,
  ).filter(Boolean);
}

export function getChatRoomByZoneId(
  zoneId: EventZoneId,
): EventZoneChatRoom | undefined {
  return MOCK_ZONE_CHAT_ROOMS.find(room => room.zoneId === zoneId);
}
