import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { formatShortAddress } from '../../utils/formatAddress';
import { extractPesantrenStats, formatStatValue } from '../../utils/pesantrenStats';
import { colors } from '../../constants/colors';
import { interaction, radius, shadows, spacing } from '../../constants/theme';

const HERO_HEIGHT = 240;

const STAT_ITEMS = [
  { key: 'santri', label: 'Santri', icon: 'people-outline' },
  { key: 'ustadz', label: 'Ustadz', icon: 'person-outline' },
  { key: 'kelas', label: 'Kelas', icon: 'library-outline' },
  { key: 'tahun', label: 'Berdiri', icon: 'calendar-outline' },
];

function HeroLogo({ logoUrl, nama }) {
  const uri = resolveMediaUrl(logoUrl);
  const initials = (nama ?? 'PP')
    .split(' ')
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  if (uri) {
    return <Image source={{ uri }} style={styles.logo} resizeMode="contain" />;
  }

  return (
    <View style={styles.logoFallback}>
      {initials.length >= 2 ? (
        <AppText variant="bodyMedium" color="brand" style={styles.logoInitials}>
          {initials}
        </AppText>
      ) : (
        <Ionicons name="school-outline" size={24} color={colors.primary} />
      )}
    </View>
  );
}

export function PremiumHeroSection({
  pesantren,
  showGanti,
  onGantiPress,
}) {
  const bannerUri = resolveMediaUrl(pesantren?.banner_url);
  const [bannerError, setBannerError] = useState(false);
  const showBanner = Boolean(bannerUri) && !bannerError && pesantren?.banner_active !== false;

  const nama = pesantren?.nama_pesantren ?? 'Pesantren';
  const alamat = formatShortAddress(pesantren?.alamat) ?? pesantren?.alamat;
  const stats = extractPesantrenStats(pesantren);

  return (
    <View style={styles.wrap}>
      <View style={[styles.heroCard, shadows.lg]}>
        {showBanner ? (
          <Image
            source={{ uri: bannerUri }}
            style={styles.bannerImage}
            resizeMode="cover"
            onError={() => setBannerError(true)}
          />
        ) : (
          <View style={styles.bannerFallback} />
        )}

        <View style={styles.overlayDark} pointerEvents="none" />
        <View style={styles.overlayGreen} pointerEvents="none" />

        <View style={styles.topBar}>
          {showGanti && onGantiPress ? (
            <TouchableOpacity
              style={styles.gantiBtn}
              onPress={onGantiPress}
              activeOpacity={interaction.activeOpacity}
            >
              <Ionicons name="swap-horizontal" size={14} color={colors.surface} />
              <AppText variant="caption" color="inverse" style={styles.gantiText}>
                Ganti
              </AppText>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.heroBody}>
          <View style={styles.brandRow}>
            <HeroLogo logoUrl={pesantren?.logo_url} nama={nama} />
            <View style={styles.brandText}>
              <AppText variant="bodyMedium" color="inverse" numberOfLines={2} style={styles.pesantrenName}>
                {nama}
              </AppText>
              {alamat ? (
                <AppText variant="caption" color="inverse" numberOfLines={2} style={styles.alamat}>
                  {alamat}
                </AppText>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.statsCard, shadows.card]}>
        {STAT_ITEMS.map((item) => (
          <View key={item.key} style={styles.statCell}>
            <Ionicons name={item.icon} size={16} color={colors.primary} />
            <AppText variant="stat" style={styles.statValue}>
              {formatStatValue(stats[item.key])}
            </AppText>
            <AppText variant="caption" color="muted" style={styles.statLabel}>
              {item.label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  heroCard: {
    width: '100%',
    height: HERO_HEIGHT,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    backgroundColor: colors.navySoft,
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
  },
  overlayDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  overlayGreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22, 163, 74, 0.25)',
  },
  topBar: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 3,
  },
  gantiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  gantiText: {
    fontWeight: '700',
  },
  heroBody: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    zIndex: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  logoFallback: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitials: {
    fontWeight: '800',
    fontSize: 16,
  },
  brandText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  pesantrenName: {
    fontWeight: '700',
  },
  alamat: {
    opacity: 0.9,
    lineHeight: 16,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.md,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    minWidth: 0,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 17,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});
