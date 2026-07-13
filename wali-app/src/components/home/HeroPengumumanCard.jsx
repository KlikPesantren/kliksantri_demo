import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { AppCard, AppText, AppButton, StatusBadge } from '../ui';
import { PengumumanCover } from '../pengumuman/PengumumanCover';
import { formatDate } from '../../utils/formatDate';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { HeroBannerFrame } from './HeroBannerFrame';
import { colors } from '../../constants/colors';
import { interaction, radius, shadows, spacing } from '../../constants/theme';

function truncateText(text, max = 72) {
  const value = String(text ?? '').trim();
  if (!value) return '';
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}…`;
}

export function HeroPengumumanSlide({ item, onPress }) {
  const [imageError, setImageError] = useState(false);
  if (!item) return null;

  const uri = resolveMediaUrl(item.cover_url);
  const showBadge = item.prioritas === 'urgent' || item.prioritas === 'penting';
  const ringkasan = truncateText(item.isi);

  const footer = (
    <View style={styles.slideContent}>
      {showBadge ? (
        <StatusBadge status={item.prioritas} size="sm" />
      ) : (
        <AppText variant="label" color="inverse" style={styles.slideLabel}>
          Pengumuman
        </AppText>
      )}
      <AppText variant="h3" color="inverse" numberOfLines={2} style={styles.slideTitle}>
        {item.judul}
      </AppText>
      {ringkasan ? (
        <AppText variant="caption" color="inverse" numberOfLines={2} style={styles.slideDesc}>
          {ringkasan}
        </AppText>
      ) : null}
      <AppText variant="caption" color="inverse" style={styles.slideDate}>
        {formatDate(item.published_at)}
      </AppText>
    </View>
  );

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      style={({ pressed }) => [styles.slidePressable, pressed && styles.slidePressed]}
      accessibilityRole="button"
      accessibilityLabel={`Baca pengumuman ${item.judul}`}
    >
      <HeroBannerFrame
        rawImageUrl={item.cover_url}
        imageUrl={uri}
        imageError={imageError}
        onImageError={() => setImageError(true)}
        fallbackIcon="megaphone-outline"
        footer={footer}
        style={styles.slideShell}
      />
    </Pressable>
  );
}

export function HeroPengumumanCard({ item, onPress, onLihatSemua, variant = 'feed' }) {
  if (!item) {
    return null;
  }

  if (variant === 'carousel') {
    return <HeroPengumumanSlide item={item} onPress={onPress} />;
  }

  const showBadge = item.prioritas === 'urgent' || item.prioritas === 'penting';

  return (
    <View style={styles.wrap}>
      <AppCard padding="none" shadow="md" style={styles.heroCard}>
        <PengumumanCover coverUrl={item.cover_url} variant="hero" />
        <View style={styles.body}>
          <View style={styles.meta}>
            {showBadge ? (
              <StatusBadge status={item.prioritas} size="sm" />
            ) : (
              <AppText variant="label" color="brand">
                Pengumuman
              </AppText>
            )}
            <AppText variant="caption" color="muted">
              {formatDate(item.published_at)}
            </AppText>
          </View>
          <AppText variant="h2" numberOfLines={2}>
            {item.judul}
          </AppText>
          <AppButton
            size="sm"
            onPress={() => onPress?.(item)}
            style={styles.cta}
          >
            Baca Selengkapnya
          </AppButton>
        </View>
      </AppCard>
      {onLihatSemua ? (
        <TouchableOpacity
          onPress={onLihatSemua}
          style={styles.link}
          activeOpacity={interaction.activeOpacity}
        >
          <AppText variant="caption" color="brand" style={styles.linkText}>
            Lihat semua pengumuman
          </AppText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  heroCard: {
    overflow: 'hidden',
    borderRadius: radius.xl,
    ...shadows.md,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cta: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  link: {
    marginTop: spacing.sm,
    alignSelf: 'flex-end',
  },
  linkText: {
    fontWeight: '700',
  },
  slidePressable: {
    width: '100%',
  },
  slidePressed: {
    opacity: interaction.cardActiveOpacity,
  },
  slideShell: {
    width: '100%',
  },
  slideContent: {
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  slideLabel: {
    opacity: 0.95,
  },
  slideTitle: {
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'left',
  },
  slideDesc: {
    opacity: 0.88,
    lineHeight: 17,
    textAlign: 'left',
  },
  slideDate: {
    opacity: 0.82,
    marginTop: 2,
  },
});
