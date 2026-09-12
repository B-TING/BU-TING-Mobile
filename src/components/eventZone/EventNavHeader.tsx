import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { BackButton } from '../shared/buttons/BackButton';

type EventNavHeaderProps = {
  title: string;
  subtitle?: string;
  onBack: () => void;
  backAccessibilityLabel: string;
  rightAccessory?: ReactNode;
  tone?: 'light' | 'dark';
};

// Figma NavHeader: Back button(40×40 border/bg-surface rounded-xl) + Titles(title 15px bold, subtitle 11px medium)
export function EventNavHeader({
  title,
  subtitle,
  onBack,
  backAccessibilityLabel,
  rightAccessory,
  tone = 'light',
}: EventNavHeaderProps) {
  const isDark = tone === 'dark';

  return (
    <View className={isDark ? 'flex-row items-center gap-2 px-2 py-2' : 'flex-row items-center gap-2 px-2 py-2'}>
      <BackButton
        accessibilityLabel={backAccessibilityLabel}
        onPress={onBack}
      />
      <View className="min-w-0 flex-1">
        <Text
          className={isDark ? 'text-[15px] font-bold leading-[22px] text-white' : 'text-[15px] font-bold leading-[22px] text-[#1E293B]'}
          numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            className={isDark ? 'text-[11px] font-medium leading-[17px] text-white/70' : 'text-[11px] font-medium leading-[17px] text-[#64748B]'}
            numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightAccessory}
    </View>
  );
}
