import { Pressable, Text } from 'react-native';

import { cn } from '../../../utils/common/cn';

type SkipButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  testID?: string;
};

export function SkipButton({
  label,
  onPress,
  variant = 'primary',
  testID,
}: SkipButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      hitSlop={12}
      className={cn(
        'rounded-lg px-4 py-2.5 active:opacity-75',
        variant === 'primary'
          ? 'border-[1.5px] border-brand-skip-border bg-brand-skip-bg'
          : 'bg-transparent',
      )}
      accessibilityRole="button"
      accessibilityLabel={label}>
          <Text
            className={cn(
              'text-[15px] font-medium',
              variant === 'primary' ? 'text-brand-skip-text' : 'text-brand-muted',
            )}>
            {label}
          </Text>
    </Pressable>
  );
}
