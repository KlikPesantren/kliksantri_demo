import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../components/ui/AppText';
import { colors } from '../constants/colors';
import { interaction, radius, shadows, spacing, typography } from '../constants/theme';

const TAB_META = {
  Beranda: { active: 'home', inactive: 'home-outline', label: 'Beranda' },
  Pengumuman: { active: 'megaphone', inactive: 'megaphone-outline', label: 'Info' },
  Monitoring: { active: 'pulse', inactive: 'pulse-outline', label: 'Monitor' },
  Keuangan: { active: 'wallet', inactive: 'wallet-outline', label: 'Keuangan' },
  Profil: { active: 'person', inactive: 'person-outline', label: 'Profil' },
};

function FloatingTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 12);

  return (
    <View style={[styles.wrapper, { paddingBottom: bottom }]}>
      <View style={[styles.bar, shadows.float]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const meta = TAB_META[route.name] ?? {
            active: 'ellipse',
            inactive: 'ellipse-outline',
            label: route.name,
          };
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              activeOpacity={interaction.activeOpacity}
            >
              <View style={[styles.tabInner, focused && styles.tabInnerActive]}>
                <Ionicons
                  name={focused ? meta.active : meta.inactive}
                  size={focused ? 22 : 20}
                  color={focused ? colors.primary : colors.textMuted}
                />
                <AppText
                  variant="caption"
                  style={[
                    styles.tabLabel,
                    focused ? styles.tabLabelActive : styles.tabLabelInactive,
                  ]}
                >
                  {options.title ?? meta.label}
                </AppText>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    pointerEvents: 'box-none',
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius['3xl'],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    minHeight: 68,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xl,
    gap: 2,
    minWidth: 56,
  },
  tabInnerActive: {
    backgroundColor: colors.primarySoft,
  },
  tabLabel: {
    ...typography.tab,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: colors.textMuted,
    fontWeight: '600',
  },
});

export { FloatingTabBar };
