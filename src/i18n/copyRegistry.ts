import type { AppLanguage } from '../types/user';
import { EVENT_GAME_COPY } from '../constants/eventZone/eventGame';
import { EVENT_ZONE_MAP_LAYER_COPY, EVENT_ZONE_COPY, ZONE_CHAT_COPY } from '../constants/eventZone/eventZone';
import { ZONE_TITLES_COPY } from '../constants/eventZone/zoneTitles';
import { USER_REWARDS_COPY } from '../constants/eventZone/userRewards';
import { FESTIVAL_CALENDAR_COPY } from '../constants/festival/festivalCalendar';
import { HELP_DESK_COPY } from '../constants/helpdesk/helpDesk';
import { HOME_EVENT_ZONE_COPY, MAIN_HOME_COPY } from '../constants/home/mainHome';
import { LUGGAGE_STORAGE_COPY } from '../constants/locker/luggageStorage';
import { MY_PAGE_COPY } from '../constants/mypage/myPage';
import { PLAN_DETAIL_COPY } from '../constants/plan/planDetail';
import { PLAN_WIZARD_COPY } from '../constants/plan/planWizard';
import { PLACE_SEARCH_COPY } from '../constants/places/placeSearch';
import { TRAVEL_REVIEW_COPY } from '../constants/review/travelReview';
import { SETUP_COPY } from '../constants/setup/onboarding';

export const COPY_NAMESPACES = {
  mainHome: MAIN_HOME_COPY,
  homeEventZone: HOME_EVENT_ZONE_COPY,
  eventZone: EVENT_ZONE_COPY,
  eventGame: EVENT_GAME_COPY,
  zoneTitles: ZONE_TITLES_COPY,
  userRewards: USER_REWARDS_COPY,
  eventZoneMapLayer: EVENT_ZONE_MAP_LAYER_COPY,
  zoneChat: ZONE_CHAT_COPY,
  planDetail: PLAN_DETAIL_COPY,
  planWizard: PLAN_WIZARD_COPY,
  placeSearch: PLACE_SEARCH_COPY,
  luggageStorage: LUGGAGE_STORAGE_COPY,
  travelReview: TRAVEL_REVIEW_COPY,
  festivalCalendar: FESTIVAL_CALENDAR_COPY,
  helpdesk: HELP_DESK_COPY,
  setup: SETUP_COPY,
  myPage: MY_PAGE_COPY,
} as const;

export type CopyNamespace = keyof typeof COPY_NAMESPACES;

export const APP_LANGUAGES: AppLanguage[] = ['ko', 'en', 'ja', 'zh'];
