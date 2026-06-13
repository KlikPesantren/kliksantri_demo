import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { stackHeaderOptions } from '../constants/theme';
import { ProfilHubScreen } from '../screens/profil/ProfilHubScreen';
import { ProfilSantriScreen } from '../screens/profil/ProfilSantriScreen';
import { ProfilPesantrenScreen } from '../screens/profil/ProfilPesantrenScreen';
import { GantiPinScreen } from '../screens/profil/GantiPinScreen';
import { TentangAplikasiScreen } from '../screens/profil/TentangAplikasiScreen';

const Stack = createNativeStackNavigator();

export function ProfilStack() {
  return (
    <Stack.Navigator screenOptions={stackHeaderOptions}>
      <Stack.Screen
        name="ProfilHub"
        component={ProfilHubScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="ProfilSantri" component={ProfilSantriScreen} options={{ title: 'Profil Anak' }} />
      <Stack.Screen name="ProfilPesantren" component={ProfilPesantrenScreen} options={{ title: 'Tentang Pesantren' }} />
      <Stack.Screen name="GantiPin" component={GantiPinScreen} options={{ title: 'Ganti PIN' }} />
      <Stack.Screen name="TentangAplikasi" component={TentangAplikasiScreen} options={{ title: 'Tentang Aplikasi' }} />
    </Stack.Navigator>
  );
}
