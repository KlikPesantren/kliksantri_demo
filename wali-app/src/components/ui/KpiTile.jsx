import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppCard } from './AppCard';
import { AppText } from './AppText';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/theme';

export function KpiTile({ label, value, icon, iconColor = colors.primary, accent }) {
  return (
    <AppCard padding="sm" shadow="sm" accent={accent} style={styles.tile}>
      <View style={[styles.iconWrap, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <AppText variant="h2" numberOfLines={1} style={styles.value}>
        {value}
      </AppText>
      <AppText variant="caption" color="muted" numberOfLines={2} style={styles.label}>
        {label}
      </AppText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: '46%',
    maxWidth: '50%',
    gap: spacing.xs,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 20,
    lineHeight: 26,
  },
  label: {
    lineHeight: 15,
  },
});
