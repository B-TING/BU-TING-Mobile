import { Pressable, Text } from 'react-native';

import { cn } from '../../utils/common/cn';
import {
  BRAND_BORDER,
  BRAND_MUTED,
  BRAND_PRIMARY,
  BRAND_SURFACE,
  BRAND_TEXT,
  EVENT_PINK,
} from './eventZoneTheme';

export type EventActionButtonVariant = 'event' | 'primary' | 'ghost' | 'disabled';

type EventActionButtonProps = {
  label: string;
  onPress: () => void;
  variant?: EventActionButtonVariant;
  disabled?: boolean;
  accessibilityLabel?: string;
};

const VARIANT_STYLE: Record<
  EventActionButtonVariant,
  {
    wrap: { backgroundColor: string; borderColor?: string; borderWidth?: number };
    text: { color: string };
  }
> = {
  event: { wrap: { backgroundColor: EVENT_PINK }, text: { color: '#FFFFFF' } },
  primary: { wrap: { backgroundColor: BRAND_PRIMARY }, text: { color: '#FFFFFF' } },
  ghost: {
    wrap: { backgroundColor: BRAND_SURFACE, borderColor: BRAND_BORDER, borderWidth: 1 },
    text: { color: BRAND_TEXT },
  },
  disabled: {
    wrap: { backgroundColor: BRAND_BORDER },
    text: { color: BRAND_MUTED },
  },
};

export function EventActionButton({
  label,
  onPress,
  variant = 'event',
  disabled = false,
  accessibilityLabel,
}: EventActionButtonProps) {
  const effectiveVariant = disabled ? 'disabled' : variant;
  const styles = VARIANT_STYLE[effectiveVariant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={cn(
        'min-h-[48px] items-center justify-center rounded-xl px-4 py-3 active:opacity-90',
        disabled && 'opacity-60',
      )}
      style={styles.wrap}>
      <Text className="text-[15px] font-bold leading-[21px]" style={styles.text}>
        {label}
      </Text>
    </Pressable>
  );
}
