import React, { useEffect } from 'react';
import {
  ScrollView,
  RefreshControl,
  View,
  StyleSheet,
} from 'react-native';
import { useActiveChild } from '../../context/ActiveChildContext';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../hooks/useDashboard';
import { usePengumuman } from '../../hooks/usePengumuman';
import { useProfilPesantren } from '../../hooks/useProfilPesantren';
import { SantriHeroCard } from '../../components/home/SantriHeroCard';
import { PesantrenImageCard } from '../../components/home/PesantrenImageCard';
import { QuickAccessGrid } from '../../components/home/QuickAccessGrid';
import { StatusHariIni } from '../../components/home/StatusHariIni';
import { PengumumanTerbaruList } from '../../components/home/PengumumanTerbaruList';
import {
  ScreenContainer,
  SectionHeading,
  EmptyState,
} from '../../components/ui';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorView } from '../../components/common/ErrorView';
import { colors } from '../../constants/colors';
import { getTabBarScrollInset, spacing } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function DashboardScreen({ navigation: tabNavigation }) {
  const insets = useSafeAreaInsets();
  const { activeSantriId, activeChild } = useActiveChild();
  const { wali, anak } = useAuth();
  const { data, isLoading, error, refresh } = useDashboard(activeSantriId);
  const { data: pengumuman, refresh: refreshPengumuman } = usePengumuman();
  const { data: pesantren, refresh: refreshPesantren } = useProfilPesantren();

  const hasPengumuman = (pengumuman?.length ?? 0) > 0;
  const showGanti = anak.length > 1;
  const handleGantiAnak = () => {
    const parent = tabNavigation.getParent?.();
    if (parent) {
      parent.navigate('AnakPilih');
      return;
    }
    tabNavigation.navigate('AnakPilih');
  };

  const statistikPesantren = data?.statistik_pesantren;

  useEffect(() => {
    console.log('[DashboardScreen] dashboard loaded:', Boolean(data));
    console.log('[DashboardScreen] statistik_pesantren prop:', JSON.stringify(statistikPesantren));
    if (data && statistikPesantren == null) {
      console.log('[DashboardScreen] dashboard keys:', Object.keys(data));
    }
  }, [data, statistikPesantren]);

  const heroHeader = (
    <SantriHeroCard
      activeChild={activeChild}
      dashboardProfil={data?.profil}
      wali={wali}
      onGantiPress={showGanti ? handleGantiAnak : undefined}
    />
  );

  if (!activeSantriId) {
    return (
      <ScreenContainer style={styles.screen} edges={false}>
        {heroHeader}
        <EmptyState title="Pilih Anak" description="Tidak ada santri yang dipilih." />
      </ScreenContainer>
    );
  }

  if (isLoading && !data) {
    return (
      <ScreenContainer style={styles.screen} edges={false}>
        {heroHeader}
        <LoadingSpinner message="Memuat beranda..." />
      </ScreenContainer>
    );
  }

  if (error && !data) {
    return (
      <ScreenContainer style={styles.screen} edges={false}>
        {heroHeader}
        <ErrorView message={error} onRetry={refresh} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.screen} edges={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: getTabBarScrollInset(insets) }]}
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
        <SantriHeroCard
          activeChild={activeChild}
          dashboardProfil={data?.profil}
          wali={wali}
          onGantiPress={showGanti ? handleGantiAnak : undefined}
        />

        <PesantrenImageCard
          pesantren={pesantren}
          statistik={statistikPesantren}
        />

        <StatusHariIni
          data={data}
          onLihatSemua={() => tabNavigation.navigate('Monitoring')}
        />

        <SectionHeading
          title="Menu Utama"
          actionLabel="Lihat Semua Menu"
          onAction={() => tabNavigation.navigate('Monitoring')}
        />
        <QuickAccessGrid navigation={tabNavigation} />

        {hasPengumuman ? (
          <PengumumanTerbaruList
            items={pengumuman}
            onItemPress={() => tabNavigation.navigate('Pengumuman')}
            onLihatSemua={() => tabNavigation.navigate('Pengumuman')}
          />
        ) : null}

        <View style={styles.bottomPad} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F3F4F6',
  },
  scroll: {
    overflow: 'visible',
  },
  bottomPad: {
    height: spacing.lg,
  },
});
