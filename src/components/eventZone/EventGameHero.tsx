import { Text, View } from 'react-native';

import { EVENT_HERO_BLUE, EVENT_HERO_PURPLE } from './eventZoneTheme';

type EventGameHeroProps = {
  emoji?: string;
  label: string;
};

// Figma GameHero: gradient 155.9deg #0777B6→#8B5CF6 (blue bottom-left → purple top-right), h=160, rounded-[20px], label 14px bold white center
export function EventGameHero({ emoji, label }: EventGameHeroProps) {
  return (
    <View
      className="h-40 items-center justify-center overflow-hidden rounded-[20px]"
      style={{ backgroundColor: EVENT_HERO_BLUE }}>
      {/* Gradient overlay: purple from top-right */}
      <View
        className="absolute bottom-0 left-0 right-0 top-0"
        style={{
          backgroundColor: EVENT_HERO_PURPLE,
          opacity: 0.55,
        }}
      />
      <Text className="z-10 px-4 text-center text-[14px] font-bold leading-5 text-white">
        {emoji ? `${emoji}  ${label}` : label}
      </Text>
    </View>
  );
}
