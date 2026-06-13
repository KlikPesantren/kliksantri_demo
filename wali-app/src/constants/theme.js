import { colors } from './colors';

/** Spacing scale — 4px base */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

/** Border radius */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

/** Typography scale */
export const typography = {
  display: { fontSize: 28, fontWeight: '800', lineHeight: 34, letterSpacing: -0.5 },
  h1: { fontSize: 22, fontWeight: '800', lineHeight: 28, letterSpacing: -0.3 },
  h2: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
  h3: { fontSize: 15, fontWeight: '700', lineHeight: 21 },
  body: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  bodyMedium: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  tab: { fontSize: 11, fontWeight: '600', lineHeight: 14 },
};

/** Shadow presets (React Native) */
export const shadows = {
  sm: {
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
};

/** Screen horizontal padding */
export const screenPadding = spacing.lg;

/** Touch feedback — BRImo/DANA consistency */
export const interaction = {
  activeOpacity: 0.75,
  cardActiveOpacity: 0.82,
  buttonActiveOpacity: 0.85,
};

/** React Navigation — stack header (pesantren green chrome) */
export const stackHeaderOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.surface,
  headerTitleStyle: { fontWeight: '700', fontSize: 16, color: colors.surface },
  headerShadowVisible: false,
};

/** React Navigation — bottom tab bar */
export const tabBarOptions = {
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabBarLabelStyle: typography.tab,
};
