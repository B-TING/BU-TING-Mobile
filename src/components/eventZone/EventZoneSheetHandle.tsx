import { View } from 'react-native';

// Figma SheetHandle: w=358 h=16, bar w=36 h=4 rounded-[2px] bg=#CBD5E1
export function EventZoneSheetHandle() {
  return (
    <View className="items-center py-2" pointerEvents="none">
      <View className="h-1 w-9 rounded-full bg-[#CBD5E1]" />
    </View>
  );
}
