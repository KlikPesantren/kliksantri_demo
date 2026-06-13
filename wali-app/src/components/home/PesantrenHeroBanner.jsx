import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { AppText } from '../ui/AppText';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/theme';

const BANNER_HEIGHT = 160;

export function PesantrenHeroBanner({ bannerUrl }) {
  const uri = resolveMediaUrl(bannerUrl);

  if (!uri) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.banner}>
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
        <View style={styles.overlayBottom} />
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
    backgroundColor: colors.primarySoft,
    ...shadows.sm,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
    backgroundColor: 'rgba(22, 163, 74, 0.55)',
  },
  content: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    gap: 2,
  },
  welcomeLabel: {
    opacity: 0.95,
    letterSpacing: 0.2,
  },
  welcomeTitle: {
    fontWeight: '700',
  },
});
