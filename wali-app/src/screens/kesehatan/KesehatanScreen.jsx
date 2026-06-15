import { useActiveChild } from '../../context/ActiveChildContext';
import { useKesehatan } from '../../hooks/useKesehatan';
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
import { spacing, radius } from '../../constants/theme';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import React, { useCallback } from 'react';

const PENANGANAN_LABELS = {
  observasi: 'Observasi',
  istirahat: 'Istirahat',
  sudah_berobat: 'Sudah Berobat',
  pulang: 'Pulang',
  rawat_lanjut: 'Rawat Lanjut',
};

function formatTime(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatPenanganan(value) {
  return PENANGANAN_LABELS[value] || value || '-';
}

function TimelineItem({ item }) {
  return (
    <View style={styles.timelineRow}>
      <AppText variant="caption" color="muted" style={styles.timelineTime}>
        {formatTime(item.time)}
      </AppText>
      <AppText variant="body" style={styles.timelineText}>
        {item.text}
      </AppText>
    </View>
  );
}

export function KesehatanScreen() {
  const { activeSantriId } = useActiveChild();
  const { current, timeline, isLoading, error, refresh } = useKesehatan(activeSantriId);

  const isSehat = (current?.status_kesehatan || 'sehat') === 'sehat';

  const renderHeader = useCallback(
    () => (
      <View style={styles.header}>
        <AppCard padding="md" style={styles.mainCard}>
          <AppText variant="label" color="muted">
            Status Kesehatan
          </AppText>
          <View style={styles.badgeWrap}>
            <StatusBadge variant={isSehat ? 'success' : 'danger'} size="md">
              {isSehat ? 'SEHAT' : 'SAKIT'}
            </StatusBadge>
          </View>
        </AppCard>

        {!isSehat && current?.keluhan ? (
          <View style={styles.section}>
            <ListSectionHeader title="Keluhan" />
            <AppCard padding="md">
              <AppText variant="body">{current.keluhan}</AppText>
            </AppCard>
          </View>
        ) : null}

        {!isSehat && current?.tindakan_pertama ? (
          <View style={styles.section}>
            <ListSectionHeader title="Tindakan Pertama" />
            <AppCard padding="md">
              <AppText variant="body">{current.tindakan_pertama}</AppText>
            </AppCard>
          </View>
        ) : null}

        {!isSehat && current?.status_penanganan ? (
          <View style={styles.section}>
            <ListSectionHeader title="Status Penanganan" />
            <AppCard padding="md">
              <AppText variant="bodyMedium">
                {formatPenanganan(current.status_penanganan)}
              </AppText>
            </AppCard>
          </View>
        ) : null}

        {isSehat ? (
          <AppCard padding="md" style={styles.sehatNote}>
            <AppText variant="body" color="secondary">
              Ananda dalam kondisi sehat dan aktif mengikuti kegiatan pesantren.
            </AppText>
          </AppCard>
        ) : null}

        {timeline?.length ? (
          <View style={styles.section}>
            <ListSectionHeader title="Timeline" />
            <AppCard padding="md">
              {timeline.map((item, index) => (
                <TimelineItem key={`${item.time}-${index}`} item={item} />
              ))}
            </AppCard>
          </View>
        ) : null}
      </View>
    ),
    [current, isSehat, timeline]
  );

  if (!activeSantriId) {
    return (
      <ScreenContainer>
        <EmptyState title="Pilih Anak" description="Tidak ada santri yang dipilih." />
      </ScreenContainer>
    );
  }

  if (isLoading && !current) {
    return (
      <ScreenContainer>
        <ChildSwitcherBar />
        <LoadingSpinner message="Memuat data kesehatan..." />
      </ScreenContainer>
    );
  }

  if (error && !current) {
    return (
      <ScreenContainer>
        <ChildSwitcherBar />
        <ErrorView message={error} onRetry={refresh} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ChildSwitcherBar />
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} colors={[colors.primary]} />
        }
        contentContainerStyle={styles.listContent}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: spacing['3xl'],
  },
  header: {
    paddingTop: spacing.sm,
  },
  mainCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
  },
  badgeWrap: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  section: {
    marginBottom: spacing.md,
  },
  sehatNote: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
  },
  timelineRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 4,
  },
  timelineTime: {
    fontWeight: '700',
  },
  timelineText: {
    lineHeight: 20,
  },
});
