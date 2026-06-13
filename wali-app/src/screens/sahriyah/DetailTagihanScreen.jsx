import React, { useCallback } from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSahriyahDetail } from '../../hooks/useSahriyahDetail';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorView } from '../../components/common/ErrorView';
import {
  ScreenContainer,
  AppCard,
  AppText,
  StatusBadge,
  EmptyState,
  ListSectionHeader,
  StaleDataBanner,
} from '../../components/ui';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate, monthName } from '../../utils/formatDate';

function TagihanSummary({ tagihan }) {
  if (!tagihan) return null;
  const pct =
    tagihan.nominal > 0
      ? Math.min(Math.round((tagihan.total_bayar / tagihan.nominal) * 100), 100)
      : 0;

  return (
    <AppCard padding="md" style={styles.summary} accent="primary">
      <View style={styles.summaryHead}>
        <AppText variant="h2">
          {monthName(tagihan.bulan)} {tagihan.tahun}
        </AppText>
        <StatusBadge status={tagihan.status} />
      </View>
      <View style={styles.amounts}>
        <Cell label="Total Tagihan" value={formatCurrency(tagihan.nominal)} />
        <Cell label="Sudah Dibayar" value={formatCurrency(tagihan.total_bayar)} color="success" />
        <Cell label="Sisa" value={formatCurrency(tagihan.sisa_tagihan)} color={tagihan.sisa_tagihan > 0 ? 'danger' : 'success'} />
      </View>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <AppText variant="caption" color="muted">{pct}% terbayar</AppText>
      {tagihan.nominal_beras > 0 ? (
        <AppText variant="caption" color="secondary">
          Beras: {tagihan.nominal_beras} kg
        </AppText>
      ) : null}
    </AppCard>
  );
}

function Cell({ label, value, color = 'primary' }) {
  return (
    <View style={styles.cell}>
      <AppText variant="caption" color="muted">{label}</AppText>
      <AppText variant="bodyMedium" color={color}>{value}</AppText>
    </View>
  );
}

function RiwayatItem({ item, index }) {
  return (
    <AppCard padding="sm" style={styles.riwayat}>
      <View style={styles.riwayatBadge}>
        <AppText variant="caption" color="brand">{index + 1}</AppText>
      </View>
      <View style={styles.riwayatBody}>
        <View style={styles.riwayatRow}>
          <AppText variant="bodyMedium">{formatDate(item.tanggal)}</AppText>
          <AppText variant="bodyMedium" color="success">{formatCurrency(item.nominal)}</AppText>
        </View>
        <AppText variant="caption" color="muted">
          {item.petugas ? `Petugas: ${item.petugas}` : 'Petugas tidak tercatat'}
        </AppText>
        {item.nominal_beras > 0 ? (
          <AppText variant="caption" color="secondary">Beras {item.nominal_beras} kg</AppText>
        ) : null}
      </View>
    </AppCard>
  );
}

export function DetailTagihanScreen() {
  const route = useRoute();
  const { tagihanId, tagihan } = route.params ?? {};
  const { data, isLoading, isRefreshing, error, refresh } = useSahriyahDetail(tagihanId);

  if (isLoading && data.length === 0) {
    return (
      <ScreenContainer>
        <LoadingSpinner message="Memuat riwayat pembayaran..." />
      </ScreenContainer>
    );
  }

  if (error && data.length === 0) {
    return (
      <ScreenContainer>
        <ErrorView message={error} onRetry={refresh} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => <RiwayatItem item={item} index={index} />}
        ListHeaderComponent={
          <>
            <TagihanSummary tagihan={tagihan} />
            <ListSectionHeader title="Riwayat Pembayaran" count={data.length > 0 ? `${data.length} transaksi` : null} />
            {error ? <StaleDataBanner /> : null}
          </>
        }
        ListEmptyComponent={
          <EmptyState title="Belum Ada Pembayaran" description="Riwayat pembayaran tagihan ini belum tersedia." icon="cash-outline" />
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
  summary: { marginHorizontal: spacing.lg, marginTop: spacing.md, gap: spacing.sm },
  summaryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  amounts: { flexDirection: 'row', gap: spacing.sm },
  cell: { flex: 1 },
  progressBg: { height: 6, backgroundColor: colors.neutralSoft, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.success, borderRadius: 3 },
  riwayat: { flexDirection: 'row', marginHorizontal: spacing.lg, gap: spacing.md, alignItems: 'flex-start' },
  riwayatBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riwayatBody: { flex: 1, gap: spacing.xs },
  riwayatRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
});
