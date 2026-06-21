import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { formatShortAddress } from '../../utils/formatAddress';
import { colors } from '../../constants/colors';
import { interaction, radius, shadows, spacing } from '../../constants/theme';

function PondokLogo({ logoUrl, nama }) {
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
        <AppText variant="caption" color="brand" style={styles.initials}>
          {initials}
        </AppText>
      ) : (
        <Ionicons name="business-outline" size={18} color={colors.primary} />
      )}
    </View>
  );
}

export function SmallPondokHeader({ pesantren, showGanti, onGantiPress }) {
  const nama = pesantren?.nama_pesantren ?? 'Pesantren';
  const alamat = formatShortAddress(pesantren?.alamat);

  return (
    <View style={[styles.card, shadows.sm]}>
      <PondokLogo logoUrl={pesantren?.logo_url} nama={nama} />
      <View style={styles.textCol}>
        <AppText variant="bodyMedium" numberOfLines={1} style={styles.nama}>
          {nama}
        </AppText>
        {alamat ? (
          <AppText variant="caption" color="muted" numberOfLines={1} style={styles.alamat}>
            {alamat}
          </AppText>
        ) : null}
      </View>
      {showGanti && onGantiPress ? (
        <TouchableOpacity
          style={styles.gantiButton}
          onPress={onGantiPress}
          activeOpacity={interaction.activeOpacity}
        >
          <Ionicons name="swap-horizontal" size={14} color={colors.primary} />
          <AppText variant="caption" color="brand" style={styles.gantiText}>
            Ganti
          </AppText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  logoFallback: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '800',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nama: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
  alamat: {
    lineHeight: 16,
  },
  gantiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  gantiText: {
    fontWeight: '800',
  },
});
