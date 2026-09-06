import { Pressable, Text } from 'react-native';

import { cn } from '../../../utils/common/cn';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  testID,
}: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      className={cn(
        'items-center rounded-full py-4',
        disabled ? 'bg-[#E8EEF5]' : 'bg-brand-primary active:opacity-90',
      )}
      accessibilityRole="button"
      accessibilityState={{ disabled }}>
      <Text
        className={cn(
          'text-[17px] font-bold',
          disabled ? 'text-[#94A3B8]' : 'text-white',
        )}>
        {label}
      </Text>
    </Pressable>
  );
}
