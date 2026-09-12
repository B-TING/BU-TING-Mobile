import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PrimaryButton } from '../../components/shared/buttons/PrimaryButton';
import { BrandIcon } from '../../components/shared/brand/BrandIcon';
import { BrandLogo } from '../../components/shared/brand/BrandLogo';
import { LANGUAGE_OPTIONS } from '../../constants/setup/languages';
import { TEST_ID } from '../../constants/e2e/testIds';
import { getCopyForLanguage } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { useAppStore } from '../../stores';
import type { AppLanguage } from '../../types/user';
import { cn } from '../../utils/common/cn';
import { enterE2ESession } from '../../utils/e2e/enterE2ESession';

type Props = NativeStackScreenProps<RootStackParamList, 'LanguageSelection'>;

export function LanguageSelectionScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const isSettingsMode = route.params?.mode === 'settings';
  const currentLanguage = useAppStore(state => state.language);
  const setLanguage = useAppStore(state => state.setLanguage);
  const [selected, setSelected] = useState<AppLanguage | null>(
    isSettingsMode ? currentLanguage : null,
  );
  const copy = getCopyForLanguage('setup', selected ?? currentLanguage ?? 'ko');

  const onContinue = () => {
    if (!selected) {
      return;
    }
    setLanguage(selected);
    if (isSettingsMode) {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return;
      }
      navigation.replace('MainTabs');
      return;
    }
    navigation.replace('Onboarding');
  };

  const onE2EBootstrap = () => {
    if (!enterE2ESession()) {
      return;
    }
    navigation.replace('MainTabs');
  };

  return (
    <View
      testID={TEST_ID.language.screen}
      className="flex-1 bg-white px-6"
      style={{ paddingTop: insets.top + 28, paddingBottom: insets.bottom + 20 }}>
      {isSettingsMode ? (
        <Pressable
          onPress={() => navigation.goBack()}
          testID={TEST_ID.language.back}
          className="mb-4 self-start active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel={copy.back}
          hitSlop={8}>
          <Text className="text-sm font-semibold text-brand-muted">{copy.back}</Text>
        </Pressable>
      ) : null}
      <View className="mb-8">
        <View className="mb-3 flex-row items-center gap-2.5">
          <BrandIcon size={36} />
          <BrandLogo height={26} />
        </View>
        <Text className="mb-6 text-sm text-brand-muted">{copy.languageSlogan}</Text>
        <Text className="mb-2 text-[28px] font-bold text-brand-text">
          {copy.languageTitle}
        </Text>
        <Text className="text-[15px] leading-[22px] text-brand-muted">
          {copy.languageSubtitle}
        </Text>
      </View>

      <View className="flex-1 flex-row flex-wrap justify-between gap-y-3">
        {LANGUAGE_OPTIONS.map(option => {
          const isSelected = selected === option.code;
          return (
            <Pressable
              key={option.code}
              onPress={() => setSelected(option.code)}
              testID={TEST_ID.language.option(option.code)}
              style={{ width: '48%' }}
              className={cn(
                'rounded-[20px] border border-brand-border bg-white px-4 py-5 active:opacity-90',
                isSelected && 'border-brand-primary bg-brand-selected',
              )}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}>
              <Text
                className={cn(
                  'mb-2 text-sm font-bold text-brand-primary',
                  !isSelected && 'text-brand-primary',
                )}>
                {option.shortCode}
              </Text>
              <Text
                className={cn(
                  'mb-1 text-lg font-bold text-brand-text',
                  isSelected && 'text-brand-primary',
                )}>
                {option.nativeLabel}
              </Text>
              <Text className="text-sm text-brand-muted">{option.hintLabel}</Text>
            </Pressable>
          );
        })}
      </View>

      <View className="pt-4">
        <PrimaryButton
          testID={TEST_ID.language.continue}
          label={isSettingsMode ? copy.save : copy.continue}
          onPress={onContinue}
          disabled={!selected}
        />
        {__DEV__ && !isSettingsMode ? (
          <Pressable
            onPress={onE2EBootstrap}
            testID={TEST_ID.language.e2eBootstrap}
            className="mt-3 items-center py-2 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="E2E bootstrap">
            <Text className="text-xs font-medium text-brand-muted">E2E: 메인으로</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
