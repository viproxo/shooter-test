import React, { useRef } from 'react';
import { View, PanResponder, StyleSheet, Animated } from 'react-native';

const JOYSTICK_SIZE = 100;
const KNOB_SIZE = 50;
const MAX_RADIUS = (JOYSTICK_SIZE - KNOB_SIZE) / 2;

const Joystick = ({ onMove }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const joystickCenter = useRef({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value
        });
        pan.setValue({ x: 0, y: 0 }); // Reset pan position for new gesture
      },
      onPanResponderMove: (evt, gestureState) => {
        let { dx, dy } = gestureState;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > MAX_RADIUS) {
          // Normalize and scale if outside max radius
          dx = (dx / distance) * MAX_RADIUS;
          dy = (dy / distance) * MAX_RADIUS;
        }

        pan.setValue({ x: dx, y: dy });

        // Calculate movement vector (normalized)
        // The system using this vector will apply speed
        const moveX = dx / MAX_RADIUS;
        const moveY = dy / MAX_RADIUS;
        onMove({ x: moveX, y: moveY });
      },
      onPanResponderRelease: () => {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 5,
          useNativeDriver: false, // Cannot use native driver for layout properties like left/top
        }).start();
        onMove({ x: 0, y: 0 }); // Signal movement stop
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.joystickBase}>
        <Animated.View
          style={[
            styles.knob,
            { transform: pan.getTranslateTransform() },
          ]}
          {...panResponder.panHandlers}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    left: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joystickBase: {
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
    borderRadius: JOYSTICK_SIZE / 2,
    backgroundColor: 'rgba(100, 100, 100, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: 'rgba(50, 50, 50, 0.8)',
  },
});

export default Joystick;
