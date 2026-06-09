import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Animated,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useActiveChild } from '../../context/ActiveChildContext';
import { usePelanggaran } from '../../hooks/usePelanggaran';
import { ChildSwitcherBar } from '../../components/dashboard/ChildSwitcherBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorView } from '../../components/common/ErrorView';
import { colors } from '../../constants/colors';
import { formatDate } from '../../utils/formatDate';

// ─── Severity Config ──────────────────────────────────────────────────────────

function getSeverity(poin, tingkat) {
  // Prioritaskan tingkat jika ada
  const t = (tingkat ?? '').toLowerCase();
  if (t === 'berat' || t === 'sangat berat') {
    return { label: tingkat, color: colors.danger, bg: colors.dangerLight, bar: colors.danger };
  }
  if (t === 'sedang') {
    return { label: tingkat, color: colors.warning, bg: colors.warningLight, bar: colors.warning };
  }
  if (t === 'ringan') {
    return { label: tingkat, color: colors.success, bg: colors.successLight, bar: colors.success };
  }

  // Fallback: gunakan poin
  const p = Number(poin) || 0;
  if (p > 15) {
    return { label: `${p} poin`, color: colors.danger, bg: colors.dangerLight, bar: colors.danger };
  }
  if (p > 5) {
    return { label: `${p} poin`, color: colors.warning, bg: colors.warningLight, bar: colors.warning };
  }
  return { label: `${p} poin`, color: colors.success, bg: colors.successLight, bar: colors.success };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  const anim = useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [anim]);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity: anim }]}>
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: '60%', marginTop: 8 }]} />
      <View style={[styles.skeletonLine, { width: '40%', marginTop: 8 }]} />
    </Animated.View>
  );
}

function SkeletonList() {
  return (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4].map((k) => (
        <SkeletonCard key={k} />
      ))}
    </View>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ ringkasan, data }) {
  if (!ringkasan && data.length === 0) return null;

  const total = ringkasan?.total ?? data.length;
  const totalPoin = ringkasan?.total_poin ?? data.reduce((s, d) => s + (Number(d.poin) || 0), 0);

  const berat = data.filter((d) => {
    const t = (d.tingkat ?? '').toLowerCase();
    const p = Number(d.poin) || 0;
    return t === 'berat' || t === 'sangat berat' || p > 15;
  }).length;

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryRow}>
        <SummaryItem icon="📋" label="Total Pelanggaran" value={total} color={colors.text} />
        <View style={styles.summaryDivider} />
        <SummaryItem icon="⚠️" label="Total Poin" value={totalPoin} color={colors.warning} />
        <View style={styles.summaryDivider} />
        <SummaryItem icon="🚨" label="Berat" value={berat} color={colors.danger} />
      </View>

      {totalPoin > 0 && (
        <View style={styles.poinBar}>
          <View style={styles.poinBarBg}>
            <View
              style={[
                styles.poinBarFill,
                {
                  width: `${Math.min((totalPoin / 100) * 100, 100)}%`,
                  backgroundColor:
                    totalPoin > 60
                      ? colors.danger
                      : totalPoin > 30
                      ? colors.warning
                      : colors.success,
                },
              ]}
            />
          </View>
          <Text style={styles.poinBarLabel}>{totalPoin} / 100 poin kumulatif</Text>
        </View>
      )}
    </View>
  );
}

function SummaryItem({ icon, label, value, color }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryIcon}>{icon}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

// ─── Timeline Item ─────────────────────────────────────────────────────────────

function TimelineItem({ item, isLast }) {
  const sev = getSeverity(item.poin, item.tingkat);

  return (
    <View style={styles.timelineRow}>
      {/* Left: line + dot */}
      <View style={styles.timelineLeft}>
        <View style={[styles.timelineDot, { backgroundColor: sev.bar }]} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>

      {/* Right: card */}
      <View style={[styles.timelineCard, isLast && styles.timelineCardLast]}>
        {/* Header */}
        <View style={styles.itemHeader}>
          <Text style={styles.jenisText} numberOfLines={1}>
            {item.jenis ?? 'Tidak diketahui'}
          </Text>
          <View style={[styles.severityBadge, { backgroundColor: sev.bg }]}>
            <Text style={[styles.severityText, { color: sev.color }]}>
              {sev.label}
            </Text>
          </View>
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>📅 {formatDate(item.tanggal)}</Text>
          {item.jam ? (
            <Text style={styles.metaText}>
              🕐 {String(item.jam).slice(0, 5)}
            </Text>
          ) : null}
        </View>

        {/* Catatan */}
        {item.catatan ? (
          <Text style={styles.catatanText} numberOfLines={2}>
            {item.catatan}
          </Text>
        ) : null}

        {/* Footer: tindakan + petugas */}
        {(item.tindakan || item.petugas) ? (
          <View style={styles.footerRow}>
            {item.tindakan ? (
              <Text style={styles.footerChip}>⚖️ {item.tindakan}</Text>
            ) : null}
            {item.petugas ? (
              <Text style={styles.footerChip}>👤 {item.petugas}</Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyPelanggaran() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>✅</Text>
      <Text style={styles.emptyTitle}>Tidak Ada Pelanggaran</Text>
      <Text style={styles.emptySubtitle}>
        Santri tidak memiliki catatan pelanggaran.{'\n'}Semoga terus terjaga! 🤲
      </Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export function PelanggaranScreen() {
  const { activeSantriId } = useActiveChild();
  const { data, ringkasan, isLoading, isRefreshing, error, refresh } =
    usePelanggaran(activeSantriId);

  const renderItem = useCallback(
    ({ item, index }) => (
      <TimelineItem item={item} isLast={index === data.length - 1} />
    ),
    [data.length]
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

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
          <SummaryCard ringkasan={ringkasan} data={data} />
        }
        ListEmptyComponent={!isLoading ? <EmptyPelanggaran /> : null}
        ListFooterComponent={<View style={styles.listFooter} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
  listContent: { paddingHorizontal: 16, paddingBottom: 0 },
  listFooter: { height: 32 },

  // ── Skeleton ──
  skeletonContainer: { padding: 16, gap: 12 },
  skeletonCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.gray200,
    width: '100%',
  },

  // ── Summary Card ──
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginVertical: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryIcon: { fontSize: 22, marginBottom: 2 },
  summaryValue: { fontSize: 24, fontWeight: '800' },
  summaryLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },

  // Poin bar
  poinBar: {},
  poinBarBg: {
    height: 6,
    backgroundColor: colors.gray100,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  poinBarFill: { height: '100%', borderRadius: 3 },
  poinBarLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
  },

  // ── Timeline ──
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 20,
    paddingTop: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    flexShrink: 0,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: 4,
    marginBottom: -4,
  },

  timelineCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  timelineCardLast: { marginBottom: 0 },

  // Card content
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  jenisText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    flexShrink: 0,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700',
  },

  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  catatanText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
    fontStyle: 'italic',
  },

  footerRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  footerChip: {
    fontSize: 11,
    color: colors.textMuted,
    backgroundColor: colors.gray50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // ── Empty ──
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyIcon: { fontSize: 52 },
  emptyTitle: {
    fontSize: 17,
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
