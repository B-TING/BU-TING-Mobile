import { Text, View } from 'react-native';

import { cn } from '../../utils/common/cn';
import {
  BRAND_BORDER,
  BRAND_MUTED,
  BRAND_SURFACE,
  BRAND_TEXT,
  EVENT_PINK_BG,
  EVENT_PINK_BORDER,
  EVENT_PINK_DARK,
  FEEDBACK_AMBER,
  FEEDBACK_AMBER_BG,
  FEEDBACK_AMBER_BORDER,
  FEEDBACK_GREEN,
  FEEDBACK_GREEN_BG,
  FEEDBACK_GREEN_BORDER,
} from './eventZoneTheme';

type EventInfoCardTone = 'default' | 'event' | 'warning' | 'success';

type EventInfoCardProps = {
  label: string;
  title: string;
  body?: string;
  tone?: EventInfoCardTone;
};

const TONE_STYLE: Record<
  EventInfoCardTone,
  { wrap: { borderColor: string; backgroundColor: string }; label: { color: string } }
> = {
  default: {
    wrap: { borderColor: BRAND_BORDER, backgroundColor: BRAND_SURFACE },
    label: { color: BRAND_MUTED },
  },
  event: {
    wrap: { borderColor: EVENT_PINK_BORDER, backgroundColor: EVENT_PINK_BG },
    label: { color: EVENT_PINK_DARK },
  },
  warning: {
    wrap: { borderColor: FEEDBACK_AMBER_BORDER, backgroundColor: FEEDBACK_AMBER_BG },
    label: { color: FEEDBACK_AMBER },
  },
  success: {
    wrap: { borderColor: FEEDBACK_GREEN_BORDER, backgroundColor: FEEDBACK_GREEN_BG },
    label: { color: FEEDBACK_GREEN },
  },
};

export function EventInfoCard({
  label,
  title,
  body,
  tone = 'default',
}: EventInfoCardProps) {
  const styles = TONE_STYLE[tone];
  return (
    <View className={cn('gap-1 rounded-2xl border px-3.5 py-3')} style={styles.wrap}>
      <Text className="text-[11px] font-bold leading-[15px]" style={styles.label}>
        {label}
      </Text>
      <Text className="text-[13px] font-bold leading-[18px]" style={{ color: BRAND_TEXT }}>
        {title}
      </Text>
      {body ? (
        <Text className="text-xs leading-[18px]" style={{ color: BRAND_TEXT }}>
          {body}
        </Text>
      ) : null}
    </View>
  );
}
