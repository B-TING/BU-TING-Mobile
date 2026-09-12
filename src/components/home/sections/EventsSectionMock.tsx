import { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { festivalTagLabel } from '../../../constants/festival/festivalCalendar';
import type { MockEvent } from '../../../constants/home/mainHome';
import { TEST_ID } from '../../../constants/e2e/testIds';
import { ICON_COLOR_WHITE } from '../../../constants/icons';
import type { AppLanguage } from '../../../types/user';
import { cn } from '../../../utils/common/cn';
import { AppIcon } from '../../shared/icons/AppIcon';

type EventsSectionMockProps = {
  title: string;
  viewAllLabel: string;
  events: MockEvent[];
  language?: AppLanguage;
  onViewAllPress?: () => void;
  onEventPress?: (id: string) => void;
};

function pickLocalizedEventField(
  event: MockEvent,
  field: 'title' | 'location' | 'date',
  language: AppLanguage,
): string {
  if (field === 'title') {
    if (language === 'ja') return event.titleJa;
    if (language === 'zh') return event.titleZh;
    if (language === 'en') return event.titleEn;
    return event.titleKo;
  }
  if (field === 'location') {
    if (language === 'ja') return event.locationJa;
    if (language === 'zh') return event.locationZh;
    if (language === 'en') return event.locationEn;
    return event.locationKo;
  }
  if (language === 'ja') return event.dateJa;
  if (language === 'zh') return event.dateZh;
  if (language === 'en') return event.dateEn;
  return event.dateKo;
}

function EventCard({
  event,
  language,
  onPress,
}: {
  event: MockEvent;
  language: AppLanguage;
  onPress?: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const title = pickLocalizedEventField(event, 'title', language);
  const location = pickLocalizedEventField(event, 'location', language);
  const date = pickLocalizedEventField(event, 'date', language);
  const hasImage = Boolean(event.imageUri) && !imageFailed;

  const overlay = (
    <View style={styles.imageOverlay}>
      <View
        className={cn(
          'self-start rounded-md px-2 py-0.5',
          event.tag === 'FESTIVAL' ? 'bg-brand-primary' : 'bg-orange-500',
        )}>
        <Text className="text-[10px] font-bold text-white">
          {festivalTagLabel(event.tag, language)}
        </Text>
      </View>
      <Text className="mt-2 text-sm font-bold text-white" numberOfLines={2}>
        {title}
      </Text>
      <Text className="mt-1 text-xs font-medium text-white/90">
        {location} • {date}
      </Text>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      className="mr-3 w-[260px] overflow-hidden rounded-2xl active:opacity-90"
      accessibilityRole="button">
      {hasImage ? (
        <ImageBackground
          source={{ uri: event.imageUri }}
          style={styles.card}
          imageStyle={styles.imageFill}
          resizeMode="cover"
          onError={() => setImageFailed(true)}>
          {overlay}
        </ImageBackground>
      ) : (
        <View style={[styles.card, { backgroundColor: event.imageColor }]}>
          <View className="absolute inset-0 items-center justify-center opacity-40">
            <AppIcon name={event.imageIcon} size={48} color={ICON_COLOR_WHITE} />
          </View>
          {overlay}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 180,
    justifyContent: 'flex-end',
  },
  imageFill: {
    borderRadius: 16,
  },
  imageOverlay: {
    padding: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
});

export function EventsSectionMock({
  title,
  viewAllLabel,
  events,
  language = 'ko',
  onViewAllPress,
  onEventPress,
}: EventsSectionMockProps) {
  return (
    <View className="mb-6">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-bold text-brand-text">{title}</Text>
        <Pressable
          onPress={onViewAllPress}
          testID={TEST_ID.home.eventsViewAll}
          hitSlop={8}
          className="active:opacity-70">
          <Text className="text-sm font-semibold text-brand-muted">{viewAllLabel}</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 8 }}>
        {events.map(event => (
          <EventCard
            key={event.id}
            event={event}
            language={language}
            onPress={() => onEventPress?.(event.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
