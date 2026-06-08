import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatCurrency';
import { monthName } from '../../utils/formatDate';

function getStatusStyle(status) {
  switch (status?.toLowerCase()) {
    case 'lunas':
      return { bg: colors.successLight, text: colors.success, label: '✓ Lunas' };
    case 'sebagian':
      return { bg: colors.warningLight, text: colors.warning, label: '◑ Sebagian' };
    default:
      return { bg: colors.dangerLight, text: colors.danger, label: '✕ Belum Bayar' };
  }
}

export function SahriyahCard({ sahriyah, bulan, tahun }) {
  if (!sahriyah) {
    return (
      <View style={[styles.card, styles.cardEmpty]}>
        <View style={styles.header}>
          <Text style={styles.icon}>📋</Text>
          <Text style={styles.title}>Sahriyah Bulan Ini</Text>
        </View>
        <Text style={styles.emptyText}>
          Belum ada tagihan untuk {monthName(bulan)} {tahun}
        </Text>
      </View>
    );
  }

  const statusStyle = getStatusStyle(sahriyah.status);
  const pct =
    sahriyah.nominal > 0
      ? Math.min(
          Math.round((sahriyah.total_bayar / sahriyah.nominal) * 100),
          100
        )
      : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>📋</Text>
        <Text style={styles.title}>
          Sahriyah {monthName(sahriyah.bulan)} {sahriyah.tahun}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {statusStyle.label}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.colLabel}>Total Tagihan</Text>
          <Text style={styles.colValue}>{formatCurrency(sahriyah.nominal)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.col}>
          <Text style={styles.colLabel}>Sudah Dibayar</Text>
          <Text style={[styles.colValue, { color: colors.success }]}>
            {formatCurrency(sahriyah.total_bayar)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.col}>
          <Text style={styles.colLabel}>Sisa</Text>
          <Text
            style={[
              styles.colValue,
              { color: sahriyah.sisa_tagihan > 0 ? colors.danger : colors.success },
            ]}
          >
            {formatCurrency(sahriyah.sisa_tagihan)}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.progressLabel}>{pct}% terbayar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardEmpty: { opacity: 0.75 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 6,
  },
  icon: { fontSize: 18 },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  col: { flex: 1, alignItems: 'center' },
  colLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
    textAlign: 'center',
  },
  colValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },

  progressBg: {
    height: 6,
    backgroundColor: colors.gray100,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },

  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
