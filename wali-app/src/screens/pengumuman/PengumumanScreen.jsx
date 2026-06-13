import React, { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { usePengumuman } from '../../hooks/usePengumuman';
import { TabPesantrenHeader } from '../../components/home/TabPesantrenHeader';
import {
  ScreenContainer,
  AppText,
  AppCard,
  StatusBadge,
  EmptyState,
} from '../../components/ui';
import { PengumumanCover } from '../../components/pengumuman/PengumumanCover';
import { PengumumanDetailModal } from '../../components/pengumuman/PengumumanDetailModal';
import { ErrorView } from '../../components/common/ErrorView';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatDate';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/theme';

function FeaturedCard({ item, onPress }) {
  if (!item) return null;
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onPress(item)}>
      <AppCard padding="none" shadow="md" style={styles.featured}>
        <PengumumanCover coverUrl={item.cover_url} variant="featured" />
        <View style={styles.featuredBody}>
          {(item.prioritas === 'urgent' || item.prioritas === 'penting') && (
            <StatusBadge status={item.prioritas} size="sm" />
          )}
          <AppText variant="h2" numberOfLines={2}>
            {item.judul}
          </AppText>
          <AppText variant="body" color="secondary" numberOfLines={2}>
            {item.isi}
          </AppText>
        </View>
      </AppCard>
    </TouchableOpacity>
  );
}

function FeedRow({ item, onPress }) {
  const showBadge = item.prioritas === 'urgent' || item.prioritas === 'penting';

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={() => onPress(item)}>
      <AppCard padding="sm" style={styles.feedRow}>
        <PengumumanCover coverUrl={item.cover_url} variant="feed" style={styles.thumb} />
        <View style={styles.feedContent}>
          {showBadge ? <StatusBadge status={item.prioritas} size="sm" /> : null}
          <AppText variant="bodyMedium" numberOfLines={2}>
            {item.judul}
          </AppText>
          <AppText variant="caption" color="muted">
            {formatDate(item.published_at)}
          </AppText>
          <AppText variant="caption" color="secondary" numberOfLines={2}>
            {item.isi}
          </AppText>
        </View>
      </AppCard>
    </TouchableOpacity>
  );
}

export function PengumumanScreen() {
  const { data, isLoading, isRefreshing, error, refresh } = usePengumuman();
  const [selected, setSelected] = useState(null);

  const featured = data[0] ?? null;
  const feedData = data.length > 1 ? data.slice(1) : [];

  const handlePress = useCallback((item) => setSelected(item), []);

  if (isLoading && data.length === 0) {
    return (
      <ScreenContainer edges={false}>
        <TabPesantrenHeader />
        <LoadingSpinner message="Memuat pengumuman..." />
      </ScreenContainer>
    );
  }

  if (error && data.length === 0) {
    return (
      <ScreenContainer edges={false}>
        <TabPesantrenHeader />
        <ErrorView message={error} onRetry={refresh} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={false}>
      <TabPesantrenHeader />

      <FlatList
        data={feedData}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText variant="label" color="muted" style={styles.sectionLabel}>
              Featured
            </AppText>
            {featured ? (
              <FeaturedCard item={featured} onPress={handlePress} />
            ) : (
              <AppCard padding="md">
                <EmptyState
                  title="Tidak Ada Pengumuman"
                  description="Belum ada pengumuman aktif saat ini."
                  icon="megaphone-outline"
                />
              </AppCard>
            )}
            {feedData.length > 0 ? (
              <AppText variant="label" color="muted" style={styles.sectionLabel}>
                Feed
              </AppText>
            ) : null}
          </View>
        }
        renderItem={({ item }) => <FeedRow item={item} onPress={handlePress} />}
        ListEmptyComponent={
          featured ? null : (
            <View style={styles.header}>
              <EmptyState title="Kosong" description="Tidak ada pengumuman lain." />
            </View>
          )
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      <PengumumanDetailModal
        visible={!!selected}
        item={selected}
        onClose={() => setSelected(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  sectionLabel: {
    marginBottom: spacing.xs,
  },
  featured: {
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  featuredBody: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  list: {
    paddingBottom: spacing['3xl'],
  },
  feedRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  feedContent: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  sep: { height: spacing.sm },
});
