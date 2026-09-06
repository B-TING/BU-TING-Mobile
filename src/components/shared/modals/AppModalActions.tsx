import { Pressable, Text, View } from 'react-native';

import { cn } from '../../../utils/common/cn';

export type AppModalAction = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  testID?: string;
};

type AppModalActionsProps = {
  actions: AppModalAction[];
  className?: string;
};

export function AppModalActions({ actions, className }: AppModalActionsProps) {
  return (
    <View className={cn('flex-row gap-3 px-5', className)}>
      {actions.map(action => {
        const isPrimary = action.variant === 'primary' || action.variant === 'danger';
        const isDanger = action.variant === 'danger';

        return (
          <Pressable
            key={action.label}
            onPress={action.onPress}
            disabled={action.disabled}
            testID={action.testID}
            className={cn(
              'flex-1 items-center rounded-2xl py-3.5 active:opacity-90',
              action.disabled && 'opacity-50',
              isPrimary
                ? isDanger
                  ? 'bg-red-600'
                  : 'bg-brand-primary'
                : 'border border-brand-border bg-brand-surface active:opacity-80',
            )}
            accessibilityRole="button">
            <Text className={cn('font-bold', isPrimary ? 'text-white' : 'text-brand-text')}>
              {action.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type AppModalPrimaryFooterProps = {
  confirmLabel: string;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  cancelLabel: string;
  onCancel: () => void;
  className?: string;
};

export function AppModalPrimaryFooter({
  confirmLabel,
  onConfirm,
  confirmDisabled,
  cancelLabel,
  onCancel,
  className,
}: AppModalPrimaryFooterProps) {
  return (
    <View className={cn('px-5 pt-2', className)}>
      <Pressable
        onPress={onConfirm}
        disabled={confirmDisabled}
        className={cn(
          'mb-2 items-center rounded-2xl py-3.5 active:opacity-90',
          confirmDisabled ? 'bg-brand-border' : 'bg-brand-primary',
        )}>
        <Text
          className={cn(
            'text-[15px] font-bold',
            confirmDisabled ? 'text-brand-muted' : 'text-white',
          )}>
          {confirmLabel}
        </Text>
      </Pressable>
      <Pressable onPress={onCancel} className="items-center py-2 active:opacity-80">
        <Text className="text-sm font-semibold text-brand-muted">{cancelLabel}</Text>
      </Pressable>
    </View>
  );
}
