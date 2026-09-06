import type { AppLanguage } from '../../types/user';

/** @deprecated Use useCopy('zoneTitles') from src/i18n */
export const ZONE_TITLES_COPY: Record<
  AppLanguage,
  {
    screenTitle: string;
    subtitle: string;
    empty: string;
    loginRequired: string;
    loginAction: string;
    noEquipped: string;
    cityGrade: (name: string) => string;
    zoneSuccess: (zoneName: string, count: number) => string;
    zoneTier: (zoneName: string) => string;
    remainingToNext: (count: number) => string;
    requiredSuccess: (count: number) => string;
    equip: string;
    equipped: string;
    locked: string;
    loadError: string;
    guestName: string;
  }
> = {
  ko: {
    screenTitle: '구역 칭호',
    subtitle: '장착한 칭호는 앨범·프로필에 표시돼요',
    empty: '아직 등록된 칭호가 없어요.',
    loginRequired: '칭호를 장착하려면 로그인이 필요해요.',
    loginAction: '로그인',
    noEquipped: '장착한 칭호 없음',
    cityGrade: name => name,
    zoneSuccess: (zoneName, count) => `${zoneName} 성공 ${count}회`,
    zoneTier: zoneName => `${zoneName} 티어`,
    remainingToNext: count => `다음 티어까지 ${count}회`,
    requiredSuccess: count => `성공 ${count}회`,
    equip: '장착',
    equipped: '장착 중',
    locked: '잠김',
    loadError: '칭호를 불러오지 못했어요.',
    guestName: '여행자',
  },
  en: {
    screenTitle: 'Zone titles',
    subtitle: 'Equipped titles show on the album and profile',
    empty: 'No titles are available yet.',
    loginRequired: 'Sign in to equip a title.',
    loginAction: 'Sign in',
    noEquipped: 'No title equipped',
    cityGrade: name => name,
    zoneSuccess: (zoneName, count) => `${zoneName} · ${count} success${count === 1 ? '' : 'es'}`,
    zoneTier: zoneName => `${zoneName} tiers`,
    remainingToNext: count => `${count} more to next tier`,
    requiredSuccess: count => `${count} successes`,
    equip: 'Equip',
    equipped: 'Equipped',
    locked: 'Locked',
    loadError: 'Could not load titles.',
    guestName: 'Traveler',
  },
  ja: {
    screenTitle: 'エリア称号',
    subtitle: '装備した称号はアルバムとプロフィールに表示されます',
    empty: 'まだ称号がありません。',
    loginRequired: '称号を装備するにはログインが必要です。',
    loginAction: 'ログイン',
    noEquipped: '装備中の称号なし',
    cityGrade: name => name,
    zoneSuccess: (zoneName, count) => `${zoneName} 成功 ${count}回`,
    zoneTier: zoneName => `${zoneName} ティア`,
    remainingToNext: count => `次のティアまで ${count}回`,
    requiredSuccess: count => `成功 ${count}回`,
    equip: '装備',
    equipped: '装備中',
    locked: 'ロック',
    loadError: '称号を読み込めませんでした。',
    guestName: '旅行者',
  },
  zh: {
    screenTitle: '区域称号',
    subtitle: '已装备的称号会显示在相册和资料中',
    empty: '暂无称号。',
    loginRequired: '装备称号需要登录。',
    loginAction: '登录',
    noEquipped: '未装备称号',
    cityGrade: name => name,
    zoneSuccess: (zoneName, count) => `${zoneName} 成功 ${count} 次`,
    zoneTier: zoneName => `${zoneName} 段位`,
    remainingToNext: count => `距下一段位还差 ${count} 次`,
    requiredSuccess: count => `成功 ${count} 次`,
    equip: '装备',
    equipped: '装备中',
    locked: '未解锁',
    loadError: '无法加载称号。',
    guestName: '旅行者',
  },
};
