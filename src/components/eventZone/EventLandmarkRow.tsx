import { Text, View } from 'react-native';

// Figma LandmarkRow: bg-white border-#E2E8F0 rounded-xl(12px), h=40, emoji 14px + name 13px medium #1E293B
type EventLandmarkRowProps = {
  emoji: string;
  name: string;
};

export function EventLandmarkRow({ emoji, name }: EventLandmarkRowProps) {
  return (
    <View className="flex-row items-center gap-2.5 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5">
      <Text className="text-[14px] leading-5">{emoji}</Text>
      <Text className="flex-1 text-[13px] font-medium leading-[18px] text-[#1E293B]">{name}</Text>
    </View>
  );
}
