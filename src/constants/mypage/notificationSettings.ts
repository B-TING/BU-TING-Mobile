import type { AppLanguage } from '../../types/user';

/** @deprecated Use useCopy('notificationSettings') from src/i18n */
export const NOTIFICATION_SETTINGS_COPY: Record<
  AppLanguage,
  {
    screenTitle: string;
    subtitle: string;
    loginRequired: string;
    loginAction: string;
    pushPendingTitle: string;
    pushPendingBody: string;
    masterLabel: string;
    masterHint: string;
    categoriesTitle: string;
    eventMissionLabel: string;
    eventMissionHint: string;
    eventReviewLabel: string;
    eventReviewHint: string;
    zoneChatLabel: string;
    zoneChatHint: string;
  }
> = {
  ko: {
    screenTitle: '알림 설정',
    subtitle: '받고 싶은 알림을 골라 주세요',
    loginRequired: '알림 설정을 저장하려면 로그인이 필요해요.',
    loginAction: '로그인',
    pushPendingTitle: '기기 푸시는 아직 연결되지 않았어요',
    pushPendingBody: '설정은 이 기기에 저장됩니다. 푸시 발송은 나중에 연결할 예정이에요.',
    masterLabel: '알림 받기',
    masterHint: '꺼 두면 아래 알림을 모두 받지 않아요.',
    categoriesTitle: '알림 종류',
    eventMissionLabel: '구역 이벤트',
    eventMissionHint: '미션 오픈·마감 안내',
    eventReviewLabel: '검수 결과',
    eventReviewHint: '제출한 미션의 통과·반려',
    zoneChatLabel: '구역 채팅',
    zoneChatHint: '새 메시지 알림',
  },
  en: {
    screenTitle: 'Notifications',
    subtitle: 'Choose what you want to hear about',
    loginRequired: 'Sign in to save notification preferences.',
    loginAction: 'Sign in',
    pushPendingTitle: 'Device push is not connected yet',
    pushPendingBody: 'Preferences are saved on this device. Push delivery will be wired later.',
    masterLabel: 'Allow notifications',
    masterHint: 'Turn this off to mute every category below.',
    categoriesTitle: 'Categories',
    eventMissionLabel: 'Zone events',
    eventMissionHint: 'Mission open and close updates',
    eventReviewLabel: 'Review results',
    eventReviewHint: 'Pass or reject on submitted missions',
    zoneChatLabel: 'Zone chat',
    zoneChatHint: 'New message alerts',
  },
  ja: {
    screenTitle: '通知設定',
    subtitle: '受け取る通知を選んでください',
    loginRequired: '通知設定を保存するにはログインが必要です。',
    loginAction: 'ログイン',
    pushPendingTitle: '端末プッシュはまだ未接続です',
    pushPendingBody: '設定はこの端末に保存されます。プッシュ配信は後で接続予定です。',
    masterLabel: '通知を受け取る',
    masterHint: 'オフにすると下の通知をすべて受け取りません。',
    categoriesTitle: '通知の種類',
    eventMissionLabel: 'エリアイベント',
    eventMissionHint: 'ミッションの開始・終了',
    eventReviewLabel: '審査結果',
    eventReviewHint: '提出したミッションの合格・差戻し',
    zoneChatLabel: 'エリアチャット',
    zoneChatHint: '新しいメッセージ',
  },
  zh: {
    screenTitle: '通知设置',
    subtitle: '选择想收到的通知',
    loginRequired: '保存通知设置需要登录。',
    loginAction: '登录',
    pushPendingTitle: '设备推送尚未接通',
    pushPendingBody: '设置会保存在这台设备上。推送发送会稍后接入。',
    masterLabel: '接收通知',
    masterHint: '关闭后下方所有通知都不会收到。',
    categoriesTitle: '通知类型',
    eventMissionLabel: '区域活动',
    eventMissionHint: '任务开始与结束提醒',
    eventReviewLabel: '审核结果',
    eventReviewHint: '已提交任务的通过或退回',
    zoneChatLabel: '区域聊天',
    zoneChatHint: '新消息提醒',
  },
};
