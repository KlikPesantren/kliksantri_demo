import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useActiveChild } from '../../context/ActiveChildContext';
import { usePerizinan } from '../../hooks/usePerizinan';
import { ChildSwitcherBar } from '../../components/dashboard/ChildSwitcherBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorView } from '../../components/common/ErrorView';
import { colors } from '../../constants/colors';
import { formatDate } from '../../utils/formatDate';

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  keluar: {
    label: 'Sedang di Luar',
    color: colors.warning,
    bg: colors.warningLight,
    dot: colors.warning,
  },
  kembali: {
    label: 'Sudah Kembali',
    color: colors.success,
    bg: colors.successLight,
    dot: colors.success,
  },
  disetujui: {
    label: 'Disetujui',
    color: colors.info,
    bg: colors.infoLight,
    dot: colors.info,
  },
  ditolak: {
    label: 'Ditolak',
    color: colors.danger,
    bg: colors.dangerLight,
    dot: colors.danger,
  },
  menunggu: {
    label: 'Menunggu',
    color: colors.gray500,
    bg: colors.gray100,
    dot: colors.gray400,
  },
};

function getStatus(raw) {
  const key = (raw ?? '').toLowerCase();
  return (
    STATUS_CONFIG[key] ?? {
      label: raw ?? '-',
      color: colors.textSecondary,
      bg: colors.gray100,
      dot: colors.gray300,
    }
  );
}

// ─── Hitung lama izin (hari) ─────────────────────────────────────────────────

function hitungLama(tanggal, tanggalKembali) {
  if (!tanggal || !tanggalKembali) return null;
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = Math.round(
    (new Date(tanggalKembali) - new Date(tanggal)) / msPerDay
  );
  if (isNaN(diff) || diff < 0) return null;
  if (diff === 0) return '< 1 hari';
  return diff === 1 ? '1 hari' : `${diff} hari`;
}

// ─── Summary Bar ─────────────────────────────────────────────────────────────

function SummaryBar({ data }) {
  const total = data.length;
  const aktif = data.filter((d) => d.status?.toLowerCase() === 'keluar').length;
  const kembali = data.filter((d) => d.status?.toLowerCase() === 'kembali').length;

  return (
    <View style={styles.summaryBar}>
      <SummaryChip label="Total Izin" value={total} color={colors.text} bg={colors.white} />
      <SummaryChip
        label="Di Luar"
        value={aktif}
        color={colors.warning}
        bg={colors.warningLight}
      />
      <SummaryChip
        label="Kembali"
        value={kembali}
        color={colors.success}
        bg={colors.successLight}
      />
    </View>
  );
}

function SummaryChip({ label, value, color, bg }) {
  return (
    <View style={[styles.summaryChip, { backgroundColor: bg }]}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Perizinan Card ───────────────────────────────────────────────────────────

function PerizinanCard({ item }) {
  const st = getStatus(item.status);
  const lama = hitungLama(item.tanggal, item.tanggal_kembali);

  return (
    <View style={styles.card}>
      {/* Header row: tujuan + status badge */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.statusDot, { backgroundColor: st.dot }]} />
          <Text style={styles.tujuanText} numberOfLines={1}>
            {item.tujuan ?? 'Tidak disebutkan'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
          <Text style={[styles.statusText, { color: st.color }]}>
            {st.label}
          </Text>
        </View>
      </View>

      {/* Alasan */}
      {item.alasan ? (
        <Text style={styles.alasanText} numberOfLines={2}>
          {item.alasan}
        </Text>
      ) : null}

      {/* Info grid */}
      <View style={styles.infoGrid}>
        <InfoItem
          icon="📅"
          label="Tanggal Keluar"
          value={formatDate(item.tanggal)}
        />
        <InfoItem
          icon="🔙"
          label="Rencana Kembali"
          value={formatDate(item.tanggal_kembali)}
        />
        {lama ? (
          <InfoItem icon="⏱" label="Lama Izin" value={lama} />
        ) : null}
        {item.jam_keluar ? (
          <InfoItem
            icon="🕐"
            label="Jam Keluar"
            value={item.jam_keluar.slice(0, 5)}
          />
        ) : null}
        {item.jam_kembali ? (
          <InfoItem
            icon="🕐"
            label="Jam Kembali"
            value={item.jam_kembali.slice(0, 5)}
          />
        ) : null}
      </View>

      {/* Catatan */}
      {item.catatan ? (
        <View style={styles.catatanBox}>
          <Text style={styles.catatanLabel}>Catatan</Text>
          <Text style={styles.catatanText}>{item.catatan}</Text>
        </View>
      ) : null}
    </View>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyPerizinan() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🏠</Text>
      <Text style={styles.emptyTitle}>Belum Ada Riwayat Izin</Text>
      <Text style={styles.emptySubtitle}>
        Santri belum pernah mengajukan izin keluar pesantren.
      </Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export function PerizinanScreen() {
  const { activeSantriId } = useActiveChild();
  const { data, isLoading, isRefreshing, error, refresh } =
    usePerizinan(activeSantriId);

  const renderItem = useCallback(
    ({ item }) => <PerizinanCard item={item} />,
    []
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  if (isLoading && data.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ChildSwitcherBar />
        <LoadingSpinner message="Memuat data perizinan..." />
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
          data.length > 0 ? <SummaryBar data={data} /> : null
        }
        ListEmptyComponent={!isLoading ? <EmptyPerizinan /> : null}
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
  listContent: { paddingHorizontal: 16, paddingTop: 0 },
  listFooter: { height: 32 },
  separator: { height: 10 },

  // ── Summary Bar ──
  summaryBar: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
  },
  summaryChip: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },

  // ── Card ──
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  tujuanText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Alasan ──
  alasanText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },

  // ── Info Grid ──
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    minWidth: '44%',
    flex: 1,
  },
  infoIcon: { fontSize: 14, marginTop: 1 },
  infoLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: 1,
  },

  // ── Catatan ──
  catatanBox: {
    marginTop: 12,
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  catatanLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  catatanText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },

  // ── Empty ──
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
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
