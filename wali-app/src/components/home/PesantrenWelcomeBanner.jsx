import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '../ui/AppText';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/theme';

const BANNER_HEIGHT = 160;

export function PesantrenWelcomeBanner() {
  return (
    <View style={styles.wrap}>
      <View style={styles.banner}>
        <View style={styles.gradientBase} />
        <View style={styles.gradientAccent} />
        <View style={styles.content}>
          <AppText variant="caption" color="inverse" style={styles.welcomeLabel}>
            Selamat Datang
          </AppText>
          <AppText variant="h3" color="inverse" style={styles.welcomeTitle}>
            Bapak/Ibu Wali Santri
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  banner: {
    height: BANNER_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  gradientBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
  },
  gradientAccent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    backgroundColor: colors.primaryHover,
    opacity: 0.85,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.lg,
    gap: 2,
  },
  welcomeLabel: {
    opacity: 0.9,
    letterSpacing: 0.2,
  },
  welcomeTitle: {
    fontWeight: '700',
  },
});
