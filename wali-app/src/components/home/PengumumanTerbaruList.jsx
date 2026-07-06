import React from 'react';
import { Image, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, StatusBadge } from '../ui';
import { formatDate } from '../../utils/formatDate';
import { colors } from '../../constants/colors';
import { interaction, radius, shadows, spacing } from '../../constants/theme';
import { resolveMediaUrl } from '../../utils/mediaUrl';

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

function AnnouncementVisual({ item }) {
  const cover = resolveMediaUrl(item.cover_url);
  if (cover) {
    return <Image source={{ uri: cover }} style={styles.thumbImage} resizeMode="cover" />;
  }

  return (
    <View style={styles.thumbFallback}>
      <Ionicons name="megaphone-outline" size={24} color={colors.primary} />
    </View>
  );
}

function PengumumanItem({ item, onPress }) {
  const showBadge = item.prioritas === 'urgent' || item.prioritas === 'penting';
  const ringkasan = truncateText(item.isi);
  const isNew = isNewAnnouncement(item);

  return (
    <TouchableOpacity
      style={[styles.item, shadows.card]}
      onPress={() => onPress?.(item)}
      activeOpacity={interaction.activeOpacity}
    >
      <AnnouncementVisual item={item} />
      <View style={styles.itemBody}>
        <View style={styles.itemMeta}>
          {showBadge ? (
            <StatusBadge status={item.prioritas} size="sm" />
          ) : (
            <View style={styles.infoBadge}>
              <AppText variant="caption" color="brand" style={styles.infoBadgeText}>
                Info
              </AppText>
            </View>
          )}
          {isNew ? (
            <View style={styles.newBadge}>
              <AppText variant="caption" color="brand" style={styles.newBadgeText}>
                Baru
              </AppText>
            </View>
          ) : null}
        </View>
        <AppText variant="bodyMedium" numberOfLines={2} style={styles.itemTitle}>
          {item.judul}
        </AppText>
        {ringkasan ? (
          <AppText variant="caption" color="muted" numberOfLines={2} style={styles.itemDesc}>
            {ringkasan}
          </AppText>
        ) : null}
        <View style={styles.dateRow}>
          <AppText variant="caption" color="muted">
            {formatDate(item.published_at)}
          </AppText>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
      </View>
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
      <View style={styles.list}>
        {latest.map((item, index) => (
          <PengumumanItem
            key={String(item.id ?? index)}
            item={item}
            onPress={onItemPress}
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
    gap: spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemBody: {
    flex: 1,
    gap: 5,
    minWidth: 0,
    paddingVertical: 2,
  },
  thumbImage: {
    width: 86,
    height: 104,
    borderRadius: radius.lg,
    backgroundColor: colors.neutralSoft,
  },
  thumbFallback: {
    width: 86,
    height: 104,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemTitle: {
    fontWeight: '900',
    lineHeight: 20,
  },
  itemDesc: {
    lineHeight: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: 2,
  },
  infoBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  infoBadgeText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
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
