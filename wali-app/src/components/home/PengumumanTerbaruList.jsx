import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, StatusBadge } from '../ui';
import { formatDate } from '../../utils/formatDate';
import { colors } from '../../constants/colors';
import { interaction, radius, shadows, spacing } from '../../constants/theme';

function truncateText(text, max = 64) {
  const value = String(text ?? '').trim();
  if (!value) return '';
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}…`;
}

function PengumumanItem({ item, onPress, isLast }) {
  const showBadge = item.prioritas === 'urgent' || item.prioritas === 'penting';
  const ringkasan = truncateText(item.isi);

  return (
    <TouchableOpacity
      style={[styles.item, !isLast && styles.itemBorder]}
      onPress={() => onPress?.(item)}
      activeOpacity={interaction.activeOpacity}
    >
      <View style={styles.itemIcon}>
        <Ionicons name="megaphone-outline" size={18} color={colors.primary} />
      </View>
      <View style={styles.itemBody}>
        <AppText variant="bodyMedium" numberOfLines={2} style={styles.itemTitle}>
          {item.judul}
        </AppText>
        {ringkasan ? (
          <AppText variant="caption" color="muted" numberOfLines={2} style={styles.itemDesc}>
            {ringkasan}
          </AppText>
        ) : null}
        <View style={styles.itemMeta}>
          {showBadge ? (
            <StatusBadge status={item.prioritas} size="sm" />
          ) : (
            <AppText variant="label" color="brand">
              Info
            </AppText>
          )}
          <AppText variant="caption" color="muted">
            {formatDate(item.published_at)}
          </AppText>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

export function PengumumanTerbaruList({ items = [], onItemPress, onLihatSemua }) {
  const latest = items.slice(0, 3);

  if (!latest.length) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <AppText variant="h3">Pengumuman Terbaru</AppText>
        {onLihatSemua ? (
          <TouchableOpacity onPress={onLihatSemua} activeOpacity={interaction.activeOpacity}>
            <AppText variant="caption" color="brand" style={styles.link}>
              Semua
            </AppText>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={[styles.list, shadows.sm]}>
        {latest.map((item, index) => (
          <PengumumanItem
            key={String(item.id ?? index)}
            item={item}
            onPress={onItemPress}
            isLast={index === latest.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  link: {
    fontWeight: '700',
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  itemTitle: {
    fontWeight: '700',
    lineHeight: 19,
  },
  itemDesc: {
    lineHeight: 16,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: 2,
  },
});
