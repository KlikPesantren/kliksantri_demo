import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import { ProfilSantriScreen } from '../screens/profil/ProfilSantriScreen';

const Stack = createNativeStackNavigator();

const headerDefaults = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: '700' },
};

export function ProfilStack() {
  return (
    <Stack.Navigator screenOptions={headerDefaults}>
      <Stack.Screen
        name="ProfilSantri"
        component={ProfilSantriScreen}
        options={{ title: 'Profil Santri' }}
      />
      {/* Ganti PIN dan pengaturan akun ditambahkan di sprint berikutnya */}
    </Stack.Navigator>
  );
}
