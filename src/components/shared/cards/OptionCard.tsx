import { Pressable, Text, View } from 'react-native';

import type { LucideIconName } from '../../../constants/icons';
import { ICON_COLOR_PRIMARY } from '../../../constants/icons';
import { cn } from '../../../utils/common/cn';
import { AppIcon } from '../icons/AppIcon';

type OptionCardProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
  description?: string;
  emoji?: string;
  icon?: LucideIconName;
  /** 2열 그리드 셀 */
  grid?: boolean;
  testID?: string;
};

export function OptionCard({
  label,
  selected,
  onPress,
  compact = false,
  description,
  emoji,
  icon,
  grid = false,
  testID,
}: OptionCardProps) {
  const showMedia = Boolean(emoji || icon);

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={grid ? { width: '48%' } : undefined}
      className={cn(
        'rounded-[20px] border border-brand-border bg-white active:opacity-90',
        grid ? 'mb-3 px-4 py-4' : 'mb-3 px-5',
        !grid && (compact ? 'py-3.5' : 'py-4'),
        !grid && 'flex-row items-center',
        selected && 'border-brand-primary bg-brand-selected',
      )}
      accessibilityRole="button"
      accessibilityState={{ selected }}>
      {showMedia ? (
        <View className={cn(grid ? 'mb-2.5' : 'mr-3.5')}>
          {emoji ? (
            <Text className="text-[22px] leading-7">{emoji}</Text>
          ) : icon ? (
            <AppIcon name={icon} size={22} color={ICON_COLOR_PRIMARY} />
          ) : null}
        </View>
      ) : null}
      <View className={cn(!grid && 'min-w-0 flex-1')}>
        <Text
          className={cn(
            'font-bold text-brand-text',
            grid ? 'text-[16px]' : 'text-[17px]',
            selected && 'text-brand-primary',
          )}>
          {label}
        </Text>
        {description ? (
          <Text className="mt-1 text-sm text-brand-muted" numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
