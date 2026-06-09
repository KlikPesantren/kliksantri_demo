import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChildSwitcherBar } from '../../components/dashboard/ChildSwitcherBar';
import { colors } from '../../constants/colors';

const MENU = [
  {
    name: 'Absensi',
    icon: '📅',
    title: 'Absensi',
    desc: 'Ringkasan dan riwayat kehadiran santri per bulan',
    color: colors.primary,
    bg: colors.primaryLight,
  },
  {
    name: 'Nilai',
    icon: '📝',
    title: 'Nilai Akademik',
    desc: 'Daftar nilai mata pelajaran dan rata-rata',
    color: colors.info,
    bg: colors.infoLight,
  },
  {
    name: 'Hafalan',
    icon: '📖',
    title: 'Hafalan',
    desc: 'Riwayat setoran hafalan kitab per pekan',
    color: colors.success,
    bg: colors.successLight,
  },
];

export function AkademikHubScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe}>
      <ChildSwitcherBar />
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Akademik</Text>
        <Text style={styles.pageSubtitle}>
          Pantau kehadiran dan perkembangan nilai santri
        </Text>

        <View style={styles.grid}>
          {MENU.map((item) => (
            <TouchableOpacity
              key={item.name}
              style={styles.card}
              onPress={() => navigation.navigate(item.name)}
              activeOpacity={0.75}
            >
              <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
                <Text style={styles.iconText}>{item.icon}</Text>
              </View>
              <Text style={[styles.cardTitle, { color: item.color }]}>
                {item.title}
              </Text>
              <Text style={styles.cardDesc} numberOfLines={2}>
                {item.desc}
              </Text>
              <View style={[styles.arrowBox, { backgroundColor: item.bg }]}>
                <Text style={[styles.arrowText, { color: item.color }]}>
                  Lihat →
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: 16 },

  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 8,
  },
  pageSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },

  grid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  card: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    gap: 8,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: { fontSize: 26 },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  cardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    flex: 1,
  },
  arrowBox: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  arrowText: { fontSize: 12, fontWeight: '700' },
});
