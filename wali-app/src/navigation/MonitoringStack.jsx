import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { stackHeaderOptions } from '../constants/theme';
import { MonitoringScreen } from '../screens/monitoring/MonitoringScreen';
import { AbsensiScreen } from '../screens/absensi/AbsensiScreen';
import { NilaiScreen } from '../screens/nilai/NilaiScreen';
import { HafalanScreen } from '../screens/hafalan/HafalanScreen';
import { PerizinanScreen } from '../screens/perizinan/PerizinanScreen';
import { PelanggaranScreen } from '../screens/pelanggaran/PelanggaranScreen';
import { KesehatanScreen } from '../screens/kesehatan/KesehatanScreen';
import { useActiveChild } from '../context/ActiveChildContext';
import { isPesantrenUnit } from '../utils/unitFeatures';

const Stack = createNativeStackNavigator();

export function MonitoringStack() {
  const { activeChild } = useActiveChild();
  const pesantren = isPesantrenUnit(activeChild);
  return (
    <Stack.Navigator screenOptions={stackHeaderOptions}>
      <Stack.Screen
        name="MonitoringHome"
        component={MonitoringScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Absensi" component={AbsensiScreen} options={{ title: 'Absensi' }} />
      <Stack.Screen name="Nilai" component={NilaiScreen} options={{ title: 'Nilai Akademik' }} />
      {pesantren ? <Stack.Screen name="Hafalan" component={HafalanScreen} options={{ title: 'Hafalan' }} /> : null}
      {pesantren ? <Stack.Screen name="Perizinan" component={PerizinanScreen} options={{ title: 'Riwayat Izin' }} /> : null}
      {pesantren ? <Stack.Screen name="Pelanggaran" component={PelanggaranScreen} options={{ title: 'Pelanggaran' }} /> : null}
      {pesantren ? <Stack.Screen name="Kesehatan" component={KesehatanScreen} options={{ title: 'Kesehatan' }} /> : null}
    </Stack.Navigator>
  );
}
