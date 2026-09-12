import { useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppAlert, useFeatureUnavailableAlert } from '../../components/shared/modals';
import {
  TRAVEL_CONSTRAINT_NONE_ID,
  dayCountBetween,
  isValidIsoDate,
  PLAN_WIZARD_STEP_COUNT,
  PLAN_WIZARD_STEPS,
  TRAVEL_TITLE_MAX_LENGTH,
} from '../../constants/plan/planWizard';
import {
  ALPHA_FEATURE_LABELS,
  isAlphaFeatureBlocked,
} from '../../constants/common/alphaFeatureBlocks';
import { useAppLanguage, useCopy } from '../../i18n';
import type { RootStackParamList, WizardPlacePickKind } from '../../navigation/types';
import { navigateToMainTab } from '../../navigation/navigateToMainTab';
import { createAiTravelPlan } from '../../services/travel/createAiTravelPlan';
import { createManualTravelPlan } from '../../services/travel/createManualTravelPlan';
import {
  selectOnboardingForUser,
  useAppStore,
  useAuthStore,
  usePlanStore,
  emptyWizardAnswers,
} from '../../stores';
import { selectAuthUser, selectReusableAccessToken } from '../../stores/useAuthStore';
import { PLACE_CONTENT_TYPE } from '../../types/placesApi';
import type { CompanionGroupType } from '../../types/planWizard';
import type { PlanMember, TravelPlan } from '../../types/travelPlan';

function defaultDates() {
  const start = new Date();
  start.setDate(start.getDate() + 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export function usePlanWizardScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'PlanWizard'>) {
  const language = useAppLanguage();
  const copy = useCopy('planWizard');
  const { alert } = useAppAlert();
  const { showUnavailable } = useFeatureUnavailableAlert();
  const user = useAuthStore(selectAuthUser);
  const accessToken = useAuthStore(selectReusableAccessToken);
  const onboarding = useAppStore(selectOnboardingForUser(user?.userId));
  const addPlan = usePlanStore(s => s.addPlan);
  const confirmPlan = usePlanStore(s => s.confirmPlan);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(() => ({
    ...emptyWizardAnswers(),
    ...defaultDates(),
  }));
  const [loading, setLoading] = useState(false);
  const stepConfig = PLAN_WIZARD_STEPS[step];

  useEffect(() => {
    const place = route.params?.pickedPlace;
    const kind = route.params?.pickKind;
    if (!place || !kind) {
      return;
    }
    if (kind === 'accommodation') {
      setAnswers(prev => ({
        ...prev,
        bookedAccommodation: place,
        accommodationPlaceId: place.placeId,
        accommodationName: place.placeName,
      }));
    } else {
      setAnswers(prev => {
        if (prev.selectedAttractions.some(item => item.placeId === place.placeId)) {
          return prev;
        }
        const selectedAttractions = [...prev.selectedAttractions, place];
        return {
          ...prev,
          selectedAttractions,
          attractionIds: selectedAttractions.map(item => item.placeId),
        };
      });
    }
    navigation.setParams({ pickedPlace: undefined, pickKind: undefined });
  }, [navigation, route.params?.pickedPlace, route.params?.pickKind]);

  const canProceed = (): boolean => {
    switch (stepConfig.id) {
      case 'dates':
        return (
          isValidIsoDate(answers.startDate) &&
          isValidIsoDate(answers.endDate) &&
          dayCountBetween(answers.startDate, answers.endDate) > 0
        );
      case 'title':
        return answers.title.trim().length <= TRAVEL_TITLE_MAX_LENGTH;
      case 'companions':
        return answers.companionCount >= 1 && answers.companionCount <= 20;
      case 'companionType':
      case 'travelStyle':
      case 'constraints':
      case 'attractions':
      case 'foods':
      case 'accommodation':
        return true;
      case 'generationMode':
        if (answers.generationMode === 'auto') {
          return answers.selectedAttractions.length >= 1;
        }
        return true;
      default:
        return false;
    }
  };

  const toggleId = (key: 'foodIds' | 'accommodationAreaIds', id: string) => {
    setAnswers(prev => {
      const list = prev[key];
      const exists = list.includes(id);
      return {
        ...prev,
        [key]: exists ? list.filter(x => x !== id) : [...list, id],
      };
    });
  };

  const toggleCompanionType = (type: CompanionGroupType) => {
    setAnswers(prev => {
      const exists = prev.companionTypes.includes(type);
      return {
        ...prev,
        companionTypes: exists
          ? prev.companionTypes.filter(t => t !== type)
          : [...prev.companionTypes, type],
      };
    });
  };

  const toggleTravelStyle = (id: string) => {
    setAnswers(prev => {
      const exists = prev.travelStyleIds.includes(id);
      return {
        ...prev,
        travelStyleIds: exists
          ? prev.travelStyleIds.filter(x => x !== id)
          : [...prev.travelStyleIds, id],
      };
    });
  };

  const isConstraintSelected = (id: string): boolean => {
    if (answers.otherConstraintIds.includes(TRAVEL_CONSTRAINT_NONE_ID)) {
      return id === TRAVEL_CONSTRAINT_NONE_ID;
    }
    if (id === TRAVEL_CONSTRAINT_NONE_ID) {
      return false;
    }
    if (id === 'heavy_luggage') {
      return answers.hasHeavyBaggage;
    }
    if (id === 'light_luggage') {
      return !answers.hasHeavyBaggage;
    }
    if (id === 'pets') {
      return answers.hasPets;
    }
    return answers.otherConstraintIds.includes(id);
  };

  const toggleConstraint = (id: string) => {
    setAnswers(prev => {
      if (id === TRAVEL_CONSTRAINT_NONE_ID) {
        const isNone = prev.otherConstraintIds.includes(TRAVEL_CONSTRAINT_NONE_ID);
        if (isNone) {
          return { ...prev, otherConstraintIds: [] };
        }
        return {
          ...prev,
          hasHeavyBaggage: false,
          hasPets: false,
          otherConstraintIds: [TRAVEL_CONSTRAINT_NONE_ID],
        };
      }

      const clearedNone = {
        ...prev,
        otherConstraintIds: prev.otherConstraintIds.filter(x => x !== TRAVEL_CONSTRAINT_NONE_ID),
      };

      if (id === 'heavy_luggage') {
        return { ...clearedNone, hasHeavyBaggage: true };
      }
      if (id === 'light_luggage') {
        return { ...clearedNone, hasHeavyBaggage: false };
      }
      if (id === 'pets') {
        return { ...clearedNone, hasPets: !prev.hasPets };
      }
      const exists = clearedNone.otherConstraintIds.includes(id);
      return {
        ...clearedNone,
        otherConstraintIds: exists
          ? clearedNone.otherConstraintIds.filter(x => x !== id)
          : [...clearedNone.otherConstraintIds, id],
      };
    });
  };

  const removePickedAttraction = (placeId: string) => {
    setAnswers(prev => {
      const selectedAttractions = prev.selectedAttractions.filter(item => item.placeId !== placeId);
      return {
        ...prev,
        selectedAttractions,
        attractionIds: selectedAttractions.map(item => item.placeId),
      };
    });
  };

  const openPlaceMapPick = (kind: WizardPlacePickKind) => {
    navigation.navigate('PlaceMapSearch', {
      contentTypeId:
        kind === 'accommodation'
          ? PLACE_CONTENT_TYPE.accommodation
          : PLACE_CONTENT_TYPE.attraction,
      pickFor: kind,
    });
  };

  const selectGenerationMode = (mode: 'auto' | 'candidates' | 'manual') => {
    if (mode === 'candidates' && isAlphaFeatureBlocked('planAiCandidates')) {
      showUnavailable(ALPHA_FEATURE_LABELS.planAiCandidates);
      return;
    }
    setAnswers(p => ({ ...p, generationMode: mode }));
  };

  const persistPlanAndGo = (plan: TravelPlan) => {
    addPlan(plan);
    confirmPlan(plan.planId);
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { tab: 'route' } }],
    });
  };

  const leaveWizard = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { tab: 'home' } }],
    });
  };

  const wizardMembers = (): PlanMember[] => [
    {
      userId: user?.userId ?? 'local-user',
      nickname: user?.nickname ?? 'Traveler',
      role: 'LEADER',
    },
  ];

  const finish = async () => {
    if (answers.generationMode === 'candidates') {
      showUnavailable(ALPHA_FEATURE_LABELS.planAiCandidates);
      return;
    }

    if (answers.generationMode === 'auto' && answers.selectedAttractions.length < 1) {
      alert({ title: copy.createAiNeedPlaces });
      return;
    }

    setLoading(true);
    try {
      if (!accessToken) {
        alert({ title: copy.createManualError });
        return;
      }

      if (answers.generationMode === 'manual') {
        const plan = await createManualTravelPlan({
          accessToken,
          answers,
          members: wizardMembers(),
        });
        persistPlanAndGo(plan);
        return;
      }

      const plan = await createAiTravelPlan({
        accessToken,
        answers,
        members: wizardMembers(),
        onboarding,
      });
      persistPlanAndGo(plan);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : copy.createManualError;
      if (answers.generationMode === 'auto') {
        alert({ title: copy.createAiError, message });
        leaveWizard();
        return;
      }
      alert({ title: copy.createManualError, message });
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => {
    if (step < PLAN_WIZARD_STEP_COUNT - 1) {
      setStep(s => s + 1);
      return;
    }
    finish();
  };

  const goBack = () => {
    if (step > 0) {
      setStep(s => s - 1);
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigateToMainTab(navigation, 'home');
    }
  };

  const stepLabel = `${step + 1} / ${PLAN_WIZARD_STEP_COUNT}`;
  const isLast = step === PLAN_WIZARD_STEP_COUNT - 1;

  return {
    language,
    copy,
    step,
    stepConfig,
    stepLabel,
    isLast,
    answers,
    setAnswers,
    loading,
    openPlaceMapPick,
    removePickedAttraction,
    canProceed,
    toggleId,
    toggleCompanionType,
    toggleTravelStyle,
    isConstraintSelected,
    toggleConstraint,
    selectGenerationMode,
    goNext,
    goBack,
  };
}
