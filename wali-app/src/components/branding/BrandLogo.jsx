import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/theme';

export function BrandLogo({ logoUrl, nama, size = 72 }) {
  const uri = resolveMediaUrl(logoUrl);
  const initials = (nama ?? 'P')
    .split(' ')
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  const boxStyle = {
    width: size,
    height: size,
    borderRadius: radius.lg,
  };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, boxStyle]}
        resizeMode="contain"
      />
    );
  }

  return (
    <View style={[styles.fallback, boxStyle]}>
      {initials.length >= 2 ? (
        <AppText variant={size >= 72 ? 'h2' : 'bodyMedium'} color="brand">
          {initials}
        </AppText>
      ) : (
        <Ionicons name="business-outline" size={size * 0.45} color={colors.primary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surface,
  },
  fallback: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
