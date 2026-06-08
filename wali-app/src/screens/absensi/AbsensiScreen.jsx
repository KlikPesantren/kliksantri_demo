import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useActiveChild } from '../../context/ActiveChildContext';
import { useAbsensi } from '../../hooks/useAbsensi';
import { ChildSwitcherBar } from '../../components/dashboard/ChildSwitcherBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorView } from '../../components/common/ErrorView';
import { colors } from '../../constants/colors';
import { monthName } from '../../utils/formatDate';

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  H: { label: 'Hadir', short: 'H', color: colors.success, bg: colors.successLight },
  Hadir: { label: 'Hadir', short: 'H', color: colors.success, bg: colors.successLight },
  I: { label: 'Izin', short: 'I', color: colors.info, bg: colors.infoLight },
  Izin: { label: 'Izin', short: 'I', color: colors.info, bg: colors.infoLight },
  S: { label: 'Sakit', short: 'S', color: colors.warning, bg: colors.warningLight },
  Sakit: { label: 'Sakit', short: 'S', color: colors.warning, bg: colors.warningLight },
  A: { label: 'Alpa', short: 'A', color: colors.danger, bg: colors.dangerLight },
  Alpa: { label: 'Alpa', short: 'A', color: colors.danger, bg: colors.dangerLight },
  Alfa: { label: 'Alpa', short: 'A', color: colors.danger, bg: colors.dangerLight },
};

function getStatus(raw) {
  return (
    STATUS_CONFIG[raw] ?? {
      label: raw ?? '-',
      short: (raw ?? '?').charAt(0),
      color: colors.textSecondary,
      bg: colors.gray100,
    }
  );
}

// ─── Month Picker ─────────────────────────────────────────────────────────────

function MonthPicker({ bulan, tahun, onPrev, onNext }) {
  const now = new Date();
  const isCurrentMonth =
    bulan === now.getMonth() + 1 && tahun === now.getFullYear();

  return (
    <View style={styles.pickerRow}>
      <TouchableOpacity
        style={styles.pickerBtn}
        onPress={onPrev}
        activeOpacity={0.7}
      >
        <Text style={styles.pickerArrow}>‹</Text>
      </TouchableOpacity>

      <Text style={styles.pickerLabel}>
        {monthName(bulan)} {tahun}
      </Text>

      <TouchableOpacity
        style={[
          styles.pickerBtn,
          isCurrentMonth && styles.pickerBtnDisabled,
        ]}
        onPress={isCurrentMonth ? undefined : onNext}
        activeOpacity={isCurrentMonth ? 1 : 0.7}
        disabled={isCurrentMonth}
      >
        <Text
          style={[
            styles.pickerArrow,
            isCurrentMonth && styles.pickerArrowDisabled,
          ]}
        >
          ›
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Ringkasan Card ───────────────────────────────────────────────────────────

function RingkasanCard({ ringkasan }) {
  if (!ringkasan) return null;

  const total = ringkasan.total || 0;
  const hadir = ringkasan.hadir || 0;
  const pct = total > 0 ? Math.round((hadir / total) * 100) : 0;

  const barColor =
    pct >= 85 ? colors.success : pct >= 70 ? colors.warning : colors.danger;

  return (
    <View style={styles.ringkasanCard}>
      {/* Percentage + circle */}
      <View style={styles.ringkasanTop}>
        <View style={[styles.pctCircle, { borderColor: barColor }]}>
          <Text style={[styles.pctNumber, { color: barColor }]}>{pct}%</Text>
          <Text style={styles.pctLabel}>hadir</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatChip
            label="Hadir"
            value={ringkasan.hadir}
            color={colors.success}
            bg={colors.successLight}
          />
          <StatChip
            label="Izin"
            value={ringkasan.izin}
            color={colors.info}
            bg={colors.infoLight}
          />
          <StatChip
            label="Sakit"
            value={ringkasan.sakit}
            color={colors.warning}
            bg={colors.warningLight}
          />
          <StatChip
            label="Alpa"
            value={ringkasan.alpa}
            color={colors.danger}
            bg={colors.dangerLight}
          />
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View
          style={[
            styles.progressFill,
            { width: `${pct}%`, backgroundColor: barColor },
          ]}
        />
      </View>
      <View style={styles.progressFooter}>
        <Text style={styles.progressLabel}>{hadir} dari {total} sesi</Text>
        <Text style={[styles.progressLabel, { color: barColor, fontWeight: '700' }]}>
          {pct}% kehadiran
        </Text>
      </View>
    </View>
  );
}

function StatChip({ label, value, color, bg }) {
  return (
    <View style={[styles.statChip, { backgroundColor: bg }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Riwayat Group (per tanggal) ─────────────────────────────────────────────

function RiwayatGroup({ tanggal, items }) {
  const date = new Date(tanggal);
  const day = date.getDate();
  const dayName = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][date.getDay()];

  // Determine the "dominant" status for the day dot
  const hasAlpa = items.some((i) => ['A', 'Alpa', 'Alfa'].includes(i.status));
  const hasHadir = items.some((i) => ['H', 'Hadir'].includes(i.status));
  const dotColor = hasAlpa
    ? colors.danger
    : hasHadir
    ? colors.success
    : colors.warning;

  return (
    <View style={styles.groupRow}>
      {/* Date badge */}
      <View style={styles.dateBadge}>
        <Text style={styles.dateDayName}>{dayName}</Text>
        <Text style={styles.dateDay}>{day}</Text>
        <View style={[styles.dateDot, { backgroundColor: dotColor }]} />
      </View>

      {/* Sesi list */}
      <View style={styles.sesiList}>
        {items.map((item, idx) => {
          const st = getStatus(item.status);
          return (
            <View key={`${item.id ?? idx}`} style={styles.sesiRow}>
              <Text style={styles.sesiName} numberOfLines={1}>
                {item.sesi ?? '-'}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                <Text style={[styles.statusText, { color: st.color }]}>
                  {st.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyAbsensi({ bulan, tahun }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📅</Text>
      <Text style={styles.emptyTitle}>Tidak Ada Data Absensi</Text>
      <Text style={styles.emptySubtitle}>
        Belum ada catatan absensi untuk{'\n'}
        {monthName(bulan)} {tahun}.
      </Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export function AbsensiScreen() {
  const { activeSantriId } = useActiveChild();

  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());

  const { ringkasan, riwayat, isLoading, isRefreshing, error, refresh } =
    useAbsensi(activeSantriId, bulan, tahun);

  // Group riwayat by tanggal
  const groupedRiwayat = useMemo(() => {
    const map = new Map();
    riwayat.forEach((item) => {
      const key = item.tanggal;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    // Return sorted array of [tanggal, items[]]
    return Array.from(map.entries()).sort(([a], [b]) =>
      new Date(b) - new Date(a)
    );
  }, [riwayat]);

  const handlePrev = useCallback(() => {
    if (bulan === 1) {
      setBulan(12);
      setTahun((y) => y - 1);
    } else {
      setBulan((b) => b - 1);
    }
  }, [bulan]);

  const handleNext = useCallback(() => {
    if (bulan === 12) {
      setBulan(1);
      setTahun((y) => y + 1);
    } else {
      setBulan((b) => b + 1);
    }
  }, [bulan]);

  const renderItem = useCallback(
    ({ item: [tanggal, items] }) => (
      <RiwayatGroup tanggal={tanggal} items={items} />
    ),
    []
  );

  const keyExtractor = useCallback(([tanggal]) => tanggal, []);

  const ListHeader = (
    <>
      <MonthPicker
        bulan={bulan}
        tahun={tahun}
        onPrev={handlePrev}
        onNext={handleNext}
      />
      <RingkasanCard ringkasan={ringkasan} />
      {groupedRiwayat.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Riwayat Kehadiran</Text>
          <Text style={styles.sectionCount}>
            {riwayat.length} catatan
          </Text>
        </View>
      )}
      {error && riwayat.length > 0 ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>
            ⚠ Gagal memperbarui. Data mungkin tidak terbaru.
          </Text>
        </View>
      ) : null}
    </>
  );

  if (isLoading && !ringkasan) {
    return (
      <SafeAreaView style={styles.safe}>
        <ChildSwitcherBar />
        <LoadingSpinner message="Memuat data absensi..." />
      </SafeAreaView>
    );
  }

  if (error && !ringkasan) {
    return (
      <SafeAreaView style={styles.safe}>
        <ChildSwitcherBar />
        <View style={styles.pickerStandalone}>
          <MonthPicker
            bulan={bulan}
            tahun={tahun}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        </View>
        <ErrorView message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ChildSwitcherBar />

      <FlatList
        data={groupedRiwayat}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyAbsensi bulan={bulan} tahun={tahun} />
          ) : null
        }
        ListFooterComponent={<View style={styles.listFooter} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => (
          <View style={styles.separator} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingBottom: 24 },
  listFooter: { height: 24 },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 72,
  },

  // ── Month Picker ──
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  pickerBtnDisabled: { opacity: 0.3 },
  pickerArrow: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: '300',
    lineHeight: 32,
  },
  pickerArrowDisabled: { color: colors.gray300 },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  pickerStandalone: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // ── Ringkasan Card ──
  ringkasanCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ringkasanTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
  },
  pctCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    flexShrink: 0,
  },
  pctNumber: { fontSize: 20, fontWeight: '800' },
  pctLabel: { fontSize: 10, color: colors.textMuted, marginTop: 1 },

  statsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statChip: {
    minWidth: '45%',
    flex: 1,
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', marginTop: 1 },

  progressBg: {
    height: 6,
    backgroundColor: colors.gray100,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  sectionCount: { fontSize: 12, color: colors.textMuted },

  // ── Riwayat Group ──
  groupRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    gap: 12,
  },
  dateBadge: {
    width: 44,
    alignItems: 'center',
    flexShrink: 0,
  },
  dateDayName: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dateDay: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 26,
  },
  dateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },

  sesiList: {
    flex: 1,
    gap: 6,
    paddingTop: 4,
  },
  sesiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sesiName: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 64,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Empty ──
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    backgroundColor: colors.white,
    gap: 8,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Error Banner ──
  errorBanner: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorBannerText: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '600',
  },
});
