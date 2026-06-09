import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import { ProfilSantriScreen } from '../screens/profil/ProfilSantriScreen';
import { ProfilPesantrenScreen } from '../screens/profil/ProfilPesantrenScreen';
import { GantiPinScreen } from '../screens/profil/GantiPinScreen';

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
      <Stack.Screen
        name="ProfilPesantren"
        component={ProfilPesantrenScreen}
        options={{ title: 'Tentang Pesantren' }}
      />
      <Stack.Screen
        name="GantiPin"
        component={GantiPinScreen}
        options={{ title: 'Ganti PIN' }}
      />
    </Stack.Navigator>
  );
}
