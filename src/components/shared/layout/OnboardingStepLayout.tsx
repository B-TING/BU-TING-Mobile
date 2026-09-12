import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TEST_ID } from '../../../constants/e2e/testIds';
import { ICON_COLOR_DEFAULT } from '../../../constants/icons';
import { AppIcon } from '../icons/AppIcon';
import { SkipButton } from '../buttons/SkipButton';

type OnboardingStepLayoutProps = {
  stepIndex: number;
  stepTotal: number;
  stepLabel: string;
  title: string;
  subtitle: string;
  backLabel?: string;
  onBack?: () => void;
  skipLabel: string;
  skipAllLabel?: string;
  onSkipStep: () => void;
  onSkipAll?: () => void;
  children: ReactNode;
  footer: ReactNode;
};

export function OnboardingStepLayout({
  stepIndex,
  stepTotal,
  stepLabel,
  title,
  subtitle,
  backLabel,
  onBack,
  skipLabel,
  skipAllLabel,
  onSkipStep,
  onSkipAll,
  children,
  footer,
}: OnboardingStepLayoutProps) {
  const insets = useSafeAreaInsets();
  const activeSegments = Math.min(stepIndex + 1, stepTotal);

  return (
    <View
      testID={TEST_ID.onboarding.screen}
      className="flex-1 bg-white px-6"
      style={{ paddingTop: insets.top + 8 }}>
      <View className="mb-5 flex-row items-center gap-3">
        {onBack ? (
          <Pressable
            onPress={onBack}
            testID={TEST_ID.onboarding.back}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            className="h-9 w-9 items-center justify-center active:opacity-70">
            <AppIcon name="chevronLeft" size={24} color={ICON_COLOR_DEFAULT} />
          </Pressable>
        ) : (
          <View className="h-9 w-9" />
        )}

        <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
          {Array.from({ length: stepTotal }, (_, index) => (
            <View
              key={`progress-${index}`}
              className={`h-1 flex-1 rounded-full ${
                index < activeSegments ? 'bg-brand-primary' : 'bg-brand-border'
              }`}
            />
          ))}
        </View>

        <SkipButton
          label={skipLabel}
          onPress={onSkipStep}
          variant="secondary"
          testID={TEST_ID.onboarding.skipStep}
        />
      </View>

      {onSkipAll && skipAllLabel ? (
        <Pressable
          onPress={onSkipAll}
          testID={TEST_ID.onboarding.skipAll}
          className="mb-2 self-end active:opacity-70"
          hitSlop={8}>
          <Text className="text-xs font-medium text-brand-muted">{skipAllLabel}</Text>
        </Pressable>
      ) : null}

      <View className="flex-1">
        <Text className="mb-2 text-sm font-bold text-brand-primary">{stepLabel}</Text>
        <Text className="mb-2 text-[26px] font-bold leading-[34px] text-brand-text">
          {title}
        </Text>
        <Text className="mb-6 text-[15px] leading-[22px] text-brand-muted">
          {subtitle}
        </Text>
        <View className="flex-1">{children}</View>
      </View>

      <View className="pt-3" style={{ paddingBottom: insets.bottom + 16 }}>
        {footer}
      </View>
    </View>
  );
}
