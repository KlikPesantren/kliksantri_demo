import React, { useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useActiveChild } from '../../context/ActiveChildContext';
import { useNilai } from '../../hooks/useNilai';
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
} from '../../components/ui';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/theme';
import { formatDate, monthName } from '../../utils/formatDate';

function toNumber(v) {
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function gradeVariant(nilaiRaw) {
  const n = toNumber(nilaiRaw);
  if (n === null) return 'neutral';
  if (n >= 85) return 'success';
  if (n >= 70) return 'info';
  if (n >= 55) return 'warning';
  return 'danger';
}

function gradeLabel(nilaiRaw) {
  const n = toNumber(nilaiRaw);
  if (n === null) return '?';
  if (n >= 85) return 'A';
  if (n >= 70) return 'B';
  if (n >= 55) return 'C';
  return 'D';
}

function SummaryCard({ ringkasan }) {
  if (!ringkasan || ringkasan.total_mapel === 0) return null;
  return (
    <AppCard padding="md" style={styles.summary} accent="info">
      <View style={styles.summaryHero}>
        <StatusBadge variant={gradeVariant(ringkasan.rata_rata)} size="lg">
          {gradeLabel(ringkasan.rata_rata)} · {ringkasan.rata_rata}
        </StatusBadge>
        <View style={styles.summaryRight}>
          <AppText variant="h3">Rata-rata Nilai</AppText>
          <AppText variant="caption" color="muted">
            {ringkasan.total_mapel} mata pelajaran
          </AppText>
        </View>
      </View>
      <View style={styles.minMax}>
        <View style={styles.minMaxItem}>
          <AppText variant="caption" color="muted">Tertinggi</AppText>
          <AppText variant="h2" color="success">{ringkasan.nilai_tertinggi}</AppText>
        </View>
        <View style={styles.divider} />
        <View style={styles.minMaxItem}>
          <AppText variant="caption" color="muted">Terendah</AppText>
          <AppText variant="h2" color="danger">{ringkasan.nilai_terendah}</AppText>
        </View>
      </View>
    </AppCard>
  );
}

function NilaiItem({ item }) {
  const nilaiNum = toNumber(item.nilai);
  const pct = nilaiNum != null ? Math.min(nilaiNum, 100) : 0;
  const variant = gradeVariant(item.nilai);

  return (
    <AppCard padding="sm" style={styles.item}>
      <StatusBadge variant={variant} size="md">{gradeLabel(item.nilai)}</StatusBadge>
      <View style={styles.itemBody}>
        <AppText variant="bodyMedium" numberOfLines={1}>{item.mapel ?? '-'}</AppText>
        <AppText variant="caption" color="muted">{formatDate(item.tanggal)}</AppText>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: colors[variant] ?? colors.primary }]} />
        </View>
      </View>
      <AppText variant="h2" color={variant}>{nilaiNum ?? item.nilai ?? '-'}</AppText>
    </AppCard>
  );
}

export function NilaiScreen() {
  const { activeSantriId } = useActiveChild();
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());

  const { data, ringkasan, isLoading, isRefreshing, error, refresh } =
    useNilai(activeSantriId, bulan, tahun);

  const handlePrev = useCallback(() => {
    if (bulan === 1) { setBulan(12); setTahun((y) => y - 1); }
    else setBulan((b) => b - 1);
  }, [bulan]);

  const handleNext = useCallback(() => {
    if (bulan === 12) { setBulan(1); setTahun((y) => y + 1); }
    else setBulan((b) => b + 1);
  }, [bulan]);

  if (isLoading && data.length === 0) {
    return (
      <ScreenContainer>
        <ChildSwitcherBar />
        <LoadingSpinner message="Memuat data nilai..." />
      </ScreenContainer>
    );
  }

  if (error && data.length === 0) {
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
        data={data}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <NilaiItem item={item} />}
        ListHeaderComponent={
          <>
            <ChildSwitcherBar />
            <MonthPickerBar bulan={bulan} tahun={tahun} onPrev={handlePrev} onNext={handleNext} />
            <SummaryCard ringkasan={ringkasan} />
            {data.length > 0 && (
              <ListSectionHeader title="Daftar Nilai" count={`${data.length} mapel`} />
            )}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            title="Belum Ada Data Nilai"
            description={`Tidak ada nilai untuk ${monthName(bulan)} ${tahun}.`}
            icon="school-outline"
          />
        }
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing['3xl'] },
  sep: { height: spacing.sm },
  summary: { marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  summaryHero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  summaryRight: { flex: 1 },
  minMax: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  minMaxItem: { flex: 1, alignItems: 'center' },
  divider: { width: 1, backgroundColor: colors.border },
  item: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, gap: spacing.md },
  itemBody: { flex: 1, minWidth: 0, gap: spacing.xs },
  barBg: { height: 4, backgroundColor: colors.neutralSoft, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2 },
});
