import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/theme';

export function PengumumanCover({ coverUrl, variant = 'feed', style, prioritasColor = colors.primarySoft
}) {
  const uri = resolveMediaUrl(coverUrl);
  const isHero = variant === 'hero' || variant === 'featured';
  const aspectRatio = 16 / 9;

  if (!uri) {
    return (
      <View
        style={[
          styles.placeholder,
          isHero ? styles.hero : styles.thumb,
          { backgroundColor: prioritasColor },
          style,
        ]}
      >
        <Ionicons
          name="megaphone-outline"
          size={isHero ? 36 : 20}
          color={colors.textMuted}
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[
        isHero ? styles.hero : styles.thumb,
        { aspectRatio: isHero ? aspectRatio : undefined },
        style,
      ]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: colors.neutralSoft,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.sm,
    backgroundColor: colors.neutralSoft,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
