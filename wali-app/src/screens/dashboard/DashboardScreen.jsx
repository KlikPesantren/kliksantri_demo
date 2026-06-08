import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useActiveChild } from '../../context/ActiveChildContext';
import { useDashboard } from '../../hooks/useDashboard';
import { ChildSwitcherBar } from '../../components/dashboard/ChildSwitcherBar';
import { SaldoCard } from '../../components/dashboard/SaldoCard';
import { SahriyahCard } from '../../components/dashboard/SahriyahCard';
import { KehadiranCard } from '../../components/dashboard/KehadiranCard';
import { StatGrid } from '../../components/dashboard/StatGrid';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorView } from '../../components/common/ErrorView';
import { colors } from '../../constants/colors';
import { monthName } from '../../utils/formatDate';

function NoChildView() {
  return (
    <View style={styles.centered}>
      <Text style={styles.noChildIcon}>👦</Text>
      <Text style={styles.noChildText}>Tidak ada santri yang dipilih.</Text>
    </View>
  );
}

function DashboardSkeleton() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard} />
      ))}
    </ScrollView>
  );
}

export function DashboardScreen() {
  const { activeSantriId, activeChild } = useActiveChild();
  const { data, isLoading, error, refresh } = useDashboard(activeSantriId);

  // Belum ada anak aktif
  if (!activeSantriId) {
    return (
      <SafeAreaView style={styles.safe}>
        <ChildSwitcherBar />
        <NoChildView />
      </SafeAreaView>
    );
  }

  // Loading pertama kali (data masih null)
  if (isLoading && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <ChildSwitcherBar />
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  // Error dan tidak ada data cached
  if (error && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <ChildSwitcherBar />
        <ErrorView message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  const d = data ?? {};
  const profil = d.profil ?? {};
  const kehadiran = d.kehadiran ?? { hadir: 0, total: 0, persentase: 0 };
  const sahriyah = d.sahriyah_aktif ?? null;
  const bulan = d.bulan ?? new Date().getMonth() + 1;
  const tahun = d.tahun ?? new Date().getFullYear();

  return (
    <SafeAreaView style={styles.safe}>
      <ChildSwitcherBar />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Period label */}
        <View style={styles.periodBar}>
          <Text style={styles.periodText}>
            {monthName(bulan)} {tahun}
          </Text>
          {error ? (
            <Text style={styles.errorHint}>⚠ Data mungkin tidak terbaru</Text>
          ) : null}
        </View>

        {/* Santri info mini */}
        {profil.kamar ? (
          <View style={styles.profilBar}>
            <Text style={styles.profilText}>
              🛏 Kamar {profil.kamar}
              {profil.nis ? `  ·  NIS: ${profil.nis}` : ''}
            </Text>
          </View>
        ) : null}

        {/* SALDO RFID */}
        <SaldoCard
          saldo={d.saldo_rfid ?? 0}
          limitHarian={profil.limit_harian ?? 0}
          kartuAktif={profil.uid_rfid !== undefined
            ? profil.uid_rfid !== null
            : d.saldo_rfid > 0}
        />

        {/* SAHRIYAH */}
        <SahriyahCard sahriyah={sahriyah} bulan={bulan} tahun={tahun} />

        {/* KEHADIRAN */}
        <KehadiranCard kehadiran={kehadiran} bulan={bulan} tahun={tahun} />

        {/* STAT GRID */}
        <StatGrid
          pelanggaran={d.pelanggaran_bulan_ini ?? 0}
          izinAktif={d.izin_aktif ?? 0}
          hafalanBulanIni={d.hafalan_bulan_ini ?? 0}
          rataNilai={d.rata_nilai_bulan_ini ?? 0}
        />

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 12 },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  noChildIcon: { fontSize: 48 },
  noChildText: { fontSize: 15, color: colors.textSecondary },

  // Skeleton
  skeletonCard: {
    height: 100,
    backgroundColor: colors.gray200,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },

  // Period bar
  periodBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  errorHint: { fontSize: 11, color: colors.warning },

  // Profil bar
  profilBar: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  profilText: {
    fontSize: 12,
    color: colors.textMuted,
  },

  bottomPad: { height: 32 },
});
