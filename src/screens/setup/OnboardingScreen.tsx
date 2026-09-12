import { type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PrimaryButton } from '../../components/shared/buttons/PrimaryButton';
import { BrandLogo } from '../../components/shared/brand/BrandLogo';
import { OptionCard } from '../../components/shared/cards/OptionCard';
import { OnboardingFeatureGuide } from '../../components/setup/OnboardingFeatureGuide';
import { OnboardingStepLayout } from '../../components/shared/layout/OnboardingStepLayout';
import { OnboardingThankYouView } from '../../components/shared/layout/OnboardingThankYouView';
import {
  COMPANION_OPTIONS,
  FAMILIARITY_OPTIONS,
  LUGGAGE_OPTIONS,
  PURPOSE_OPTIONS,
  SCHEDULE_PACE_OPTIONS,
  TRAVEL_STYLE_OPTIONS,
} from '../../constants/setup/onboarding';
import { TEST_ID } from '../../constants/e2e/testIds';
import { useOnboardingScreen } from '../../hooks/setup/useOnboardingScreen';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation, route }: Props) {
  const {
    language,
    copy,
    answers,
    step,
    stepCount,
    stepConfig,
    isWelcomeStep,
    isFeatureStep,
    isEditMode,
    pendingComplete,
    featureContent,
    title,
    subtitle,
    footerLabel,
    goNext,
    goPrevious,
    onSkipStep,
    onSkipAll,
    canProceed,
    selectTravelStyle,
    selectSchedulePace,
    selectCompanions,
    selectLuggage,
    togglePurpose,
    selectBusanFamiliarity,
    handleThankYouComplete,
  } = useOnboardingScreen({
    navigation,
    mode: route.params?.mode,
  });

  const renderOptionGrid = (cards: ReactNode[]) => (
    <View className="flex-row flex-wrap justify-between">{cards}</View>
  );

  const renderOptions = () => {
    if (stepConfig.kind !== 'question') {
      return null;
    }
    switch (stepConfig.id) {
      case 'travelStyle':
        return renderOptionGrid(
          TRAVEL_STYLE_OPTIONS.map(opt => (
            <OptionCard
              key={opt.value}
              grid
              emoji={opt.emoji}
              label={opt.label[language]}
              description={opt.description?.[language]}
              selected={answers.travelStyle === opt.value}
              onPress={() => selectTravelStyle(opt.value)}
              testID={TEST_ID.onboarding.option(opt.value)}
            />
          )),
        );
      case 'schedulePace':
        return renderOptionGrid(
          SCHEDULE_PACE_OPTIONS.map(opt => (
            <OptionCard
              key={opt.value}
              grid
              emoji={opt.emoji}
              label={opt.label[language]}
              description={opt.description?.[language]}
              selected={answers.schedulePace === opt.value}
              onPress={() => selectSchedulePace(opt.value)}
              testID={TEST_ID.onboarding.option(opt.value)}
            />
          )),
        );
      case 'companions':
        return renderOptionGrid(
          COMPANION_OPTIONS.map(opt => (
            <OptionCard
              key={opt.value}
              grid
              emoji={opt.emoji}
              label={opt.label[language]}
              description={opt.description?.[language]}
              selected={answers.companions === opt.value}
              onPress={() => selectCompanions(opt.value)}
              testID={TEST_ID.onboarding.option(opt.value)}
            />
          )),
        );
      case 'luggage':
        return renderOptionGrid(
          LUGGAGE_OPTIONS.map(opt => (
            <OptionCard
              key={opt.value}
              grid
              emoji={opt.emoji}
              label={opt.label[language]}
              description={opt.description?.[language]}
              selected={answers.luggage === opt.value}
              onPress={() => selectLuggage(opt.value)}
              testID={TEST_ID.onboarding.option(opt.value)}
            />
          )),
        );
      case 'purposes':
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row flex-wrap justify-between">
              {PURPOSE_OPTIONS.map(opt => (
                <OptionCard
                  key={opt.value}
                  grid
                  emoji={opt.emoji}
                  label={opt.label[language]}
                  description={opt.description?.[language]}
                  selected={answers.purposes.includes(opt.value)}
                  onPress={() => togglePurpose(opt.value)}
                  testID={TEST_ID.onboarding.option(opt.value)}
                />
              ))}
            </View>
          </ScrollView>
        );
      case 'busanFamiliarity':
        return renderOptionGrid(
          FAMILIARITY_OPTIONS.map(opt => (
            <OptionCard
              key={opt.value}
              grid
              emoji={opt.emoji}
              label={opt.label[language]}
              description={opt.description?.[language]}
              selected={answers.busanFamiliarity === opt.value}
              onPress={() => selectBusanFamiliarity(opt.value)}
              testID={TEST_ID.onboarding.option(opt.value)}
            />
          )),
        );
      default:
        return null;
    }
  };

  if (pendingComplete) {
    return (
      <OnboardingThankYouView
        title={copy.thankYouTitle}
        privacy={copy.thankYouPrivacy}
        waitLabel={copy.thankYouWait}
        backLabel={copy.back}
        onBack={goPrevious}
        onComplete={handleThankYouComplete}
      />
    );
  }

  if (isFeatureStep && featureContent) {
    return (
      <OnboardingFeatureGuide
        features={featureContent.features}
        language={language}
        nextLabel={footerLabel}
        skipLabel={copy.skip}
        onNext={goNext}
        onSkip={onSkipStep}
        onBack={goPrevious}
        backLabel={copy.back}
        navigation={navigation}
      />
    );
  }

  return (
    <OnboardingStepLayout
      stepIndex={step}
      stepTotal={stepCount}
      stepLabel={copy.stepOf(step + 1, stepCount)}
      title={title}
      subtitle={subtitle}
      backLabel={copy.back}
      onBack={goPrevious}
      skipLabel={copy.skip}
      skipAllLabel={isEditMode ? copy.cancelEdit : copy.skipAll}
      onSkipStep={onSkipStep}
      onSkipAll={onSkipAll}
      footer={
        <PrimaryButton
          testID={TEST_ID.onboarding.next}
          label={footerLabel}
          onPress={goNext}
          disabled={!canProceed()}
        />
      }>
      <View className="flex-1">
        {isWelcomeStep ? (
          <View className="flex-1 items-center justify-center">
            <BrandLogo height={48} style={{ marginBottom: 24 }} />
            <Text className="text-center text-base leading-6 text-brand-muted">
              {language === 'ko'
                ? '건너뛰기를 눌러 바로 시작할 수도 있어요.'
                : 'You can skip anytime to get started faster.'}
            </Text>
          </View>
        ) : (
          renderOptions()
        )}
      </View>
    </OnboardingStepLayout>
  );
}
