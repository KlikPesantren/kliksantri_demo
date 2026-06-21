import React, { useMemo } from 'react';
import { Pressable, View, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { colors } from '../../constants/colors';
import { interaction, radius, spacing } from '../../constants/theme';

const QUICK_ITEMS = [
  { key: 'Absensi', label: 'Absensi', icon: 'calendar-outline', tab: 'Monitoring', screen: 'Absensi' },
  { key: 'Nilai', label: 'Nilai', icon: 'school-outline', tab: 'Monitoring', screen: 'Nilai' },
  { key: 'Hafalan', label: 'Hafalan', icon: 'book-outline', tab: 'Monitoring', screen: 'Hafalan' },
  { key: 'Perizinan', label: 'Perizinan', icon: 'document-text-outline', tab: 'Monitoring', screen: 'Perizinan' },
  { key: 'Pelanggaran', label: 'Pelanggaran', icon: 'alert-circle-outline', tab: 'Monitoring', screen: 'Pelanggaran' },
  { key: 'Kesehatan', label: 'Kesehatan', icon: 'heart-outline', tab: 'Monitoring', screen: 'Kesehatan' },
  { key: 'Sahriyah', label: 'Sahriyah', icon: 'receipt-outline', tab: 'Keuangan', screen: 'Sahriyah' },
  { key: 'RFID', label: 'RFID & Saldo', icon: 'card-outline', tab: 'Keuangan', screen: 'RFID' },
];

const COLS = 4;
const GAP = spacing.sm;
const H_PADDING = spacing.lg;

const cellShadow = {
  shadowColor: colors.navy,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.045,
  shadowRadius: 4,
  elevation: 1,
};

export function QuickAccessGrid({ navigation }) {
  const { width } = useWindowDimensions();
  const cellWidth = useMemo(
    () => Math.floor((width - H_PADDING * 2 - GAP * (COLS - 1)) / COLS),
    [width]
  );

  function handlePress(item) {
    if (item.screen) {
      navigation.navigate(item.tab, { screen: item.screen });
      return;
    }
    navigation.navigate(item.tab);
  }

  return (
    <View style={styles.grid}>
      {QUICK_ITEMS.map((item) => (
        <Pressable
          key={item.key}
          style={({ pressed }) => [
            styles.cell,
            cellShadow,
            { width: cellWidth },
            pressed && styles.cellPressed,
          ]}
          onPress={() => handlePress(item)}
        >
          <View style={styles.iconWrap}>
            <Ionicons name={item.icon} size={20} color={colors.primary} />
          </View>
          <AppText variant="caption" color="primary" numberOfLines={2} style={styles.label}>
            {item.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: H_PADDING,
    gap: GAP,
    marginBottom: spacing.lg,
  },
  cell: {
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cellPressed: {
    opacity: interaction.activeOpacity,
    transform: [{ scale: 0.98 }],
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.lg,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 10,
    lineHeight: 13,
  },
});
