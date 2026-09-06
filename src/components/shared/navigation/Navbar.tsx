import { BlurView } from '@react-native-community/blur';
import { useIsFocused } from '@react-navigation/native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TEST_ID } from '../../../constants/e2e/testIds';
import { ICON_COLOR_MUTED, ICON_COLOR_PRIMARY, NAVBAR_TAB_ICONS } from '../../../constants/icons';
import { GUIDE_TARGET } from '../../guide/guideTypes';
import { GuideTarget } from '../../guide/GuideTarget';
import { cn } from '../../../utils/common/cn';
import { AppIcon } from '../icons/AppIcon';

export type NavbarTab = 'home' | 'route' | 'feed' | 'my';

/** 탭 아이콘·라벨 영역 높이 (safe area / home indicator 패딩 제외) */
export const NAVBAR_HEIGHT = 72;

/** Navbar 실제 탭 행 높이 (pt-2 + icon/label + py-1). 액션 바 등 하단 고정 UI clearance용 */
export const NAVBAR_TAB_ROW_HEIGHT = 54;

/** absolute Navbar가 덮는 전체 높이 — 탭 콘텐츠·FAB 하단 clearance에 사용 */
export function getNavbarOverlayHeight(safeAreaBottom: number): number {
  return NAVBAR_HEIGHT + Math.max(safeAreaBottom, 8);
}

/** 하단 고정 버튼 바 → Navbar 아이콘 바로 위까지 (여백 최소) */
export function getNavbarActionBarInset(safeAreaBottom: number): number {
  return NAVBAR_TAB_ROW_HEIGHT + Math.max(safeAreaBottom, 8);
}

type TabConfig = {
  id: NavbarTab;
  labelKo: string;
  labelEn: string;
};

const TABS: TabConfig[] = [
  { id: 'home', labelKo: '홈', labelEn: 'Home' },
  { id: 'route', labelKo: '일정', labelEn: 'Itinerary' },
  { id: 'feed', labelKo: '피드', labelEn: 'Feed' },
  { id: 'my', labelKo: '마이', labelEn: 'My' },
];

const GLASS_ANDROID_OVERLAY = 'rgba(255, 255, 255, 0.45)';
const GLASS_FALLBACK = 'rgba(248, 250, 252, 0.78)';

type NavbarProps = {
  activeTab: NavbarTab;
  language?: 'ko' | 'en' | 'ja' | 'zh';
  onTabPress: (tab: NavbarTab) => void;
};

export function Navbar({ activeTab, language = 'ko', onTabPress }: NavbarProps) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const bottomPad = Math.max(insets.bottom, 8);
  /** Android BlurView는 스택 화면 위로 blur가 새어 전체 화면이 뿌옇게 보이는 버그가 있음 */
  const useLiveBlur = Platform.OS === 'ios' && isFocused;

  return (
    <View
      testID={TEST_ID.navbar.root}
      className="absolute bottom-0 left-0 right-0 z-50 overflow-hidden"
      style={{
        paddingBottom: bottomPad,
        ...Platform.select({
          ios: {
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: -6 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
          },
          android: { elevation: 16 },
        }),
      }}>
      {useLiveBlur ? (
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="light"
          blurAmount={Platform.OS === 'ios' ? 55 : 32}
          reducedTransparencyFallbackColor={GLASS_FALLBACK}
          {...(Platform.OS === 'android'
            ? {
                overlayColor: GLASS_ANDROID_OVERLAY,
                blurRadius: 25,
                downsampleFactor: 12,
              }
            : {})}
        />
      ) : (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: GLASS_FALLBACK }]}
        />
      )}
      <View pointerEvents="none" className="absolute inset-0 bg-white/25" />
      <View pointerEvents="none" className="absolute inset-x-0 top-0 border-t border-white/60" />
      <View className="flex-row items-center justify-around px-2 pt-2">
        {TABS.map(tab => {
          const active = tab.id === activeTab;
          const label = language === 'ko' ? tab.labelKo : tab.labelEn;
          const guideId =
            tab.id === 'route'
              ? GUIDE_TARGET.navbarRoute
              : tab.id === 'feed'
                ? GUIDE_TARGET.navbarFeed
                : null;
          const tabButton = (
            <Pressable
              onPress={() => onTabPress(tab.id)}
              testID={TEST_ID.navbar.tab(tab.id)}
              className="min-w-[56px] flex-1 items-center py-1 active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: active }}>
              <AppIcon
                name={NAVBAR_TAB_ICONS[tab.id]}
                size={22}
                color={active ? ICON_COLOR_PRIMARY : ICON_COLOR_MUTED}
              />
              <Text
                className={cn(
                  'mt-0.5 text-[11px] font-semibold',
                  active ? 'text-brand-primary' : 'text-brand-muted',
                )}>
                {label}
              </Text>
            </Pressable>
          );

          if (!guideId) {
            return (
              <View key={tab.id} className="min-w-[56px] flex-1">
                {tabButton}
              </View>
            );
          }

          return (
            <GuideTarget key={tab.id} id={guideId} className="min-w-[56px] flex-1">
              {tabButton}
            </GuideTarget>
          );
        })}
      </View>
    </View>
  );
}
