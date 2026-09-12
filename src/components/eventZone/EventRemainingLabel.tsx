import { Text, View } from 'react-native';

import { AppIcon } from '../shared/icons/AppIcon';
import type { AppLanguage } from '../../types/user';
import type { ZoneEvent } from '../../types/eventZone';
import { cn } from '../../utils/common/cn';
import {
  formatZoneEventRemaining,
  useZoneEventRemaining,
} from '../../utils/eventZone/zoneEventRemaining';
import { EVENT_PINK } from './eventZoneTheme';

type EventRemainingLabelProps = {
  event: ZoneEvent;
  language: AppLanguage;
  endsInLabel: (remaining: string) => string;
  endedLabel: string;
  /** 기본 `mt-1.5` — 배너/카드 여백에 맞춰 덮어쓸 때 */
  className?: string;
};

export function EventRemainingLabel({
  event,
  language,
  endsInLabel,
  endedLabel,
  className,
}: EventRemainingLabelProps) {
  const remainingMs = useZoneEventRemaining(event);
  const remainingText = formatZoneEventRemaining(remainingMs, language);

  return (
    <View className={cn('mt-1.5 flex-row items-center gap-1.5', className)}>
      <AppIcon name="timer" size={12} color={EVENT_PINK} />
      <Text className="text-xs font-semibold" style={{ color: EVENT_PINK }}>
        {remainingMs > 0 ? endsInLabel(remainingText) : endedLabel}
      </Text>
    </View>
  );
}
