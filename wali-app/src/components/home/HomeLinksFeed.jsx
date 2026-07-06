import React, { useMemo } from 'react';
import {
  Image,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { colors } from '../../constants/colors';
import { interaction, radius, shadows, spacing } from '../../constants/theme';
import { resolveMediaUrl } from '../../utils/mediaUrl';

const TYPE_META = {
  youtube: { label: 'YouTube', cta: 'Tonton', icon: 'logo-youtube', color: '#DC2626', bg: '#FEE2E2' },
  website: { label: 'Website', cta: 'Buka', icon: 'globe-outline', color: colors.info, bg: colors.infoSoft },
  whatsapp: { label: 'WhatsApp', cta: 'Gabung', icon: 'logo-whatsapp', color: '#16A34A', bg: colors.successSoft },
  live: { label: 'Live', cta: 'Tonton', icon: 'radio-outline', color: '#DC2626', bg: '#FEE2E2' },
  form: { label: 'Form', cta: 'Daftar', icon: 'document-text-outline', color: '#7C3AED', bg: '#EDE9FE' },
  donation: { label: 'Donasi', cta: 'Donasi', icon: 'heart-outline', color: colors.warning, bg: colors.warningSoft },
  pdf: { label: 'PDF', cta: 'Unduh', icon: 'document-attach-outline', color: '#EA580C', bg: '#FFEDD5' },
  drive: { label: 'Drive', cta: 'Buka', icon: 'folder-open-outline', color: colors.info, bg: colors.infoSoft },
  instagram: { label: 'Instagram', cta: 'Buka', icon: 'logo-instagram', color: '#DB2777', bg: '#FCE7F3' },
  facebook: { label: 'Facebook', cta: 'Buka', icon: 'logo-facebook', color: '#2563EB', bg: '#DBEAFE' },
  tiktok: { label: 'TikTok', cta: 'Buka', icon: 'musical-notes-outline', color: colors.navy, bg: colors.neutralSoft },
  telegram: { label: 'Telegram', cta: 'Gabung', icon: 'paper-plane-outline', color: '#0284C7', bg: '#E0F2FE' },
  other: { label: 'Tautan', cta: 'Buka', icon: 'link-outline', color: colors.primary, bg: colors.primarySoft },
};

function trimText(value, max = 86) {
  const text = String(value || '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
}

async function openUrl(url) {
  if (!url) return;
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  } catch (err) {
    console.log('[HOME LINKS] open url error', err?.message);
  }
}

function LinkVisual({ item }) {
  const meta = TYPE_META[item.type] || TYPE_META.other;
  const thumbnail = resolveMediaUrl(item.resolved_thumbnail_url || item.thumbnail_url);

  if (thumbnail) {
    return (
      <Image
        source={{ uri: thumbnail }}
        style={styles.image}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={[styles.iconFallback, { backgroundColor: meta.bg }]}>
      <Ionicons name={meta.icon} size={26} color={meta.color} />
    </View>
  );
}

function HomeLinkCard({ item }) {
  const meta = TYPE_META[item.type] || TYPE_META.other;

  return (
    <TouchableOpacity
      style={[styles.card, shadows.card]}
      activeOpacity={interaction.activeOpacity}
      onPress={() => openUrl(item.url)}
    >
      <LinkVisual item={item} />
      <View style={styles.body}>
        <View style={[styles.badge, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={12} color={meta.color} />
          <AppText variant="caption" style={[styles.badgeText, { color: meta.color }]}>
            {meta.label}
          </AppText>
        </View>
        <AppText variant="bodyMedium" numberOfLines={2} style={styles.cardTitle}>
          {item.title}
        </AppText>
        {item.description ? (
          <AppText variant="caption" color="muted" numberOfLines={2} style={styles.desc}>
            {trimText(item.description)}
          </AppText>
        ) : null}
        <View style={styles.ctaRow}>
          <AppText variant="caption" style={[styles.ctaText, { color: meta.color }]}>
            {meta.cta}
          </AppText>
          <Ionicons name="arrow-forward" size={13} color={meta.color} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function HomeLinksFeed({ items = [] }) {
  const activeItems = useMemo(() => items.filter((item) => item?.url), [items]);

  if (!activeItems.length) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <AppText variant="h3" style={styles.title}>
          Konten Pesantren
        </AppText>
      </View>
      <View style={styles.list}>
        {activeItems.map((item) => (
          <HomeLinkCard key={String(item.id)} item={item} />
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
    marginBottom: spacing.sm,
  },
  title: {
    fontWeight: '900',
  },
  list: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: 92,
    height: 96,
    borderRadius: radius.lg,
    backgroundColor: colors.neutralSoft,
  },
  iconFallback: {
    width: 92,
    height: 96,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 2,
    gap: spacing.xs,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
  },
  cardTitle: {
    color: colors.textPrimary,
    fontWeight: '900',
    lineHeight: 20,
  },
  desc: {
    lineHeight: 16,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ctaText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
  },
});
