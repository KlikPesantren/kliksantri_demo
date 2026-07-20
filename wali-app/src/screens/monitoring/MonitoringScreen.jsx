import React from 'react';
import {
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useActiveChild } from '../../context/ActiveChildContext';
import { useAbsensi } from '../../hooks/useAbsensi';
import { useNilai } from '../../hooks/useNilai';
import { useHafalan } from '../../hooks/useHafalan';
import { usePerizinan } from '../../hooks/usePerizinan';
import { usePelanggaran } from '../../hooks/usePelanggaran';
import { useWaliFeatures } from '../../hooks/useWaliFeatures';
import { TabPesantrenHeader } from '../../components/home/TabPesantrenHeader';
import {
  ScreenContainer,
  AppCard,
  AppText,
  StatusBadge,
  SectionHeading,
  EmptyState,
} from '../../components/ui';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatDate';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/theme';

function MiniRow({ label, value, badge }) {
  return (
    <View style={styles.miniRow}>
      <View style={styles.miniLeft}>
        <AppText variant="bodyMedium" numberOfLines={1}>
          {label}
        </AppText>
        {value ? (
          <AppText variant="caption" color="muted" numberOfLines={1}>
            {value}
          </AppText>
        ) : null}
      </View>
      {badge ? <StatusBadge status={badge} size="sm">{badge}</StatusBadge> : null}
    </View>
  );
}

function SectionBlock({ title, onLihatSemua, children, emptyTitle, emptyDesc, isEmpty }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <AppText variant="h3">{title}</AppText>
        {onLihatSemua ? (
          <TouchableOpacity onPress={onLihatSemua}>
            <AppText variant="caption" color="brand" style={styles.link}>
              Lihat semua
            </AppText>
          </TouchableOpacity>
        ) : null}
      </View>
      <AppCard padding="md">
        {isEmpty ? (
          <EmptyState title={emptyTitle} description={emptyDesc} icon="document-text-outline" />
        ) : (
          children
        )}
      </AppCard>
    </View>
  );
}

export function MonitoringScreen() {
  const navigation = useNavigation();
  const { activeSantriId, activeChild } = useActiveChild();
  const { features } = useWaliFeatures(activeChild);
  const now = new Date();
  const bulan = now.getMonth() + 1;
  const tahun = now.getFullYear();

  const absensi = useAbsensi(activeSantriId, bulan, tahun);
  const nilai = useNilai(activeSantriId, bulan, tahun);
  const hafalan = useHafalan(activeSantriId, bulan, tahun);
  const perizinan = usePerizinan(activeSantriId);
  const pelanggaran = usePelanggaran(activeSantriId);

  const loading =
    (absensi.isLoading && !absensi.riwayat.length) ||
    (nilai.isLoading && !nilai.data.length);

  const refreshing =
    absensi.isRefreshing ||
    nilai.isRefreshing ||
    hafalan.isRefreshing ||
    perizinan.isRefreshing ||
    pelanggaran.isRefreshing;

  function refreshAll() {
    absensi.refresh();
    nilai.refresh();
    hafalan.refresh();
    perizinan.refresh();
    pelanggaran.refresh();
  }

  if (!activeSantriId) {
    return (
      <ScreenContainer edges={false}>
        <TabPesantrenHeader />
        <EmptyState title="Pilih Anak" description="Tidak ada santri aktif." />
      </ScreenContainer>
    );
  }

  if (loading) {
    return (
      <ScreenContainer edges={false}>
        <TabPesantrenHeader />
        <LoadingSpinner message="Memuat monitoring..." />
      </ScreenContainer>
    );
  }

  const absensiLatest = absensi.riwayat.slice(0, 3);
  const nilaiLatest = nilai.data.slice(0, 2);
  const hafalanLatest = hafalan.data.slice(0, 2);
  const izinLatest = perizinan.data.slice(0, 2);
  const pelLatest = pelanggaran.data.slice(0, 2);

  return (
    <ScreenContainer edges={false}>
      <TabPesantrenHeader />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshAll}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <SectionHeading title="Kehadiran & Akademik" />

        <SectionBlock
          title="Kehadiran"
          onLihatSemua={() => navigation.navigate('Absensi')}
          isEmpty={absensiLatest.length === 0}
          emptyTitle="Belum ada absensi"
          emptyDesc="Data kehadiran bulan ini belum tersedia."
        >
          {absensiLatest.map((row, i) => (
            <MiniRow
              key={row.id ?? i}
              label={formatDate(row.tanggal)}
              value={row.keterangan}
              badge={row.status}
            />
          ))}
        </SectionBlock>

        <SectionBlock
          title="Akademik"
          onLihatSemua={() => navigation.navigate('Nilai')}
          isEmpty={nilaiLatest.length === 0 && hafalanLatest.length === 0}
          emptyTitle="Belum ada data akademik"
          emptyDesc="Nilai dan hafalan akan muncul di sini."
        >
          {nilaiLatest.map((row, i) => (
            <MiniRow
              key={`n-${row.id ?? i}`}
              label={row.mata_pelajaran ?? 'Nilai'}
              value={`Nilai: ${row.nilai ?? '-'}`}
            />
          ))}
          {features.hafalan ? hafalanLatest.map((row, i) => (
            <MiniRow
              key={`h-${row.id ?? i}`}
              label={row.kitab ?? 'Hafalan'}
              value={row.surat ?? row.keterangan}
            />
          )) : null}
        </SectionBlock>

        {features.perizinan || features.pelanggaran ? <SectionBlock
          title="Disiplin"
          onLihatSemua={() => navigation.navigate('Perizinan')}
          isEmpty={izinLatest.length === 0 && pelLatest.length === 0}
          emptyTitle="Tidak ada catatan"
          emptyDesc="Perizinan dan pelanggaran akan muncul di sini."
        >
          {izinLatest.map((row, i) => (
            <MiniRow
              key={`i-${row.id ?? i}`}
              label="Izin keluar"
              value={formatDate(row.tanggal_keluar ?? row.created_at)}
              badge={row.status}
            />
          ))}
          {pelLatest.map((row, i) => (
            <MiniRow
              key={`p-${row.id ?? i}`}
              label={row.jenis ?? 'Pelanggaran'}
              value={formatDate(row.tanggal)}
              badge={row.tindakan}
            />
          ))}
        </SectionBlock> : null}

        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navChip} onPress={() => navigation.navigate('Absensi')}>
            <AppText variant="caption" color="brand">Absensi</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navChip} onPress={() => navigation.navigate('Nilai')}>
            <AppText variant="caption" color="brand">Nilai</AppText>
          </TouchableOpacity>
          {features.hafalan ? <TouchableOpacity style={styles.navChip} onPress={() => navigation.navigate('Hafalan')}>
            <AppText variant="caption" color="brand">Hafalan</AppText>
          </TouchableOpacity> : null}
          {features.perizinan ? <TouchableOpacity style={styles.navChip} onPress={() => navigation.navigate('Perizinan')}>
            <AppText variant="caption" color="brand">Perizinan</AppText>
          </TouchableOpacity> : null}
          {features.pelanggaran ? <TouchableOpacity style={styles.navChip} onPress={() => navigation.navigate('Pelanggaran')}>
            <AppText variant="caption" color="brand">Pelanggaran</AppText>
          </TouchableOpacity> : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing['3xl'],
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  link: { fontWeight: '700' },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  miniLeft: { flex: 1, minWidth: 0 },
  navRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  navChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
  },
});
