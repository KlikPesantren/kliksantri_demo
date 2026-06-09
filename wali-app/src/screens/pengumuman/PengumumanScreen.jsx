import React, { useCallback, useRef } from 'react';
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
import { usePengumuman } from '../../hooks/usePengumuman';
import { ErrorView } from '../../components/common/ErrorView';
import { colors } from '../../constants/colors';
import { formatDate } from '../../utils/formatDate';

// ─── Prioritas Config ─────────────────────────────────────────────────────────

const PRIORITAS = {
  urgent:  { label: 'Urgent',  color: colors.danger,  bg: colors.dangerLight,  icon: '🚨' },
  penting: { label: 'Penting', color: colors.warning, bg: colors.warningLight, icon: '⚠️' },
  normal:  { label: 'Normal',  color: colors.info,    bg: colors.infoLight,    icon: '📢' },
};

function getPrioritasConfig(p) {
  return PRIORITAS[p] ?? PRIORITAS.normal;
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
      <View style={{ gap: 8, flex: 1 }}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '80%' }]} />
        <View style={[styles.skeletonLine, { width: '60%', height: 11 }]} />
      </View>
    </Animated.View>
  );
}

// ─── Pengumuman Card ─────────────────────────────────────────────────────────

function PengumumanCard({ item, onPress }) {
  const cfg = getPrioritasConfig(item.prioritas);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
    >
      {/* Badge + Tanggal */}
      <View style={styles.cardMeta}>
        <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.badgeText, { color: cfg.color }]}>
            {cfg.icon} {cfg.label}
          </Text>
        </View>
        <Text style={styles.dateText}>{formatDate(item.published_at)}</Text>
      </View>

      {/* Judul */}
      <Text style={styles.judul} numberOfLines={2}>{item.judul}</Text>

      {/* Preview isi */}
      <Text style={styles.preview} numberOfLines={3}>{item.isi}</Text>

      {/* "Baca selengkapnya" hint */}
      <Text style={styles.readMore}>Baca selengkapnya →</Text>
    </TouchableOpacity>
  );
}

// ─── Empty ────────────────────────────────────────────────────────────────────

function EmptyPengumuman() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>Tidak Ada Pengumuman</Text>
      <Text style={styles.emptySubtitle}>
        Belum ada pengumuman aktif saat ini.
      </Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export function PengumumanScreen({ navigation }) {
  const { data, total, isLoading, isRefreshing, error, refresh } = usePengumuman();

  const handlePress = useCallback(
    (item) => {
      navigation.navigate('DetailPengumuman', { item });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }) => <PengumumanCard item={item} onPress={handlePress} />,
    [handlePress]
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  if (isLoading && data.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map((k) => <SkeletonCard key={k} />)}
        </View>
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
      {total > 0 && (
        <View style={styles.totalBar}>
          <Text style={styles.totalText}>{total} pengumuman aktif</Text>
        </View>
      )}
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={!isLoading ? <EmptyPengumuman /> : null}
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
  listContent: { paddingTop: 12 },
  separator: { height: 10, marginHorizontal: 16 },

  totalBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  totalText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },

  // ── Skeleton ──
  skeletonContainer: { padding: 16, gap: 12 },
  skeletonCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skeletonBadge: {
    width: 72,
    height: 22,
    borderRadius: 8,
    backgroundColor: colors.gray200,
  },
  skeletonLine: {
    height: 13,
    borderRadius: 6,
    backgroundColor: colors.gray200,
    width: '100%',
  },

  // ── Card ──
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    marginHorizontal: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
    gap: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  dateText: { fontSize: 11, color: colors.textMuted },

  judul: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 22,
  },
  preview: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  readMore: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },

  // ── Empty ──
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 10,
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
