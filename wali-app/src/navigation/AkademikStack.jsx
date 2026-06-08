import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import { AbsensiScreen } from '../screens/absensi/AbsensiScreen';

const Stack = createNativeStackNavigator();

const headerDefaults = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: '700' },
};

export function AkademikStack() {
  return (
    <Stack.Navigator screenOptions={headerDefaults}>
      <Stack.Screen
        name="Absensi"
        component={AbsensiScreen}
        options={{ title: 'Absensi' }}
      />
      {/* Nilai dan Hafalan ditambahkan di sprint backend berikutnya */}
    </Stack.Navigator>
  );
}
