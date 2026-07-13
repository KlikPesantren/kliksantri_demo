import React from 'react';
import { View, ScrollView, RefreshControl, Image, StyleSheet } from 'react-native';
import { useActiveChild } from '../../context/ActiveChildContext';
import { useProfil } from '../../hooks/useProfil';
import { ChildSwitcherBar } from '../../components/dashboard/ChildSwitcherBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorView } from '../../components/common/ErrorView';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import {
  ScreenContainer,
  AppCard,
  AppText,
  StatusBadge,
} from '../../components/ui';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatCurrency';

function Avatar({ foto, nama }) {
  const initials = (nama ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
  const uri = resolveMediaUrl(foto);

  if (uri) {
    return <Image source={{ uri }} style={styles.avatarImage} />;
  }

  return (
    <View style={styles.avatarFallback}>
      <AppText variant="h1" color="inverse">{initials}</AppText>
    </View>
  );
}

function InfoRow({ label, value, last }) {
  if (!value) return null;
  return (
    <View style={[styles.infoRow, !last && styles.infoBorder]}>
      <AppText variant="caption" color="muted">{label}</AppText>
      <AppText variant="bodyMedium" style={styles.infoValue}>{value}</AppText>
    </View>
  );
}

function SectionCard({ title, children }) {
  return (
    <AppCard padding="md" style={styles.section}>
      <AppText variant="h3" style={styles.sectionTitle}>{title}</AppText>
      {children}
    </AppCard>
  );
}

export function ProfilSantriScreen() {
  const { activeSantriId } = useActiveChild();
  const { data, isLoading, isRefreshing, error, refresh } = useProfil(activeSantriId);

  if (isLoading && !data) {
    return (
      <ScreenContainer>
        <ChildSwitcherBar />
        <LoadingSpinner message="Memuat profil santri..." />
      </ScreenContainer>
    );
  }

  if (error && !data) {
    return (
      <ScreenContainer>
        <ChildSwitcherBar />
        <ErrorView message={error} onRetry={refresh} />
      </ScreenContainer>
    );
  }

  const p = data ?? {};

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
      >
        <ChildSwitcherBar />
        <AppCard padding="lg" style={styles.hero} accent="primary" accentPosition="left">
          <Avatar foto={p.foto} nama={p.nama} />
          <AppText variant="h2" style={styles.center}>{p.nama ?? '-'}</AppText>
          <StatusBadge variant="primary" size="sm">NIS {p.nis ?? '-'}</StatusBadge>
          <View style={styles.metaRow}>
            {p.nama_kelas ? (
              <AppText variant="caption" color="secondary">{p.nama_kelas}</AppText>
            ) : null}
            {p.kamar ? (
              <AppText variant="caption" color="muted">Kamar {p.kamar}</AppText>
            ) : null}
          </View>
        </AppCard>

        <SectionCard title="Akademik">
          <InfoRow label="Kelas" value={p.nama_kelas} />
          <InfoRow label="Kamar" value={p.kamar} last />
        </SectionCard>

        <SectionCard title="Identitas">
          <InfoRow label="NIS" value={p.nis} />
          <InfoRow label="Nama Lengkap" value={p.nama} />
          <InfoRow label="Nama Orang Tua" value={p.orang_tua} />
          <InfoRow label="Alamat" value={p.alamat} last />
        </SectionCard>

        <SectionCard title="Kontak">
          <InfoRow label="HP Orang Tua" value={p.nomor_hp_ortu} last />
        </SectionCard>

        <SectionCard title="Data Wali Terdaftar">
          <InfoRow label="Nama Wali" value={p.nama_wali} />
          <InfoRow label="HP Wali" value={p.nomor_hp_wali} />
          <InfoRow label="Alamat Wali" value={p.alamat_wali} last />
        </SectionCard>

        <SectionCard title="Kartu RFID">
          <InfoRow label="Saldo" value={p.saldo != null ? formatCurrency(p.saldo) : null} />
          <InfoRow label="Limit Harian" value={p.limit_harian != null ? formatCurrency(p.limit_harian) : null} last />
        </SectionCard>

        <AppText variant="caption" color="muted" style={styles.disclaimer}>
          Data profil diambil langsung dari sistem pesantren. Hubungi admin untuk perubahan data.
        </AppText>
      </ScrollView>
    </ScreenContainer>
  );
}

const AVATAR = 88;

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.md },
  hero: { alignItems: 'center', gap: spacing.sm },
  center: { textAlign: 'center' },
  metaRow: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  avatarImage: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: 3,
    borderColor: colors.border,
  },
  avatarFallback: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { gap: spacing.sm },
  sectionTitle: { marginBottom: spacing.xs },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  infoValue: { flex: 1, textAlign: 'right' },
  disclaimer: { textAlign: 'center', lineHeight: 18, paddingHorizontal: spacing.md },
});
