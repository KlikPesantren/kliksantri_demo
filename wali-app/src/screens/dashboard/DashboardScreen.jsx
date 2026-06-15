import React from 'react';
import {
  ScrollView,
  RefreshControl,
  View,
  StyleSheet,
  Text,
} from 'react-native';
import { useActiveChild } from '../../context/ActiveChildContext';
import { useDashboard } from '../../hooks/useDashboard';
import { usePengumuman } from '../../hooks/usePengumuman';
import { useProfilPesantren } from '../../hooks/useProfilPesantren';
import { TabPesantrenHeader } from '../../components/home/TabPesantrenHeader';
import { HomeCarousel } from '../../components/home/HomeCarousel';
import { QuickAccessGrid } from '../../components/home/QuickAccessGrid';
import { StatusHariIni } from '../../components/home/StatusHariIni';
import { PengumumanTerbaruList } from '../../components/home/PengumumanTerbaruList';
import { PengumumanHomeEmpty } from '../../components/home/PengumumanHomeEmpty';
import {
  ScreenContainer,
  AppText,
  SectionHeading,
  EmptyState,
} from '../../components/ui';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorView } from '../../components/common/ErrorView';
import { PengumumanDetailModal } from '../../components/pengumuman/PengumumanDetailModal';
import { colors } from '../../constants/colors';
import { spacing, tabBarScrollInset } from '../../constants/theme';

function santriFirstName(nama) {
  if (!nama) return '';
  return nama.trim().split(/\s+/)[0] ?? nama;
}

function HomeGreeting({ activeChild }) {
  const firstName = santriFirstName(activeChild?.nama);

  return (
    <View style={styles.greeting}>
      <AppText variant="caption" color="secondary">
        Assalamu&apos;alaikum
      </AppText>
      <Text style={styles.greetingLine}>
        <Text style={styles.greetingPrefix}>Bapak/Ibu, </Text>
        <Text style={styles.greetingName}>{firstName || '—'}</Text>
      </Text>
    </View>
  );
}

export function DashboardScreen({ navigation: tabNavigation }) {
  const { activeSantriId, activeChild } = useActiveChild();
  const { data, isLoading, error, refresh } = useDashboard(activeSantriId);
  const { data: pengumuman, refresh: refreshPengumuman } = usePengumuman();
  const { data: pesantren, refresh: refreshPesantren } = useProfilPesantren();
  const [detailItem, setDetailItem] = React.useState(null);

  const hasPengumuman = (pengumuman?.length ?? 0) > 0;

  function renderPengumumanSection() {
    if (hasPengumuman) {
      return (
        <PengumumanTerbaruList
          items={pengumuman}
          onItemPress={setDetailItem}
          onLihatSemua={() => tabNavigation.navigate('Pengumuman')}
        />
      );
    }
    return <PengumumanHomeEmpty />;
  }

  const header = <TabPesantrenHeader />;

  if (!activeSantriId) {
    return (
      <ScreenContainer style={styles.screen} edges={false}>
        {header}
        <EmptyState title="Pilih Anak" description="Tidak ada santri yang dipilih." />
      </ScreenContainer>
    );
  }

  if (isLoading && !data) {
    return (
      <ScreenContainer style={styles.screen} edges={false}>
        {header}
        <LoadingSpinner message="Memuat beranda..." />
      </ScreenContainer>
    );
  }

  if (error && !data) {
    return (
      <ScreenContainer style={styles.screen} edges={false}>
        {header}
        <ErrorView message={error} onRetry={refresh} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.screen} edges={false}>
      {header}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              refresh();
              refreshPengumuman();
              refreshPesantren();
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <HomeGreeting activeChild={activeChild} />

        <HomeCarousel
          pesantren={pesantren}
          pengumuman={pengumuman}
          onPengumumanPress={setDetailItem}
        />

        <StatusHariIni
          data={data}
          onLihatSemua={() => tabNavigation.navigate('Monitoring')}
        />

        <SectionHeading title="Menu Utama" />
        <QuickAccessGrid navigation={tabNavigation} />

        {renderPengumumanSection()}

        <View style={styles.bottomPad} />
      </ScrollView>

      <PengumumanDetailModal
        visible={!!detailItem}
        item={detailItem}
        onClose={() => setDetailItem(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.surfaceSoft,
  },
  scroll: {
    paddingTop: spacing.sm,
    paddingBottom: tabBarScrollInset,
  },
  greeting: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: 2,
  },
  greetingLine: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  greetingPrefix: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  greetingName: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  bottomPad: {
    height: spacing.lg,
  },
});
