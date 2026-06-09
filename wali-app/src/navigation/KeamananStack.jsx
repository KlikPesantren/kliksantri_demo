import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import { KeamananHubScreen } from '../screens/keamanan/KeamananHubScreen';
import { PerizinanScreen } from '../screens/perizinan/PerizinanScreen';
import { PelanggaranScreen } from '../screens/pelanggaran/PelanggaranScreen';

const Stack = createNativeStackNavigator();

const headerDefaults = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: '700' },
};

export function KeamananStack() {
  return (
    <Stack.Navigator screenOptions={headerDefaults}>
      <Stack.Screen
        name="KeamananHub"
        component={KeamananHubScreen}
        options={{ title: 'Keamanan' }}
      />
      <Stack.Screen
        name="Perizinan"
        component={PerizinanScreen}
        options={{ title: 'Riwayat Izin' }}
      />
      <Stack.Screen
        name="Pelanggaran"
        component={PelanggaranScreen}
        options={{ title: 'Catatan Pelanggaran' }}
      />
    </Stack.Navigator>
  );
}
