import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { colors } from '../../constants/colors';
import { interaction, spacing } from '../../constants/theme';

const QUICK_ITEMS = [
  { key: 'Absensi', label: 'Absensi', icon: 'calendar-outline', tab: 'Monitoring', screen: 'Absensi' },
  { key: 'Nilai', label: 'Nilai', icon: 'school-outline', tab: 'Monitoring', screen: 'Nilai' },
  { key: 'Hafalan', label: 'Hafalan', icon: 'book-outline', tab: 'Monitoring', screen: 'Hafalan' },
  { key: 'Perizinan', label: 'Perizinan', icon: 'exit-outline', tab: 'Monitoring', screen: 'Perizinan' },
  { key: 'Pelanggaran', label: 'Pelanggaran', icon: 'alert-circle-outline', tab: 'Monitoring', screen: 'Pelanggaran' },
  { key: 'Sahriyah', label: 'Sahriyah', icon: 'receipt-outline', tab: 'Keuangan', screen: 'Sahriyah' },
  { key: 'RFID', label: 'RFID', icon: 'card-outline', tab: 'Keuangan', screen: 'RFID' },
  { key: 'ProfilAnak', label: 'Profil Anak', icon: 'person-outline', tab: 'Profil', screen: 'ProfilSantri' },
  { key: 'ProfilPesantren', label: 'Profil Pesantren', icon: 'business-outline', tab: 'Profil', screen: 'ProfilPesantren' },
];

export function QuickAccessGrid({ navigation }) {
  function handlePress(item) {
    if (item.screen) {
      navigation.navigate(item.tab, { screen: item.screen });
    } else {
      navigation.navigate(item.tab);
    }
  }

  return (
    <View style={styles.grid}>
      {QUICK_ITEMS.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={styles.cell}
          onPress={() => handlePress(item)}
          activeOpacity={interaction.activeOpacity}
        >
          <Ionicons name={item.icon} size={22} color={colors.primary} />
          <AppText variant="caption" color="secondary" numberOfLines={2} style={styles.label}>
            {item.label}
          </AppText>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    rowGap: spacing.sm,
  },
  cell: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: 4,
  },
  label: {
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 11,
    lineHeight: 14,
  },
});
