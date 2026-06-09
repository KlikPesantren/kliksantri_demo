import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import { AkademikHubScreen } from '../screens/akademik/AkademikHubScreen';
import { AbsensiScreen } from '../screens/absensi/AbsensiScreen';
import { NilaiScreen } from '../screens/nilai/NilaiScreen';
import { HafalanScreen } from '../screens/hafalan/HafalanScreen';

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
        name="AkademikHub"
        component={AkademikHubScreen}
        options={{ title: 'Akademik' }}
      />
      <Stack.Screen
        name="Absensi"
        component={AbsensiScreen}
        options={{ title: 'Absensi' }}
      />
      <Stack.Screen
        name="Nilai"
        component={NilaiScreen}
        options={{ title: 'Nilai Akademik' }}
      />
      <Stack.Screen
        name="Hafalan"
        component={HafalanScreen}
        options={{ title: 'Hafalan' }}
      />
    </Stack.Navigator>
  );
}
