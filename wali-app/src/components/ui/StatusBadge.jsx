import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/theme';
import { AppText } from './AppText';

const VARIANT_STYLES = {
  success: { bg: colors.successSoft, text: colors.primaryHover },
  warning: { bg: colors.warningSoft, text: colors.warning },
  danger: { bg: colors.dangerSoft, text: colors.danger },
  info: { bg: colors.infoSoft, text: colors.info },
  neutral: { bg: colors.neutralSoft, text: colors.textSecondary },
  primary: { bg: colors.primarySoft, text: colors.primaryHover },
};

const STATUS_MAP = {
  aktif: 'success',
  nonaktif: 'neutral',
  pending: 'warning',
  ditolak: 'danger',
  lunas: 'success',
  'belum lunas': 'danger',
  'belum bayar': 'danger',
  sebagian: 'warning',
  tunggakan: 'danger',
  cicilan: 'warning',
  online: 'success',
  offline: 'neutral',
  keluar: 'warning',
  kembali: 'success',
  urgent: 'danger',
  penting: 'warning',
  normal: 'neutral',
  hadir: 'success',
  izin: 'warning',
  sakit: 'warning',
  alfa: 'danger',
  topup: 'success',
  refund: 'warning',
  pembayaran: 'danger',
};

function normalizeStatus(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function resolveVariant(status) {
  const key = normalizeStatus(status);
  if (STATUS_MAP[key]) return STATUS_MAP[key];
  if (key.includes('lunas')) return 'success';
  if (key.includes('belum') || key.includes('tunggak')) return 'danger';
  if (key.includes('cicil') || key.includes('sebagian')) return 'warning';
  if (key.includes('aktif') && !key.includes('non')) return 'success';
  if (key.includes('nonaktif')) return 'neutral';
  return 'neutral';
}

const SIZES = {
  sm: { paddingH: spacing.sm, paddingV: 2, fontSize: 10 },
  md: { paddingH: spacing.md, paddingV: spacing.xs, fontSize: 11 },
  lg: { paddingH: spacing.lg, paddingV: spacing.sm, fontSize: 12 },
};

export function StatusBadge({ status, children, variant, size = 'md' }) {
  const resolved = variant ?? resolveVariant(status);
  const palette = VARIANT_STYLES[resolved] ?? VARIANT_STYLES.neutral;
  const s = SIZES[size] ?? SIZES.md;
  const label = children ?? status ?? '—';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.bg,
          paddingHorizontal: s.paddingH,
          paddingVertical: s.paddingV,
        },
      ]}
    >
      <AppText
        variant="caption"
        style={[styles.text, { color: palette.text, fontSize: s.fontSize }]}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
  },
});
