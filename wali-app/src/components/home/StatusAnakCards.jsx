import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/theme';

const PENANGANAN_LABELS = {
  observasi: 'Observasi',
  istirahat: 'Istirahat',
  sudah_berobat: 'Sudah berobat',
  pulang: 'Pulang',
  rawat_lanjut: 'Rawat lanjut',
};

function StatusCard({ icon, label, value, sub, tone = 'neutral' }) {
  const toneColors = {
    success: { bg: colors.successSoft, icon: colors.primary, text: colors.primaryHover },
    warning: { bg: colors.warningSoft, icon: colors.warning, text: colors.warning },
    danger: { bg: colors.dangerSoft, icon: colors.danger, text: colors.danger },
    neutral: { bg: colors.neutralSoft, icon: colors.primary, text: colors.textPrimary },
  };
  const palette = toneColors[tone] ?? toneColors.neutral;

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={[styles.iconWrap, { backgroundColor: palette.bg }]}>
        <Ionicons name={icon} size={20} color={palette.icon} />
      </View>
      <AppText variant="caption" color="muted" style={styles.cardLabel}>
        {label}
      </AppText>
      <AppText variant="bodyMedium" numberOfLines={2} style={[styles.cardValue, { color: palette.text }]}>
        {value}
      </AppText>
      {sub ? (
        <AppText variant="caption" color="muted" numberOfLines={2} style={styles.cardSub}>
          {sub}
        </AppText>
      ) : null}
    </View>
  );
}

function buildCards(data) {
  if (!data) return [];

  const izinAktif = (data.izin_aktif ?? 0) > 0;
  const kehadiran = data.kehadiran ?? {};
  const pct = kehadiran.persentase ?? 0;

  let kehadiranValue = `${pct}%`;
  let kehadiranSub = `${kehadiran.hadir ?? 0}/${kehadiran.total ?? 0} hari`;
  let kehadiranTone = pct >= 80 ? 'success' : pct >= 60 ? 'warning' : 'neutral';
  if (izinAktif) {
    kehadiranValue = 'Izin';
    kehadiranSub = 'Sedang di luar';
    kehadiranTone = 'warning';
  }

  const hafalanCount = data.hafalan_bulan_ini ?? 0;
  const kesehatan = data.kesehatan_aktif || { status_kesehatan: 'sehat' };
  const isSakit = kesehatan.status_kesehatan === 'sakit';
  const penanganan = PENANGANAN_LABELS[kesehatan.status_penanganan] || 'Observasi';

  const sahStatus = data.sahriyah_aktif?.status?.toLowerCase();
  const keuanganLunas = !data.sahriyah_aktif || sahStatus === 'lunas';

  return [
    {
      key: 'kehadiran',
      icon: 'calendar-outline',
      label: 'Kehadiran',
      value: kehadiranValue,
      sub: kehadiranSub,
      tone: kehadiranTone,
    },
    {
      key: 'hafalan',
      icon: 'book-outline',
      label: 'Hafalan',
      value: `${hafalanCount} setoran`,
      sub: 'Bulan ini',
      tone: hafalanCount > 0 ? 'success' : 'neutral',
    },
    {
      key: 'kesehatan',
      icon: 'fitness-outline',
      label: 'Kesehatan',
      value: isSakit ? 'Sakit' : 'Sehat',
      sub: isSakit ? penanganan : 'Kondisi baik',
      tone: isSakit ? 'danger' : 'success',
    },
    {
      key: 'keuangan',
      icon: 'wallet-outline',
      label: 'Keuangan',
      value: keuanganLunas ? 'Lunas' : 'Belum lunas',
      sub: keuanganLunas ? 'Shahriyah OK' : data.sahriyah_aktif?.periode || 'Shahriyah',
      tone: keuanganLunas ? 'success' : 'warning',
    },
  ];
}

export function StatusAnakCards({ data }) {
  const cards = buildCards(data);
  if (!cards.length) return null;

  return (
    <View style={styles.wrap}>
      <AppText variant="h3" style={styles.title}>
        Status Anak Hari Ini
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {cards.map((card) => (
          <StatusCard key={card.key} {...card} />
        ))}
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = 132;

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.xl,
  },
  title: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  cardLabel: {
    fontWeight: '600',
    fontSize: 11,
  },
  cardValue: {
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 18,
  },
  cardSub: {
    fontSize: 10,
    lineHeight: 14,
  },
});
