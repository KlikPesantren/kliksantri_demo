import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/theme';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';

export function ErrorView({ message = 'Terjadi kesalahan.', onRetry }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="alert-circle-outline" size={32} color={colors.warning} />
      </View>
      <AppText variant="bodyMedium" color="secondary" style={styles.message}>
        {message}
      </AppText>
      {onRetry ? (
        <AppButton variant="primary" size="sm" onPress={onRetry} style={styles.button}>
          Coba Lagi
        </AppButton>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
    backgroundColor: colors.surfaceSoft,
    gap: spacing.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    maxWidth: 280,
  },
  button: {
    marginTop: spacing.sm,
    minWidth: 120,
  },
});
