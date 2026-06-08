import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSahriyahDetail } from '../../hooks/useSahriyahDetail';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorView } from '../../components/common/ErrorView';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate, monthName } from '../../utils/formatDate';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getStatusConfig(status) {
  switch ((status ?? '').toLowerCase()) {
    case 'lunas':
      return { label: 'Lunas', bg: colors.successLight, text: colors.success, icon: '✓' };
    case 'sebagian':
      return { label: 'Sebagian', bg: colors.warningLight, text: colors.warning, icon: '◑' };
    default:
      return { label: 'Belum Bayar', bg: colors.dangerLight, text: colors.danger, icon: '✕' };
  }
}

// ─── Tagihan Summary (header of detail screen) ────────────────────────────────

function TagihanSummary({ tagihan }) {
  if (!tagihan) return null;

  const status = getStatusConfig(tagihan.status);
  const pct =
    tagihan.nominal > 0
      ? Math.min(Math.round((tagihan.total_bayar / tagihan.nominal) * 100), 100)
      : 0;

  return (
    <View style={styles.summaryCard}>
      {/* Period + Status */}
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryPeriod}>
          {monthName(tagihan.bulan)} {tagihan.tahun}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.text }]}>
            {status.icon} {status.label}
          </Text>
        </View>
      </View>

      {/* Amounts grid */}
      <View style={styles.amountsGrid}>
        <AmountCell
          label="Total Tagihan"
          value={formatCurrency(tagihan.nominal)}
          color={colors.text}
        />
        <AmountCell
          label="Terbayar"
          value={formatCurrency(tagihan.total_bayar)}
          color={colors.success}
        />
        <AmountCell
          label="Sisa Tagihan"
          value={formatCurrency(tagihan.sisa_tagihan)}
          color={tagihan.sisa_tagihan > 0 ? colors.danger : colors.success}
        />
      </View>

      {/* Beras (if any) */}
      {tagihan.nominal_beras > 0 ? (
        <View style={styles.berasRow}>
          <Text style={styles.berasLabel}>🌾 Beras:</Text>
          <Text style={styles.berasValue}>
            {tagihan.nominal_beras} kg  ·  Terbayar: {tagihan.beras_terbayar ?? 0} kg
            {tagihan.sisa_beras > 0 ? `  ·  Sisa: ${tagihan.sisa_beras} kg` : ''}
          </Text>
        </View>
      ) : null}

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${pct}%`,
              backgroundColor: pct === 100 ? colors.success : colors.warning,
            },
          ]}
        />
      </View>
      <Text style={styles.progressLabel}>{pct}% terbayar</Text>
    </View>
  );
}

function AmountCell({ label, value, color }) {
  return (
    <View style={styles.amountCell}>
      <Text style={styles.amountLabel}>{label}</Text>
      <Text style={[styles.amountValue, { color }]}>{value}</Text>
    </View>
  );
}

// ─── Riwayat Item ─────────────────────────────────────────────────────────────

function RiwayatItem({ item, index }) {
  return (
    <View style={styles.riwayatItem}>
      {/* Number badge */}
      <View style={styles.riwayatBadge}>
        <Text style={styles.riwayatBadgeText}>{index + 1}</Text>
      </View>

      <View style={styles.riwayatBody}>
        <View style={styles.riwayatRow}>
          <Text style={styles.riwayatTanggal}>{formatDate(item.tanggal)}</Text>
          <Text style={styles.riwayatNominal}>
            {formatCurrency(item.nominal)}
          </Text>
        </View>

        <View style={styles.riwayatRow}>
          {item.petugas ? (
            <Text style={styles.riwayatPetugas}>
              Petugas: {item.petugas}
            </Text>
          ) : (
            <Text style={styles.riwayatPetugasEmpty}>Petugas tidak tercatat</Text>
          )}
          {item.nominal_beras > 0 ? (
            <Text style={styles.riwayatBeras}>
              🌾 {item.nominal_beras} kg
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyRiwayat() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📂</Text>
      <Text style={styles.emptyTitle}>Belum Ada Pembayaran</Text>
      <Text style={styles.emptySubtitle}>
        Riwayat pembayaran untuk tagihan ini belum tersedia.
      </Text>
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ count }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Riwayat Pembayaran</Text>
      {count > 0 ? (
        <Text style={styles.sectionCount}>{count} transaksi</Text>
      ) : null}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export function DetailTagihanScreen() {
  const route = useRoute();
  const { tagihanId, tagihan } = route.params ?? {};

  const { data, isLoading, isRefreshing, error, refresh } =
    useSahriyahDetail(tagihanId);

  const renderItem = useCallback(
    ({ item, index }) => <RiwayatItem item={item} index={index} />,
    []
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  if (isLoading && data.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingSpinner message="Memuat riwayat pembayaran..." />
      </SafeAreaView>
    );
  }

  if (error && data.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorView message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={
          <>
            <TagihanSummary tagihan={tagihan} />
            <SectionHeader count={data.length} />
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>
                  ⚠ Gagal memperbarui. Menampilkan data terakhir.
                </Text>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={!isLoading ? <EmptyRiwayat /> : null}
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
    marginLeft: 60,
  },

  // ── Summary ──
  summaryCard: {
    backgroundColor: colors.white,
    padding: 20,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryPeriod: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  amountsGrid: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 1,
  },
  amountCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: colors.gray50,
    borderRadius: 8,
  },
  amountLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 4,
    textAlign: 'center',
  },
  amountValue: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  berasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    backgroundColor: colors.secondaryLight,
    padding: 10,
    borderRadius: 8,
  },
  berasLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.warning,
  },
  berasValue: {
    fontSize: 12,
    color: colors.text,
    flex: 1,
  },
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
  progressLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
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

  // ── Riwayat Item ──
  riwayatItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  riwayatBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  riwayatBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  riwayatBody: { flex: 1, gap: 4 },
  riwayatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riwayatTanggal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  riwayatNominal: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.success,
  },
  riwayatPetugas: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  riwayatPetugasEmpty: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  riwayatBeras: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '600',
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
