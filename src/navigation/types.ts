import type { NavbarTab } from '../components/shared/navigation/Navbar';
import type { EventZoneId } from '../types/eventZone';
import type { PlaceContentTypeId } from '../types/placesApi';
import type { WizardPickedPlace } from '../types/planWizard';

export type WizardPlacePickKind = 'attractions' | 'accommodation';

export type RootStackParamList = {
  LanguageSelection: { mode?: 'setup' | 'settings' } | undefined;
  Login: undefined;
  Onboarding: { mode?: 'setup' | 'edit' | 'account' } | undefined;
  MainTabs: { tab?: NavbarTab } | undefined;
  PlanWizard:
    | {
        pickedPlace?: WizardPickedPlace;
        pickKind?: WizardPlacePickKind;
      }
    | undefined;
  PlanCandidates: undefined;
  /** planId 생략 시 진행 중(active) 플랜 사용 */
  PlanDetail: { planId?: string; openReboot?: boolean; tab?: 'overview' | 'schedule' | 'budget' | 'records' } | undefined;
  /** 인앱 QR/링크 스캔으로 여행 초대 수락 */
  TravelInviteScan: undefined;
  MenuPlaceholder: { title: string };
  TravelRecordDetail: { travelRecordId: string };
  FestivalCalendar: { initialDate?: string } | undefined;
  /** @deprecated PlaceMapSearch 사용 */
  FestivalDetail: { festivalId: string };
  LuggageStorage: undefined;
  PlaceMapSearch: {
    contentTypeId?: PlaceContentTypeId;
    selectedContentId?: string;
    festivalEventStartDate?: string;
    festivalEventEndDate?: string;
    /** 일정 위저드에서 장소 고를 때 — 카테고리 고정 + 선택 후 위저드로 복귀 */
    pickFor?: WizardPlacePickKind;
  } | undefined;
  HelpDeskChat: undefined;
  EventZone: undefined;
  EventZoneChat: { roomId: string };
  EventGameDetail: { eventId: string };
  EventGameCamera: { eventId: string; targetId: string; participationId: string };
  /** Phase 3+ — 네비 미등록 */
  EventGameMukjjippa: { eventId: string };
  EventParticipationHistory: undefined;
  /** Phase 2 — 네비 미등록 */
  EventAlbum: { zoneId?: EventZoneId; eventId?: string } | undefined;
};

export type SetupPhase = 'language' | 'login' | 'onboarding' | 'main';
