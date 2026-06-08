import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useActiveChild } from '../../context/ActiveChildContext';
import { useRFID } from '../../hooks/useRFID';
import { ChildSwitcherBar } from '../../components/dashboard/ChildSwitcherBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorView } from '../../components/common/ErrorView';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTrxLabel(trxType) {
  const t = (trxType ?? '').toLowerCase();
  if (t.includes('topup') || t.includes('top_up') || t.includes('top up')) {
    return { label: 'Top Up', color: colors.success, sign: '+' };
  }
  if (t.includes('payment') || t.includes('belanja') || t.includes('bayar')) {
    return { label: 'Belanja', color: colors.danger, sign: '-' };
  }
  return { label: trxType ?? '-', color: colors.textSecondary, sign: '' };
}

// ─── Header: Saldo Card ──────────────────────────────────────────────────────

function SaldoHeader({ saldo, activeChild }) {
  const kartuAktif = saldo?.kartu_aktif ?? false;
  const nominal = saldo?.saldo ?? 0;
  const limitHarian = saldo?.limit_harian ?? 0;

  return (
    <View style={styles.saldoCard}>
      {/* Row 1: label + badge */}
      <View style={styles.saldoTopRow}>
        <Text style={styles.saldoLabel}>Saldo RFID</Text>
        <View
          style={[
            styles.kartiBadge,
            kartuAktif ? styles.kartiBadgeActive : styles.kartiBadgeInactive,
          ]}
        >
          <Text
            style={[
              styles.kartiBadgeText,
              kartuAktif
                ? styles.kartiBadgeTextActive
                : styles.kartiBadgeTextInactive,
            ]}
          >
            {kartuAktif ? '● Kartu Aktif' : '○ Kartu Tidak Ada'}
          </Text>
        </View>
      </View>

      {/* Nominal besar */}
      <Text style={styles.saldoNominal}>{formatCurrency(nominal)}</Text>

      {/* Sub-info */}
      <View style={styles.saldoSubRow}>
        {limitHarian > 0 && (
          <Text style={styles.saldoSub}>
            Limit harian: {formatCurrency(limitHarian)}
          </Text>
        )}
        {activeChild?.nama ? (
          <Text style={styles.saldoSub}>
            a/n {activeChild.nama}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── Mutasi Item ─────────────────────────────────────────────────────────────

function MutasiItem({ item }) {
  const { label, color, sign } = getTrxLabel(item.trx_type);
  const isPositive = sign === '+';

  return (
    <View style={styles.mutasiItem}>
      {/* Icon */}
      <View style={[styles.mutasiIcon, { backgroundColor: isPositive ? colors.successLight : colors.dangerLight }]}>
        <Text style={styles.mutasiIconText}>{isPositive ? '↑' : '↓'}</Text>
      </View>

      {/* Info */}
      <View style={styles.mutasiInfo}>
        <Text style={styles.mutasiMerchant} numberOfLines={1}>
          {item.nama_merchant ?? 'Tanpa Merchant'}
        </Text>
        <Text style={styles.mutasiMeta}>
          {formatDate(item.created_at)}
          {item.trx_id ? `  ·  #${item.trx_id}` : ''}
        </Text>
        <View style={styles.mutasiTypeBadge}>
          <Text style={[styles.mutasiTypeText, { color }]}>{label}</Text>
        </View>
      </View>

      {/* Amounts */}
      <View style={styles.mutasiAmounts}>
        <Text style={[styles.mutasiNominal, { color }]}>
          {sign}{formatCurrency(item.nominal)}
        </Text>
        <Text style={styles.mutasiSaldoAkhir}>
          {formatCurrency(item.saldo_akhir)}
        </Text>
        <Text style={styles.mutasiSaldoLabel}>saldo akhir</Text>
      </View>
    </View>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyMutasi() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🧾</Text>
      <Text style={styles.emptyTitle}>Belum Ada Transaksi</Text>
      <Text style={styles.emptySubtitle}>
        Riwayat mutasi RFID akan muncul di sini.
      </Text>
    </View>
  );
}

// ─── Footer: Load More / End ──────────────────────────────────────────────────

function ListFooter({ isLoadingMore, hasMore, total, loaded }) {
  if (isLoadingMore) {
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.footerText}>Memuat lebih banyak...</Text>
      </View>
    );
  }
  if (!hasMore && total > 0) {
    return (
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Menampilkan {loaded} dari {total} transaksi
        </Text>
      </View>
    );
  }
  return <View style={styles.footerPad} />;
}

// ─── Section Header ───────────────────────────────────────────────────────────

function MutasiSectionHeader({ total }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Riwayat Mutasi</Text>
      {total > 0 ? (
        <Text style={styles.sectionCount}>{total} transaksi</Text>
      ) : null}
    </View>
  );
}

// ─── Skeleton Loading ─────────────────────────────────────────────────────────

function SkeletonRow() {
  return <View style={styles.skeletonRow} />;
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export function RFIDScreen() {
  const { activeSantriId, activeChild } = useActiveChild();

  const {
    saldo,
    mutasi,
    total,
    hasMore,
    isLoadingFirst,
    isRefreshing,
    isLoadingMore,
    error,
    refresh,
    loadMore,
  } = useRFID(activeSantriId);

  const handleEndReached = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadMore();
    }
  }, [isLoadingMore, hasMore, loadMore]);

  const renderItem = useCallback(
    ({ item }) => <MutasiItem item={item} />,
    []
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  // Loading pertama kali
  if (isLoadingFirst && !saldo) {
    return (
      <SafeAreaView style={styles.safe}>
        <ChildSwitcherBar />
        <LoadingSpinner message="Memuat data RFID..." />
      </SafeAreaView>
    );
  }

  // Error tanpa data
  if (error && !saldo) {
    return (
      <SafeAreaView style={styles.safe}>
        <ChildSwitcherBar />
        <ErrorView message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  const ListHeader = (
    <>
      <SaldoHeader saldo={saldo} activeChild={activeChild} />
      <MutasiSectionHeader total={total} />
      {/* Skeleton saat pertama load mutasi */}
      {isLoadingFirst && mutasi.length === 0 && (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
        </View>
      )}
      {/* Error hint saat refresh gagal tapi ada data lama */}
      {error && saldo ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>
            ⚠ Gagal memperbarui. Data mungkin tidak terbaru.
          </Text>
        </View>
      ) : null}
    </>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ChildSwitcherBar />

      <FlatList
        data={mutasi}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={!isLoadingFirst ? <EmptyMutasi /> : null}
        ListFooterComponent={
          <ListFooter
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            total={total}
            loaded={mutasi.length}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  listContent: { paddingBottom: 24 },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: 72 },

  // ── Saldo Card ──
  saldoCard: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    marginBottom: 0,
  },
  saldoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  saldoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  kartiBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  kartiBadgeActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  kartiBadgeInactive: { backgroundColor: 'rgba(255,255,255,0.08)' },
  kartiBadgeText: { fontSize: 11, fontWeight: '600' },
  kartiBadgeTextActive: { color: '#86efac' },
  kartiBadgeTextInactive: { color: 'rgba(255,255,255,0.4)' },

  saldoNominal: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  saldoSubRow: {
    flexDirection: 'row',
    gap: 16,
  },
  saldoSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  sectionCount: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // ── Mutasi Item ──
  mutasiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  mutasiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mutasiIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  mutasiInfo: { flex: 1 },
  mutasiMerchant: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  mutasiMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
  },
  mutasiTypeBadge: {},
  mutasiTypeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  mutasiAmounts: { alignItems: 'flex-end', minWidth: 90 },
  mutasiNominal: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  mutasiSaldoAkhir: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  mutasiSaldoLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },

  // ── Empty ──
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    backgroundColor: colors.white,
    gap: 8,
  },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
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

  // ── Footer ──
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
    backgroundColor: colors.white,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  footerPad: { height: 16 },

  // ── Skeleton ──
  skeletonContainer: { backgroundColor: colors.white },
  skeletonRow: {
    height: 68,
    backgroundColor: colors.gray100,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 8,
  },

  // ── Error Banner ──
  errorBanner: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.warning,
  },
  errorBannerText: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '600',
  },
});
