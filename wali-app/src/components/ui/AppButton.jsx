import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { colors } from '../../constants/colors';
import { interaction, radius, spacing } from '../../constants/theme';
import { AppText } from './AppText';

const VARIANTS = {
  primary: {
    bg: colors.primary,
    bgPressed: colors.primaryHover,
    text: colors.surface,
    border: colors.primary,
  },
  secondary: {
    bg: colors.neutralSoft,
    bgPressed: colors.border,
    text: colors.textSecondary,
    border: colors.border,
  },
  outline: {
    bg: 'transparent',
    bgPressed: colors.surfaceSoft,
    text: colors.textSecondary,
    border: colors.border,
  },
  danger: {
    bg: colors.danger,
    bgPressed: '#DC2626',
    text: colors.surface,
    border: colors.danger,
  },
  ghost: {
    bg: 'transparent',
    bgPressed: colors.primarySoft,
    text: colors.primary,
    border: 'transparent',
  },
};

const SIZES = {
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, minHeight: 36 },
  md: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, minHeight: 44 },
  lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing['2xl'], minHeight: 52 },
};

export function AppButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onPress,
  style,
  textStyle,
  icon,
  fullWidth = false,
  ...rest
}) {
  const v = VARIANTS[variant] ?? VARIANTS.primary;
  const s = SIZES[size] ?? SIZES.md;
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={interaction.buttonActiveOpacity}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          opacity: isDisabled ? 0.55 : 1,
        },
        s,
        fullWidth && styles.fullWidth,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
          <AppText
            variant="bodyMedium"
            style={[{ color: v.text, fontSize: size === 'sm' ? 13 : 14 }, textStyle]}
          >
            {children}
          </AppText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
