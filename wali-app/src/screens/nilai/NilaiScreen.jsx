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
import { useNilai } from '../../hooks/useNilai';
import { ChildSwitcherBar } from '../../components/dashboard/ChildSwitcherBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorView } from '../../components/common/ErrorView';
import { colors } from '../../constants/colors';
import { formatDate, monthName } from '../../utils/formatDate';

// ─── Grade Helper ─────────────────────────────────────────────────────────────

// nilai disimpan sebagai string di DB (nilai::numeric diperlukan di SQL)
function toNumber(v) {
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function getGrade(nilaiRaw) {
  const n = toNumber(nilaiRaw);
  if (n === null) return { label: '?', color: colors.textMuted, bg: colors.gray100 };
  if (n >= 85) return { label: 'A', color: colors.success, bg: colors.successLight };
  if (n >= 70) return { label: 'B', color: colors.info, bg: colors.infoLight };
  if (n >= 55) return { label: 'C', color: colors.warning, bg: colors.warningLight };
  return { label: 'D', color: colors.danger, bg: colors.dangerLight };
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
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: '50%', marginTop: 8 }]} />
    </Animated.View>
  );
}

function SkeletonList() {
  return (
    <View style={styles.skeletonContainer}>
      <View style={[styles.skeletonCard, { height: 90, marginBottom: 12 }]} />
      {[1, 2, 3, 4, 5].map((k) => (
        <SkeletonCard key={k} />
      ))}
    </View>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ ringkasan }) {
  if (!ringkasan || ringkasan.total_mapel === 0) return null;

  const rataGrade = getGrade(ringkasan.rata_rata);

  return (
    <View style={styles.summaryCard}>
      {/* Rata-rata besar */}
      <View style={styles.summaryHero}>
        <View style={[styles.gradeCircle, { borderColor: rataGrade.color }]}>
          <Text style={[styles.gradeCircleLabel, { color: rataGrade.color }]}>
            {rataGrade.label}
          </Text>
          <Text style={[styles.gradeCircleNum, { color: rataGrade.color }]}>
            {ringkasan.rata_rata}
          </Text>
        </View>
        <View style={styles.summaryHeroRight}>
          <Text style={styles.summaryHeroTitle}>Rata-rata Nilai</Text>
          <Text style={styles.summaryHeroSub}>
            {ringkasan.total_mapel} mata pelajaran
          </Text>
        </View>
      </View>

      {/* Tertinggi & Terendah */}
      <View style={styles.summaryMinMax}>
        <View style={styles.minMaxItem}>
          <Text style={styles.minMaxIcon}>⬆️</Text>
          <Text style={[styles.minMaxValue, { color: colors.success }]}>
            {ringkasan.nilai_tertinggi}
          </Text>
          <Text style={styles.minMaxLabel}>Tertinggi</Text>
        </View>
        <View style={styles.minMaxDivider} />
        <View style={styles.minMaxItem}>
          <Text style={styles.minMaxIcon}>⬇️</Text>
          <Text style={[styles.minMaxValue, { color: colors.danger }]}>
            {ringkasan.nilai_terendah}
          </Text>
          <Text style={styles.minMaxLabel}>Terendah</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Nilai Item ───────────────────────────────────────────────────────────────

function NilaiItem({ item }) {
  const grade = getGrade(item.nilai);
  const nilaiNum = toNumber(item.nilai);

  // Progress bar width
  const pct = nilaiNum != null ? Math.min(nilaiNum, 100) : 0;

  return (
    <View style={styles.nilaiCard}>
      {/* Left: badge grade */}
      <View style={[styles.gradeBadge, { backgroundColor: grade.bg }]}>
        <Text style={[styles.gradeBadgeText, { color: grade.color }]}>
          {grade.label}
        </Text>
      </View>

      {/* Center: info */}
      <View style={styles.nilaiInfo}>
        <Text style={styles.mapelText} numberOfLines={1}>
          {item.mapel ?? '-'}
        </Text>
        <Text style={styles.tanggalText}>
          {formatDate(item.tanggal)}
        </Text>

        {/* Score bar */}
        <View style={styles.scoreBg}>
          <View
            style={[
              styles.scoreFill,
              { width: `${pct}%`, backgroundColor: grade.color },
            ]}
          />
        </View>
      </View>

      {/* Right: angka */}
      <Text style={[styles.nilaiAngka, { color: grade.color }]}>
        {nilaiNum ?? item.nilai ?? '-'}
      </Text>
    </View>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyNilai({ bulan, tahun }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={styles.emptyTitle}>Belum Ada Data Nilai</Text>
      <Text style={styles.emptySubtitle}>
        Tidak ada nilai yang tercatat untuk{'\n'}
        {monthName(bulan)} {tahun}.
      </Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export function NilaiScreen() {
  const { activeSantriId } = useActiveChild();

  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());

  const { data, ringkasan, isLoading, isRefreshing, error, refresh } =
    useNilai(activeSantriId, bulan, tahun);

  const handlePrev = useCallback(() => {
    if (bulan === 1) { setBulan(12); setTahun((y) => y - 1); }
    else setBulan((b) => b - 1);
  }, [bulan]);

  const handleNext = useCallback(() => {
    if (bulan === 12) { setBulan(1); setTahun((y) => y + 1); }
    else setBulan((b) => b + 1);
  }, [bulan]);

  const renderItem = useCallback(({ item }) => <NilaiItem item={item} />, []);
  const keyExtractor = useCallback((item) => String(item.id), []);

  const ListHeader = (
    <>
      <MonthPicker bulan={bulan} tahun={tahun} onPrev={handlePrev} onNext={handleNext} />
      {ringkasan && ringkasan.total_mapel > 0 ? (
        <SummaryCard ringkasan={ringkasan} />
      ) : null}
      {data.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daftar Nilai</Text>
          <Text style={styles.sectionCount}>{data.length} mata pelajaran</Text>
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
        ListEmptyComponent={!isLoading ? <EmptyNilai bulan={bulan} tahun={tahun} /> : null}
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
  separator: { height: 8, marginHorizontal: 16 },

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
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skeletonLine: { height: 14, borderRadius: 7, backgroundColor: colors.gray200, width: '100%' },

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
  summaryHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  gradeCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    flexShrink: 0,
  },
  gradeCircleLabel: { fontSize: 22, fontWeight: '900', lineHeight: 26 },
  gradeCircleNum: { fontSize: 12, fontWeight: '700', marginTop: 0 },
  summaryHeroRight: { flex: 1 },
  summaryHeroTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  summaryHeroSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  summaryMinMax: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  minMaxItem: { flex: 1, alignItems: 'center', gap: 3 },
  minMaxDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  minMaxIcon: { fontSize: 18 },
  minMaxValue: { fontSize: 22, fontWeight: '800' },
  minMaxLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },

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

  // ── Nilai Card ──
  nilaiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  gradeBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  gradeBadgeText: { fontSize: 20, fontWeight: '900' },

  nilaiInfo: { flex: 1 },
  mapelText: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 2 },
  tanggalText: { fontSize: 11, color: colors.textMuted, marginBottom: 6 },

  scoreBg: {
    height: 4,
    backgroundColor: colors.gray100,
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreFill: { height: '100%', borderRadius: 2 },

  nilaiAngka: { fontSize: 22, fontWeight: '900', flexShrink: 0 },

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
