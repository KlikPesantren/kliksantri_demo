import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { AppCard, AppText } from '../ui';
import { colors } from '../../constants/colors';
import { interaction, radius, spacing } from '../../constants/theme';

const PENANGANAN_LABELS = {
  observasi: 'Observasi',
  istirahat: 'Istirahat',
  sudah_berobat: 'Sudah berobat',
  pulang: 'Pulang',
  rawat_lanjut: 'Rawat lanjut',
};

function buildItems(d) {
  const items = [];

  if ((d.izin_aktif ?? 0) > 0) {
    items.push({
      emoji: '⚠',
      text: 'Sedang izin',
      tone: 'warning',
    });
  } else {
    items.push({
      emoji: '✓',
      text: 'Aktif di pesantren',
      tone: 'success',
    });
  }

  const kesehatan = d.kesehatan_aktif || { status_kesehatan: 'sehat' };
  const isSakit = kesehatan.status_kesehatan === 'sakit';

  if (isSakit) {
    items.push({
      emoji: '🟠',
      text: 'Sedang sakit',
      tone: 'danger',
    });
    const penanganan = PENANGANAN_LABELS[kesehatan.status_penanganan] || 'Dalam penanganan';
    const sudahBerobat =
      kesehatan.status_penanganan === 'sudah_berobat' ||
      kesehatan.status_penanganan === 'pulang';
    items.push({
      emoji: sudahBerobat ? '💊' : '⚠',
      text: sudahBerobat ? 'Sudah berobat' : penanganan,
      tone: sudahBerobat ? 'success' : 'warning',
    });
  } else {
    items.push({
      emoji: '💚',
      text: 'Sehat',
      tone: 'success',
    });
  }

  const sahStatus = d.sahriyah_aktif?.status?.toLowerCase();
  if (!d.sahriyah_aktif || sahStatus === 'lunas') {
    items.push({
      emoji: '✓',
      text: 'Shahriyah lunas',
      tone: 'success',
    });
  } else {
    items.push({
      emoji: '⚠',
      text: 'Shahriyah belum lunas',
      tone: 'warning',
    });
  }

  return items;
}

const TONE_STYLES = {
  success: { bg: colors.successSoft, text: colors.primaryHover },
  warning: { bg: colors.warningSoft, text: colors.warning },
  danger: { bg: colors.dangerSoft, text: colors.danger },
};

function StatusChip({ emoji, text, tone }) {
  const palette = TONE_STYLES[tone] ?? TONE_STYLES.success;

  return (
    <View style={[styles.chip, { backgroundColor: palette.bg }]}>
      <AppText variant="caption" style={[styles.chipEmoji]}>
        {emoji}
      </AppText>
      <AppText variant="caption" numberOfLines={3} style={[styles.chipText, { color: palette.text }]}>
        {text}
      </AppText>
    </View>
  );
}

export function StatusHariIni({ data, onLihatSemua }) {
  if (!data) return null;

  const items = buildItems(data);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <AppText variant="h3">Status Hari Ini</AppText>
        {onLihatSemua ? (
          <TouchableOpacity onPress={onLihatSemua} activeOpacity={interaction.activeOpacity}>
            <AppText variant="caption" color="brand" style={styles.link}>
              Lihat Semua
            </AppText>
          </TouchableOpacity>
        ) : null}
      </View>
      <AppCard padding="md" style={styles.card}>
        <View style={styles.row}>
          {items.map((item) => (
            <StatusChip key={item.text} {...item} />
          ))}
        </View>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  link: {
    fontWeight: '700',
  },
  card: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    gap: 4,
  },
  chipEmoji: {
    fontSize: 16,
    lineHeight: 18,
  },
  chipText: {
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
  },
});
