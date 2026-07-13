import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { AppCard } from './AppCard';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/theme';
import { monthName } from '../../utils/formatDate';

export function MonthPickerBar({ bulan, tahun, onPrev, onNext }) {
  const now = new Date();
  const isCurrent =
    bulan === now.getMonth() + 1 && tahun === now.getFullYear();

  return (
    <AppCard padding="sm" shadow="none" style={styles.wrap}>
      <TouchableOpacity onPress={onPrev} style={styles.btn} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={22} color={colors.primary} />
      </TouchableOpacity>
      <AppText variant="bodyMedium">
        {monthName(bulan)} {tahun}
      </AppText>
      <TouchableOpacity
        onPress={isCurrent ? undefined : onNext}
        style={[styles.btn, isCurrent && styles.btnDisabled]}
        activeOpacity={isCurrent ? 1 : 0.7}
        disabled={isCurrent}
      >
        <Ionicons
          name="chevron-forward"
          size={22}
          color={isCurrent ? colors.textMuted : colors.primary}
        />
      </TouchableOpacity>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  btn: {
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  btnDisabled: { opacity: 0.35 },
});
