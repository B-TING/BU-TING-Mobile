import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { QuickAccessItem } from '../../../constants/home/mainHome';
import { TEST_ID } from '../../../constants/e2e/testIds';
import { ICON_COLOR_PRIMARY } from '../../../constants/icons';
import { GUIDE_TARGET } from '../../guide/guideTypes';
import { GuideTarget } from '../../guide/GuideTarget';
import { AppIcon } from '../../shared/icons/AppIcon';

type QuickAccessRowProps = {
  items: QuickAccessItem[];
  language?: 'ko' | 'en' | 'ja' | 'zh';
  onItemPress?: (id: string) => void;
};

const QUICK_GUIDE_IDS: Record<string, string> = {
  luggage: GUIDE_TARGET.quickLuggage,
  festivals: GUIDE_TARGET.quickFestivals,
  restaurants: GUIDE_TARGET.quickRestaurants,
  attractions: GUIDE_TARGET.quickAttractions,
  hotels: GUIDE_TARGET.quickHotels,
};

export function QuickAccessRow({
  items,
  language = 'ko',
  onItemPress,
}: QuickAccessRowProps) {
  return (
    <GuideTarget id={GUIDE_TARGET.quickAccessRow} className="mb-6">
      <View className="flex-row justify-between">
        {items.map(item => {
          const guideId = QUICK_GUIDE_IDS[item.id];
          const content = (
            <Pressable
              onPress={() => onItemPress?.(item.id)}
              testID={TEST_ID.home.quickAccess(item.id)}
              className="w-full items-center active:opacity-80"
              accessibilityRole="button">
              <View
                style={[styles.iconShadow, styles.border]}
                className="mb-2 h-14 w-14 items-center justify-center rounded-2xl bg-white">
                <AppIcon name={item.icon} size={26} color={ICON_COLOR_PRIMARY} />
              </View>
              <Text className="text-center text-xs font-semibold text-brand-text">
                {language === 'ko' ? item.labelKo : item.labelEn}
              </Text>
            </Pressable>
          );

          if (!guideId) {
            return (
              <View key={item.id} className="flex-1">
                {content}
              </View>
            );
          }

          return (
            <GuideTarget key={item.id} id={guideId} className="flex-1">
              {content}
            </GuideTarget>
          );
        })}
      </View>
    </GuideTarget>
  );
}

const styles = StyleSheet.create({
  border: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconShadow: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 2,
  },
});
