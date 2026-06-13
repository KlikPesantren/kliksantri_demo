import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { stackHeaderOptions } from '../constants/theme';
import { MonitoringScreen } from '../screens/monitoring/MonitoringScreen';
import { AbsensiScreen } from '../screens/absensi/AbsensiScreen';
import { NilaiScreen } from '../screens/nilai/NilaiScreen';
import { HafalanScreen } from '../screens/hafalan/HafalanScreen';
import { PerizinanScreen } from '../screens/perizinan/PerizinanScreen';
import { PelanggaranScreen } from '../screens/pelanggaran/PelanggaranScreen';

const Stack = createNativeStackNavigator();

export function MonitoringStack() {
  return (
    <Stack.Navigator screenOptions={stackHeaderOptions}>
      <Stack.Screen
        name="MonitoringHome"
        component={MonitoringScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Absensi" component={AbsensiScreen} options={{ title: 'Absensi' }} />
      <Stack.Screen name="Nilai" component={NilaiScreen} options={{ title: 'Nilai Akademik' }} />
      <Stack.Screen name="Hafalan" component={HafalanScreen} options={{ title: 'Hafalan' }} />
      <Stack.Screen name="Perizinan" component={PerizinanScreen} options={{ title: 'Riwayat Izin' }} />
      <Stack.Screen name="Pelanggaran" component={PelanggaranScreen} options={{ title: 'Pelanggaran' }} />
    </Stack.Navigator>
  );
}
