import { useEffect } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TEST_ID } from '../../../constants/e2e/testIds';
import { ONBOARDING_COMPLETE_DELAY_MS } from '../../../constants/setup/onboarding';
import { layout } from '../../../constants/common/layout';

type OnboardingThankYouViewProps = {
  title: string;
  privacy: string;
  waitLabel: string;
  backLabel?: string;
  onBack?: () => void;
  onComplete: () => void;
};

export function OnboardingThankYouView({
  title,
  privacy,
  waitLabel,
  backLabel,
  onBack,
  onComplete,
}: OnboardingThankYouViewProps) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const timer = setTimeout(onComplete, ONBOARDING_COMPLETE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <View
      testID={TEST_ID.onboarding.thankYou}
      className="flex-1 bg-brand-background px-8"
      style={[layout.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}>
      {onBack && backLabel ? (
        <Pressable onPress={onBack} hitSlop={8} className="mb-4 self-start active:opacity-80">
          <Text className="text-sm font-semibold text-brand-primary">{backLabel}</Text>
        </Pressable>
      ) : null}
      <View className="flex-1 items-center justify-center">
        <Text className="mb-4 text-center text-[26px] font-bold leading-[34px] text-brand-text">
          {title}
        </Text>
        <Text className="mb-10 text-center text-[15px] leading-[24px] text-brand-muted">
          {privacy}
        </Text>
        <ActivityIndicator size="large" color="#0077B6" />
        <Text className="mt-5 text-center text-sm text-brand-muted">{waitLabel}</Text>
      </View>
    </View>
  );
}
