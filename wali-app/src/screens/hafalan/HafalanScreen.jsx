import React, { useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useActiveChild } from '../../context/ActiveChildContext';
import { useHafalan } from '../../hooks/useHafalan';
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

function SummaryCard({ ringkasan, bulan, tahun }) {
  if (!ringkasan || ringkasan.total_entri === 0) return null;
  return (
    <AppCard padding="md" style={styles.summary} accent="primary">
      <AppText variant="h3">Setoran Hafalan</AppText>
      <AppText variant="caption" color="muted">{monthName(bulan)} {tahun}</AppText>
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <AppText variant="h1" color="brand">{ringkasan.total_entri}</AppText>
          <AppText variant="caption" color="muted">Total Setoran</AppText>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <AppText variant="h1" color="info">{ringkasan.total_pekan}</AppText>
          <AppText variant="caption" color="muted">Pekan Aktif</AppText>
        </View>
      </View>
    </AppCard>
  );
}

function HafalanCard({ item }) {
  return (
    <AppCard padding="md" style={styles.card}>
      <View style={styles.cardHead}>
        <StatusBadge variant="primary" size="sm">Pekan {item.pekan ?? '-'}</StatusBadge>
        <AppText variant="caption" color="muted">{formatDate(item.tanggal)}</AppText>
      </View>
      <AppText variant="h3" numberOfLines={1}>{item.kitab ?? '-'}</AppText>
      {(item.awal || item.akhir) ? (
        <AppCard padding="sm" shadow="none" style={styles.range}>
          <AppText variant="caption" color="muted">Halaman / Ayat</AppText>
          <AppText variant="bodyMedium" color="brand">
            {item.awal ?? '?'} → {item.akhir ?? '?'}
          </AppText>
        </AppCard>
      ) : null}
      {item.catatan ? (
        <AppText variant="caption" color="secondary" style={styles.catatan} numberOfLines={3}>
          {item.catatan}
        </AppText>
      ) : null}
    </AppCard>
  );
}

export function HafalanScreen() {
  const { activeSantriId } = useActiveChild();
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());

  const { data, ringkasan, isLoading, isRefreshing, error, refresh } =
    useHafalan(activeSantriId, bulan, tahun);

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
        <LoadingSpinner message="Memuat data hafalan..." />
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
        renderItem={({ item }) => <HafalanCard item={item} />}
        ListHeaderComponent={
          <>
            <ChildSwitcherBar />
            <MonthPickerBar bulan={bulan} tahun={tahun} onPrev={handlePrev} onNext={handleNext} />
            <SummaryCard ringkasan={ringkasan} bulan={bulan} tahun={tahun} />
            {data.length > 0 && (
              <ListSectionHeader title="Riwayat Setoran" count={`${data.length} catatan`} />
            )}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            title="Belum Ada Setoran Hafalan"
            description={`Tidak ada catatan hafalan untuk ${monthName(bulan)} ${tahun}.`}
            icon="book-outline"
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
  summary: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, gap: spacing.xs },
  stats: { flexDirection: 'row', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  statItem: { flex: 1, alignItems: 'center' },
  divider: { width: 1, backgroundColor: colors.border },
  card: { marginHorizontal: spacing.lg, gap: spacing.sm },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  range: { backgroundColor: colors.surfaceSoft, marginTop: spacing.xs },
  catatan: { fontStyle: 'italic', marginTop: spacing.xs },
});
