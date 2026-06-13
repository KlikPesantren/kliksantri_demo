import React, { useCallback } from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useActiveChild } from '../../context/ActiveChildContext';
import { usePelanggaran } from '../../hooks/usePelanggaran';
import { ChildSwitcherBar } from '../../components/dashboard/ChildSwitcherBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorView } from '../../components/common/ErrorView';
import {
  ScreenContainer,
  AppCard,
  AppText,
  StatusBadge,
  EmptyState,
  KpiTile,
  ListSectionHeader,
} from '../../components/ui';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/theme';
import { formatDate } from '../../utils/formatDate';

function severityVariant(poin, tingkat) {
  const t = (tingkat ?? '').toLowerCase();
  if (t === 'berat' || t === 'sangat berat') return 'danger';
  if (t === 'sedang') return 'warning';
  if (t === 'ringan') return 'success';
  const p = Number(poin) || 0;
  if (p > 15) return 'danger';
  if (p > 5) return 'warning';
  return 'success';
}

function severityLabel(poin, tingkat) {
  if (tingkat) return tingkat;
  return `${Number(poin) || 0} poin`;
}

function SummaryRow({ ringkasan, data }) {
  const total = ringkasan?.total ?? data.length;
  const totalPoin = ringkasan?.total_poin ?? data.reduce((s, d) => s + (Number(d.poin) || 0), 0);
  const berat = data.filter((d) => severityVariant(d.poin, d.tingkat) === 'danger').length;

  return (
    <View style={styles.kpiRow}>
      <KpiTile label="Total" value={String(total)} icon="alert-circle-outline" accent="primary" iconColor={colors.primary} />
      <KpiTile label="Total Poin" value={String(totalPoin)} icon="stats-chart-outline" accent="warning" iconColor={colors.warning} />
      <KpiTile label="Berat" value={String(berat)} icon="warning-outline" accent="danger" iconColor={colors.danger} />
    </View>
  );
}

function PelanggaranCard({ item }) {
  const variant = severityVariant(item.poin, item.tingkat);
  return (
    <AppCard padding="md" style={styles.card} accent={variant} accentPosition="left">
      <View style={styles.head}>
        <AppText variant="bodyMedium" numberOfLines={1} style={styles.flex}>
          {item.jenis ?? 'Tidak diketahui'}
        </AppText>
        <StatusBadge variant={variant} size="sm">
          {severityLabel(item.poin, item.tingkat)}
        </StatusBadge>
      </View>
      <AppText variant="caption" color="muted">
        {formatDate(item.tanggal)}
        {item.jam ? ` · ${String(item.jam).slice(0, 5)}` : ''}
      </AppText>
      {item.catatan ? (
        <AppText variant="caption" color="secondary" numberOfLines={2}>{item.catatan}</AppText>
      ) : null}
      {(item.tindakan || item.petugas) ? (
        <View style={styles.footer}>
          {item.tindakan ? <StatusBadge status={item.tindakan} size="sm">{item.tindakan}</StatusBadge> : null}
          {item.petugas ? (
            <AppText variant="caption" color="muted">{item.petugas}</AppText>
          ) : null}
        </View>
      ) : null}
    </AppCard>
  );
}

export function PelanggaranScreen() {
  const { activeSantriId } = useActiveChild();
  const { data, ringkasan, isLoading, isRefreshing, error, refresh } =
    usePelanggaran(activeSantriId);

  if (isLoading && data.length === 0) {
    return (
      <ScreenContainer>
        <ChildSwitcherBar />
        <LoadingSpinner message="Memuat pelanggaran..." />
      </ScreenContainer>
    );
  }

  if (error && data.length === 0) {
    return (
      <ScreenContainer>
        <ChildSwitcherBar />
        <ErrorView message={error} onRetry={refresh} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <PelanggaranCard item={item} />}
        ListHeaderComponent={
          <>
            <ChildSwitcherBar />
            {data.length > 0 ? (
              <>
                <SummaryRow ringkasan={ringkasan} data={data} />
                <ListSectionHeader title="Riwayat Pelanggaran" count={`${data.length} catatan`} />
              </>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            title="Tidak Ada Catatan"
            description="Alhamdulillah, belum ada catatan pelanggaran."
            icon="shield-checkmark-outline"
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
  list: { paddingTop: spacing.md, paddingBottom: spacing['3xl'] },
  sep: { height: spacing.sm },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.sm },
  card: { marginHorizontal: spacing.lg, gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  flex: { flex: 1, minWidth: 0 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.xs },
});
