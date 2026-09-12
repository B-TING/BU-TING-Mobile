import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { ICON_COLOR_WHITE } from '../../constants/icons';
import { TEST_ID } from '../../constants/e2e/testIds';
import { GUIDE_TARGET } from '../guide/guideTypes';
import { GuideTarget } from '../guide/GuideTarget';
import { AppIcon } from '../shared/icons/AppIcon';

const FAB_SIZE = 56;
const GLOW_RING = 12;

type HelpDeskChatFabProps = {
  onPress: () => void;
  bottom: number;
  accessibilityLabel: string;
};

export function HelpDeskChatFab({ onPress, bottom, accessibilityLabel }: HelpDeskChatFabProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.88,
        friction: 5,
        tension: 320,
        useNativeDriver: true,
      }),
      Animated.spring(glow, {
        toValue: 1.18,
        friction: 5,
        tension: 280,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.92,
        duration: 70,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 280,
        useNativeDriver: true,
      }),
      Animated.spring(glow, {
        toValue: 1,
        friction: 6,
        tension: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <GuideTarget
      id={GUIDE_TARGET.helpFab}
      className="absolute right-4 z-20"
      style={{ bottom }}
      pointerEvents="box-none">
      <View style={styles.glowOuter}>
        <Animated.View
          style={[styles.glowHalo, { transform: [{ scale: glow }] }]}
        />
        <Pressable
          onPress={onPress}
          onPressIn={animateIn}
          onPressOut={animateOut}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          testID={TEST_ID.home.helpFab}
          style={styles.pressable}>
          <Animated.View
            style={[styles.fab, { transform: [{ scale }], opacity }]}>
            <View style={styles.shine} />
            <AppIcon name="messageCircle" size={24} color={ICON_COLOR_WHITE} />
          </Animated.View>
        </Pressable>
      </View>
    </GuideTarget>
  );
}

const styles = StyleSheet.create({
  glowOuter: {
    width: FAB_SIZE + GLOW_RING * 2,
    height: FAB_SIZE + GLOW_RING * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowHalo: {
    position: 'absolute',
    width: FAB_SIZE + GLOW_RING,
    height: FAB_SIZE + GLOW_RING,
    borderRadius: (FAB_SIZE + GLOW_RING) / 2,
    backgroundColor: 'rgba(124, 58, 237, 0.22)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 16,
    elevation: 12,
  },
  pressable: {
    borderRadius: FAB_SIZE / 2,
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    overflow: 'hidden',
    backgroundColor: '#7C3AED',
  },
  shine: {
    position: 'absolute',
    top: 4,
    left: 8,
    width: FAB_SIZE * 0.45,
    height: FAB_SIZE * 0.28,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});
