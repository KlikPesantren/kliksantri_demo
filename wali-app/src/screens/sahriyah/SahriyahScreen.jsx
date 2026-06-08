import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useActiveChild } from '../../context/ActiveChildContext';
import { useSahriyah } from '../../hooks/useSahriyah';
import { ChildSwitcherBar } from '../../components/dashboard/ChildSwitcherBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorView } from '../../components/common/ErrorView';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatCurrency';
import { monthName } from '../../utils/formatDate';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getStatusConfig(status) {
  switch ((status ?? '').toLowerCase()) {
    case 'lunas':
      return {
        label: 'Lunas',
        bg: colors.successLight,
        text: colors.success,
        icon: '✓',
      };
    case 'sebagian':
      return {
        label: 'Sebagian',
        bg: colors.warningLight,
        text: colors.warning,
        icon: '◑',
      };
    default:
      return {
        label: 'Belum Bayar',
        bg: colors.dangerLight,
        text: colors.danger,
        icon: '✕',
      };
  }
}

// ─── Summary Header ───────────────────────────────────────────────────────────

function SummaryHeader({ data }) {
  const lunas = data.filter((d) => d.status?.toLowerCase() === 'lunas').length;
  const sebagian = data.filter(
    (d) => d.status?.toLowerCase() === 'sebagian'
  ).length;
  const belum = data.length - lunas - sebagian;

  const totalTagihan = data.reduce((s, d) => s + Number(d.nominal ?? 0), 0);
  const totalBayar = data.reduce((s, d) => s + Number(d.total_bayar ?? 0), 0);
  const totalSisa = data.reduce((s, d) => s + Number(d.sisa_tagihan ?? 0), 0);

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Ringkasan Sahriyah</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{data.length}</Text>
          <Text style={styles.summaryLabel}>Total Tagihan</Text>
        </View>
        <View style={[styles.summaryItem, styles.summaryItemBordered]}>
          <Text style={[styles.summaryValue, { color: colors.success }]}>
            {lunas}
          </Text>
          <Text style={styles.summaryLabel}>Lunas</Text>
        </View>
        <View style={[styles.summaryItem, styles.summaryItemBordered]}>
          <Text style={[styles.summaryValue, { color: colors.warning }]}>
            {sebagian}
          </Text>
          <Text style={styles.summaryLabel}>Sebagian</Text>
        </View>
        <View style={[styles.summaryItem, styles.summaryItemBordered]}>
          <Text style={[styles.summaryValue, { color: colors.danger }]}>
            {belum}
          </Text>
          <Text style={styles.summaryLabel}>Belum</Text>
        </View>
      </View>

      <View style={styles.summaryDivider} />

      <View style={styles.summaryFinanceRow}>
        <View style={styles.summaryFinanceItem}>
          <Text style={styles.summaryFinanceLabel}>Total Tagihan</Text>
          <Text style={styles.summaryFinanceValue}>
            {formatCurrency(totalTagihan)}
          </Text>
        </View>
        <View style={styles.summaryFinanceItem}>
          <Text style={styles.summaryFinanceLabel}>Terbayar</Text>
          <Text style={[styles.summaryFinanceValue, { color: colors.success }]}>
            {formatCurrency(totalBayar)}
          </Text>
        </View>
        <View style={styles.summaryFinanceItem}>
          <Text style={styles.summaryFinanceLabel}>Sisa</Text>
          <Text
            style={[
              styles.summaryFinanceValue,
              { color: totalSisa > 0 ? colors.danger : colors.success },
            ]}
          >
            {formatCurrency(totalSisa)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Tagihan Item ─────────────────────────────────────────────────────────────

function TagihanItem({ item, onPress }) {
  const status = getStatusConfig(item.status);
  const pct =
    item.nominal > 0
      ? Math.min(Math.round((item.total_bayar / item.nominal) * 100), 100)
      : 0;

  return (
    <TouchableOpacity
      style={styles.tagihanCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Row 1: bulan-tahun + badge */}
      <View style={styles.tagihanHeader}>
        <Text style={styles.tagihanPeriod}>
          {monthName(item.bulan)} {item.tahun}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.text }]}>
            {status.icon} {status.label}
          </Text>
        </View>
      </View>

      {/* Row 2: nominal detail */}
      <View style={styles.tagihanAmounts}>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Tagihan</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(item.nominal)}
          </Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Dibayar</Text>
          <Text style={[styles.amountValue, { color: colors.success }]}>
            {formatCurrency(item.total_bayar)}
          </Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Sisa</Text>
          <Text
            style={[
              styles.amountValue,
              { color: item.sisa_tagihan > 0 ? colors.danger : colors.success },
            ]}
          >
            {formatCurrency(item.sisa_tagihan)}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${pct}%`,
              backgroundColor:
                pct === 100 ? colors.success : pct > 0 ? colors.warning : colors.gray200,
            },
          ]}
        />
      </View>
      <View style={styles.progressFooter}>
        <Text style={styles.progressLabel}>{pct}% terbayar</Text>
        <Text style={styles.tapDetail}>Tap untuk riwayat →</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptySahriyah() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>Belum Ada Tagihan</Text>
      <Text style={styles.emptySubtitle}>
        Data sahriyah belum tersedia untuk santri ini.
      </Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export function SahriyahScreen() {
  const navigation = useNavigation();
  const { activeSantriId } = useActiveChild();

  const { data, isLoading, isRefreshing, error, refresh } =
    useSahriyah(activeSantriId);

  const handlePressItem = useCallback(
    (item) => {
      navigation.navigate('DetailTagihan', {
        tagihanId: item.id,
        title: `${monthName(item.bulan)} ${item.tahun}`,
        tagihan: item,
      });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <TagihanItem item={item} onPress={() => handlePressItem(item)} />
    ),
    [handlePressItem]
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  if (isLoading && data.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ChildSwitcherBar />
        <LoadingSpinner message="Memuat data sahriyah..." />
      </SafeAreaView>
    );
  }

  if (error && data.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ChildSwitcherBar />
        <ErrorView message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ChildSwitcherBar />

      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={
          data.length > 0 ? <SummaryHeader data={data} /> : null
        }
        ListEmptyComponent={!isLoading ? <EmptySahriyah /> : null}
        ListFooterComponent={<View style={styles.listFooter} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  listContent: { padding: 16 },
  separator: { height: 10 },
  listFooter: { height: 24 },

  // ── Summary Card ──
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryItemBordered: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 14,
  },
  summaryFinanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryFinanceItem: { flex: 1, alignItems: 'center' },
  summaryFinanceLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 3,
  },
  summaryFinanceValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },

  // ── Tagihan Card ──
  tagihanCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tagihanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  tagihanPeriod: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Amounts
  tagihanAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  amountItem: { flex: 1, alignItems: 'center' },
  amountLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 3,
  },
  amountValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },

  // Progress
  progressBg: {
    height: 6,
    backgroundColor: colors.gray100,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  tapDetail: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },

  // ── Empty ──
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
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
});
