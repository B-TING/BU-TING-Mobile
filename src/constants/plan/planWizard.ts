import type { AppLanguage } from '../../types/user';
import type { LocalizedLabel, PlanWizardStepId } from '../../types/planWizard';

export const PLAN_WIZARD_STEP_COUNT = 10;
export const TRAVEL_TITLE_MAX_LENGTH = 15;

export type PlanWizardStepConfig = {
  id: PlanWizardStepId;
  title: LocalizedLabel;
  subtitle: LocalizedLabel;
};

export const PLAN_WIZARD_STEPS: PlanWizardStepConfig[] = [
  {
    id: 'title',
    title: {
      ko: '여행 제목은?',
      en: 'Name your trip',
      ja: '旅行のタイトルは？',
      zh: '旅行标题是？',
    },
    subtitle: {
      ko: '일정 목록에 표시될 이름',
      en: 'Shown on your itinerary list',
      ja: '行程一覧に表示される名前',
      zh: '将显示在行程列表中',
    },
  },
  {
    id: 'dates',
    title: {
      ko: '언제 여행하시나요?',
      en: 'When is your trip?',
      ja: 'いつ旅行しますか？',
      zh: '旅行日期是？',
    },
    subtitle: {
      ko: '시작일·종료일 (YYYY-MM-DD)',
      en: 'Start and end (YYYY-MM-DD)',
      ja: '開始・終了日 (YYYY-MM-DD)',
      zh: '开始与结束日期',
    },
  },
  {
    id: 'companions',
    title: {
      ko: '몇 명이서 가시나요?',
      en: 'How many travelers?',
      ja: '何名で行きますか？',
      zh: '一共几位？',
    },
    subtitle: {
      ko: '본인 포함 인원',
      en: 'Including yourself',
      ja: '本人を含む人数',
      zh: '包含您在内',
    },
  },
  {
    id: 'companionType',
    title: {
      ko: '동행인 유형은?',
      en: 'Who are you traveling with?',
      ja: '同行者のタイプは？',
      zh: '同行类型？',
    },
    subtitle: {
      ko: '복수 선택 가능',
      en: 'Select all that apply',
      ja: '複数選択可',
      zh: '可多选',
    },
  },
  {
    id: 'travelStyle',
    title: {
      ko: '선호하는 여행 스타일은?',
      en: 'What travel style do you prefer?',
      ja: '好みの旅行スタイルは？',
      zh: '偏好的旅行风格？',
    },
    subtitle: {
      ko: '여행 테마 · 복수 선택',
      en: 'Travel themes · multi-select',
      ja: 'テーマ · 複数選択',
      zh: '旅行主题 · 多选',
    },
  },
  {
    id: 'constraints',
    title: {
      ko: '여행 제약 조건이 있나요?',
      en: 'Any travel constraints?',
      ja: '旅行の制約はありますか？',
      zh: '有旅行限制吗？',
    },
    subtitle: {
      ko: '짐, 애완동물, 기타 조건 선택',
      en: 'Luggage, pets, and other needs',
      ja: '荷物・ペット・その他',
      zh: '行李、宠物及其他',
    },
  },
  {
    id: 'attractions',
    title: {
      ko: '가고 싶은 관광지',
      en: 'Places you want to visit',
      ja: '行きたい観光地',
      zh: '想去的景点',
    },
    subtitle: {
      ko: '검색·지도에서 복수 선택',
      en: 'Search or pick on the map',
      ja: '検索・地図から複数選択',
      zh: '从搜索或地图多选',
    },
  },
  {
    id: 'foods',
    title: {
      ko: '좋아하는 음식',
      en: 'Foods you enjoy',
      ja: '好きな食べ物',
      zh: '喜欢的食物',
    },
    subtitle: {
      ko: '맛집 추천에 반영',
      en: 'Used for restaurant picks',
      ja: '飲食店おすすめに反映',
      zh: '用于餐厅推荐',
    },
  },
  {
    id: 'accommodation',
    title: {
      ko: '숙소는 정하셨나요?',
      en: 'Accommodation plans?',
      ja: '宿泊は決まっていますか？',
      zh: '住宿定了吗？',
    },
    subtitle: {
      ko: '예약 완료 또는 후보 지역 선택',
      en: 'Booked stay or pick areas',
      ja: '予約済みかエリア候補',
      zh: '已预订或选区域',
    },
  },
  {
    id: 'generationMode',
    title: {
      ko: '일정 생성 방식',
      en: 'How should we build your plan?',
      ja: '行程の作り方',
      zh: '如何生成行程',
    },
    subtitle: {
      ko: 'AI 자동 생성 또는 직접 만들기',
      en: 'AI auto-build or build manually',
      ja: 'AI自動生成または手動作成',
      zh: 'AI 生成或手动创建',
    },
  },
];

type SelectOption = { id: string; label: LocalizedLabel; meta?: { lat: number; lng: number; placeId?: string } };

export const TRAVEL_STYLE_OPTIONS: SelectOption[] = [
  { id: 'culture', label: { ko: '문화·역사', en: 'Culture & history', ja: '文化・歴史', zh: '文化历史' } },
  { id: 'nature', label: { ko: '자연·힐링', en: 'Nature & wellness', ja: '自然・癒し', zh: '自然疗愈' } },
  { id: 'food', label: { ko: '미식·맛집', en: 'Food & dining', ja: 'グルメ', zh: '美食' } },
  { id: 'shopping', label: { ko: '쇼핑', en: 'Shopping', ja: 'ショッピング', zh: '购物' } },
  { id: 'adventure', label: { ko: '액티비티', en: 'Adventure', ja: 'アクティビティ', zh: '冒险活动' } },
  { id: 'photo', label: { ko: '사진·인스타', en: 'Photo spots', ja: '写真スポット', zh: '拍照打卡' } },
  { id: 'nightlife', label: { ko: '야경·나이트', en: 'Nightlife', ja: 'ナイト', zh: '夜生活' } },
];

export const TRAVEL_CONSTRAINT_NONE_ID = 'none';

export const TRAVEL_CONSTRAINT_OPTIONS: SelectOption[] = [
  { id: TRAVEL_CONSTRAINT_NONE_ID, label: { ko: '없음', en: 'None', ja: 'なし', zh: '无' } },
  { id: 'heavy_luggage', label: { ko: '짐이 많음', en: 'Heavy luggage', ja: '荷物多め', zh: '行李较多' } },
  { id: 'light_luggage', label: { ko: '짐이 적음', en: 'Light luggage', ja: '荷物少なめ', zh: '行李较少' } },
  { id: 'pets', label: { ko: '애완동물 동반', en: 'Traveling with pets', ja: 'ペット同伴', zh: '携带宠物' } },
  { id: 'stroller', label: { ko: '유모차', en: 'Stroller', ja: 'ベビーカー', zh: '婴儿车' } },
  { id: 'wheelchair', label: { ko: '휠체어·접근성', en: 'Wheelchair access', ja: '車椅子', zh: '轮椅无障碍' } },
  { id: 'dietary', label: { ko: '식단·알레르기', en: 'Dietary restrictions', ja: '食事制限', zh: '饮食限制' } },
];

export const BUSAN_ATTRACTIONS: SelectOption[] = [
  { id: 'gamcheon', label: { ko: '감천문화마을', en: 'Gamcheon Village', ja: '甘川文化村', zh: '甘川文化村' }, meta: { lat: 35.0974, lng: 129.0107, placeId: 'tour_gamcheon' } },
  { id: 'haeundae', label: { ko: '해운대 해수욕장', en: 'Haeundae Beach', ja: '海雲台', zh: '海云台' }, meta: { lat: 35.1587, lng: 129.1604, placeId: 'tour_haeundae' } },
  { id: 'gwangan', label: { ko: '광안리', en: 'Gwangalli', ja: '広安里', zh: '广安里' }, meta: { lat: 35.1532, lng: 129.1186, placeId: 'tour_gwangan' } },
  { id: 'taejongdae', label: { ko: '태종대', en: 'Taejongdae', ja: '太宗台', zh: '太宗台' }, meta: { lat: 35.0517, lng: 129.085, placeId: 'tour_taejongdae' } },
  { id: 'jagalchi', label: { ko: '자갈치시장', en: 'Jagalchi Market', ja: 'ジャガルチ', zh: '札嘎其市场' }, meta: { lat: 35.0977, lng: 129.0307, placeId: 'tour_jagalchi' } },
  { id: 'haedong', label: { ko: '해동용궁사', en: 'Haedong Yonggungsa', ja: '海東龍宮寺', zh: '海东龙宫寺' }, meta: { lat: 35.1885, lng: 129.2233, placeId: 'tour_haedong' } },
  { id: 'songjeong', label: { ko: '송정 해수욕장', en: 'Songjeong Beach', ja: '松亭', zh: '松亭海水浴场' }, meta: { lat: 35.181, lng: 129.207, placeId: 'tour_songjeong' } },
  { id: 'huangnyeong', label: { ko: '황령산 봉수대', en: 'Hwangnyeongsan', ja: '荒嶺山', zh: '荒岭山' }, meta: { lat: 35.153, lng: 129.081, placeId: 'tour_huangnyeong' } },
  { id: 'yongdusan', label: { ko: '용두산 공원', en: 'Yongdusan Park', ja: '龍頭山', zh: '龙头山' }, meta: { lat: 35.101, lng: 129.032, placeId: 'tour_yongdusan' } },
  { id: 'oryukdo', label: { ko: '오륙도 스카이워크', en: 'Oryukdo Skywalk', ja: '五六島', zh: '五六岛' }, meta: { lat: 35.046, lng: 129.12, placeId: 'tour_oryukdo' } },
];

export const BUSAN_FOODS: SelectOption[] = [
  { id: 'milmyeon', label: { ko: '밀면', en: 'Milmyeon', ja: '冷麺', zh: '密阳冷面' } },
  { id: 'dwaeji', label: { ko: '돼지국밥', en: 'Pork soup rice', ja: '豚汁', zh: '猪肉汤饭' } },
  { id: 'haemul', label: { ko: '해물탕·회', en: 'Seafood stew & sashimi', ja: '海鮮', zh: '海鲜' } },
  { id: 'eomuk', label: { ko: '어묵·부산 간식', en: 'Fish cake street food', ja: '練り物', zh: '鱼糕' } },
  { id: 'bingsu', label: { ko: '팥빙수·디저트', en: 'Bingsu & desserts', ja: 'かき氷', zh: '红豆刨冰' } },
  { id: 'chimaek', label: { ko: '치맥·야식', en: 'Chicken & beer', ja: 'チキン', zh: '炸鸡啤酒' } },
];

export const COMPANION_TYPE_OPTIONS: { id: import('../../types/planWizard').CompanionGroupType; label: LocalizedLabel }[] = [
  { id: 'solo', label: { ko: '혼자', en: 'Solo', ja: 'ひとり', zh: '独自' } },
  { id: 'family', label: { ko: '가족', en: 'Family', ja: '家族', zh: '家人' } },
  { id: 'couple', label: { ko: '애인·연인', en: 'Partner', ja: '恋人', zh: '伴侣' } },
  { id: 'friends', label: { ko: '친구', en: 'Friends', ja: '友人', zh: '朋友' } },
  { id: 'coworkers', label: { ko: '동료', en: 'Coworkers', ja: '同僚', zh: '同事' } },
];

export const ACCOMMODATION_AREAS: SelectOption[] = [
  { id: 'haeundae', label: { ko: '해운대·마린시티', en: 'Haeundae', ja: '海雲台', zh: '海云台' } },
  { id: 'seomyeon', label: { ko: '서면·부전', en: 'Seomyeon', ja: '西面', zh: '西面' } },
  { id: 'nampo', label: { ko: '남포·중구', en: 'Nampo', ja: '南浦', zh: '南浦' } },
  { id: 'gwangan', label: { ko: '광안리', en: 'Gwangalli', ja: '広安里', zh: '广安里' } },
  { id: 'yeongdo', label: { ko: '영도', en: 'Yeongdo', ja: '影島', zh: '影岛' } },
];

export const ACCOMMODATION_SEARCH: (SelectOption & { areaId: string })[] = [
  { id: 'hotel_paradise', areaId: 'haeundae', label: { ko: '파라다이스 호텔 부산', en: 'Paradise Hotel Busan', ja: 'パラダイス', zh: '釜山天堂酒店' }, meta: { lat: 35.158, lng: 129.165, placeId: 'stay_paradise' } },
  { id: 'hotel_signiel', areaId: 'haeundae', label: { ko: '시그니엘 부산', en: 'Signiel Busan', ja: 'シグニエル', zh: '喜格尼尔' }, meta: { lat: 35.163, lng: 129.17, placeId: 'stay_signiel' } },
  { id: 'hotel_lottee', areaId: 'seomyeon', label: { ko: '롯데 호텔 부산', en: 'Lotte Hotel Busan', ja: 'ロッテ', zh: '乐天酒店' }, meta: { lat: 35.157, lng: 129.055, placeId: 'stay_lotte' } },
  { id: 'guest_nampo', areaId: 'nampo', label: { ko: '남포 게스트하우스', en: 'Nampo Guesthouse', ja: '南浦GH', zh: '南浦旅馆' }, meta: { lat: 35.099, lng: 129.034, placeId: 'stay_nampo_gh' } },
  { id: 'hotel_gwangan', areaId: 'gwangan', label: { ko: '광안리 비치 호텔', en: 'Gwangalli Beach Hotel', ja: '広安里ビーチ', zh: '广安里海滩酒店' }, meta: { lat: 35.154, lng: 129.118, placeId: 'stay_gwangan' } },
];

/** @deprecated Use useCopy('planWizard') from src/i18n */
export const PLAN_WIZARD_COPY: Record<
  AppLanguage,
  {
    next: string;
    back: string;
    finish: string;
    createPlan: string;
    newPlan: string;
    activePlan: string;
    noPlan: string;
    noPlanSub: string;
    countLabel: (n: number) => string;
    heavyYes: string;
    heavyNo: string;
    constraintHint: string;
    accBooked: string;
    accArea: string;
    accSearch: string;
    accSearchPlaceholder: string;
    pickPlace: string;
    pickStay: string;
    selectedPlacesEmpty: string;
    removePlace: string;
    pickApply: string;
    pickCancel: string;
    pickNearbyTitle: string;
    pickSearchPlaceholder: string;
    pickSearchEmpty: string;
    pickDistance: (d: string) => string;
    modeAuto: string;
    modeAutoSub: string;
    modeCandidates: string;
    modeCandidatesSub: string;
    modeManual: string;
    modeManualSub: string;
    generating: string;
    creatingManual: string;
    createManualError: string;
    createAiError: string;
    createAiNeedPlaces: string;
    pickPlan: string;
    days: (n: number) => string;
    statusDraft: string;
    startDate: string;
    endDate: string;
    travelTitlePlaceholder: string;
    travelTitleCount: (used: number, max: number) => string;
  }
> = {
  ko: {
    next: '다음',
    back: '이전',
    finish: '완료',
    createPlan: '새 여행 계획',
    newPlan: '새 일정',
    activePlan: '진행 중인 계획',
    noPlan: '아직 진행 중인 계획이 없어요',
    noPlanSub: '버튼을 눌러 맞춤 일정을 만들어 보세요',
    countLabel: n => `${n}명`,
    heavyYes: '짐이 많아요',
    heavyNo: '가볍게 다녀요',
    constraintHint: '해당하는 항목을 모두 선택해 주세요',
    accBooked: '숙소 예약 완료',
    accArea: '숙소 후보 지역만',
    accSearch: '숙소 검색',
    accSearchPlaceholder: '호텔·게스트하우스 이름',
    pickPlace: '장소 추가',
    pickStay: '숙소 검색',
    selectedPlacesEmpty: '검색해서 가고 싶은 장소를 추가하세요',
    removePlace: '삭제',
    pickApply: '선택',
    pickCancel: '취소',
    pickNearbyTitle: '근처 장소',
    pickSearchPlaceholder: '장소 이름 검색',
    pickSearchEmpty: '검색 결과가 없어요',
    pickDistance: d => `약 ${d}`,
    modeAuto: 'AI가 일정 생성',
    modeAutoSub: '선택한 장소로 바로 플랜 생성 · 관광지 1곳 이상',
    modeCandidates: '후보에서 직접 선택',
    modeCandidatesSub: 'AI 후보를 받고 마음에 드는 플랜 선택',
    modeManual: '직접 일정 만들기',
    modeManualSub: '날짜·인원만으로 빈 일정을 만들고 장소를 직접 추가',
    generating: 'AI에게 일정 요청 중…',
    creatingManual: '여행 일정 생성 중…',
    createManualError: '여행 생성에 실패했습니다. 로그인 상태와 API 서버를 확인해 주세요.',
    createAiError: 'AI 일정 생성에 실패했습니다. 빈 일정은 삭제했어요.',
    createAiNeedPlaces: '가고 싶은 관광지를 1곳 이상 선택해 주세요.',
    pickPlan: '이 일정으로 시작',
    days: n => `${n}일`,
    statusDraft: '생성 중',
    startDate: '시작일',
    endDate: '종료일',
    travelTitlePlaceholder: '예: 해운대 주말 여행',
    travelTitleCount: (used, max) => `${used} / ${max}`,
  },
  en: {
    next: 'Next',
    back: 'Back',
    finish: 'Done',
    createPlan: 'New trip plan',
    newPlan: 'New plan',
    activePlan: 'Current plan',
    noPlan: 'No active plan yet',
    noPlanSub: 'Tap below to build a personalized itinerary',
    countLabel: n => `${n} travelers`,
    heavyYes: 'Heavy luggage',
    heavyNo: 'Travel light',
    constraintHint: 'Select all that apply',
    accBooked: 'Already booked',
    accArea: 'Pick stay areas only',
    accSearch: 'Search stay',
    accSearchPlaceholder: 'Hotel or guesthouse name',
    pickPlace: 'Add place',
    pickStay: 'Search stay',
    selectedPlacesEmpty: 'Search and add places you want to visit',
    removePlace: 'Remove',
    pickApply: 'Select',
    pickCancel: 'Cancel',
    pickNearbyTitle: 'Nearby places',
    pickSearchPlaceholder: 'Search by name',
    pickSearchEmpty: 'No results',
    pickDistance: d => `~${d}`,
    modeAuto: 'AI builds my plan',
    modeAutoSub: 'Generate from selected places · at least 1 attraction',
    modeCandidates: 'Choose from options',
    modeCandidatesSub: 'Review AI options and pick one',
    modeManual: 'Build itinerary manually',
    modeManualSub: 'Create an empty plan with dates & travelers, then add places yourself',
    generating: 'Requesting plan from AI…',
    creatingManual: 'Creating your trip…',
    createManualError: 'Could not create the trip. Check login and API server.',
    createAiError: 'AI could not create the plan. The empty trip was removed.',
    createAiNeedPlaces: 'Pick at least one place you want to visit.',
    pickPlan: 'Start with this plan',
    days: n => `${n} days`,
    statusDraft: 'Draft',
    startDate: 'Start',
    endDate: 'End',
    travelTitlePlaceholder: 'e.g. Haeundae weekend trip',
    travelTitleCount: (used, max) => `${used} / ${max}`,
  },
  ja: {
    next: '次へ',
    back: '戻る',
    finish: '完了',
    createPlan: '新しい旅行プラン',
    newPlan: '新規プラン',
    activePlan: '進行中のプラン',
    noPlan: '進行中のプランがありません',
    noPlanSub: 'ボタンからオリジナル行程を作成',
    countLabel: n => `${n}名`,
    heavyYes: '荷物多め',
    heavyNo: '少なめ',
    constraintHint: '該当する項目を選んでください',
    accBooked: '宿泊予約済み',
    accArea: 'エリア候補のみ',
    accSearch: '宿を検索',
    accSearchPlaceholder: 'ホテル名',
    pickPlace: '場所を追加',
    pickStay: '宿を検索',
    selectedPlacesEmpty: '検索して行きたい場所を追加してください',
    removePlace: '削除',
    pickApply: '選択',
    pickCancel: 'キャンセル',
    pickNearbyTitle: '近くの場所',
    pickSearchPlaceholder: '名前で検索',
    pickSearchEmpty: '該当なし',
    pickDistance: d => `約${d}`,
    modeAuto: 'AIが行程作成',
    modeAutoSub: '選んだ場所からすぐ生成 · 観光地を1件以上',
    modeCandidates: '候補から選択',
    modeCandidatesSub: 'AI候補から選ぶ',
    modeManual: '手動で行程作成',
    modeManualSub: '日付・人数だけで空の行程を作り、場所を追加',
    generating: 'AIにリクエスト中…',
    creatingManual: '旅行を作成中…',
    createManualError: '旅行の作成に失敗しました。ログインとAPIを確認してください。',
    createAiError: 'AIの行程作成に失敗しました。空の旅行は削除しました。',
    createAiNeedPlaces: '行きたい観光地を1件以上選んでください。',
    pickPlan: 'このプランで開始',
    days: n => `${n}日`,
    statusDraft: '作成中',
    startDate: '開始',
    endDate: '終了',
    travelTitlePlaceholder: '例: 海雲台の週末旅行',
    travelTitleCount: (used, max) => `${used} / ${max}`,
  },
  zh: {
    next: '下一步',
    back: '上一步',
    finish: '完成',
    createPlan: '新建旅行计划',
    newPlan: '新计划',
    activePlan: '进行中的计划',
    noPlan: '暂无进行中的计划',
    noPlanSub: '点击下方创建专属行程',
    countLabel: n => `${n}人`,
    heavyYes: '行李较多',
    heavyNo: '轻装',
    constraintHint: '请选择所有适用项',
    accBooked: '已预订住宿',
    accArea: '仅选住宿区域',
    accSearch: '搜索住宿',
    accSearchPlaceholder: '酒店或旅馆名称',
    pickPlace: '添加地点',
    pickStay: '搜索住宿',
    selectedPlacesEmpty: '请搜索并添加想去的地点',
    removePlace: '删除',
    pickApply: '选择',
    pickCancel: '取消',
    pickNearbyTitle: '附近地点',
    pickSearchPlaceholder: '按名称搜索',
    pickSearchEmpty: '无搜索结果',
    pickDistance: d => `约 ${d}`,
    modeAuto: 'AI 生成行程',
    modeAutoSub: '根据所选地点立即生成 · 至少 1 个景点',
    modeCandidates: '从候选中选择',
    modeCandidatesSub: '查看 AI 候选并挑选',
    modeManual: '手动创建行程',
    modeManualSub: '仅用日期和人数创建空行程，自行添加地点',
    generating: '正在向 AI 请求行程…',
    creatingManual: '正在创建旅行…',
    createManualError: '创建旅行失败。请检查登录和 API 服务器。',
    createAiError: 'AI 行程生成失败。已删除空行程。',
    createAiNeedPlaces: '请至少选择 1 个想去的景点。',
    pickPlan: '使用此行程',
    days: n => `${n}天`,
    statusDraft: '草稿',
    startDate: '开始',
    endDate: '结束',
    travelTitlePlaceholder: '例如：海云台周末之旅',
    travelTitleCount: (used, max) => `${used} / ${max}`,
  },
};

export function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export function dayCountBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.floor((e.getTime() - s.getTime()) / 86400000) + 1;
  return diff > 0 ? diff : 0;
}
