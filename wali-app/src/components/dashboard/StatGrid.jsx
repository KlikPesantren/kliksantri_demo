import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

function StatItem({ icon, label, value, valueColor }) {
  return (
    <View style={styles.item}>
      <Text style={styles.itemIcon}>{icon}</Text>
      <Text style={[styles.itemValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
      <Text style={styles.itemLabel}>{label}</Text>
    </View>
  );
}

export function StatGrid({
  pelanggaran = 0,
  izinAktif = 0,
  hafalanBulanIni = 0,
  rataNilai = 0,
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Statistik Bulan Ini</Text>
      <View style={styles.grid}>
        <StatItem
          icon="⚠️"
          label="Pelanggaran"
          value={pelanggaran}
          valueColor={pelanggaran > 0 ? colors.danger : colors.success}
        />
        <StatItem
          icon="🚪"
          label="Izin Aktif"
          value={izinAktif}
          valueColor={izinAktif > 0 ? colors.warning : colors.textSecondary}
        />
        <StatItem
          icon="📖"
          label="Hafalan"
          value={hafalanBulanIni}
          valueColor={colors.info}
        />
        <StatItem
          icon="📝"
          label="Rata Nilai"
          value={rataNilai > 0 ? rataNilai : '-'}
          valueColor={
            rataNilai >= 80
              ? colors.success
              : rataNilai >= 60
              ? colors.warning
              : colors.textSecondary
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  item: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemIcon: { fontSize: 24, marginBottom: 8 },
  itemValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  itemLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
