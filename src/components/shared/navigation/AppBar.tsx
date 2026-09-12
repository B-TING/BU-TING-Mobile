import type { ReactNode } from 'react';
import { Platform, Pressable, StatusBar, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TEST_ID } from '../../../constants/e2e/testIds';
import { ICON_COLOR_DEFAULT } from '../../../constants/icons';
import { BrandLogo } from '../brand/BrandLogo';
import { AppIcon } from '../icons/AppIcon';

/** 상태바·전면 카메라(펀치홀) 아래 여백 */
const TOP_GAP = 10;
/** 메뉴·로고·프로필이 들어가는 바 본문 높이 */
const BAR_HEIGHT = 48;

type AppBarProps = {
  onMenuPress?: () => void;
  onProfilePress?: () => void;
  topRightAccessory?: ReactNode;
};

/** 전면 카메라·노치 아래로 내리기 위한 상단 inset (px) */
export function useAppBarTopInset(): number {
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  return Math.max(insets.top, statusBarHeight) + TOP_GAP;
}

export function AppBar({ onMenuPress, onProfilePress, topRightAccessory }: AppBarProps) {
  const topPadding = useAppBarTopInset();

  return (
    <View
      className="border-b border-brand-border bg-brand-surface"
      style={{ paddingTop: topPadding }}>
      <View
        className="flex-row items-center justify-between px-4"
        style={{ height: BAR_HEIGHT }}>
        <Pressable
          onPress={onMenuPress}
          hitSlop={12}
          testID={TEST_ID.appBar.menu}
          className="h-10 w-10 items-center justify-center active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel="메뉴">
          <AppIcon name="menu" size={22} color={ICON_COLOR_DEFAULT} />
        </Pressable>

        <BrandLogo height={26} />

        <View className="flex-row items-center gap-2">
          {topRightAccessory}
          <Pressable
            onPress={onProfilePress}
            hitSlop={12}
            testID={TEST_ID.appBar.profile}
            className="active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="프로필">
            <View className="h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-brand-border bg-brand-selected">
              <AppIcon name="user" size={16} color={ICON_COLOR_DEFAULT} />
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** AppBar가 차지하는 대략적인 전체 높이 (safe area 제외, 스크롤 패딩 등) */
export const APP_BAR_TOTAL_HEIGHT = BAR_HEIGHT + TOP_GAP;

/** safe area 포함 AppBar 전체 높이 */
export function useAppBarTotalHeight(): number {
  return useAppBarTopInset() + BAR_HEIGHT;
}
