import React, { useCallback } from 'react';
import { View, FlatList, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useActiveChild } from '../../context/ActiveChildContext';
import { useSahriyah } from '../../hooks/useSahriyah';
import { ChildSwitcherBar } from '../../components/dashboard/ChildSwitcherBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorView } from '../../components/common/ErrorView';
import {
  ScreenContainer,
  AppCard,
  AppText,
  StatusBadge,
  EmptyState,
  ListSectionHeader,
} from '../../components/ui';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatCurrency';
import { monthName } from '../../utils/formatDate';

function SummaryHeader({ data }) {
  const lunas = data.filter((d) => d.status?.toLowerCase() === 'lunas').length;
  const sebagian = data.filter((d) => d.status?.toLowerCase() === 'sebagian').length;
  const belum = data.length - lunas - sebagian;
  const totalTagihan = data.reduce((s, d) => s + Number(d.nominal ?? 0), 0);
  const totalBayar = data.reduce((s, d) => s + Number(d.total_bayar ?? 0), 0);

  return (
    <View style={styles.summaryWrap}>
      <View style={styles.miniStatsGrid}>
        <MiniStat label="Tagihan" value={String(data.length)} icon="receipt-outline" color={colors.primary} bg={colors.primarySoft} />
        <MiniStat label="Lunas" value={String(lunas)} icon="checkmark-circle-outline" color={colors.success} bg={colors.successSoft} />
        <MiniStat label="Sebagian" value={String(sebagian)} icon="pie-chart-outline" color={colors.warning} bg={colors.warningSoft} />
        <MiniStat label="Belum" value={String(belum)} icon="alert-circle-outline" color={colors.danger} bg={colors.dangerSoft} />
      </View>
      <AppCard padding="md">
        <View style={styles.financeRow}>
          <View style={styles.financeCell}>
            <AppText variant="caption" color="muted">Total Tagihan</AppText>
            <AppText variant="bodyMedium">{formatCurrency(totalTagihan)}</AppText>
          </View>
          <View style={styles.financeCell}>
            <AppText variant="caption" color="muted">Terbayar</AppText>
            <AppText variant="bodyMedium" color="success">{formatCurrency(totalBayar)}</AppText>
          </View>
        </View>
      </AppCard>
    </View>
  );
}

function MiniStat({ label, value, icon, color, bg }) {
  return (
    <View style={[styles.miniStat, shadows.sm]}>
      <View style={[styles.miniIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={styles.miniCopy}>
        <AppText variant="h3" numberOfLines={1} style={styles.miniValue}>
          {value}
        </AppText>
        <AppText variant="caption" color="muted" numberOfLines={1} style={styles.miniLabel}>
          {label}
        </AppText>
      </View>
    </View>
  );
}

function TagihanItem({ item, onPress }) {
  const pct =
    item.nominal > 0
      ? Math.min(Math.round((item.total_bayar / item.nominal) * 100), 100)
      : 0;
  const barColor = pct === 100 ? colors.success : pct > 0 ? colors.warning : colors.neutralSoft;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <AppCard padding="md" style={styles.tagihan}>
        <View style={styles.tagihanHead}>
          <AppText variant="h3">{monthName(item.bulan)} {item.tahun}</AppText>
          <StatusBadge status={item.status} />
        </View>
        <View style={styles.amounts}>
          <AmountCell label="Tagihan" value={formatCurrency(item.nominal)} />
          <AmountCell label="Dibayar" value={formatCurrency(item.total_bayar)} color="success" />
          <AmountCell label="Sisa" value={formatCurrency(item.sisa_tagihan)} color={item.sisa_tagihan > 0 ? 'danger' : 'success'} />
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: barColor }]} />
        </View>
        <View style={styles.progressFoot}>
          <AppText variant="caption" color="muted">{pct}% terbayar</AppText>
          <AppText variant="caption" color="brand">Lihat riwayat</AppText>
        </View>
      </AppCard>
    </TouchableOpacity>
  );
}

function AmountCell({ label, value, color = 'primary' }) {
  return (
    <View style={styles.amountCell}>
      <AppText variant="caption" color="muted">{label}</AppText>
      <AppText variant="bodyMedium" color={color} numberOfLines={1}>{value}</AppText>
    </View>
  );
}

export function SahriyahScreen() {
  const navigation = useNavigation();
  const { activeSantriId } = useActiveChild();
  const { data, isLoading, isRefreshing, error, refresh } = useSahriyah(activeSantriId);

  const handlePress = useCallback(
    (item) => {
      navigation.navigate('DetailTagihan', {
        tagihanId: item.id,
        title: `${monthName(item.bulan)} ${item.tahun}`,
        tagihan: item,
      });
    },
    [navigation]
  );

  if (isLoading && data.length === 0) {
    return (
      <ScreenContainer>
        <ChildSwitcherBar />
        <LoadingSpinner message="Memuat data sahriyah..." />
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
        renderItem={({ item }) => (
          <TagihanItem item={item} onPress={() => handlePress(item)} />
        )}
        ListHeaderComponent={
          <>
            <ChildSwitcherBar />
            {data.length > 0 ? (
              <>
                <SummaryHeader data={data} />
                <ListSectionHeader title="Daftar Tagihan" count={`${data.length} bulan`} />
              </>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <EmptyState title="Belum Ada Tagihan" description="Data sahriyah belum tersedia." icon="receipt-outline" />
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
  summaryWrap: { paddingTop: spacing.md, gap: spacing.sm },
  miniStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  miniStat: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 58,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  miniIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCopy: {
    flex: 1,
    minWidth: 0,
  },
  miniValue: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '900',
  },
  miniLabel: {
    lineHeight: 15,
  },
  financeRow: { flexDirection: 'row', gap: spacing.md },
  financeCell: { flex: 1 },
  tagihan: { marginHorizontal: spacing.lg, gap: spacing.sm },
  tagihanHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  amounts: { flexDirection: 'row', gap: spacing.sm },
  amountCell: { flex: 1, minWidth: 0 },
  progressBg: { height: 6, backgroundColor: colors.neutralSoft, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressFoot: { flexDirection: 'row', justifyContent: 'space-between' },
});
