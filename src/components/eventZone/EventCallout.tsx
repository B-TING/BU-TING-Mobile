import { Text, View } from 'react-native';

import { cn } from '../../utils/common/cn';
import {
  BRAND_PRIMARY,
  BRAND_SELECTED,
  BRAND_TEXT,
  EVENT_PINK_BG,
  EVENT_PINK_BORDER,
  EVENT_PINK_DARK,
  FEEDBACK_AMBER,
  FEEDBACK_AMBER_BG,
} from './eventZoneTheme';

export type EventCalloutTone = 'warning' | 'event' | 'info';

type EventCalloutProps = {
  title: string;
  body: string;
  tone?: EventCalloutTone;
};

const TONE_STYLE: Record<
  EventCalloutTone,
  { wrap: { borderColor: string; backgroundColor: string }; title: { color: string } }
> = {
  event: {
    wrap: { borderColor: EVENT_PINK_BORDER, backgroundColor: EVENT_PINK_BG },
    title: { color: EVENT_PINK_DARK },
  },
  info: {
    wrap: { borderColor: BRAND_PRIMARY, backgroundColor: BRAND_SELECTED },
    title: { color: BRAND_PRIMARY },
  },
  warning: {
    wrap: { borderColor: FEEDBACK_AMBER, backgroundColor: FEEDBACK_AMBER_BG },
    title: { color: FEEDBACK_AMBER },
  },
};

export function EventCallout({ title, body, tone = 'warning' }: EventCalloutProps) {
  const styles = TONE_STYLE[tone];

  return (
    <View className={cn('gap-1.5 rounded-2xl border px-3.5 py-3')} style={styles.wrap}>
      <Text className="text-[13px] font-bold leading-5" style={styles.title}>
        {title}
      </Text>
      <Text className="text-xs leading-[18px]" style={{ color: BRAND_TEXT }}>
        {body}
      </Text>
    </View>
  );
}
