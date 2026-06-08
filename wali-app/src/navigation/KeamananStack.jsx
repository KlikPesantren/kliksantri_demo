import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import { PerizinanScreen } from '../screens/perizinan/PerizinanScreen';

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
        name="Perizinan"
        component={PerizinanScreen}
        options={{ title: 'Riwayat Izin' }}
      />
      {/* Pelanggaran ditambahkan di sprint berikutnya */}
    </Stack.Navigator>
  );
}
