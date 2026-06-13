import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { AppCard, AppText, AppButton, StatusBadge } from '../ui';
import { PengumumanCover } from '../pengumuman/PengumumanCover';
import { formatDate } from '../../utils/formatDate';
import { colors } from '../../constants/colors';
import { interaction, radius, shadows, spacing } from '../../constants/theme';

export function HeroPengumumanCard({ item, onPress, onLihatSemua }) {
  if (!item) {
    return null;
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
});
