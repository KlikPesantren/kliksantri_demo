import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/theme';

const ACCENT_COLORS = {
  primary: colors.primary,
  navy: colors.navy,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  info: colors.info,
};

const PADDING = {
  none: 0,
  sm: spacing.lg,
  md: spacing.xl,
  lg: spacing['2xl'],
};

const SHADOW = {
  none: {},
  sm: shadows.sm,
  md: shadows.md,
};

/**
 * Standard surface card — BRImo/DANA-style clean container.
 */
export function AppCard({
  children,
  padding = 'md',
  shadow = 'sm',
  accent,
  accentPosition = 'top',
  style,
  ...rest
}) {
  const accentColor = accent ? (ACCENT_COLORS[accent] ?? accent) : null;
  const accentStyle =
    accentColor && accentPosition === 'left'
      ? { borderLeftWidth: 4, borderLeftColor: accentColor }
      : accentColor
        ? { borderTopWidth: 4, borderTopColor: accentColor }
        : null;

  return (
    <View
      style={[
        styles.card,
        SHADOW[shadow] ?? shadows.sm,
        accentStyle,
        { padding: PADDING[padding] ?? PADDING.md },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
