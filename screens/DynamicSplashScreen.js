import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const ICON_SIZE = 50;
const ANIMATION_DURATION = 1000;

const icons = [
  { name: 'musical-notes', color: '#FF6B6B' },
  { name: 'globe', color: '#4ECDC4' },
  { name: 'mic', color: '#45B7D1' },
  { name: 'bluetooth', color: '#F7B731' },
  { name: 'play', color: '#5D5FEF' },
  { name: 'radio', color: '#FF8A5C' },
  { name: 'headset', color: '#9B59B6' },
];

const DynamicSplashScreen = () => {
  const scaleValues = icons.map(() => useRef(new Animated.Value(0)).current);
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animations = scaleValues.map((value, index) =>
      Animated.sequence([
        Animated.delay(index * (ANIMATION_DURATION / 2)),
        Animated.timing(value, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
      ])
    );

    const fadeInAnimation = Animated.timing(opacityValue, {
      toValue: 1,
      duration: ANIMATION_DURATION * 2,
      useNativeDriver: true,
    });

    Animated.parallel([...animations, fadeInAnimation]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#4c669f', '#3b5998', '#192f6a']}
      style={styles.container}
    >
      <View style={styles.iconContainer}>
        {icons.map((icon, index) => (
          <Animated.View
            key={icon.name}
            style={[
              styles.iconWrapper,
              {
                transform: [{ scale: scaleValues[index] }],
              },
            ]}
          >
            <Ionicons name={icon.name} size={ICON_SIZE} color={icon.color} />
          </Animated.View>
        ))}
      </View>
      <Animated.View style={{ opacity: opacityValue }}>
        <Text style={styles.appName}>SonoAI</Text>
        <Text style={styles.appTagline}>Create Music with AI</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  iconWrapper: {
    margin: 10,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  appTagline: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default DynamicSplashScreen;