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

/** Border radius — premium scale */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  full: 9999,
};

/** Typography scale — premium fintech / edtech */
export const typography = {
  display: { fontSize: 30, fontWeight: '800', lineHeight: 36, letterSpacing: -0.6 },
  h1: { fontSize: 24, fontWeight: '800', lineHeight: 30, letterSpacing: -0.4 },
  h2: { fontSize: 18, fontWeight: '700', lineHeight: 24, letterSpacing: -0.2 },
  h3: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  body: { fontSize: 14, fontWeight: '400', lineHeight: 21 },
  bodyMedium: { fontSize: 14, fontWeight: '600', lineHeight: 21 },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 17 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  tab: { fontSize: 10, fontWeight: '700', lineHeight: 13 },
  stat: { fontSize: 20, fontWeight: '800', lineHeight: 24, letterSpacing: -0.3 },
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  float: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 12,
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

/** React Navigation — bottom tab bar (standard native style) */
export const tabBarOptions = {
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopColor: 'rgba(226, 232, 240, 0.65)',
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 10,
    paddingTop: 8,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
  tabBarLabelStyle: typography.tab,
};

/** Tab bar options with safe-area bottom inset (APK / gesture nav). */
export function buildTabBarScreenOptions(insets) {
  const safeBottom = Math.max(insets?.bottom ?? 0, 0);
  return {
    ...tabBarOptions,
    tabBarStyle: {
      ...tabBarOptions.tabBarStyle,
      height: 72 + safeBottom,
      paddingBottom: 10 + safeBottom,
    },
  };
}

/** Scroll content spacing above the native bottom tab bar. */
export function getTabBarScrollInset(insets) {
  return 24 + Math.min(Math.max(insets?.bottom ?? 0, 0), 12);
}

/** @deprecated use getTabBarScrollInset(insets) */
export const tabBarScrollInset = 96;
