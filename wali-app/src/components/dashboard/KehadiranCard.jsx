import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { monthName } from '../../utils/formatDate';

function getKehadiranColor(pct) {
  if (pct >= 85) return colors.success;
  if (pct >= 70) return colors.warning;
  return colors.danger;
}

export function KehadiranCard({ kehadiran, bulan, tahun }) {
  const pct = kehadiran?.persentase ?? 0;
  const hadir = kehadiran?.hadir ?? 0;
  const total = kehadiran?.total ?? 0;
  const barColor = getKehadiranColor(pct);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>📅</Text>
        <Text style={styles.title}>
          Kehadiran {monthName(bulan)} {tahun}
        </Text>
      </View>

      <View style={styles.body}>
        {/* Circular-like percentage display */}
        <View style={[styles.pctCircle, { borderColor: barColor }]}>
          <Text style={[styles.pctNumber, { color: barColor }]}>{pct}%</Text>
          <Text style={styles.pctLabel}>hadir</Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.statRow}>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
            <Text style={styles.statText}>Hadir: <Text style={styles.statBold}>{hadir} hari</Text></Text>
          </View>
          <View style={styles.statRow}>
            <View style={[styles.dot, { backgroundColor: colors.gray300 }]} />
            <Text style={styles.statText}>Total sesi: <Text style={styles.statBold}>{total}</Text></Text>
          </View>
          <View style={styles.statRow}>
            <View style={[styles.dot, { backgroundColor: colors.danger }]} />
            <Text style={styles.statText}>Tidak hadir: <Text style={styles.statBold}>{total - hadir}</Text></Text>
          </View>
        </View>
      </View>

      {/* Bar */}
      <View style={styles.progressBg}>
        <View
          style={[
            styles.progressFill,
            { width: `${pct}%`, backgroundColor: barColor },
          ]}
        />
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  icon: { fontSize: 18 },
  title: { fontSize: 14, fontWeight: '700', color: colors.text },

  body: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 16,
  },

  pctCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray50,
  },
  pctNumber: { fontSize: 22, fontWeight: '800' },
  pctLabel: { fontSize: 10, color: colors.textMuted, marginTop: 1 },

  stats: { flex: 1, gap: 6 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statText: { fontSize: 13, color: colors.textSecondary },
  statBold: { fontWeight: '700', color: colors.text },

  progressBg: {
    height: 6,
    backgroundColor: colors.gray100,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
