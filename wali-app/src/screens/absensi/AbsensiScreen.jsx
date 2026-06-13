import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useActiveChild } from '../../context/ActiveChildContext';
import { useAbsensi } from '../../hooks/useAbsensi';
import { ChildSwitcherBar } from '../../components/dashboard/ChildSwitcherBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorView } from '../../components/common/ErrorView';
import {
  ScreenContainer,
  AppCard,
  AppText,
  StatusBadge,
  EmptyState,
  MonthPickerBar,
  ListSectionHeader,
  StaleDataBanner,
} from '../../components/ui';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/theme';
import { monthName } from '../../utils/formatDate';

function RingkasanCard({ ringkasan }) {
  if (!ringkasan) return null;
  const total = ringkasan.total || 0;
  const hadir = ringkasan.hadir || 0;
  const pct = total > 0 ? Math.round((hadir / total) * 100) : 0;
  const barColor =
    pct >= 85 ? colors.success : pct >= 70 ? colors.warning : colors.danger;

  return (
    <AppCard padding="md" style={styles.ringkasan} accent="primary">
      <View style={styles.ringkasanTop}>
        <View style={[styles.pctCircle, { borderColor: barColor }]}>
          <AppText variant="h2" style={{ color: barColor }}>{pct}%</AppText>
          <AppText variant="caption" color="muted">hadir</AppText>
        </View>
        <View style={styles.chips}>
          <Chip label="Hadir" value={ringkasan.hadir} variant="success" />
          <Chip label="Izin" value={ringkasan.izin} variant="info" />
          <Chip label="Sakit" value={ringkasan.sakit} variant="warning" />
          <Chip label="Alpa" value={ringkasan.alpa} variant="danger" />
        </View>
      </View>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>
      <View style={styles.progressFooter}>
        <AppText variant="caption" color="muted">{hadir} dari {total} sesi</AppText>
        <AppText variant="caption" style={{ color: barColor, fontWeight: '700' }}>
          {pct}% kehadiran
        </AppText>
      </View>
    </AppCard>
  );
}

function Chip({ label, value, variant }) {
  return (
    <View style={styles.chip}>
      <AppText variant="h3" color={variant}>{String(value ?? 0)}</AppText>
      <AppText variant="caption" color="muted">{label}</AppText>
    </View>
  );
}

function RiwayatGroup({ tanggal, items }) {
  const date = new Date(tanggal);
  const day = date.getDate();
  const dayName = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][date.getDay()];

  return (
    <AppCard padding="sm" style={styles.groupRow}>
      <View style={styles.dateBadge}>
        <AppText variant="caption" color="muted">{dayName}</AppText>
        <AppText variant="h2">{day}</AppText>
      </View>
      <View style={styles.sesiList}>
        {items.map((item, idx) => (
          <View key={item.id ?? idx} style={styles.sesiRow}>
            <AppText variant="bodyMedium" numberOfLines={1} style={styles.sesiName}>
              {item.sesi ?? '-'}
            </AppText>
            <StatusBadge status={item.status} size="sm" />
          </View>
        ))}
      </View>
    </AppCard>
  );
}

export function AbsensiScreen() {
  const { activeSantriId } = useActiveChild();
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());

  const { ringkasan, riwayat, isLoading, isRefreshing, error, refresh } =
    useAbsensi(activeSantriId, bulan, tahun);

  const groupedRiwayat = useMemo(() => {
    const map = new Map();
    riwayat.forEach((item) => {
      const key = item.tanggal;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries()).sort(([a], [b]) => new Date(b) - new Date(a));
  }, [riwayat]);

  const handlePrev = useCallback(() => {
    if (bulan === 1) { setBulan(12); setTahun((y) => y - 1); }
    else setBulan((b) => b - 1);
  }, [bulan]);

  const handleNext = useCallback(() => {
    if (bulan === 12) { setBulan(1); setTahun((y) => y + 1); }
    else setBulan((b) => b + 1);
  }, [bulan]);

  const ListHeader = (
    <>
      <ChildSwitcherBar />
      <MonthPickerBar bulan={bulan} tahun={tahun} onPrev={handlePrev} onNext={handleNext} />
      <RingkasanCard ringkasan={ringkasan} />
      {groupedRiwayat.length > 0 && (
        <ListSectionHeader title="Riwayat Kehadiran" count={`${riwayat.length} catatan`} />
      )}
      {error && riwayat.length > 0 ? <StaleDataBanner /> : null}
    </>
  );

  if (isLoading && !ringkasan) {
    return (
      <ScreenContainer>
        <ChildSwitcherBar />
        <LoadingSpinner message="Memuat data absensi..." />
      </ScreenContainer>
    );
  }

  if (error && !ringkasan) {
    return (
      <ScreenContainer>
        <ChildSwitcherBar />
        <MonthPickerBar bulan={bulan} tahun={tahun} onPrev={handlePrev} onNext={handleNext} />
        <ErrorView message={error} onRetry={refresh} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={groupedRiwayat}
        keyExtractor={([tanggal]) => tanggal}
        renderItem={({ item: [tanggal, items] }) => (
          <RiwayatGroup tanggal={tanggal} items={items} />
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="Tidak Ada Data Absensi"
              description={`Belum ada catatan absensi untuk ${monthName(bulan)} ${tahun}.`}
              icon="calendar-outline"
            />
          ) : null
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing['3xl'] },
  sep: { height: spacing.sm },
  ringkasan: { marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  ringkasanTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.md },
  pctCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  chips: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minWidth: '44%', flex: 1, alignItems: 'center', padding: spacing.sm, backgroundColor: colors.surfaceSoft, borderRadius: 8 },
  progressBg: { height: 6, backgroundColor: colors.neutralSoft, borderRadius: 3, overflow: 'hidden', marginBottom: spacing.xs },
  progressFill: { height: '100%', borderRadius: 3 },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  groupRow: { flexDirection: 'row', marginHorizontal: spacing.lg, gap: spacing.md, alignItems: 'flex-start' },
  dateBadge: { width: 44, alignItems: 'center' },
  sesiList: { flex: 1, gap: spacing.sm },
  sesiRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  sesiName: { flex: 1, minWidth: 0 },
});
