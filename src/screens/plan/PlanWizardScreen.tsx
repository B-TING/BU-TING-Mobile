import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { WizardStepLayout } from '../../components/shared/layout/WizardStepLayout';
import { OptionCard } from '../../components/shared/cards/OptionCard';
import { PrimaryButton } from '../../components/shared/buttons/PrimaryButton';
import { AppIcon } from '../../components/shared/icons/AppIcon';
import { PlaceSearchListItem } from '../../components/places/PlaceSearchListItem';
import { ICON_COLOR_WHITE } from '../../constants/icons';
import { TEST_ID } from '../../constants/e2e/testIds';
import {
  TRAVEL_CONSTRAINT_OPTIONS,
  TRAVEL_STYLE_OPTIONS,
  ACCOMMODATION_AREAS,
  BUSAN_FOODS,
  COMPANION_TYPE_OPTIONS,
  PLAN_WIZARD_STEP_COUNT,
  TRAVEL_TITLE_MAX_LENGTH,
} from '../../constants/plan/planWizard';
import { usePlanWizardScreen } from '../../hooks/plan/usePlanWizardScreen';
import type { RootStackParamList } from '../../navigation/types';
import { PLACE_CONTENT_TYPE } from '../../types/placesApi';
import type { WizardPickedPlace } from '../../types/planWizard';
import type { BusanPlace } from '../../types/placeSearch';

type Props = NativeStackScreenProps<RootStackParamList, 'PlanWizard'>;

function pickedToBusanPlace(
  place: WizardPickedPlace,
  contentTypeId: BusanPlace['contentTypeId'],
): BusanPlace {
  return {
    id: place.placeId,
    contentId: place.placeId,
    contentTypeId,
    name: place.placeName,
    address: place.address ?? '',
    location: place.location,
    rating: 0,
    userRatingsTotal: 0,
    imageUrl: place.imageUrl,
  };
}

export function PlanWizardScreen(props: Props) {
  const {
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
  } = usePlanWizardScreen(props);

  const renderStep = () => {
    switch (stepConfig.id) {
      case 'title':
        return (
          <View>
            <TextInput
              testID={TEST_ID.planWizard.titleInput}
              className="rounded-2xl border-2 border-brand-border bg-brand-surface px-4 py-3.5 text-base text-brand-text"
              value={answers.title}
              onChangeText={title => setAnswers(p => ({ ...p, title }))}
              placeholder={copy.travelTitlePlaceholder}
              placeholderTextColor="#94A3B8"
              maxLength={TRAVEL_TITLE_MAX_LENGTH}
              autoCapitalize="sentences"
              autoCorrect={false}
              accessibilityLabel={stepConfig.title[language]}
            />
            <Text className="mt-2 text-right text-xs text-brand-muted">
              {copy.travelTitleCount(answers.title.length, TRAVEL_TITLE_MAX_LENGTH)}
            </Text>
          </View>
        );
      case 'dates':
        return (
          <View>
            <Text className="mb-2 text-sm font-semibold text-brand-muted">
              {copy.startDate}
            </Text>
            <TextInput
              className="mb-4 rounded-2xl border-2 border-brand-border bg-brand-surface px-4 py-3.5 text-base text-brand-text"
              value={answers.startDate}
              onChangeText={startDate => setAnswers(p => ({ ...p, startDate }))}
              placeholder="2026-06-15"
              autoCapitalize="none"
            />
            <Text className="mb-2 text-sm font-semibold text-brand-muted">
              {copy.endDate}
            </Text>
            <TextInput
              className="rounded-2xl border-2 border-brand-border bg-brand-surface px-4 py-3.5 text-base text-brand-text"
              value={answers.endDate}
              onChangeText={endDate => setAnswers(p => ({ ...p, endDate }))}
              placeholder="2026-06-16"
              autoCapitalize="none"
            />
          </View>
        );
      case 'companions':
        return (
          <View className="items-center pt-8">
            <Text className="mb-6 text-4xl font-bold text-brand-primary">
              {copy.countLabel(answers.companionCount)}
            </Text>
            <View className="flex-row gap-6">
              <Pressable
                className="h-14 w-14 items-center justify-center rounded-full bg-brand-primary active:opacity-90"
                onPress={() =>
                  setAnswers(p => ({
                    ...p,
                    companionCount: Math.max(1, p.companionCount - 1),
                  }))
                }>
                <AppIcon name="minus" size={24} color={ICON_COLOR_WHITE} strokeWidth={2.5} />
              </Pressable>
              <Pressable
                className="h-14 w-14 items-center justify-center rounded-full bg-brand-primary active:opacity-90"
                onPress={() =>
                  setAnswers(p => ({
                    ...p,
                    companionCount: Math.min(20, p.companionCount + 1),
                  }))
                }>
                <AppIcon name="plus" size={24} color={ICON_COLOR_WHITE} strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>
        );
      case 'companionType':
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            {COMPANION_TYPE_OPTIONS.map(opt => (
              <OptionCard
                key={opt.id}
                label={opt.label[language]}
                selected={answers.companionTypes.includes(opt.id)}
                onPress={() => toggleCompanionType(opt.id)}
              />
            ))}
          </ScrollView>
        );
      case 'travelStyle':
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            {TRAVEL_STYLE_OPTIONS.map(opt => (
              <OptionCard
                key={opt.id}
                label={opt.label[language]}
                selected={answers.travelStyleIds.includes(opt.id)}
                compact
                onPress={() => toggleTravelStyle(opt.id)}
              />
            ))}
          </ScrollView>
        );
      case 'constraints':
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="mb-3 text-sm text-brand-muted">{copy.constraintHint}</Text>
            {TRAVEL_CONSTRAINT_OPTIONS.map(opt => (
              <OptionCard
                key={opt.id}
                label={opt.label[language]}
                selected={isConstraintSelected(opt.id)}
                onPress={() => toggleConstraint(opt.id)}
              />
            ))}
          </ScrollView>
        );
      case 'attractions':
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            {answers.selectedAttractions.length === 0 ? (
              <Text className="mb-3 text-sm text-brand-muted">{copy.selectedPlacesEmpty}</Text>
            ) : (
              answers.selectedAttractions.map(place => (
                <PlaceSearchListItem
                  key={place.placeId}
                  place={pickedToBusanPlace(place, PLACE_CONTENT_TYPE.attraction)}
                  selected
                  meta={place.address}
                  onPress={() => removePickedAttraction(place.placeId)}
                />
              ))
            )}
            <Pressable
              onPress={() => openPlaceMapPick('attractions')}
              accessibilityRole="button"
              accessibilityLabel={copy.pickPlace}
              className="mt-2 items-center rounded-2xl border-2 border-brand-primary bg-brand-surface px-4 py-3.5 active:opacity-90">
              <Text className="text-base font-bold text-brand-primary">{copy.pickPlace}</Text>
            </Pressable>
          </ScrollView>
        );
      case 'foods':
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            {BUSAN_FOODS.map(opt => (
              <OptionCard
                key={opt.id}
                label={opt.label[language]}
                selected={answers.foodIds.includes(opt.id)}
                compact
                onPress={() => toggleId('foodIds', opt.id)}
              />
            ))}
          </ScrollView>
        );
      case 'accommodation':
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            <OptionCard
              label={copy.accBooked}
              selected={answers.accommodationMode === 'booked'}
              onPress={() =>
                setAnswers(p => ({
                  ...p,
                  accommodationMode: 'booked',
                  accommodationAreaIds: [],
                }))
              }
            />
            <OptionCard
              label={copy.accArea}
              selected={answers.accommodationMode === 'area_only'}
              onPress={() =>
                setAnswers(p => ({
                  ...p,
                  accommodationMode: 'area_only',
                  accommodationPlaceId: null,
                  accommodationName: null,
                  bookedAccommodation: null,
                }))
              }
            />
            {answers.accommodationMode === 'booked' ? (
              <View className="mt-2">
                {answers.bookedAccommodation ? (
                  <PlaceSearchListItem
                    place={pickedToBusanPlace(
                      answers.bookedAccommodation,
                      PLACE_CONTENT_TYPE.accommodation,
                    )}
                    meta={answers.bookedAccommodation.address}
                    selected
                    onPress={() => openPlaceMapPick('accommodation')}
                  />
                ) : (
                  <Text className="mb-3 text-sm text-brand-muted">{copy.accSearchPlaceholder}</Text>
                )}
                <Pressable
                  onPress={() => openPlaceMapPick('accommodation')}
                  accessibilityRole="button"
                  accessibilityLabel={copy.pickStay}
                  className="mt-2 items-center rounded-2xl border-2 border-brand-primary bg-brand-surface px-4 py-3.5 active:opacity-90">
                  <Text className="text-base font-bold text-brand-primary">{copy.pickStay}</Text>
                </Pressable>
              </View>
            ) : (
              <View className="mt-2">
                {ACCOMMODATION_AREAS.map(area => (
                  <OptionCard
                    key={area.id}
                    label={area.label[language]}
                    selected={answers.accommodationAreaIds.includes(area.id)}
                    compact
                    onPress={() => toggleId('accommodationAreaIds', area.id)}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        );
      case 'generationMode':
        return (
          <>
            <OptionCard
              label={copy.modeAuto}
              selected={answers.generationMode === 'auto'}
              onPress={() => selectGenerationMode('auto')}
            />
            <Text className="-mt-1 mb-3 ml-1 text-xs text-brand-muted">
              {copy.modeAutoSub}
            </Text>
            {answers.generationMode === 'auto' &&
            answers.selectedAttractions.length < 1 ? (
              <Text className="-mt-2 mb-3 ml-1 text-xs text-red-500">
                {copy.createAiNeedPlaces}
              </Text>
            ) : null}
            <OptionCard
              label={copy.modeManual}
              selected={answers.generationMode === 'manual'}
              onPress={() => selectGenerationMode('manual')}
            />
            <Text className="-mt-1 mb-3 ml-1 text-xs text-brand-muted">
              {copy.modeManualSub}
            </Text>
          </>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background px-6">
        <ActivityIndicator size="large" color="#0077B6" />
        <Text className="mt-4 text-base text-brand-muted">
          {answers.generationMode === 'manual' ? copy.creatingManual : copy.generating}
        </Text>
      </View>
    );
  }

  return (
    <WizardStepLayout
      stepIndex={step}
      totalSteps={PLAN_WIZARD_STEP_COUNT}
      stepLabel={stepLabel}
      title={stepConfig.title[language]}
      subtitle={stepConfig.subtitle[language]}
      backLabel={copy.back}
      onBack={goBack}
      footer={
        <PrimaryButton
          testID={TEST_ID.planWizard.next}
          label={isLast ? copy.finish : copy.next}
          onPress={goNext}
          disabled={!canProceed()}
        />
      }>
      {renderStep()}
    </WizardStepLayout>
  );
}
