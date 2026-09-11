/**
 * Maestro / Detox 공용 셀렉터.
 * 화면·버튼에 `testID={TEST_ID....}` 로 연결합니다.
 */
export const TEST_ID = {
  app: {
    loading: 'app.loading',
  },
  language: {
    screen: 'language.screen',
    option: (code: string) => `language.option.${code}`,
    continue: 'language.continue',
    back: 'language.back',
    e2eBootstrap: 'language.e2eBootstrap',
  },
  onboarding: {
    screen: 'onboarding.screen',
    skipStep: 'onboarding.skipStep',
    skipAll: 'onboarding.skipAll',
    next: 'onboarding.next',
    back: 'onboarding.back',
    thankYou: 'onboarding.thankYou',
    option: (value: string) => `onboarding.option.${value}`,
  },
  login: {
    screen: 'login.screen',
    google: 'login.google',
    kakao: 'login.kakao',
    naver: 'login.naver',
    rememberMe: 'login.rememberMe',
    offline: 'login.offline',
    e2eEnter: 'login.e2eEnter',
    error: 'login.error',
  },
  main: {
    screen: 'main.screen',
  },
  appBar: {
    menu: 'appBar.menu',
    profile: 'appBar.profile',
  },
  navbar: {
    root: 'navbar.root',
    tab: (id: string) => `navbar.tab.${id}`,
  },
  menu: {
    drawer: 'menu.drawer',
    close: 'menu.close',
    item: (id: string) => `menu.item.${id}`,
  },
  home: {
    screen: 'home.screen',
    heroCta: 'home.heroCta',
    quickAccess: (id: string) => `home.quickAccess.${id}`,
    eventZoneMap: 'home.eventZoneMap',
    eventZoneChat: 'home.eventZoneChat',
    eventsViewAll: 'home.eventsViewAll',
    helpFab: 'home.helpFab',
  },
  feed: {
    screen: 'feed.screen',
    empty: 'feed.empty',
  },
  mypage: {
    screen: 'mypage.screen',
    login: 'mypage.login',
    settings: 'mypage.settings',
    language: 'mypage.language',
    account: 'mypage.account',
    logout: 'mypage.logout',
    preferences: 'mypage.preferences',
    nickname: 'mypage.nickname',
    notifications: 'mypage.notifications',
  },
  notificationSettings: {
    screen: 'notificationSettings.screen',
    master: 'notificationSettings.master',
    eventMission: 'notificationSettings.eventMission',
    eventReview: 'notificationSettings.eventReview',
    zoneChat: 'notificationSettings.zoneChat',
  },
  planWizard: {
    screen: 'planWizard.screen',
    titleInput: 'planWizard.titleInput',
    startDateInput: 'planWizard.startDateInput',
    endDateInput: 'planWizard.endDateInput',
    companionMinus: 'planWizard.companionMinus',
    companionPlus: 'planWizard.companionPlus',
    pickPlace: 'planWizard.pickPlace',
    pickStay: 'planWizard.pickStay',
    accBooked: 'planWizard.accommodation.booked',
    accArea: 'planWizard.accommodation.area',
    generationAuto: 'planWizard.generation.auto',
    generationManual: 'planWizard.generation.manual',
    next: 'planWizard.next',
    back: 'planWizard.back',
    step: (id: string) => `planWizard.step.${id}`,
    option: (group: string, id: string) => `planWizard.option.${group}.${id}`,
  },
  planDetail: {
    screen: 'planDetail.screen',
  },
  placeSearch: {
    screen: 'placeSearch.screen',
    keyword: 'placeSearch.keyword',
    search: 'placeSearch.search',
    category: (typeId: string) => `placeSearch.category.${typeId}`,
  },
  festival: {
    screen: 'festival.screen',
    prevMonth: 'festival.prevMonth',
    nextMonth: 'festival.nextMonth',
  },
  luggage: {
    screen: 'luggage.screen',
  },
  eventZone: {
    screen: 'eventZone.screen',
  },
  helpdesk: {
    screen: 'helpdesk.screen',
    input: 'helpdesk.input',
    send: 'helpdesk.send',
  },
  nav: {
    back: 'nav.back',
  },
  alert: {
    featureUnavailable: 'alert.featureUnavailable',
    confirm: 'alert.confirm',
  },
  location: {
    disclosure: 'location.disclosure',
    accept: 'location.accept',
    decline: 'location.decline',
  },
} as const;
