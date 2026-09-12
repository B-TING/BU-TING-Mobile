import type { AppLanguage } from '../../types/user';

/** @deprecated Use useCopy('userRewards') from src/i18n */
export const USER_REWARDS_COPY: Record<
  AppLanguage,
  {
    screenTitle: string;
    subtitle: string;
    loginRequired: string;
    loginAction: string;
    pointBalanceLabel: string;
    pointBalanceValue: (n: number) => string;
    badgesTitle: string;
    badgesEmpty: string;
    unknownZone: string;
    ledgerTitle: string;
    ledgerEmpty: string;
    ledgerCredit: string;
    ledgerDebit: string;
    amountCredit: (n: number) => string;
    amountDebit: (n: number) => string;
    reasons: {
      BASE: string;
      TOP_LIKE: string;
      ZONE_WIN: string;
      TOP_RANK: string;
      REVOKE: string;
      other: (code: string) => string;
    };
  }
> = {
  ko: {
    screenTitle: '내 보상',
    subtitle: '보유 포인트와 적립 내역',
    loginRequired: '보상과 포인트 내역을 보려면 로그인이 필요해요.',
    loginAction: '로그인',
    pointBalanceLabel: '보유 포인트',
    pointBalanceValue: n => `${n.toLocaleString('ko-KR')}P`,
    badgesTitle: '받은 배지',
    badgesEmpty: '아직 받은 배지가 없어요.',
    unknownZone: '기타 구역',
    ledgerTitle: '포인트 적립 내역',
    ledgerEmpty: '아직 포인트 내역이 없어요.',
    ledgerCredit: '적립',
    ledgerDebit: '회수',
    amountCredit: n => `+${n.toLocaleString('ko-KR')}P`,
    amountDebit: n => `-${n.toLocaleString('ko-KR')}P`,
    reasons: {
      BASE: '미션 성공 보상',
      TOP_LIKE: '좋아요 우수 보상',
      ZONE_WIN: '구역 우승 보상',
      TOP_RANK: '순위 보상',
      REVOKE: '보상 회수',
      other: code => code,
    },
  },
  en: {
    screenTitle: 'My rewards',
    subtitle: 'Balance and point history',
    loginRequired: 'Sign in to see your rewards and point history.',
    loginAction: 'Sign in',
    pointBalanceLabel: 'Point balance',
    pointBalanceValue: n => `${n.toLocaleString('en-US')} pts`,
    badgesTitle: 'Badges',
    badgesEmpty: 'No badges yet.',
    unknownZone: 'Other zone',
    ledgerTitle: 'Point history',
    ledgerEmpty: 'No point history yet.',
    ledgerCredit: 'Earned',
    ledgerDebit: 'Revoked',
    amountCredit: n => `+${n.toLocaleString('en-US')} pts`,
    amountDebit: n => `-${n.toLocaleString('en-US')} pts`,
    reasons: {
      BASE: 'Mission reward',
      TOP_LIKE: 'Top-like reward',
      ZONE_WIN: 'Zone win reward',
      TOP_RANK: 'Ranking reward',
      REVOKE: 'Reward revoked',
      other: code => code,
    },
  },
  ja: {
    screenTitle: 'マイ報酬',
    subtitle: '保有ポイントと履歴',
    loginRequired: '報酬とポイント履歴を見るにはログインが必要です。',
    loginAction: 'ログイン',
    pointBalanceLabel: '保有ポイント',
    pointBalanceValue: n => `${n.toLocaleString('ja-JP')}P`,
    badgesTitle: '獲得バッジ',
    badgesEmpty: 'まだバッジがありません。',
    unknownZone: 'その他のエリア',
    ledgerTitle: 'ポイント履歴',
    ledgerEmpty: 'まだポイント履歴がありません。',
    ledgerCredit: '付与',
    ledgerDebit: '取消',
    amountCredit: n => `+${n.toLocaleString('ja-JP')}P`,
    amountDebit: n => `-${n.toLocaleString('ja-JP')}P`,
    reasons: {
      BASE: 'ミッション成功報酬',
      TOP_LIKE: 'いいね優秀報酬',
      ZONE_WIN: 'エリア優勝報酬',
      TOP_RANK: 'ランキング報酬',
      REVOKE: '報酬取消',
      other: code => code,
    },
  },
  zh: {
    screenTitle: '我的奖励',
    subtitle: '积分余额与明细',
    loginRequired: '查看奖励和积分明细需要登录。',
    loginAction: '登录',
    pointBalanceLabel: '当前积分',
    pointBalanceValue: n => `${n.toLocaleString('zh-CN')}P`,
    badgesTitle: '已获徽章',
    badgesEmpty: '还没有徽章。',
    unknownZone: '其他区域',
    ledgerTitle: '积分明细',
    ledgerEmpty: '暂无积分记录。',
    ledgerCredit: '入账',
    ledgerDebit: '收回',
    amountCredit: n => `+${n.toLocaleString('zh-CN')}P`,
    amountDebit: n => `-${n.toLocaleString('zh-CN')}P`,
    reasons: {
      BASE: '任务成功奖励',
      TOP_LIKE: '点赞优秀奖励',
      ZONE_WIN: '区域优胜奖励',
      TOP_RANK: '排名奖励',
      REVOKE: '奖励收回',
      other: code => code,
    },
  },
};
