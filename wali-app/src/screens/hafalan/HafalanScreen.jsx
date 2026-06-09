import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Animated,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useActiveChild } from '../../context/ActiveChildContext';
import { useHafalan } from '../../hooks/useHafalan';
import { ChildSwitcherBar } from '../../components/dashboard/ChildSwitcherBar';
import { ErrorView } from '../../components/common/ErrorView';
import { colors } from '../../constants/colors';
import { formatDate, monthName } from '../../utils/formatDate';

// ─── Pekan Badge Colors ───────────────────────────────────────────────────────

const PEKAN_COLORS = [
  { color: colors.primary, bg: colors.primaryLight },
  { color: colors.info, bg: colors.infoLight },
  { color: colors.warning, bg: colors.warningLight },
  { color: colors.success, bg: colors.successLight },
];

function getPekanStyle(pekan) {
  const idx = (Number(pekan) - 1) % 4;
  return PEKAN_COLORS[idx >= 0 ? idx : 0] ?? PEKAN_COLORS[0];
}

// ─── Month Picker ─────────────────────────────────────────────────────────────

function MonthPicker({ bulan, tahun, onPrev, onNext }) {
  const now = new Date();
  const isCurrent =
    bulan === now.getMonth() + 1 && tahun === now.getFullYear();

  return (
    <View style={styles.pickerRow}>
      <TouchableOpacity style={styles.pickerBtn} onPress={onPrev} activeOpacity={0.7}>
        <Text style={styles.pickerArrow}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.pickerLabel}>
        {monthName(bulan)} {tahun}
      </Text>
      <TouchableOpacity
        style={[styles.pickerBtn, isCurrent && styles.pickerBtnDisabled]}
        onPress={isCurrent ? undefined : onNext}
        activeOpacity={isCurrent ? 1 : 0.7}
        disabled={isCurrent}
      >
        <Text style={[styles.pickerArrow, isCurrent && styles.pickerArrowDisabled]}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  const anim = useRef(new Animated.Value(0.4)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity: anim }]}>
      <View style={styles.skeletonBadge} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '55%' }]} />
      </View>
    </Animated.View>
  );
}

function SkeletonList() {
  return (
    <View style={styles.skeletonContainer}>
      <View style={[styles.skeletonCard, { height: 80, marginBottom: 12 }]}>
        <View style={{ flex: 1, gap: 8 }}>
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, { width: '40%' }]} />
        </View>
      </View>
      {[1, 2, 3].map((k) => <SkeletonCard key={k} />)}
    </View>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ ringkasan, bulan, tahun }) {
  if (!ringkasan || ringkasan.total_entri === 0) return null;

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryIcon}>📖</Text>
        <View>
          <Text style={styles.summaryTitle}>Setoran Hafalan</Text>
          <Text style={styles.summaryPeriode}>
            {monthName(bulan)} {tahun}
          </Text>
        </View>
      </View>

      <View style={styles.summaryStats}>
        <StatItem
          value={ringkasan.total_entri}
          label="Total Setoran"
          color={colors.primary}
        />
        <View style={styles.statDivider} />
        <StatItem
          value={ringkasan.total_pekan}
          label="Pekan Aktif"
          color={colors.info}
        />
      </View>
    </View>
  );
}

function StatItem({ value, label, color }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Hafalan Card ─────────────────────────────────────────────────────────────

function HafalanCard({ item }) {
  const pekan = item.pekan ?? '-';
  const pekanStyle = getPekanStyle(item.pekan);

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        {/* Pekan badge */}
        <View style={[styles.pekanBadge, { backgroundColor: pekanStyle.bg }]}>
          <Text style={[styles.pekanText, { color: pekanStyle.color }]}>
            Pekan {pekan}
          </Text>
        </View>

        {/* Tanggal */}
        <Text style={styles.tanggalText}>
          {formatDate(item.tanggal)}
        </Text>
      </View>

      {/* Kitab — judul utama */}
      <Text style={styles.kitabText} numberOfLines={1}>
        {item.kitab ?? '-'}
      </Text>

      {/* Range: awal → akhir */}
      {(item.awal || item.akhir) ? (
        <View style={styles.rangeRow}>
          <Text style={styles.rangeLabel}>Halaman / Ayat</Text>
          <Text style={styles.rangeValue}>
            {item.awal ?? '?'} → {item.akhir ?? '?'}
          </Text>
        </View>
      ) : null}

      {/* Catatan */}
      {item.catatan ? (
        <View style={styles.catatanBox}>
          <Text style={styles.catatanIcon}>📝</Text>
          <Text style={styles.catatanText} numberOfLines={3}>
            {item.catatan}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyHafalan({ bulan, tahun }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📖</Text>
      <Text style={styles.emptyTitle}>Belum Ada Setoran Hafalan</Text>
      <Text style={styles.emptySubtitle}>
        Tidak ada catatan hafalan untuk{'\n'}
        {monthName(bulan)} {tahun}.
      </Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

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

  const renderItem = useCallback(({ item }) => <HafalanCard item={item} />, []);
  const keyExtractor = useCallback((item) => String(item.id), []);

  const ListHeader = (
    <>
      <MonthPicker bulan={bulan} tahun={tahun} onPrev={handlePrev} onNext={handleNext} />
      {ringkasan && ringkasan.total_entri > 0
        ? <SummaryCard ringkasan={ringkasan} bulan={bulan} tahun={tahun} />
        : null}
      {data.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Riwayat Setoran</Text>
          <Text style={styles.sectionCount}>{data.length} catatan</Text>
        </View>
      )}
    </>
  );

  if (isLoading && data.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ChildSwitcherBar />
        <SkeletonList />
      </SafeAreaView>
    );
  }

  if (error && data.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ChildSwitcherBar />
        <View style={styles.pickerStandalone}>
          <MonthPicker bulan={bulan} tahun={tahun} onPrev={handlePrev} onNext={handleNext} />
        </View>
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
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={!isLoading ? <EmptyHafalan bulan={bulan} tahun={tahun} /> : null}
        ListFooterComponent={<View style={{ height: 32 }} />}
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
  listContent: { paddingBottom: 0 },
  separator: { height: 10, marginHorizontal: 16 },

  // ── Month Picker ──
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  pickerBtnDisabled: { opacity: 0.3 },
  pickerArrow: { fontSize: 28, color: colors.primary, fontWeight: '300', lineHeight: 32 },
  pickerArrowDisabled: { color: colors.gray300 },
  pickerLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  pickerStandalone: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // ── Skeleton ──
  skeletonContainer: { padding: 16 },
  skeletonCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skeletonBadge: {
    width: 56,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.gray200,
  },
  skeletonLine: {
    height: 13,
    borderRadius: 6,
    backgroundColor: colors.gray200,
    width: '100%',
  },

  // ── Summary Card ──
  summaryCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  summaryIcon: { fontSize: 28 },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  summaryPeriode: { fontSize: 12, color: colors.textMuted, marginTop: 1 },

  summaryStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  sectionCount: { fontSize: 12, color: colors.textMuted },

  // ── Hafalan Card ──
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pekanBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pekanText: { fontSize: 12, fontWeight: '700' },
  tanggalText: { fontSize: 12, color: colors.textMuted },

  kitabText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.2,
  },

  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gray50,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rangeLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  rangeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },

  catatanBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  catatanIcon: { fontSize: 13, marginTop: 1 },
  catatanText: {
    flex: 1,
    fontSize: 12,
    color: colors.primaryDark,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  // ── Empty ──
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
