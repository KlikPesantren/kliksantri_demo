import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

const GRADIENT_HEIGHT = 80;

/** Bottom fade — smooth photo transition for text legibility (premium travel/fintech) */
export function HeroBottomGradient() {
  return (
    <LinearGradient
      colors={[
        'transparent',
        'rgba(0,0,0,0.05)',
        'rgba(0,0,0,0.12)',
        'rgba(0,0,0,0.22)',
        'rgba(0,0,0,0.35)',
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: GRADIENT_HEIGHT,
  },
});
