import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppCard, AppText } from '../ui';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/theme';

export function PengumumanHomeEmpty() {
  return (
    <View style={styles.wrap}>
      <AppText variant="h3" style={styles.title}>
        Pengumuman
      </AppText>
      <AppCard padding="md" style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="megaphone-outline" size={18} color={colors.textMuted} />
          <AppText variant="caption" color="muted">
            Tidak ada pengumuman terbaru
          </AppText>
        </View>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: radius.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
