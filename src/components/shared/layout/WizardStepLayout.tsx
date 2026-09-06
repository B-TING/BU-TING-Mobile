import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TEST_ID } from '../../../constants/e2e/testIds';
import { layout } from '../../../constants/common/layout';

type WizardStepLayoutProps = {
  stepIndex: number;
  totalSteps: number;
  stepLabel: string;
  title: string;
  subtitle: string;
  backLabel?: string;
  onBack?: () => void;
  omitTopSafeArea?: boolean;
  children: ReactNode;
  footer: ReactNode;
  testID?: string;
};

export function WizardStepLayout({
  stepIndex,
  totalSteps,
  stepLabel,
  title,
  subtitle,
  backLabel,
  onBack,
  omitTopSafeArea = false,
  children,
  footer,
  testID = TEST_ID.planWizard.screen,
}: WizardStepLayoutProps) {
  const insets = useSafeAreaInsets();
  const progress = (stepIndex + 1) / totalSteps;

  return (
    <View
      testID={testID}
      className="flex-1 bg-brand-background px-6"
      style={[layout.screenPad24, { paddingTop: omitTopSafeArea ? 8 : insets.top + 8 }]}>
      <View className="mb-3 flex-row items-center justify-between">
        {onBack && backLabel ? (
          <Pressable
            onPress={onBack}
            testID={TEST_ID.planWizard.back}
            hitSlop={8}
            className="active:opacity-80">
            <Text className="text-sm font-semibold text-brand-primary">{backLabel}</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Text className="text-sm font-semibold text-brand-muted">{stepLabel}</Text>
      </View>

      <View className="mb-2 h-1 overflow-hidden rounded-sm bg-brand-border">
        <View
          className="h-full rounded-sm bg-brand-primary"
          style={{ width: `${progress * 100}%` }}
        />
      </View>

      <View className="flex-1 pt-4">
        <Text className="mb-2 text-[26px] font-bold leading-[34px] text-brand-text">
          {title}
        </Text>
        <Text className="mb-7 text-[15px] leading-[22px] text-brand-muted">
          {subtitle}
        </Text>
        <View className="flex-1">{children}</View>
      </View>

      <View className="pt-2" style={{ paddingBottom: insets.bottom + 16 }}>
        {footer}
      </View>
    </View>
  );
}
