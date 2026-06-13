import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { AppCard, AppText } from '../ui';
import { colors } from '../../constants/colors';
import { interaction, radius, spacing } from '../../constants/theme';

function buildItems(d) {
  const items = [];

  if ((d.izin_aktif ?? 0) > 0) {
    items.push({
      ok: false,
      warn: true,
      text: 'Sedang izin',
    });
  } else {
    items.push({
      ok: true,
      text: 'Aktif di pesantren',
    });
  }

  const pelanggaran = d.pelanggaran_bulan_ini ?? 0;
  if (pelanggaran === 0) {
    items.push({
      ok: true,
      text: 'Tidak ada pelanggaran',
    });
  } else {
    items.push({
      ok: false,
      warn: true,
      text: `${pelanggaran} catatan pelanggaran`,
    });
  }

  const sahStatus = d.sahriyah_aktif?.status?.toLowerCase();
  if (!d.sahriyah_aktif || sahStatus === 'lunas') {
    items.push({
      ok: true,
      text: 'Sahriyah bulan ini lunas',
    });
  } else {
    items.push({
      ok: false,
      warn: true,
      text: 'Sahriyah belum lunas',
    });
  }

  return items;
}

function StatusChip({ ok, warn, text }) {
  const prefix = ok ? '✓ ' : warn ? '⚠ ' : '';

  return (
    <View style={styles.chip}>
      <AppText variant="caption" numberOfLines={4} style={styles.chipText}>
        {prefix}
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
    shadowOpacity: 0,
    elevation: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  chipText: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
  },
});
