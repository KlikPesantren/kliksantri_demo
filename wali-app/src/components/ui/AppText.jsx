import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { typography } from '../../constants/theme';
import { colors } from '../../constants/colors';

const VARIANT_MAP = {
  display: typography.display,
  h1: typography.h1,
  h2: typography.h2,
  h3: typography.h3,
  body: typography.body,
  bodyMedium: typography.bodyMedium,
  caption: typography.caption,
  label: typography.label,
  stat: typography.stat,
};

const COLOR_MAP = {
  primary: colors.textPrimary,
  secondary: colors.textSecondary,
  muted: colors.textMuted,
  inverse: colors.surface,
  brand: colors.primary,
  danger: colors.danger,
  warning: colors.warning,
  info: colors.info,
  success: colors.success,
};

export function AppText({
  variant = 'body',
  color = 'primary',
  style,
  children,
  ...rest
}) {
  return (
    <Text
      style={[
        styles.base,
        VARIANT_MAP[variant] ?? typography.body,
        { color: COLOR_MAP[color] ?? color },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.textPrimary,
  },
});
