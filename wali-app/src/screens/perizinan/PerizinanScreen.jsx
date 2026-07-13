import React from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useActiveChild } from '../../context/ActiveChildContext';
import { usePerizinan } from '../../hooks/usePerizinan';
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

function hitungLama(tanggal, tanggalKembali) {
  if (!tanggal || !tanggalKembali) return null;
  const diff = Math.round(
    (new Date(tanggalKembali) - new Date(tanggal)) / (1000 * 60 * 60 * 24)
  );
  if (Number.isNaN(diff) || diff < 0) return null;
  if (diff === 0) return '< 1 hari';
  return diff === 1 ? '1 hari' : `${diff} hari`;
}

function SummaryRow({ data }) {
  const aktif = data.filter((d) => d.status?.toLowerCase() === 'keluar').length;
  const kembali = data.filter((d) => d.status?.toLowerCase() === 'kembali').length;
  return (
    <View style={styles.kpiRow}>
      <KpiTile label="Total Izin" value={String(data.length)} icon="document-text-outline" accent="primary" iconColor={colors.primary} />
      <KpiTile label="Di Luar" value={String(aktif)} icon="exit-outline" accent="warning" iconColor={colors.warning} />
      <KpiTile label="Kembali" value={String(kembali)} icon="checkmark-circle-outline" accent="success" iconColor={colors.success} />
    </View>
  );
}

function PerizinanCard({ item }) {
  const lama = hitungLama(item.tanggal, item.tanggal_kembali);
  return (
    <AppCard padding="md" style={styles.card}>
      <View style={styles.cardHead}>
        <AppText variant="bodyMedium" numberOfLines={1} style={styles.flex}>
          {item.tujuan ?? 'Tidak disebutkan'}
        </AppText>
        <StatusBadge status={item.status} />
      </View>
      {item.alasan ? (
        <AppText variant="caption" color="secondary" numberOfLines={2}>{item.alasan}</AppText>
      ) : null}
      <View style={styles.infoGrid}>
        <InfoCell label="Keluar" value={formatDate(item.tanggal)} />
        <InfoCell label="Rencana Kembali" value={formatDate(item.tanggal_kembali)} />
        {lama ? <InfoCell label="Lama Izin" value={lama} /> : null}
        {item.jam_keluar ? <InfoCell label="Jam Keluar" value={item.jam_keluar.slice(0, 5)} /> : null}
        {item.jam_kembali ? <InfoCell label="Jam Kembali" value={item.jam_kembali.slice(0, 5)} /> : null}
      </View>
      {item.catatan ? (
        <AppText variant="caption" color="muted" style={styles.catatan}>{item.catatan}</AppText>
      ) : null}
    </AppCard>
  );
}

function InfoCell({ label, value }) {
  return (
    <View style={styles.infoCell}>
      <AppText variant="caption" color="muted">{label}</AppText>
      <AppText variant="bodyMedium" numberOfLines={1}>{value ?? '-'}</AppText>
    </View>
  );
}

export function PerizinanScreen() {
  const { activeSantriId } = useActiveChild();
  const { data, isLoading, isRefreshing, error, refresh } = usePerizinan(activeSantriId);

  if (isLoading && data.length === 0) {
    return (
      <ScreenContainer>
        <ChildSwitcherBar />
        <LoadingSpinner message="Memuat perizinan..." />
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
        renderItem={({ item }) => <PerizinanCard item={item} />}
        ListHeaderComponent={
          <>
            <ChildSwitcherBar />
            {data.length > 0 ? (
              <>
                <SummaryRow data={data} />
                <ListSectionHeader title="Riwayat Izin" count={`${data.length} catatan`} />
              </>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            title="Belum Ada Riwayat Izin"
            description="Santri belum pernah mengajukan izin keluar pesantren."
            icon="exit-outline"
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
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  flex: { flex: 1, minWidth: 0 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  infoCell: { width: '47%', minWidth: 140 },
  catatan: { marginTop: spacing.xs, fontStyle: 'italic' },
});
