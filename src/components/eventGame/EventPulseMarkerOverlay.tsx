import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const EVENT_GLOW_COLOR = '#E91E63';
const RING_SIZE = 120;
const RING_DURATION_MS = 2200;

type ExpandingRingProps = {
  delayMs: number;
};

/** Native Driver — transform(scale) + opacity 만 사용 */
function ExpandingRing({ delayMs }: ExpandingRingProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delayMs),
        Animated.timing(progress, {
          toValue: 1,
          duration: RING_DURATION_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delayMs, progress]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 1.15],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.12, 0.55, 1],
    outputRange: [0, 0.65, 0.28, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

type EventPulseMarkerOverlayProps = {
  left: number;
  top: number;
};

/**
 * SVG 밖 View 오버레이 pulse — useNativeDriver로 UI 스레드 애니메이션
 */
export function EventPulseMarkerOverlay({ left, top }: EventPulseMarkerOverlayProps) {
  const haloOpacity = useRef(new Animated.Value(0.28)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(haloOpacity, {
          toValue: 0.42,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(haloOpacity, {
          toValue: 0.22,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [haloOpacity]);

  const half = RING_SIZE / 2;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.anchor,
        {
          left: left - half,
          top: top - half,
          width: RING_SIZE,
          height: RING_SIZE,
        },
      ]}>
      <ExpandingRing delayMs={0} />

      <Animated.View pointerEvents="none" style={[styles.halo, { opacity: haloOpacity }]} />
      <View pointerEvents="none" style={styles.coreGlow} />
      <View pointerEvents="none" style={styles.coreDot} />
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    ...StyleSheet.absoluteFill,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2.5,
    borderColor: EVENT_GLOW_COLOR,
  },
  halo: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: EVENT_GLOW_COLOR,
  },
  coreGlow: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: EVENT_GLOW_COLOR,
    opacity: 0.9,
  },
  coreDot: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FFFFFF',
  },
});
