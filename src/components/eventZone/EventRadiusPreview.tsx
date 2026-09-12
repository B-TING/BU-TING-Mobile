import { Text, View } from 'react-native';

type EventRadiusPreviewProps = {
  placeName: string;
  radiusLabel: string;
};

export function EventRadiusPreview({ placeName, radiusLabel }: EventRadiusPreviewProps) {
  return (
    <View className="h-[220px] items-center justify-center overflow-hidden rounded-[20px] bg-neutral-200">
      <View className="h-[150px] w-[150px] items-center justify-center rounded-full border-2 border-dashed border-brand-primary/70 bg-white/70">
        <Text className="px-3 text-center text-[13px] font-bold text-brand-text">{placeName}</Text>
        <Text className="mt-1 text-center text-[11px] font-medium text-pink-600">{radiusLabel}</Text>
      </View>
    </View>
  );
}
