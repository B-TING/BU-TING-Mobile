import { Pressable, Text, View } from 'react-native';

import { ICON_COLOR_WHITE } from '../../constants/icons';
import { AppIcon } from '../shared/icons/AppIcon';

type EventGameActiveBannerProps = {
  message: string;
  actionLabel: string;
  onPress: () => void;
};

/** 현재 존에 활성 게임이 있을 때 채팅 리스트 위 참여 배너 */
export function EventGameActiveBanner({
  message,
  actionLabel,
  onPress,
}: EventGameActiveBannerProps) {
  return (
    <View className="mx-3 flex-row items-center gap-2 rounded-2xl border border-pink-200 bg-pink-50 px-3 py-2.5 shadow-sm">
      <View className="h-8 w-8 items-center justify-center rounded-full bg-pink-600">
        <AppIcon name="partyPopper" size={16} color={ICON_COLOR_WHITE} />
      </View>
      <Text className="flex-1 text-xs font-semibold leading-snug text-pink-900">{message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        onPress={onPress}
        className="rounded-full bg-pink-600 px-3 py-2 active:opacity-90">
        <Text className="text-[11px] font-bold text-white">{actionLabel}</Text>
      </Pressable>
    </View>
  );
}
