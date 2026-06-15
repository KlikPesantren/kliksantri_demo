import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { formatShortAddress } from '../../utils/formatAddress';
import { colors } from '../../constants/colors';
import { interaction, radius, spacing } from '../../constants/theme';

const HEADER_RADIUS = 28;

export function PesantrenHeader({ nama, logoUrl, alamat, showGanti, onGantiPress }) {
  const insets = useSafeAreaInsets();
  const uri = resolveMediaUrl(logoUrl);
  const shortAddr = formatShortAddress(alamat);
  const initials = (nama ?? 'PP')
    .split(' ')
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  const topPad =
    Platform.OS === 'ios'
      ? Math.max(insets.top, 44) + spacing.sm
      : Math.max(insets.top, 28) + spacing.lg;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.gradient, { paddingTop: topPad }]}>
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
        <View style={styles.row}>
          {uri ? (
            <Image source={{ uri }} style={styles.logo} resizeMode="contain" />
          ) : (
            <View style={styles.logoFallback}>
              {initials.length >= 2 ? (
                <AppText variant="bodyMedium" color="brand">
                  {initials}
                </AppText>
              ) : (
                <Ionicons name="business-outline" size={22} color={colors.primary} />
              )}
            </View>
          )}

          <View style={styles.textCol}>
            <AppText variant="h3" color="inverse" numberOfLines={2} style={styles.nama}>
              {nama ?? 'Pesantren'}
            </AppText>
            {shortAddr ? (
              <AppText variant="caption" color="inverse" numberOfLines={2} style={styles.alamat}>
                {shortAddr}
              </AppText>
            ) : null}
          </View>

          {showGanti && onGantiPress ? (
            <TouchableOpacity
              style={styles.gantiButton}
              onPress={onGantiPress}
              activeOpacity={interaction.activeOpacity}
            >
              <AppText variant="caption" color="inverse" style={styles.gantiText}>
                Ganti
              </AppText>
            </TouchableOpacity>
          ) : (
            <View style={styles.gantiPlaceholder} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surfaceSoft,
  },
  gradient: {
    minHeight: 112,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderBottomLeftRadius: HEADER_RADIUS,
    borderBottomRightRadius: HEADER_RADIUS,
    backgroundColor: colors.primary,
  },
  gradientTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
  },
  gradientBottom: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primaryHover,
    opacity: 0.55,
    top: '35%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  logoFallback: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 4,
    minWidth: 0,
  },
  nama: {
    fontWeight: '800',
    fontSize: 18,
    lineHeight: 23,
    textAlign: 'left',
  },
  alamat: {
    textAlign: 'left',
    opacity: 0.82,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.88)',
  },
  gantiButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    minWidth: 52,
    alignItems: 'center',
    flexShrink: 0,
  },
  gantiText: {
    fontWeight: '700',
  },
  gantiPlaceholder: {
    width: 52,
    flexShrink: 0,
  },
});
