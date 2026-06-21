import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, StatusBadge } from '../ui';
import { formatDate } from '../../utils/formatDate';
import { colors } from '../../constants/colors';
import { interaction, radius, shadows, spacing } from '../../constants/theme';

function truncateText(text, max = 72) {
  const value = String(text ?? '').trim();
  if (!value) return '';
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}...`;
}

function isNewAnnouncement(item) {
  const raw = item.published_at ?? item.created_at;
  if (!raw) return false;
  const time = new Date(raw).getTime();
  if (Number.isNaN(time)) return false;
  const diffDays = (Date.now() - time) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
}

function PengumumanItem({ item, onPress, isLast }) {
  const showBadge = item.prioritas === 'urgent' || item.prioritas === 'penting';
  const ringkasan = truncateText(item.isi);
  const isNew = isNewAnnouncement(item);

  return (
    <TouchableOpacity
      style={[styles.item, !isLast && styles.itemBorder]}
      onPress={() => onPress?.(item)}
      activeOpacity={interaction.activeOpacity}
    >
      <View style={styles.itemIcon}>
        <Ionicons name="megaphone-outline" size={19} color={colors.primary} />
      </View>
      <View style={styles.itemBody}>
        <View style={styles.titleRow}>
          <AppText variant="bodyMedium" numberOfLines={1} style={styles.itemTitle}>
            {item.judul}
          </AppText>
          {isNew ? (
            <View style={styles.newBadge}>
              <AppText variant="caption" color="brand" style={styles.newBadgeText}>
                Baru
              </AppText>
            </View>
          ) : null}
        </View>
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
  const latest = [...items]
    .sort((a, b) => {
      const rank = { urgent: 0, penting: 1 };
      const aRank = rank[a.prioritas] ?? 2;
      const bRank = rank[b.prioritas] ?? 2;
      if (aRank !== bRank) return aRank - bRank;
      return new Date(b.published_at ?? b.created_at ?? 0) - new Date(a.published_at ?? a.created_at ?? 0);
    })
    .slice(0, 3);

  if (!latest.length) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <AppText variant="h3" style={styles.title}>
          Pengumuman Terbaru
        </AppText>
        {onLihatSemua ? (
          <TouchableOpacity onPress={onLihatSemua} activeOpacity={interaction.activeOpacity}>
            <AppText variant="caption" color="brand" style={styles.link}>
              Lihat Semua
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
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    fontWeight: '900',
  },
  link: {
    fontWeight: '800',
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
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
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  itemTitle: {
    flex: 1,
    fontWeight: '900',
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
  newBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    flexShrink: 0,
  },
  newBadgeText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
  },
});
