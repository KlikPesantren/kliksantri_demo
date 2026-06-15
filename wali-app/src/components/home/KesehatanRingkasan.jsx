import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, StatusBadge } from '../ui';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/theme';

const PENANGANAN_LABELS = {
  observasi: 'Observasi',
  istirahat: 'Istirahat',
  sudah_berobat: 'Sudah Berobat',
  pulang: 'Pulang',
  rawat_lanjut: 'Rawat Lanjut',
};

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.rowText}>
        <AppText variant="caption" color="muted">
          {label}
        </AppText>
        <AppText variant="bodyMedium" numberOfLines={3}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

export function KesehatanRingkasan({ data }) {
  if (!data) return null;

  const kesehatan = data.kesehatan_aktif || { status_kesehatan: 'sehat' };
  const isSakit = kesehatan.status_kesehatan === 'sakit';
  const sudahBerobat =
    kesehatan.status_penanganan === 'sudah_berobat' ||
    kesehatan.status_penanganan === 'pulang';

  return (
    <View style={styles.wrap}>
      <AppText variant="h3" style={styles.title}>
        Ringkasan Kesehatan
      </AppText>
      <View style={[styles.card, shadows.card]}>
        <View style={styles.head}>
          <StatusBadge variant={isSakit ? 'danger' : 'success'} size="lg">
            {isSakit ? 'SAKIT' : 'SEHAT'}
          </StatusBadge>
          {!isSakit ? (
            <AppText variant="caption" color="muted">
              Ananda dalam kondisi baik
            </AppText>
          ) : null}
        </View>

        {isSakit ? (
          <>
            <InfoRow
              icon="medkit-outline"
              label="Tindakan Pertama"
              value={kesehatan.tindakan_pertama?.trim() || 'Belum tercatat'}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="checkmark-circle-outline"
              label="Status Berobat"
              value={sudahBerobat ? 'Sudah berobat' : 'Belum berobat / dalam observasi'}
            />
            {kesehatan.keluhan ? (
              <>
                <View style={styles.divider} />
                <InfoRow
                  icon="document-text-outline"
                  label="Keluhan"
                  value={kesehatan.keluhan}
                />
              </>
            ) : null}
            <View style={styles.divider} />
            <InfoRow
              icon="pulse-outline"
              label="Penanganan"
              value={PENANGANAN_LABELS[kesehatan.status_penanganan] || 'Observasi'}
            />
          </>
        ) : (
          <InfoRow
            icon="shield-checkmark-outline"
            label="Status"
            value="Tidak ada catatan kesehatan aktif"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  title: {
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
});
