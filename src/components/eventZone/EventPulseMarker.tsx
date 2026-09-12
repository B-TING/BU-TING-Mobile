import { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const EVENT_GLOW_COLOR = '#EE82EE';
const RING_DURATION_MS = 2200;
const RING_SIZE = 72;
const PIN_WIDTH = 22;
const PIN_HEIGHT = 32;

type EventPulseMarkerProps = {
  /** 레이아웃 픽셀 좌표 (카메라 래퍼 내부, transform 적용 전) */
  left: number;
  top: number;
  /** false 이면 애니메이션 루프 정지 */
  active?: boolean;
};

function ExpandingRingView({
  delayMs,
  active,
}: {
  delayMs: number;
  active: boolean;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      progress.stopAnimation();
      progress.setValue(0);
      return;
    }
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
  }, [active, delayMs, progress]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 1],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.1, 0.55, 1],
    outputRange: [0, 0.35, 0.16, 0],
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

function MapPinIcon() {
  return (
    <Svg width={PIN_WIDTH} height={PIN_HEIGHT} viewBox="0 0 24 36">
      <Path
        d="M12 0C5.373 0 0 5.373 0 12c0 8.4 12 24 12 24s12-15.6 12-24C24 5.373 18.627 0 12 0z"
        fill={EVENT_GLOW_COLOR}
      />
      <Circle cx="12" cy="12" r="5" fill="#FFFFFF" />
    </Svg>
  );
}

/**
 * 이벤트 지도 핀 — RN View + native driver (scale/opacity).
 * SVG path 트리와 분리되어 pulse 프레임이 구 Path 를 dirty 하지 않는다.
 */
export const EventPulseMarker = memo(function EventPulseMarker({
  left,
  top,
  active = true,
}: EventPulseMarkerProps) {
  const corePulse = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (!active) {
      corePulse.stopAnimation();
      corePulse.setValue(0.7);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(corePulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(corePulse, {
          toValue: 0.7,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, corePulse]);

  const haloScale = corePulse.interpolate({
    inputRange: [0.7, 1],
    outputRange: [1, 1.16],
  });
  const haloOpacity = corePulse.interpolate({
    inputRange: [0.7, 1],
    outputRange: [0.12, 0.22],
  });
  const pinScale = corePulse.interpolate({
    inputRange: [0.7, 1],
    outputRange: [1, 1.06],
  });
  const pinLift = corePulse.interpolate({
    inputRange: [0.7, 1],
    outputRange: [0, -2],
  });

  return (
    <View
      pointerEvents="none"
      style={[
        styles.anchor,
        {
          left: left - RING_SIZE / 2,
          top: top - RING_SIZE / 2,
        },
      ]}>
      <ExpandingRingView delayMs={0} active={active} />
      <ExpandingRingView delayMs={RING_DURATION_MS / 2} active={active} />
      <Animated.View
        style={[
          styles.groundHalo,
          {
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.pinWrap,
          {
            transform: [{ translateY: pinLift }, { scale: pinScale }],
          },
        ]}>
        <MapPinIcon />
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
    borderColor: EVENT_GLOW_COLOR,
  },
  groundHalo: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: EVENT_GLOW_COLOR,
  },
  pinWrap: {
    position: 'absolute',
    left: (RING_SIZE - PIN_WIDTH) / 2,
    top: RING_SIZE / 2 - PIN_HEIGHT,
    width: PIN_WIDTH,
    height: PIN_HEIGHT,
    transformOrigin: 'bottom',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 3,
    elevation: 3,
  },
});
