import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppCard } from './AppCard';
import { AppText } from './AppText';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/theme';

export function StaleDataBanner() {
  return (
    <View style={styles.wrap}>
      <AppText variant="caption" color="warning" style={styles.text}>
        Data mungkin belum terbaru. Tarik untuk refresh.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.warningSoft,
    borderRadius: 8,
  },
  text: { fontWeight: '600' },
});
