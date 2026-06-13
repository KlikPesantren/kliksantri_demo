import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { spacing } from '../../constants/theme';

export function ListSectionHeader({ title, count }) {
  return (
    <View style={styles.row}>
      <AppText variant="label" color="muted">
        {title}
      </AppText>
      {count != null ? (
        <AppText variant="caption" color="muted">
          {count}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
